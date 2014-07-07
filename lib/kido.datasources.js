/**
 * Access to the Datasources backend service.
 *
 * @param kidoApp {Kido} - instance of the Kido class.
 * @param name {string}
 * @param {{caching: boolean, queueing: boolean, timeout: number}} [options={}]
 * @returns {KidoDatasource}
 * @constructor
 */
var KidoDatasource = function (kidoApp, name, options) {

    if (!(this instanceof KidoDatasource)) return new KidoDatasource(kidoApp, name);
    if (!kidoApp) throw "The 'kidoApp' argument is required by the KidoDatasource class.";
    if (!name) throw "The 'name' argument is required by the KidoDatasource class.";
    if (!options) options = { caching: false, queueing: false, timeout: null };

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
    this.caching = options.caching || false;
    /**
     * @type {boolean}
     */
    this.queueing = options.queueing || false;
    /**
     * @type {number}
     */
    this.timeout = options.timeout || null;


    /**
     * Sets default options.
     *
     * @param {Object} opts
     * @returns {KidoDatasource}
     * @public
     */
    this.defaults = function (opts) {
        self._defaults = $.extend(self._defaults, opts || {});
        return self;
    };

    /**
     * Queries a configured Enterprice API Data source.
     *
     * @param {Object} [opts={}]
     * @returns {Deferred}
     * @public
     */
    this.query = function (opts) {
        var result = $.Deferred();
        var args = $.extend({}, self._defaults, opts);
        var qs = Object.keys(args).length > 0 ? "?" + $.param(args) : "";
        var settings = self.timeout ? { headers: { "timeout": self.timeout } } : {};

        // Offline configuration
        settings.kidoService = {
            service: self.SERVICE_NAME,
            collection: self.name,
            caching: self.caching,
            queueing: false
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
     * Invokes a configured Enterprice API Data source method.
     *
     * @param {Object} [opts={}]
     * @returns {Deferred}
     * @public
     */
    this.invoke = function (opts) {
        var result = $.Deferred();
        var args = $.extend({}, self._defaults, opts);
        var settings = self.timeout ? { headers: { "timeout": self.timeout } } : {};

        // Offline configuration
        settings.kidoService = {
            service: self.SERVICE_NAME,
            collection: self.name,
            caching: false,
            queueing: self.queueing
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
 * @param {{caching: boolean, queueing: boolean, timeout: number}} [options={}]
 * @returns {KidoDatasource}
 */
Kido.prototype.datasources = function (name, options) {
    return new KidoDatasource(this, name, options);
};
