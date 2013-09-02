
/**
 * access to the Enterprise Services backend service.
 *
 * @param kidoApp {object} - instance of the Kido class.
 */

var KidoService = function ( kidoApp, name ) {

    var self = this;

    if (!(this instanceof KidoService)) return new KidoService(kidoApp);
    if (!kidoApp) throw "The 'kidoApp' argument is required by the KidoService class.";

    /** variables **/

    this.app = kidoApp;
    this.name = name;
    this._defaults = {};


    /** methods **/

    this.defaults = function ( opts ) {

        self._defaults = $.extend(self._defaults, opts || {});
        return self;
    };


    this.invoke = function ( name, opts ) {
        var result = $.Deferred();
        var args = $.extend({}, self._defaults, opts);
        self.app
            .post("/api/services/" + self.name + "/invoke/" + name, args)
            .done(function ( res ) {
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

Kido.prototype.services = function ( name ) {
    return new KidoService(this, name);
};