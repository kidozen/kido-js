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

    this.getLoggedInUser = function() {
        return self.app.get("/user")
            .then(function(claims) {
                var result = {};
                claims.forEach(function(item) {
                    var key = item.type.substring(item.type.lastIndexOf('/') + 1);
                    result[key] = item.value;
                });
            });
    };

    this.getOriginalToken = function () {
        return self.app.get("/user/original-token");
    };

    this.getJWT = function (useGzip) {
        var url = "/api/v3/delegation/token" + (useGzip ? "?gzip=true" : "");
        return self.app.get(url);
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
