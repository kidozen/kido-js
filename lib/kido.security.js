/**
 * Access to the Security backend service.
 *
 * @param kidoApp {Kido} - instance of the Kido class.
 * @returns {KidoSecurity}
 * @constructor
 */
var KidoSecurity = function (kidoApp) {

    if (!(this instanceof KidoSecurity)) return new KidoSecurity(kidoApp);
    if (!kidoApp) throw "The 'kidoApp' argument is required by the KidoSecurity class.";

    /**
     * @type {KidoSecurity}
     */
    var self = this;
    /**
     * @type {Kido}
     */
    this.app = kidoApp;
    /**
     * @constant {string}
     */
    this.SERVICE_NAME = "security";

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
