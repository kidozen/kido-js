Kido.prototype.email = function() {

    var parentKido = this;

    return {
        kido: parentKido,

        send: function (from, to, subject, bodyText, bodyHtml) {
			if (!to) throw "'to' argument is required.";
			if (!from) throw "'from' argument is required.";
			
			var mail = { to: to, from: from };
            if (typeof(subject)==='string' && subject.length>0) mail.subject = subject;
			if (typeof(bodyText)==='string' && bodyText.length>0) mail.bodyText = bodyText;
            if (typeof(bodyHtml)==='string' && bodyHtml.length>0) mail.bodyHtml = bodyHtml;

            return parentKido.send({
                url: "/email",
                type: "POST",
                data: JSON.stringify(mail)
            });
        }
    };
};