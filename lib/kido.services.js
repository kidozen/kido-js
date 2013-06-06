
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

        var args = $.extend(self._defaults, opts);
        return self.app.post("/api/services/" + self.name + "/invoke/" + name, args);
    };
};

Kido.prototype.services = function ( name ) {
    return new KidoService(this, name);
};