/**
 * Access to the Sms backend service.
 *
 * @param {Kido} kidoApp - instance of the Kido class.
 * @param {{queueing: boolean}} [options=]
 * @returns {KidoSms}
 * @constructor
 */
var KidoSms = function (kidoApp, options) {

    if (!(this instanceof KidoSms)) return new KidoSms(kidoApp);
    if (!kidoApp) throw "The 'kidoApp' argument is required by the KidoSms class.";
    if (!options) options = { queueing: false };

    /**
     * @type {KidoSms}
     */
    var self = this;
    /**
     * @type {Kido}
     */
    this.app = kidoApp;
    /**
     * @constant {string}
     */
    this.SERVICE_NAME = "sms";
    /**
     * @type {boolean}
     */
    this.caching = false;
    /**
     * @type {boolean}
     */
    this.queueing = options.queueing || false;

    /**
     * Sends a text message to a mobile phone.
     *
     * @param {string|number} to
     * @param {string} message
     * @returns {Deferred}
     */
    this.send = function (to, message) {
        if (!to) throw "The 'to' argument is required to send an sms.";
        if (!message) throw "The 'message' argument is required to send an sms.";

        var settings = {
            url: "/sms?to=" + encodeURIComponent(to) + "&message=" + encodeURIComponent(message),
            type: "POST"
        };

        // Offline configuration
        settings.kidoService = {
            service: self.SERVICE_NAME,
            caching: self.caching,
            queueing: self.queueing
        };

        return self.app.send(settings);
    };

    /**
     * Retrieves the status of a message.
     *
     * @param {string} messageId
     * @returns {Deferred}
     */
    this.getStatus = function (messageId) {
        if (!messageId) throw "The 'messageId' argument is required to get message status";
        return self.app.get("/sms/" + messageId);
    };
};

/**
 * Retrieves a singleton instance of KidoSms.
 *
 * @param {{queueing: boolean}} [options=]
 * @returns {KidoSms}
 */
Kido.prototype.sms = function (options) {
    if (!this._sms) this._sms = new KidoSms(this, options);
    return this._sms;
};
