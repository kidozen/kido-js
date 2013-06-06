
/**
 * access to the logging backend service.
 *
 * @param kidoApp {object} - instance of the Kido class.
 */

var KidoLogging = function ( kidoApp ) {

    var self = this;

    if (!(this instanceof KidoLogging)) return new KidoLogging(kidoApp);
    if (!kidoApp) throw "The 'kidoApp' argument is required by the KidoLogging class.";
    
    this.app = kidoApp;

    this.writeVerbose = function (data) {
        return this.write(data, 0);
    };

    this.writeInfo = function (data) {
        return this.write(data, 1);
    };

    this.writeWarning = function (data) {
        return this.write(data, 2);
    };

    this.writeError = function (data) {
        return this.write(data, 3);
    };

    this.writeCritical = function (data) {
        return this.write(data, 4);
    };

    this.write = function (data, level) {

        if(!data) throw "'data' argument is requiered.";
        if (!level && level!==0) throw "'level' argument is required.";
        if (!(level>=0 && level<=4)) throw "'level' argument must be an integer number between 0 and 4.";

        return self.app.send({
            url: "/logging?level=" + level,
            type: "POST",
            data: JSON.stringify(data)
        });
    };

    this.query = function (query, options) {
        var params = [];
        if (query) params.push("query=" + JSON.stringify(query));
        if (options) params.push("options=" + JSON.stringify(options));

        return self.app.send({
            url: "/logging" + ((params.length>0) ? ("?" + params.join("&")) : ""),
            type: "GET"
        });
    };

    this.get = function(since, level, skip, limit) {

        var query = {};

        if (level)
            query.level = level;

        if (since) {
            if (!(since instanceof Date)) throw "'Since' argument accepts only null or Date values.";
            query.dateTime = { $gt: since };
        } else {
            query.dateTime = {"$exists":true};
        }

        var options = { $sort: { dateTime: -1 } };
        if (skip) options.$skip = skip;
        if (limit) options.$limit = limit;

        return self.query(query, options);
    };

    this.clear = function () {
        return self.app.send({
            url: "/logging",
            type: "DELETE",
            dataType: 'text'
        });
    };
};


/**
 * singleton access to a KidoLogging instance.
 */

Kido.prototype.logging = function() {

    if (!this._logging) this._logging = new KidoLogging(this);
    return this._logging;
};