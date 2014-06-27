/**
 * Access to the web browser/Cordova storage service.
 * You can use this through the localStorage() helper in Kido.
 * ie: var tasks = new Kido().localStorage().collection("tasks");
 *
 * @param {Kido} kidoApp
 * @returns {KidoLocalStorage}
 * @constructor
 */
var KidoLocalStorage = function (kidoApp) {

    if (!(this instanceof KidoLocalStorage)) return new KidoLocalStorage(kidoApp);
    if (!localforage) throw "KidoLocalStorage needs Mozilla LocalForage to be able to work.";

    /** Local Forage configuration and helper methods **/
    localforage.config({
        name: 'kidozen',
        storeName: 'kidozen'
    });

    var LOCAL_FORAGE_DELAY = 50;

    /**
     * Local Forage setItem method with jQuery deferred interface.
     *
     * @param {string} key
     * @param {object} value
     * @returns {*}
     */
    localforage.setItemAsync = function (key, value) {
        var deferred = $.Deferred();
        localforage.setItem(key, value).then(function (item) {
            setTimeout(function () {
                deferred.resolve(item);
            }, LOCAL_FORAGE_DELAY);
        }, function () {
            deferred.reject();
        });
        return deferred.promise();
    };

    /**
     * Local Forage getItem method with jQuery deferred interface.
     *
     * @param {string} key
     * @returns {*}
     */
    localforage.getItemAsync = function (key) {
        var deferred = $.Deferred();
        localforage.getItem(key).then(function (item) {
            setTimeout(function () {
                deferred.resolve(item);
            }, LOCAL_FORAGE_DELAY);
        }, function () {
            deferred.reject();
        });
        return deferred.promise();
    };

    /**
     * Local Forage removeItem method with jQuery deferred interface.
     *
     * @returns {*}
     */
    localforage.removeItemAsync = function () {
        var deferred = $.Deferred();
        localforage.removeItem(self.name).then(function () {
            setTimeout(function () {
                deferred.resolve();
            }, LOCAL_FORAGE_DELAY);
        });
        return deferred.promise();
    };

    /** Private properties **/
    var self = this,
        executingPendingTasks = false,
        dictionary = new KidoLocalStorageCollection('id_dictionary', this),
        pending_requests = new KidoLocalStorageCollection('pending_requests', this);

    /** Public properties **/
    this.app = kidoApp;

    /**
     * Returns a new local storage collection.
     *
     * @param {string} name
     * @returns {KidoLocalStorageCollection}
     * @api public
     */
    this.collection = function (name) {
        return new KidoLocalStorageCollection(name, this);
    };

    /**
     * Adds a request to the pending queue.
     *
     * @param {string} object_id
     * @param {object} request
     * @returns {*}
     * @api public
     */
    this.addPendingRequest = function (object_id, request) {
        return pending_requests.persist({
            _id: object_id,
            request: request
        });
    };

    /**
     * Removes a request from the pending queue.
     *
     * @param {string} object_id
     * @returns {*}
     * @api public
     */
    this.removePendingRequest = function (object_id) {
        return pending_requests.del(object_id);
    };

    /**
     * Retrieves the request data by its key.
     *
     * @param {string} object_id
     * @returns {*}
     */
    this.getPendingRequestObject = function (object_id) {
        return pending_requests.get(object_id, true).then(function (req) {
            return JSON.parse(req.request.data);
        });
    };

    /**
     * Executes the requests stored in the pending requests queue.
     *
     * @returns {*}
     * @api public
     */
    this.executePendingRequests = function () {
        if (executingPendingTasks) return $.Deferred().reject();
        executingPendingTasks = true;
        return pending_requests.query().then(function (reqs) {
            if (reqs.length === 0) {
                executingPendingTasks = false;
                return $.Deferred().reject();
            }
            return self.makeAjaxCall(reqs);
        }).then(function () {
            executingPendingTasks = false;
            return $.Deferred().resolve();
        }, function () {
            executingPendingTasks = false;
            return $.Deferred().reject();
        });
    };

    /**
     * @param {object[]} reqs
     * @returns {*}
     * @api private
     */
    this.makeAjaxCall = function (reqs) {
        if (reqs.length === 0) return $.Deferred().resolve();
        var req = reqs.shift();
        return $.ajax(req.request).then(function (res) {
            return self.persistChange(req, res).then(function () {
                return pending_requests.persist(reqs);
            }).then(function () {
                return self.makeAjaxCall(reqs);
            });
        });
    };

    /**
     * @param {object} req
     * @param {object} res
     * @returns {*}
     * @api private
     */
    this.persistChange = function (req, res) {
        var col = self.collection(req.request.kidoService.service + '.' + req.request.kidoService.collection),
            old_id = req._id,
            new_id = typeof res === 'object' ? res._id : null;
        if (!new_id) {
            // Item was deleted
            return col.del(old_id).then(function () {
                return dictionary.del(old_id);
            });
        }
        return col.get(old_id, true).then(function (val) {
            // Item found
            val._id = new_id;
            return col.persist(val);
        }, function () {
            // Item not found
            return self.getPendingRequestObject(old_id).then(function (object) {
                object._id = new_id;
                return col.persist(object);
            });
        }).then(function () {
            if (old_id !== new_id) {
                return col.del(old_id).then(function () {
                    return dictionary.persist({
                        _id: old_id,
                        new_id: new_id
                    });
                });
            }
            return $.Deferred().resolve();
        }, function () {
            return $.Deferred().resolve();
        });
    };

    /**
     * Returns a relation between the old object id and the new one.
     *
     * @param {string} old_id
     * @returns {*}
     * @api public
     */
    this.getNewIdFromDictionary = function (old_id) {
        return dictionary.get(old_id, true).then(function (item) {
            return item.new_id;
        });
    };

};

