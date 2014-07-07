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

    /**
     * @type {KidoLocalStorage}
     */
    var self = this;
    /**
     * @type {Kido}
     */
    this.app = kidoApp;
    /**
     * @constant {string}
     */
    this.SERVICE_NAME = "localstorage";

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
     * @param {Object} value
     * @returns {Deferred}
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
     * @returns {Deferred}
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
     * @param {string} key
     * @returns {Deferred}
     */
    localforage.removeItemAsync = function (key) {
        var deferred = $.Deferred();
        localforage.removeItem(key).then(function () {
            setTimeout(function () {
                deferred.resolve();
            }, LOCAL_FORAGE_DELAY);
        });
        return deferred.promise();
    };

    /**
     * Returns a new local storage collection.
     *
     * @param {string} name
     * @returns {KidoLocalStorageCollection}
     * @public
     */
    this.collection = function (name) {
        return new KidoLocalStorageCollection(name, this);
    };

};

/**
 * @param {string} name
 * @param {KidoLocalStorage} parentLocalStorage
 * @returns {KidoLocalStorageCollection}
 * @constructor
 */
var KidoLocalStorageCollection = function (name, parentLocalStorage) {

    /**
     * @type {KidoLocalStorageCollection}
     */
    var self = this;

    /** Validations **/
    if (!(this instanceof KidoLocalStorageCollection)) return new KidoLocalStorageCollection(name, parentLocalStorage);
    if (!name) throw "KidoLocalStorageCollection needs a name to be created.";
    if (!parentLocalStorage) throw "KidoLocalStorageCollection needs a parent KidoLocalStorage object.";

    /**
     * @type {KidoLocalStorage}
     */
    this.localStorage = parentLocalStorage;
    /**
     * @type {string}
     */
    this.name = 'kido.' + name;

    /**
     * @param {object[]} values
     * @returns {Deferred}
     * @private
     */
    this.storeCollection = function (values) {
        return localforage.setItemAsync(self.name, values);
    };

    /**
     * @param {Object} new_val
     * @returns {Deferred}
     * @private
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
     * @param {Object} new_val
     * @returns {Deferred}
     * @private
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
                return self.localStorage.app.offline().getNewIdFromDictionary(new_val._id).then(function (new_id) {
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
     * @param {Object} new_val
     * @returns {Deferred}
     * @public
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
     * @returns {Deferred}
     * @public
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
                return self.localStorage.app.offline().getNewIdFromDictionary(id).then(function (new_id) {
                    return self.get(new_id, true);
                });
            }
            return $.Deferred().reject('Item not found');
        });
    };


    /**
     * Retrieves an array of matching objects from Local Storage.
     *
     * @param {Object} [query=]
     * @returns {Deferred}
     * @public
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
     * @returns {Deferred}
     * @public
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
     * @returns {Deferred}
     * @public
     */
    this.drop = function () {
        return localforage.removeItemAsync(self.name);
    };

    /**
     * Retrieves the quantity of stored items
     *
     * @returns {Deferred}
     * @public
     */
    this.length = function () {
        return self.query().then(function (values) {
            return values.length;
        });
    };
};

/**
 * Retrieves a singleton instance of KidoLocalStorage.
 *
 * @returns {KidoLocalStorage}
 */
Kido.prototype.localStorage = function () {
    if (!this._localStorage) this._localStorage = new KidoLocalStorage(this);
    return this._localStorage;
};
