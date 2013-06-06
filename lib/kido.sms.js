
/**
 * access to the Sms backend service.
 *
 * @param kidoApp {object} - instance of the Kido class.
 */

var KidoSms = function ( kidoApp ) {

    var self = this;

    if (!(this instanceof KidoSms)) return new KidoSms(kidoApp);
    if (!kidoApp) throw "The 'kidoApp' argument is required by the KidoSms class.";

    this.app = kidoApp;

    this.send = function ( to, message ) {
        return self.app.post({
            url: "/sms?to=" + encodeURIComponent(to) + "&message=" + encodeURIComponent(message),
            headers : { "Content-Length": 0 }
        });
    };

    this.getStatus = function ( messageId ) {
        return self.app.get("/sms/" + messageId);
    };
};

Kido.prototype.sms = function() {

    if (!this._sms) this._sms = new KidoSms(this);
    return this._sms;
};