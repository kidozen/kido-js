/**
 * Access to the Pubsub backend service.
 *
 * @param kidoApp {Kido} - instance of the Kido class.
 * @returns {KidoPubsub}
 * @constructor
 */
var KidoPubsub = function (kidoApp) {

    if (!(this instanceof KidoPubsub)) return new KidoPubsub(kidoApp);
    if (!kidoApp) throw "The 'kidoApp' argument is required by the KidoPubsub class.";

    /**
     * @type {KidoPubsub}
     */
    var self = this;
    /**
     * @type {Kido}
     */
    this.app = kidoApp;
    /**
     * @constant {string}
     */
    this.SERVICE_NAME = "pubsub";


    this.channel = function (name) {
        return new KidoPubsubChannel(name, self.app);
    };
};

var KidoPubsubChannel = function (name, app) {

    var self = this;
    this.name = name;
    this.app = app;
    this.rootUrl = "/pubsub/local/";

    this.publish = function (data) {
        return self.app.send({
            url: self.rootUrl + self.name,
            type: "POST",
            data: JSON.stringify(data),
            dataType: 'text'
        });
    };

    this.subscribe = function (cb) {

        var socket = io.connect('/pubsub');

        socket.on('connect', function () {
            socket.emit('bindToChannel', { application: self.app.name, channel: self.name });
        });

        socket.on('bindAccepted', function (m) {
            socket.on(m.responseChannelName, cb);
        });

        return function () {
            socket.disconnect();
        };
    };
};

/**
 * Retrieves a singleton instance of KidoPubsub.
 *
 * @returns {KidoPubsub}
 */
Kido.prototype.pubsub = function () {
    if (!this._pubsub) this._pubsub = new KidoPubsub(this);
    return this._pubsub;
};
