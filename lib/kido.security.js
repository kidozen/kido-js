/**
 * Access to the Security backend service.
 *
 * @param kidoApp {Kido} - instance of the Kido class.
 * @returns {KidoSecurity}
 * @constructor
 */
var KidoSecurity = function (kidoApp) {

    var self = this;

    if (!(this instanceof KidoSecurity)) return new KidoSecurity(kidoApp);
    if (!kidoApp) throw "The 'kidoApp' argument is required by the KidoSecurity class.";

    this.app = kidoApp;

    this.getLoggedInUser = function () {
        return self.app.get("/user");
    };

    this.getOriginalToken = function () {
        return self.app.get("/user/original-token");
    };
};

/**
 * Retrieves a singleton instance of KidoSecurity.
 *
 * @returns {KidoSecurity}
 */
Kido.prototype.security = function () {
    if (!this._security) this._security = new KidoSecurity(this);
    return this._security;
};
