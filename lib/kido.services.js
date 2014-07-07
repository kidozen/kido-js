/**
 * Access to the Enterprise Services backend service.
 *
 * @param kidoApp {Kido} - instance of the Kido class.
 * @param name
 * @returns {KidoService}
 * @constructor
 */
var KidoService = function (kidoApp, name) {

    var self = this;

    if (!(this instanceof KidoService)) return new KidoService(kidoApp);
    if (!kidoApp) throw "The 'kidoApp' argument is required by the KidoService class.";

    /** variables **/

    this.app = kidoApp;
    this.name = name;
    this._defaults = {};


    /** methods **/

    this.defaults = function (opts) {
        self._defaults = $.extend(self._defaults, opts || {});
        return self;
    };

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
