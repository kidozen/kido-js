
/**
 * access to the Queues backend service.
 *
 * @param kidoApp {object} - instance of the Kido class.
 */

var KidoQueues = function ( kidoApp ) {

    var self = this;

    if (!(this instanceof KidoQueues)) return new KidoQueues(kidoApp);
    if (!kidoApp) throw "The 'kidoApp' argument is required by the KidoQueues class.";

    this.app = kidoApp;

    this.queue = function ( name ) {

        return {
            push: function ( data ) {

                var msg = {
                    url: "/queue/" + self.app.name + "/" + name,
                    type: "POST",
                    data: JSON.stringify(data),
                    dataType: 'text'
                };

                return self.app.send(msg);
            },
            dequeue: function () {
                return self.app.send({
                    url: "/queue/" + self.app.name + "/" + name + "/next",
                    type: "DELETE"
                });
            }
        };
    };
};

Kido.prototype.queues = function () {
    if (!this._queues) this._queues = new KidoQueues(this);
    return this._queues;
};