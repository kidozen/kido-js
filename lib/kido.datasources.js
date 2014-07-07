/**
 * Access to the Datasources backend service.
 *
 * @param kidoApp {Kido} - instance of the Kido class.
 * @param name {string}
 * @param [caching=false] {boolean}
 * @returns {KidoDatasource}
 * @constructor
 */
var KidoDatasource = function (kidoApp, name, caching) {

    if (!(this instanceof KidoDatasource)) return new KidoDatasource(kidoApp, name);
    if (!kidoApp) throw "The 'kidoApp' argument is required by the KidoDatasource class.";
    if (!name) throw "The 'name' argument is required by the KidoDatasource class.";

    /**
     * @type {KidoDatasource}
     */
    var self = this;
    /**
     * @type {Kido}
     */
    this.app = kidoApp;
    /**
     * @constant {string}
     */
    this.SERVICE_NAME = "datasources";
    /**
     * @type {string}
     */
    this.name = name;
    /**
     * @type {Object}
     * @private
     */
    this._defaults = {};
    /**
     * @type {boolean}
     */
    this.caching = caching || false;


    /**
     * Sets default options.
     *
     * @param opts
     * @returns {KidoDatasource}
     */
    this.defaults = function (opts) {
        self._defaults = $.extend(self._defaults, opts || {});
        return self;
    };

    /**
     * Queries a data source.
     *
     * @param {Object} opts
     * @param {number} timeout
     * @returns {*}
     */
    this.query = function (opts, timeout) {
        if (!timeout && $.isNumeric(opts)) {
            timeout = opts;
            opts = null;
        }
        var result = $.Deferred();
        var args = $.extend({}, self._defaults, opts);
        var qs = Object.keys(args).length > 0 ? "?" + $.param(args) : "";
        var settings = timeout ? { headers: { "timeout": timeout } } : {};

        // Offline configuration
        settings.kidoService = {
            service: self.SERVICE_NAME,
            collection: self.name,
            caching: self.caching
        };

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

    /**
     * Invokes a data source method.
     *
     * @param {Object} opts
     * @param {number} timeout
     * @returns {*}
     */
    this.invoke = function (opts, timeout) {
        if (!timeout && $.isNumeric(opts)) {
            timeout = opts;
            opts = null;
        }
        var result = $.Deferred();
        var args = $.extend({}, self._defaults, opts);
        var settings = timeout ? { headers: { "timeout": timeout } } : {};

        // Offline configuration
        settings.kidoService = {
            service: self.SERVICE_NAME,
            collection: self.name,
            caching: self.caching
        };

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
 * @param {string} name
 * @param {boolean} [caching=false]
 * @returns {KidoDatasource}
 */
Kido.prototype.datasources = function (name, caching) {
    return new KidoDatasource(this, name, caching);
};
