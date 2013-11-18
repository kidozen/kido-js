
/**
 * access to the Pubsub backend service.
 *
 * @param kidoApp {object} - instance of the Kido class.
 */

var KidoPubsub = function ( kidoApp ) {

    var self = this;

    if (!(this instanceof KidoPubsub)) return new KidoPubsub(kidoApp);
    if (!kidoApp) throw "The 'kidoApp' argument is required by the KidoPubsub class.";

    this.app = kidoApp;

    this.channel = function ( name ) {
        return new KidoPubsubChannel(name, self.app);
    };
};

var KidoPubsubChannel = function ( name, app ) {

    var self = this;

    this.name = name;
    this.app = app;

    this.publish = function ( data ) {
        return self.app.send({
            url: "/pubsub/" + self.app.name + "/" + self.name,
            type: "POST",
            data: JSON.stringify(data),
            dataType: 'text'
        });
    };

    this.subscribe = function ( cb ) {

        var socket = io.connect('/pubsub');

        socket.on('connect', function () {
            socket.emit('bindToChannel', { application: self.app.name, channel: self.name });
        });

        socket.on('bindAccepted', function(m){
            socket.on(m.responseChannelName, cb);
        });

        return function(){
            socket.disconnect();
        };
    };
};

Kido.prototype.pubsub = function () {
    if (!this._pubsub) this._pubsub = new KidoPubsub(this);
    return this._pubsub;
};