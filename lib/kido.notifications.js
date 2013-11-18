
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

        return self.app.send({
            url: "/notifications/push/" + self.app.name + "/" + channel,
            type: "POST",
            data: JSON.stringify(notification)
        });
    };
    
    /**
     * subscribe to a push notification channel to start receiving
     * events.
     * @param {string} deviceId to uniquely identify the device
     * @param {string} channel of events
     * @param {string} subscriptionId is the platform specific id of push
     *                 notification's service registration.
     * @param {string} platform "gcm" | "apns" | "c2dm" | "mpns" | "wns"
     * @api public
     */
    this.subscribe = function (deviceId, channel, subscriptionId, platform) {

        if (!deviceId) throw "'deviceId' argument is required.";
        if (!channel) throw "'channel' argument is required.";
        if (!subscriptionId) throw "'subscriptionId' argument is required.";
        if (!platform) throw "'platform' is required. Use one of: gcm, apns, c2dm, mpns or wns.";

        return self.app.send({
            url: "/notifications/subscriptions/" + self.app.name + "/" + channel,
            type: "POST",
            data: JSON.stringify({
                deviceId: deviceId,
                subscriptionId: subscriptionId,
                platform: platform
            })
        });
    };
};

Kido.prototype.notifications = function() {

    if (!this._notifications) this._notifications = new KidoNotifications(this);
    return this._notifications;
};