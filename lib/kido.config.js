/**
 * Access to the configuration backend service.
 *
 * @param kidoApp {Kido} - instance of the Kido class.
 * @returns {KidoConfig}
 * @constructor
 */
var KidoConfig = function (kidoApp) {

    if (!(this instanceof KidoConfig)) return new KidoConfig(kidoApp);
    if (!kidoApp) throw "The 'kidoApp' argument is required by the KidoConfig class.";

    /**
     * @type {KidoConfig}
     */
    var self = this;
    /**
     * @type {Kido}
     */
    this.app = kidoApp;
    /**
     * @constant {string}
     */
    this.SERVICE_NAME = "config";

    this.set = function (name, data) {
        if (!name) throw "The config key 'name' is required to set a value.";
        return self.app.post("/config/" + name, data);
    };

    this.get = function (name) {
        if (!name) throw "The config key 'name' is required to retrieve the value.";
        return self.app.get("/config/" + name);
    };

    this.getAll = function () {
        return self.app.get("/config");
    };

    this.del = function (name) {
        if (!name) throw "The config key 'name' is required to delete a value.";
        return self.app.del("/config/" + name);
    };
};

/**
 * Retrieves a singleton instance of KidoConfig.
 *
 * @returns {KidoConfig}
 */
Kido.prototype.config = function () {
    if (!this._config) this._config = new KidoConfig(this);
    return this._config;
};
