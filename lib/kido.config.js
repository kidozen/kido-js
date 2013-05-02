Kido.prototype.config = function() {

    var parentKido = this;

    return {
        kido: parentKido,

        set: function (name, data) {
            if(!name) throw "'name' argument is requiered.";

            return parentKido.send({
                url: "/config/" + name,
                type: "POST",
                data: data ? JSON.stringify(data) : null
            });
        },

        get: function (name, customData) {
            if(!name) throw "'name' argument is requiered.";

            var settings = {
                url: "/config/" + name,
                type: "GET"
            };
            if (customData) settings.data = JSON.stringify(customData);

            return parentKido.send(settings);
        },

        getAll: function () {
            var settings = {
                url: "/config",
                type: "GET"
            };

            return parentKido.send(settings);
        },

        del: function (name) {
            if(!name) throw "'name' argument is requiered.";

            return parentKido.send({
                url: "/config/" + name,
                type: "DELETE"
            });
        }
    };
};