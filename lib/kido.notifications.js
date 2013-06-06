
/**
 * access to the Notifications backend service.
 *
 * @param kidoApp {object} - instance of the Kido class.
 */

var KidoNotifications = function ( kidoApp ) {

    var self = this;

    if (!(this instanceof KidoNotifications)) return new KidoNotifications(kidoApp);
    if (!kidoApp) throw "The 'kidoApp' argument is required by the KidoNotifications class.";

    this.app = kidoApp;

    this.send = function (channel, title, text, type, badge, image, param) {

        if (!channel) throw "'channel' argument is required.";
        if (!title) throw "'title' argument is required.";

        var notification = { title: title };
        if (typeof(type)==='string' && type) notification.type = type;
        if (typeof(text)==='string' && text) notification.text = text;
        if (typeof(image)==='string' && image) notification.image = image;
        if (typeof(badge)==='number') notification.badge = badge;
        if (param) notification.param = param;

        return parentKido.send({
            url: "/notifications/push/" + parentKido.applicationName + "/" + channel,
            type: "POST",
            data: JSON.stringify(notification)
        });
    };
};

Kido.prototype.notifications = function() {

    if (!this._notifications) this._notifications = new KidoNotifications(this);
    return this._notifications;
};