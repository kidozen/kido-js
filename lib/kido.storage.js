
/**
 * access to the object storage backend service.
 *
 * You can use this through the storage() helper in Kido ie:
 * ie: var tasks = new Kido().storage().objectSet("tasks");
 */

var KidoStorage = function ( kidoApp ) {

    var self = this;

    if (!(this instanceof KidoStorage)) return new KidoStorage(kidoApp);

    this.app = kidoApp;
    this.rootUrl = "/storage/" + this.app.name;

    this.getObjectSetNames = function () {
        return self.app.get(self.rootUrl);
    };

    this.objectSet = function ( name ) {
        return new KidoObjectSet(name, this);
    };
};

var KidoObjectSet = function ( name, parentStorage ) {

    var self = this;

    //validations

    if (!(this instanceof KidoObjectSet)) return new KidoObjectSet(name, parentStorage);
    if (!parentStorage) throw "KidoObjectSet needs a parent KidoStorage object.";

    //propeties

    this.storage =  parentStorage;
    this.name = name || 'default';
    this.rootUrl = this.storage.rootUrl + "/" + this.name;


    /** methods **/

    /**
     * @api private
     */

    this.invoke = function ( data ) {

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

        return self.storage.app.send(data.settings);
    };


    /**
     * inserts an object in the KidoZen Object Storage backend service.
     *
     * @param obj {object}        - the object to store.
     * @param isPrivate {boolean} - whether the object is private for that
     *                              user.
     * @api public
     */

    this.insert = function ( obj, isPrivate ) {

        if(!obj) throw "The object set 'obj' argument is requiered in order to insert.";

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

        return self.invoke(data).pipe(function ( result ) {
            return $.extend(obj, result);
        });
    };

    
    /**
     * Updates an existing object, the object instance
     * must contains the object's key
     */

    this.update = function ( obj, isPrivate ) {

        if(!obj) throw "obj argument is requiered.";

        obj = $.extend({}, obj);

        var data = {
            settings: {
                type: "PUT",
                data: JSON.stringify(obj)
            },
            isPrivate: isPrivate
        };

        return self
                .invoke(data)
                .pipe(function ( result ) {
                    return $.extend(obj, result);
                }, function ( err ) {

                    //if there is an error with the sync field for concurrency
                    //check, add the details to the error object.
                    if (err.status === 409) {
                        try
                        {
                            err.body = JSON.parse(err.responseText);
                        }
                        catch(e)
                        {
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
     * function will try to insert it
     *
     * @api public
     */

    this.save = function ( obj, isPrivate ){

        if(!obj) throw "obj argument is requiered.";

        obj = $.extend({}, obj);

        if(obj._id && obj._id.length > 0) {
            return self.update(obj, isPrivate);
        }
        else {
            return self.insert(obj, isPrivate);
        }
    };


    /**
     * Retrieves an object by its key
     */

    this.get = function ( objectId ) {

        if(!objectId) throw "objectId is required";

        var result = $.Deferred();

        self
            .invoke ({
                settings: { type: "GET" },
                objectId: objectId,
                cache: false
            })
            .fail(function ( err ) {
                if (err.status === 404) {
                    result.resolve(null);
                } else {
                    result.reject(err);
                }
            })
            .done(function ( obj ) { result.resolve(obj); });

        return result;
    };


    /**
     * Executes the query
     */

    this.query = function ( query, fields, options, cache ) {

        return self.invoke ({
            settings: { type: "GET" },
            query: query,
            fields: fields,
            options: options,
            cache: cache
        });
    };


    /**
     * Delete an object from the set by its key
     */

    this.del = function ( objectId ) {
        return self.invoke ({
            settings: { type: "DELETE", dataType: 'text' },
            objectId: objectId
        });
    };


    /**
     * drops the entire object set.
     */

    this.drop = function () {
        return self.invoke ({
            settings: { type: "DELETE", dataType: 'text' }
        });
    };
};


Kido.prototype.storage = function () {

    if (!this._storage) this._storage = new KidoStorage(this);

    return this._storage;
};
