Kido.prototype.sms = function() {

    var parentKido = this;

    return {
        kido: parentKido,

        send: function (to, message) {
            return parentKido.send({
                url: "/sms?to=" + encodeURIComponent(to) + "&message=" + encodeURIComponent(message),
                type: "POST",
                headers : { "Content-Length": 0 }
            });
        },

        getStatus: function (messageId) {
            var settings = {
                url: "/sms/" + messageId,
                type: "GET"
            };

            return parentKido.send(settings);
        }
    };
};