/**
 * @param {string} name
 * @param {KidoLocalStorage} parentLocalStorage
 * @returns {KidoLocalStorageCollection}
 * @constructor
 */
var KidoLocalStorageCollection = function (name, parentLocalStorage) {

    var self = this;

    /** Validations **/
    if (!(this instanceof KidoLocalStorageCollection)) return new KidoLocalStorageCollection(name, parentLocalStorage);
    if (!name) throw "KidoLocalStorageCollection needs a name to be created.";
    if (!parentLocalStorage) throw "KidoLocalStorageCollection needs a parent KidoLocalStorage object.";

    /** Public properties **/
    this.localStorage = parentLocalStorage;
    this.name = 'kido.' + name;

    /**
     * @param {object[]} values
     * @returns {*}
     * @api private
     */
    this.storeCollection = function (values) {
        return localforage.setItemAsync(self.name, values);
    };

    /**
     * @param {object} new_val
     * @returns {*}
     * @api private
     */
    this.insertItem = function (new_val) {
        new_val._id = ($.now() * -1).toString();
        return self.query().then(function (values) {
            values.push(new_val);
            return self.storeCollection(values).then(function () {
                return new_val;
            });
        });
    };

    /**
     * @param {object} new_val
     * @returns {*}
     * @api private
     */
    this.updateItem = function (new_val) {
        return self.query().then(function (values) {
            if (!values) values = [];
            var val, i;
            for (i = 0; val = values[i]; i++) {
                if (val._id === new_val._id) {
                    values[i] = new_val;
                    break;
                }
            }
            // item not found
            if (values.length !== 0 && values.length === i) {
                // check if exists in the dictionary and if it does
                // replace the id with the new one and persist the object
                return self.localStorage.getNewIdFromDictionary(new_val._id).then(function (new_id) {
                    new_val._id = new_id;
                    return self.updateItem(new_val);
                }, function () {
                    values.push(new_val);
                    return self.storeCollection(values).then(function () {
                        return new_val;
                    });
                });
            } else if (values.length === 0) {
                values.push(new_val);
            }
            return self.storeCollection(values).then(function () {
                return new_val;
            });
        });
    };

    /**
     * Persists an object or array in Local Storage.
     *
     * @param {object} new_val
     * @returns {*}
     * @api public
     */
    this.persist = function (new_val) {
        if (!new_val) throw "The 'new_val' argument is required in order to insert.";
        if (typeof new_val !== 'object') new_val = JSON.parse(new_val);
        if ($.isArray(new_val)) {
            return self.storeCollection(new_val);
        } else if (typeof new_val._id !== 'undefined') {
            return self.updateItem(new_val);
        } else {
            return self.insertItem(new_val);
        }
    };


    /**
     * Retrieves an object by its key from Local Storage.
     *
     * @param id
     * @param {boolean} [from_dictionary=false]
     * @returns {*}
     * @api public
     */
    this.get = function (id, from_dictionary) {
        if (!id) throw "The 'id' argument is required in order to get.";
        if (!from_dictionary) from_dictionary = false;
        return self.query().then(function (values) {
            var val;
            for (var i = 0; val = values[i]; i++) {
                if (val._id === id) {
                    return val;
                }
            }
            if (!from_dictionary) {
                // if item not found, check if exists in the dictionary and look for it by the new id
                return self.localStorage.getNewIdFromDictionary(id).then(function (new_id) {
                    return self.get(new_id, true);
                });
            }
            return $.Deferred().reject('Item not found');
        });
    };


    /**
     * Retrieves an array of matching objects from Local Storage.
     *
     * @param {object} [query=]
     * @returns {*}
     * @api public
     */
    this.query = function (query) {
        return localforage.getItemAsync(self.name).then(function (values) {
            if (!values) values = [];
            if (typeof query === 'undefined') {
                return values;
            } else {
                for (var q in query) {
                    values = $.map(values, function (val) {
                        return val[q] === query[q] ? val : null;
                    });
                }
                return values;
            }
        });
    };


    /**
     * Deletes an object from Local Storage by its key.
     *
     * @param id
     * @returns {*}
     * @api public
     */
    this.del = function (id) {
        if (!id) throw "The 'id' argument is required in order to delete.";
        return self.query().then(function (values) {
            values = $.map(values, function (val) {
                return val._id !== id ? val : null;
            });
            return self.persist(values);
        });
    };


    /**
     * Drops the entire collection from Local Storage.
     *
     * @returns {*}
     * @api public
     */
    this.drop = function () {
        return localforage.removeItemAsync();
    };

    /**
     * Retrieves the quantity of stored items
     *
     * @returns {*}
     * @api public
     */
    this.length = function () {
        return self.query().then(function (values) {
            return values.length;
        });
    };
};

/**
 * Retrieves an instance of KidoLocalStorage.
 *
 * @returns {KidoLocalStorage}
 */
Kido.prototype.localStorage = function () {
    if (!this._localStorage) this._localStorage = new KidoLocalStorage(this);
    return this._localStorage;
};
