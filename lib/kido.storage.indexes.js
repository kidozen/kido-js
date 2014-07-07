/**
 * Access to the storage backend service, to manage object set indexes.
 *
 * @param objectSet {KidoObjectSet} - instance of the KidoObjectSet class.
 * @returns {KidoStorageIndexes}
 * @constructor
 */
var KidoStorageIndexes = function (objectSet) {

    if (!(this instanceof KidoStorageIndexes)) return new KidoStorageIndexes(objectSet);
    if (!objectSet) throw "The 'objectSet' argument is required by the KidoStorageIndexes class.";

    /**
     * @type {KidoStorageIndexes}
     */
    var self = this;
    /**
     * @type {KidoObjectSet}
     */
    this.objectSet = objectSet;
    /**
     * @constant {string}
     */
    this.SERVICE_NAME = "storageindexes";

    this.all = function () {
        var data = {
            indexes: "indexes",
            settings: {
                type: "GET"
            }};
        return self.objectSet.invoke(data);
    };

    this.get = function (name) {

        if (!name) throw "The 'name' argument is required to retrieve an object set index.";

        var data = {
            indexes: "indexes?name=" + name,
            settings: {
                type: "GET"
            }};
        return self.objectSet.invoke(data);
    };

    this.del = function (name) {

        if (!name) throw "The 'name' argument is required to delete an object set index.";

        var data = {
            indexes: "indexes/" + name,
            settings: {
                type: "DELETE"
            }};
        return self.objectSet.invoke(data);
    };

    //spec: JSON string with the index's specification. {lastName:1, firstName:1}
    //safe: fire and forget will be overrided
    //sparse: A "sparse index" is an index that only includes documents with the indexed field.
    //background: creates the index in the background, yielding whenever possible
    //dropDups: a unique index cannot be created on a key that has pre-existing duplicate: values. If you would like to create the index anyway, keeping the first document the database: indexes and deleting all subsequent documents that have duplicate value
    //min: for geospatial indexes set the lower bound for the co-ordinates
    //max: for geospatial indexes set the high bound for the co-ordinates.
    //please refer to: http://www.mongodb.org/display/DOCS/Indexes#Indexes-CreationOptions
    this.create = function (spec, safe, unique, sparse, background, dropDups, min, max) {

        if (!spec) throw "The 'spec' argument is required to create an index.";
        if (!safe) safe = false;
        if (!unique) unique = false;
        if (!sparse) sparse = false;
        if (!background) background = false;
        if (!dropDups) dropDups = false;

        var index = {
            spec: spec,
            options: { safe: safe, unique: unique, sparse: sparse, background: background, dropDups: dropDups }
        };

        if (min && min.toString() != "0") index.options.min = min;
        if (max && max.toString() != "0") index.options.max = max;

        var data = {
            indexes: "indexes",
            settings: {
                type: "POST",
                data: JSON.stringify(index)
            }};
        return self.objectSet.invoke(data);
    };
};

/**
 * Retrieves a singleton instance of KidoStorageIndexes.
 *
 * @returns {KidoStorageIndexes}
 */
KidoObjectSet.prototype.indexes = function () {
    if (!this._indexes) this._indexes = new KidoStorageIndexes(this);
    return this._indexes;
};
