/**
 * Access to the logging backend service.
 *
 * @param kidoApp {Kido} - instance of the Kido class.
 * @returns {KidoLogging}
 * @constructor
 */
var KidoLogging = function (kidoApp) {

    if (!(this instanceof KidoLogging)) return new KidoLogging(kidoApp);
    if (!kidoApp) throw "The 'kidoApp' argument is required by the KidoLogging class.";

    /**
     * @type {KidoLogging}
     */
    var self = this;
    /**
     * @type {Kido}
     */
    this.app = kidoApp;
    /**
     * @constant {string}
     */
    this.SERVICE_NAME = "logging";

    this.writeVerbose = function (data) {
        return self.write(data, 0);
    };

    this.writeInfo = function (data) {
        return self.write(data, 1);
    };

    this.writeWarning = function (data) {
        return self.write(data, 2);
    };

    this.writeError = function (data) {
        return self.write(data, 3);
    };

    this.writeCritical = function (data) {
        return self.write(data, 4);
    };

    this.write = function (data, level, message) {

        if (!data) throw "'data' argument is requiered.";
        if (!level && level !== 0) throw "'level' argument is required.";
        if (!(level >= 0 && level <= 4)) throw "'level' argument must be an integer number between 0 and 4.";

        return self.app.send({
            url: "/api/v3/logging/log?level=" + level + (message ? ("&message=" + encodeURIComponent(message)) : ""),
            type: "POST",
            data: JSON.stringify(data)
        });
    };

    this.query = function (query) {
        var params = [];
        if (query) params.push("query=" + JSON.stringify(query));
        // if (options) params.push("options=" + JSON.stringify(options));

        return self.app.send({
            url: "/api/v3/logging/log" + ((params.length > 0) ? ("?" + params.join("&")) : ""),
            type: "GET"
        });
    };

    this.get = function (since, level, skip, limit) {

        var query = {};

        if (level)
            query.level = level;

        if (since) {
            if (!(since instanceof Date)) throw "'Since' argument accepts only null or Date values.";
            query.dateTime = { $gt: since };
        } else {
            query.dateTime = {"$exists": true};
        }

        var options = { $sort: { dateTime: -1 } };
        if (skip) options.$skip = skip;
        if (limit) options.$limit = limit;

        return self.query(query, options);
    };

    this.clear = function () {
        return self.app.send({
            url: "/api/v3/logging/log",
            type: "DELETE",
            dataType: 'text'
        });
    };
};

/**
 * Retrieves a singleton instance of KidoLogging.
 *
 * @returns {KidoLogging}
 */
Kido.prototype.logging = function () {
    if (!this._logging) this._logging = new KidoLogging(this);
    return this._logging;
};
