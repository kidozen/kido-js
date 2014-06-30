/**
 * Access to the Datasources backend service.
 *
 * @param kidoApp {Kido}
 * @param name {string}
 * @param [caching=false] {boolean}
 * @returns {KidoDatasource}
 * @constructor
 */
var KidoDatasource = function (kidoApp, name, caching) {

    var self = this;

    if (!(this instanceof KidoDatasource)) return new KidoDatasource(kidoApp, name);
    if (!kidoApp) throw "The 'kidoApp' argument is required by the KidoDatasource class.";
    if (!name) throw "The 'name' argument is required by the KidoDatasource class.";

    /** variables **/

    this.app = kidoApp;
    this.name = name;
    this._defaults = {};
    this.caching = caching || false;

    /** methods **/

    this.defaults = function (opts) {
        self._defaults = $.extend(self._defaults, opts || {});
        return self;
    };

    this.query = function (opts, timeout) {
        if (!timeout && $.isNumeric(opts)) {
            timeout = opts;
            opts = null;
        }
        var result = $.Deferred();
        var args = $.extend({}, self._defaults, opts);
        var qs = Object.keys(args).length > 0 ? "?" + $.param(args) : "";
        var settings = timeout ? { headers: { "timeout": timeout } } : {};
        self.app
            .get("/api/v2/datasources/" + self.name + qs, settings)
            .done(function (res) {
                if (res.error) {
                    return result.reject(res.error);
                }
                result.resolve(res.data || res);
            })
            .fail(function (err) {
                result.reject(err);
            });
        return result;
    };

    this.invoke = function (opts, timeout) {
        // $.isNumeric requires jQuery 1.7+
        if (!timeout && $.isNumeric(opts)) {
            timeout = opts;
            opts = null;
        }
        var result = $.Deferred();
        var args = $.extend({}, self._defaults, opts);
        var settings = timeout ? { headers: { "timeout": timeout } } : {};
        self.app
            .post("/api/v2/datasources/" + self.name, args, settings)
            .done(function (res) {
                if (res.error) {
                    return result.reject(res.error);
                }
                result.resolve(res.data || res);
            })
            .fail(function (err) {
                result.reject(err);
            });
        return result;
    };
};

/**
 * Retrieves an instance of KidoDatasource.
 *
 * @param name {string}
 * @param [caching=false] {boolean}
 * @returns {KidoDatasource}
 */
Kido.prototype.datasources = function (name, caching) {
    return new KidoDatasource(this, name, caching);
};
