
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
        if (!to) throw "The 'to' argument is required to send an sms.";
        if (!message) throw "The 'message' argument is required to send an sms.";
        
        return self.app.send({
            url: "/sms?to=" + encodeURIComponent(to) + "&message=" + encodeURIComponent(message),
            type: "POST"
        });
    };

    this.getStatus = function ( messageId ) {
        if (!messageId) throw "The 'messageId' argument is required to get message status";        
        return self.app.get("/sms/" + messageId);
    };
};

Kido.prototype.sms = function() {
    if (!this._sms) this._sms = new KidoSms(this);
    return this._sms;
};