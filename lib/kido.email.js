
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

    this.send = function (from, to, subject, bodyText, bodyHtml, attachments, timeout) {

        if (from && typeof from === 'object') {
            var mail = from;
            from = mail.from;
            to = mail.to;
            subject = mail.subject;
            bodyText = mail.bodyText;
            bodyHtml = mail.bodyHtml;
            attachments = mail.attachments;
            timeout = mail.timeout;
        }

        if (!from) throw "The 'from' argument is required to send an email.";
        if (!to) throw "The 'to' argument is required to send an email.";

        if (!attachments && bodyHtml instanceof Array) {
            attachments = bodyHtml;
            bodyHtml = null;
        }
        
        var mail = { to: to, from: from };
        if (typeof(subject)  === 'string' && subject.length>0 ) mail.subject  = subject;
        if (typeof(bodyText) === 'string' && bodyText.length>0) mail.bodyText = bodyText;
        if (typeof(bodyHtml) === 'string' && bodyHtml.length>0) mail.bodyHtml = bodyHtml;
        if (attachments instanceof Array) mail.attachments = attachments;

        return self.app.send({
            url: "/email",
            type: "POST",
            data: JSON.stringify(mail),
            timeout: timeout || 15 * 60 * 1000 // 15 minutes
        });
    };

    this.attach = function (formOrName, data, progress) {

        if (formOrName instanceof HTMLFormElement) {
        
            formOrName = new FormData(formOrName);
        }

        if (formOrName instanceof HTMLInputElement) {

            if (!(formOrName.type) || formOrName.type.toLowerCase() !== 'file') throw "HTML Input element must be of type 'file'.";
            formOrName = formOrName.files[0]
        }

        if (formOrName instanceof File) {

            var file = formOrName;
            formOrName = new FormData();
            formOrName.append(file.name, file);
        }

        if (formOrName instanceof FormData) {
            
            if (typeof(data) === 'function') {
                progress = data;
                data = null;
            }

        } else if (typeof(formOrName) === 'string') {
            
            var name = formOrName;
            formOrName = new FormData();    

            if (!data || typeof(data) === 'function') throw "if a name was specified, 'data' argument is required.";
            if (typeof data === 'string')   data = new Blob([data], { type: "text/text" });
            if (!(data instanceof Blob))    throw "'data' argument must be a string, a Blob instance or a File instance.";

            formOrName.append(name, data, name);
            
        } else {

            throw "The argument 'formOrName' is invalid.";
        }

        var dfd = new jQuery.Deferred();

        var success = function(e) {
            dfd.resolve(JSON.parse(e.currentTarget.response));
        };

        var failure = function(e) {
            dfd.reject(e.currentTarget);
        };

        var oXHR = new XMLHttpRequest();
        if (oXHR.upload && typeof progress === 'function') oXHR.upload.addEventListener('progress', progress, false);
        oXHR.addEventListener('load', success, false);
        oXHR.addEventListener('error', failure, false);
        oXHR.addEventListener('abort', failure, false);
        oXHR.open('POST', '/email/attachments');
        oXHR.send(formOrName);

        return dfd.promise();
    }
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