/**
 * Access to the object storage backend service.
 * You can use this through the storage() helper in Kido.
 * ie: var tasks = new Kido().storage().objectSet("tasks");
 *
 * @param {Kido} kidoApp
 * @returns {KidoStorage}
 * @constructor
 */
var KidoStorage = function (kidoApp) {

    if (!(this instanceof KidoStorage)) return new KidoStorage(kidoApp);

    /**
     * @type {KidoStorage}
     */
    var self = this;
    /**
     * @type {Kido}
     */
    this.app = kidoApp;
    /**
     * @constant {string}
     */
    this.SERVICE_NAME = "storage";
    /**
     * @type {string}
     */
    this.rootUrl = "/storage/local";

    /**
     * Retrieves the names of the object sets
     *
     * @returns {Deferred}
     * @public
     */
    this.getObjectSetNames = function () {
        return self.app.get(self.rootUrl);
    };

    /**
     * Retrieves an object set with given name.
     *
     * @param {string} name
     * @param {{caching: boolean, queueing: boolean}} [options={}]
     * @returns {KidoObjectSet}
     * @public
     */
    this.objectSet = function (name, options) {
        return new KidoObjectSet(name, this, options);
    };
};

/**
 * @param {string} name
 * @param {KidoStorage} parentStorage
 * @param {{caching: boolean, queueing: boolean}} [options={}]
 * @returns {KidoObjectSet}
 * @constructor
 */
var KidoObjectSet = function (name, parentStorage, options) {

    if (!(this instanceof KidoObjectSet)) return new KidoObjectSet(name, parentStorage);
    if (!parentStorage) throw "KidoObjectSet needs a parent KidoStorage object.";
    if (!options) options = { caching: false, queueing: false };

    /**
     * @type {KidoObjectSet}
     */
    var self = this;
    /**
     * @type {KidoStorage}
     */
    this.storage = parentStorage;
    /**
     * @type {string}
     */
    this.name = name || 'default';
    /**
     * @type {string}
     */
    this.rootUrl = this.storage.rootUrl + "/" + this.name;
    /**
     * @type {boolean}
     */
    this.caching = options.caching || false;
    /**
     * @type {boolean}
     */
    this.queueing = options.queueing || false;

    /**
     * Invokes an operation on an object set.
     *
     * @param {Object} data
     * @returns {Deferred}
     * @private
     */
    this.invoke = function (data) {

        if (!data) throw "The storage 'data' argument is required";
        if (!data.settings) throw "The storage 'data.settings' property is required.";

        var params = [];
        if (data.query) params.push("query=" + JSON.stringify(data.query));
        if (data.options) params.push("options=" + JSON.stringify(data.options));
        if (data.fields) params.push("fields=" + JSON.stringify(data.fields));
        if (data.isPrivate) params.push("isPrivate=true");

        //the URL format is /storage/local/{objectset}/{objectId}
        data.settings.url =
            self.rootUrl +
            (data.objectId ? "/" + data.objectId : "") +
            (data.indexes ? "/" + data.indexes : "") +
            (params.length ? "?" + params.join("&") : "");
        data.settings.url = encodeURI(data.settings.url);
        data.settings.cache = data.cache;

        // Offline configuration
        data.settings.kidoService = {
            service: self.storage.SERVICE_NAME,
            collection: self.name,
            objectId: data.objectId,
            query: data.query,
            caching: self.caching,
            queueing: self.queueing
        };

        return self.storage.app.send(data.settings);
    };

    /**
     * Inserts an object in the KidoZen Object Storage backend service.
     *
     * @param {Object} obj                - the object to store.
     * @param {boolean} [isPrivate=false] - whether the object is private for that user.
     * @returns {Deferred}
     * @public
     */
    this.insert = function (obj, isPrivate) {

        if (!obj) throw "The object set 'obj' argument is requiered in order to insert.";

        /**
         * we should not modify the original object to avoid problems on the
         * front end. The assumption should be that a new (or copy) object
         * will be returned when inserting/updating.
         */
        obj = $.extend({}, obj);

        //remove the _id in case somebody is trying to insert the same object
        //multiple times.
        obj._id = undefined;

        var data = {
            settings: {
                type: "POST",
                data: JSON.stringify(obj)
            },
            isPrivate: isPrivate
        };

        return self.invoke(data).then(function (result) {
            return $.extend(obj, result);
        });
    };


    /**
     * Updates an existing object, the object instance
     * must contains the object's key.
     *
     * @param {Object} obj
     * @param {boolean} [isPrivate=false]
     * @returns {Deferred}
     * @public
     */
    this.update = function (obj, isPrivate) {

        if (!obj) throw "obj argument is requiered.";

        obj = $.extend({}, obj);

        var data = {
            settings: {
                type: "PUT",
                data: JSON.stringify(obj)
            },
            isPrivate: !!isPrivate
        };

        return self
            .invoke(data)
            .then(function (result) {
                return $.extend(obj, result);
            }, function (err) {

                //if there is an error with the sync field for concurrency
                //check, add the details to the error object.
                if (err.status === 409) {
                    try {
                        err.body = JSON.parse(err.responseText);
                    }
                    catch (e) {
                    }
                }
                return err;
            });
    };

    /**
     * Inserts or updates the object instance.
     * If the object instance contains the object's key
     * then this function will update it, if the object
     * instance doesn't contain the object's key then this
     * function will try to insert it.
     *
     * @param {Object} obj
     * @param {boolean} [isPrivate=false]
     * @returns {Deferred}
     * @public
     */
    this.save = function (obj, isPrivate) {

        if (!obj) throw "obj argument is requiered.";

        obj = $.extend({}, obj);

        if (obj._id && obj._id.length > 0) {
            return self.update(obj, isPrivate);
        }
        else {
            return self.insert(obj, isPrivate);
        }
    };


    /**
     * Retrieves an object by its key.
     *
     * @param {string} objectId
     * @returns {Deferred}
     * @public
     */
    this.get = function (objectId) {

        if (!objectId) throw "objectId is required";

        var result = $.Deferred();

        self
            .invoke({
                settings: { type: "GET" },
                objectId: objectId,
                cache: false
            })
            .fail(function (err) {
                if (err.status === 404) {
                    result.resolve(null);
                } else {
                    result.reject(err);
                }
            })
            .done(function (obj) {
                result.resolve(obj);
            });

        return result;
    };


    /**
     * Executes the query.
     *
     * @param [query=]
     * @param [fields=]
     * @param [options=]
     * @param [cache=]
     * @returns {Deferred}
     * @public
     */
    this.query = function (query, fields, options, cache) {
        return self.invoke({
            settings: { type: "GET" },
            query: query,
            fields: fields,
            options: options,
            cache: cache
        });
    };


    /**
     * Delete an object from the set by its key.
     *
     * @param {string} objectId
     * @returns {Deferred}
     * @public
     */
    this.del = function (objectId) {
        return self.invoke({
            settings: { type: "DELETE", dataType: 'text' },
            objectId: objectId
        });
    };


    /**
     * Drops the entire object set.
     *
     * @returns {Deferred}
     * @public
     */
    this.drop = function () {
        return self.invoke({
            settings: { type: "DELETE", dataType: 'text' }
        });
    };
};

/**
 * Retrieves a singleton instance of KidoStorage.
 *
 * @returns {KidoStorage}
 */
Kido.prototype.storage = function () {
    if (!this._storage) this._storage = new KidoStorage(this);
    return this._storage;
};
