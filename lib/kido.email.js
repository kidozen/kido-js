
/**
 * access to the email backend service.
 *
 * @param kidoApp {object} - instance of the Kido class.
 */

var KidoEmail = function ( kidoApp ) {

    var self = this;

    if (!(this instanceof KidoEmail)) return new KidoEmail(kidoApp);
    if (!kidoApp) throw "The 'kidoApp' argument is required by the KidoEmail class.";

    this.app = kidoApp;

    this.send = function (from, to, subject, bodyText, bodyHtml) {

        if (!to) throw "The 'to' argument is required to send an email.";
        if (!from) throw "The 'from' argument is required to send an email.";

        var mail = { to: to, from: from };
        if (typeof(subject)  ==='string' && subject.length>0 ) mail.subject  = subject;
        if (typeof(bodyText) ==='string' && bodyText.length>0) mail.bodyText = bodyText;
        if (typeof(bodyHtml) ==='string' && bodyHtml.length>0) mail.bodyHtml = bodyHtml;

        return self.app.send({
            url: "/email",
            type: "POST",
            data: JSON.stringify(mail)
        });
    };
};

/**
 * add a singleton helper to Kido to retrieve an instance of KidoEmail.
 *
 * @api public
 */

Kido.prototype.email = function() {

    if (!this._email) this._email = new KidoEmail(this);

    return this._email;
};