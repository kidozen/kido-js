/**
 * Access to the Enterprise Services backend service.
 *
 * @param kidoApp {Kido} - instance of the Kido class.
 * @param name
 * @returns {KidoService}
 * @constructor
 */
var KidoService = function (kidoApp, name) {

    if (!(this instanceof KidoService)) return new KidoService(kidoApp);
    if (!kidoApp) throw "The 'kidoApp' argument is required by the KidoService class.";

    /**
     * @type {KidoService}
     */
    var self = this;
    /**
     * @type {Kido}
     */
    this.app = kidoApp;
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
     * @constant {string}
     */
    this.SERVICE_NAME = "services";

    /**
     * Sets default options.
     *
     * @param {Object} opts
     * @returns {KidoService}
     * @public
     */
    this.defaults = function (opts) {
        self._defaults = $.extend(self._defaults, opts || {});
        return self;
    };

    /**
     * Invokes a configured Enterprice API Service method.
     *
     * @param {string} name
     * @param {Object} [opts={}]
     * @param {number} [timeout=]
     * @returns {Deferred}
     * @public
     */
    this.invoke = function (name, opts, timeout) {
        var result = $.Deferred();
        var args = $.extend({}, self._defaults, opts);
        var settings = timeout ? { headers: { "timeout": timeout } } : {};
        self.app
            .post("/api/services/" + self.name + "/invoke/" + name, args, settings)
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
 * Retrieves an instance of KidoService;
 *
 * @param {string} name
 * @returns {KidoService}
 */
Kido.prototype.services = function (name) {
    return new KidoService(this, name);
};
