/**
 * Access to the Queues backend service.
 *
 * @param kidoApp {Kido} - instance of the Kido class.
 * @returns {KidoQueues}
 * @constructor
 */
var KidoQueues = function (kidoApp) {

    if (!(this instanceof KidoQueues)) return new KidoQueues(kidoApp);
    if (!kidoApp) throw "The 'kidoApp' argument is required by the KidoQueues class.";

    /**
     * @type {KidoQueues}
     */
    var self = this;
    /**
     * @type {Kido}
     */
    this.app = kidoApp;
    /**
     * @type {string}
     */
    this.rootUrl = "/queue/local/";
    /**
     * @constant {string}
     */
    this.SERVICE_NAME = "queue";

    this.queue = function (name) {

        return {
            push: function (data) {

                var msg = {
                    url: self.rootUrl + name,
                    type: "POST",
                    data: JSON.stringify(data),
                    dataType: 'text'
                };

                return self.app.send(msg);
            },
            dequeue: function () {
                return self.app.send({
                    url: self.rootUrl + name + "/next",
                    type: "DELETE"
                });
            }
        };
    };
};

/**
 * Retrieves a singleton instance of KidoQueues.
 *
 * @returns {KidoQueues}
 */
Kido.prototype.queues = function () {
    if (!this._queues) this._queues = new KidoQueues(this);
    return this._queues;
};
