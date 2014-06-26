var KidoLocalStorage = function (kidoApp) {

    if (!(this instanceof KidoLocalStorage)) return new KidoLocalStorage(kidoApp);
    if (!localforage) throw "KidoLocalStorageCollection needs Mozilla LocalForage to be able to work.";

    localforage.config({
        name: 'kidozen',
        storeName: 'kidozen'
    });

    localforage.setItemAsync = function (key, value) {
        var deferred = $.Deferred();
        localforage.setItem(key, value).then(function (inserted) {
            deferred.resolve(inserted);
        }, function () {
            deferred.reject();
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
     * @param {string} name
     * @returns {KidoLocalStorageCollection}
     * @api public
     */
    this.collection = function (name) {
        return new KidoLocalStorageCollection(name, this);
    };

    /**
     * Adds a request to the pending queue
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
     * Removes a request from the pending queue
     * @param {string} object_id
     * @returns {*}
     * @api public
     */
    this.removePendingRequest = function (object_id) {
        return pending_requests.del(object_id);
    };

    /**
     * Returns a relation between the old object id and the new one.
     * @param {string} old_id
     * @returns {*}
     * @api public
     */
    this.getNewIdFromDictionary = function (old_id) {
        return dictionary.get(old_id, true).pipe(function (item) {
            return item.new_id;
        });
    };

    /**
     * Executes the requests stored in the pending requests queue
     * @returns {*}
     * @api public
     */
    this.executePendingRequests = function () {
        if (executingPendingTasks) return $.Deferred().reject();
        executingPendingTasks = true;
        return pending_requests.query().pipe(function (reqs) {
            return self.makeAjaxCall(reqs);
        }).pipe(function () {
            executingPendingTasks = false;
            return $.Deferred().resolve();
        }, function (err) {
            executingPendingTasks = false;
            return $.Deferred().reject(err);
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
            return pending_requests.persist(reqs).pipe(function () {
                return self.updateKey(req, res);
            }).pipe(function () {
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
    this.updateKey = function (req, res) {
        if (typeof res !== 'object' || req._id === res._id) {
            return $.Deferred().resolve();
        }
        var col = self.collection(req.request.kidoService.service + '.' + req.request.kidoService.name),
            old_id = req._id,
            new_id = res._id;
        return col.get(old_id, true).pipe(function (val) {
            val._id = new_id;
            return col.persist(val);
        }).pipe(function () {
            return col.del(old_id);
        }).pipe(function () {
            return dictionary.persist({
                _id: old_id,
                new_id: new_id
            });
        }, function () {
            // Item not found
            return $.Deferred().resolve();
        });
    };

};

var KidoLocalStorageCollection = function (name, parentLocalStorage) {

    var self = this;

    // validations
    if (!(this instanceof KidoLocalStorageCollection)) return new KidoLocalStorageCollection(name, parentLocalStorage);
    if (!name) throw "KidoLocalStorageCollection needs a name to be created.";
    if (!parentLocalStorage) throw "KidoLocalStorageCollection needs a parent KidoLocalStorage object.";

    // properties
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
        return self.query().pipe(function (values) {
            values.push(new_val);
            return self.storeCollection(values).pipe(function () {
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
        return self.query().pipe(function (values) {
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
                return self.localStorage.getNewIdFromDictionary(new_val._id).pipe(function (new_id) {
                    new_val._id = new_id;
                    return self.updateItem(new_val);
                }, function () {
                    values.push(new_val);
                    return self.storeCollection(values).pipe(function () {
                        return new_val;
                    });
                });
            } else if (values.length === 0) {
                values.push(new_val);
            }
            return self.storeCollection(values).pipe(function () {
                return new_val;
            });
        });
    };

    /**
     * Persists an object or array in the Local Storage.
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
        return self.query().pipe(function (values) {
            var val;
            for (var i = 0; val = values[i]; i++) {
                if (val._id === id) {
                    return val;
                }
            }
            if (!from_dictionary) {
                // if item not found, check if exists in the dictionary and look for it by the new id
                return self.localStorage.getNewIdFromDictionary(id).pipe(function (new_id) {
                    return self.get(new_id, true);
                });
            }
            return $.Deferred().reject('Item not found');
        });
    };


    /**
     * Executes the query.
     *
     * @param {object} [query=]
     * @returns {*}
     * @api public
     */
    this.query = function (query) {
        var deferred = $.Deferred();
        localforage.getItem(self.name).then(function (values) {
            if (!values) values = [];
            if (typeof query === 'undefined') {
                deferred.resolve(values);
            } else {
                for (var q in query) {
                    values = $.map(values, function (val) {
                        return val[q] === query[q] ? val : null;
                    });
                }
                deferred.resolve(values);
            }
        });
        return deferred.promise();
    };


    /**
     * Delete an object from Local Storage by its key.
     *
     * @param id
     * @returns {*}
     * @api public
     */
    this.del = function (id) {
        if (!id) throw "The 'id' argument is required in order to delete.";
        var deferred = $.Deferred();
        localforage.getItem(self.name).then(function (values) {
            values = $.map(values, function (val) {
                return val._id !== id ? val : null;
            });
            localforage.setItem(self.name, values).then(function (values) {
                deferred.resolve(values);
            });
        });
        return deferred.promise();
    };


    /**
     * Drops the entire collection from Local Storage.
     *
     * @returns {*}
     * @api public
     */
    this.drop = function () {
        var deferred = $.Deferred();
        localforage.removeItem(self.name).then(deferred.resolve);
        return deferred.promise();
    };
};

Kido.prototype.localStorage = function () {
    // cache the KidoLocalStorage instance
    if (!this._localStorage) this._localStorage = new KidoLocalStorage(this);
    return this._localStorage;
};