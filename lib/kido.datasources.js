/**
 * access to the Datasources backend service.
 *
 * @param kidoApp {object} - instance of the Kido class.
 */

var KidoDatasource = function ( kidoApp, name ) {

    var self = this;

    if (!(this instanceof KidoDatasource)) return new KidoDatasource(kidoApp);
    if (!kidoApp) throw "The 'kidoApp' argument is required by the KidoDatasource class.";

    /** variables **/

    this.app = kidoApp;
    this.name = name;
    this._defaults = {};


    /** methods **/

    this.defaults = function ( opts ) {
        self._defaults = $.extend(self._defaults, opts || {});
        return self;
    };

    this.query = function ( opts, timeout ) {
        var result = $.Deferred();
        var args = $.extend({}, self._defaults, opts);
        var qs = "?"+ $.param(args);
        var settings = timeout ? { headers: { "timeout": timeout } } : {};
        self.app
            .get("/api/v2/datasources/" + self.name + qs, args, settings)
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

    this.invoke = function ( opts, timeout ) {
        var result = $.Deferred();
        var args = $.extend({}, self._defaults, opts);
        var settings = timeout ? { headers: { "timeout": timeout } } : {};
        self.app
            .post("/api/v2/datasources/" + self.name, args, settings)
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

Kido.prototype.datasources = function ( name ) {
    return new KidoDatasource(this, name);
};
