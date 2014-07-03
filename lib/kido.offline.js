/**
 * Access to the Kido offline capabilities.
 * You can use this through the offline() helper in Kido.
 * ie: var offline = new Kido().offline();
 *
 * @param {Kido} kidoApp
 * @returns {KidoOffline}
 * @constructor
 */
var KidoOffline = function (kidoApp) {

    if (!(this instanceof KidoOffline)) return new KidoOffline(kidoApp);

    /**
     * @type {Kido}
     */
    this.app = kidoApp;

    /**
     * @type {KidoOffline}
     */
    var self = this,
        /**
         * @type {Worker}
         */
        worker = null,
        /**
         * @type {boolean}
         */
        executingPendingTasks = false,
        /**
         * @type {KidoLocalStorageCollection}
         */
        dictionary = self.app.localStorage().collection('id_dictionary', this),
        /**
         * @type {KidoLocalStorageCollection}
         */
        pending_requests = self.app.localStorage().collection('pending_requests', this),
        /**
         * @type {boolean}
         */
        isNative = (document.URL.indexOf("http://") == -1),
        /**
         * @type {URL|*}
         */
        URL = window.URL || window.webkitURL,
        /**
         * @type {Blob|*}
         */
        Blob = window.Blob,
        /**
         * @type {Worker|*}
         */
        Worker = window.Worker;

    // TODO: change URL for something of our own hosted in a CDN
    var URL_TO_CHECK = 'http://ajax.googleapis.com/ajax/libs/jquery/1.11.1/jquery.min.js',
        DELAY_TO_CHECK = 5000;

    /**
     * Starts web worker which checks if there is internet connection.
     *
     * @api private
     */
    this.startCheckingConnectivity = function () {
        if (!worker) {
            // Check if browser is not able to use Web Workers
            if (isNative || !URL || !Blob || !Worker) {
                // Create fallback
                worker = setInterval(function () {
                    console.log('Interval is checking connection...');
                    var xhr = new XMLHttpRequest();
                    var randomNum = Math.round(Math.random() * 10000);
                    xhr.open("HEAD", URL_TO_CHECK + "?rand=" + randomNum, false);
                    try {
                        xhr.send();
                        if (xhr.status !== 0) {
                            console.log('Interval detected connection :)');
                            self.executePendingRequests();
                            clearInterval(worker);
                            worker = null;
                        }
                    } catch (e) {
                        console.log('Interval did not detect connection :(');
                    }
                }, DELAY_TO_CHECK);
            } else {
                // Create Web Worker
                var blob = new Blob(['var checkConnectivityInterval,checkConnectivityURL,checkConnectivityDelayTime;self.addEventListener("message",function(e){var t=e.data;switch(t.command){case"start":checkConnectivityURL=t.data.url,checkConnectivityDelayTime=t.data.delay,self.start();break;case"stop":self.stop()}},!1),self.stop=function(){clearInterval(checkConnectivityInterval),self.postMessage({event:"log",data:"Worker is stopped"}),self.postMessage({event:"stopped"}),self.close()},self.start=function(){self.postMessage({event:"log",data:"Worker is started"}),checkConnectivityInterval=setInterval(function(){self.doesConnectionExist()},checkConnectivityDelayTime)},self.doesConnectionExist=function(){self.postMessage({event:"log",data:"Worker is checking connection..."});var e=new XMLHttpRequest,t=Math.round(1e4*Math.random());e.open("HEAD",checkConnectivityURL+"?rand="+t,!1);try{e.send(),0!==e.status&&(self.postMessage({event:"log",data:"Worker detected connection :)"}),self.postMessage({event:"up"}))}catch(n){self.postMessage({event:"log",data:"Worker did not detect connection :("})}};']);
                worker = new Worker(URL.createObjectURL(blob));
                worker.addEventListener('message', function (event) {
                    var msg = event.data;
                    switch (msg.event) {
                        case 'up':
                            self.executePendingRequests();
                            worker.postMessage({
                                command: 'stop'
                            });
                            break;
                        case 'stopped':
                            worker = null;
                            break;
                        case 'log':
                            console.log(msg.data);
                    }
                });
                worker.postMessage({
                    command: 'start',
                    data: {
                        url: URL_TO_CHECK,
                        delay: DELAY_TO_CHECK
                    }
                });
            }
        }
    };

    /**
     * Adds a request to the pending queue.
     *
     * @param {string} object_id
     * @param {object} request
     * @returns {*}
     * @api private
     */
    this.addPendingRequest = function (object_id, request) {
        return pending_requests.persist({
            _id: object_id,
            request: request
        });
    };

    /**
     * Removes a request from the pending queue.
     *
     * @param {string} object_id
     * @returns {*}
     * @api private
     */
    this.removePendingRequest = function (object_id) {
        return pending_requests.del(object_id);
    };

    /**
     * Retrieves the request data by its key.
     *
     * @param {string} object_id
     * @returns {*}
     * @api private
     */
    this.getPendingRequestObject = function (object_id) {
        return pending_requests.get(object_id, true).then(function (req) {
            return JSON.parse(req.request.data);
        });
    };

    /**
     * Executes the requests stored in the pending requests queue.
     *
     * @returns {*}
     * @api private
     */
    this.executePendingRequests = function () {
        if (executingPendingTasks) return $.Deferred().reject();
        executingPendingTasks = true;
        return pending_requests.query().then(function (reqs) {
            if (reqs.length === 0) {
                executingPendingTasks = false;
                return $.Deferred().reject();
            }
            return self.makeAjaxCall(reqs);
        }).then(function () {
            executingPendingTasks = false;
            return $.Deferred().resolve();
        }, function () {
            executingPendingTasks = false;
            return $.Deferred().reject();
        });
    };

    /**
     * @param {object[]} reqs
     * @returns {*}
     * @api private
     */
    this.makeAjaxCall = function (reqs) {
        if (reqs.length === 0) return $.Deferred().resolve();
        var req = reqs.shift();
        return $.ajax(req.request).then(function (res) {
            return self.persistChange(req, res).then(function () {
                return pending_requests.persist(reqs);
            }).then(function () {
                return self.makeAjaxCall(reqs);
            });
        });
    };

    /**
     * @param {object} req
     * @param {object} res
     * @returns {*}
     * @api private
     */
    this.persistChange = function (req, res) {
        var col = self.app.localStorage().collection(req.request.kidoService.service + '.' + req.request.kidoService.collection),
            old_id = req._id,
            new_id = typeof res === 'object' ? res._id : null;
        if (!new_id) {
            // Item was deleted
            return col.del(old_id).then(function () {
                return dictionary.del(old_id);
            });
        }
        return col.get(old_id, true).then(function (val) {
            // Item found
            val._id = new_id;
            return col.persist(val);
        }, function () {
            // Item not found
            return self.getPendingRequestObject(old_id).then(function (object) {
                object._id = new_id;
                return col.persist(object);
            });
        }).then(function () {
            if (old_id !== new_id) {
                return col.del(old_id).then(function () {
                    return dictionary.persist({
                        _id: old_id,
                        new_id: new_id
                    });
                });
            }
            return $.Deferred().resolve();
        }, function () {
            return $.Deferred().resolve();
        });
    };

    /**
     * Returns a relation between the old object id and the new one.
     *
     * @param {string} old_id
     * @returns {*}
     * @api public
     */
    this.getNewIdFromDictionary = function (old_id) {
        return dictionary.get(old_id, true).then(function (item) {
            return item.new_id;
        });
    };

    /**
     * Executes ajax requests or stores it in a queue if it fails
     *
     * @param {object} settings
     * @returns {*}
     * @api public
     */
    this.ajax = function (settings) {
        var data = settings.data,
            service = settings.kidoService.service,
            name = settings.kidoService.collection,
            objectId = settings.kidoService.objectId,
            query = settings.kidoService.query,
            method = settings.type.toLowerCase(),
            collection = self.app.localStorage().collection(service + '.' + name),
            getOne = (method === 'get' && objectId),
            getAll = (method === 'get' && !objectId),
            insert = (method === 'post' && data),
            update = (method === 'put' && data),
            remove = (method === 'delete' && objectId),
            drop = (method === 'delete' && !objectId),
            object = data ? JSON.parse(data) : null,
            old_id = object ? object._id : null,
            local = (objectId && parseInt(objectId) < 0) || (old_id && parseInt(old_id) < 0);

        if (getOne || getAll) {
            // Caching is enabled so set a lower timeout
            settings.timeout = 5000;
        }

        if (local) {
            if (getOne) {
                return collection.get(objectId);
            } else if (remove) {
                return collection.del(objectId).then(function () {
                    return self.removePendingRequest(objectId);
                });
            } else if (update) {
                settings.type = 'POST';
                delete object._id;
                settings.data = JSON.stringify(object);
                objectId = null;
            }
        }

        var deferred = $.Deferred(),
            ajax = $.ajax(settings);
        if (getAll || insert || update) {
            ajax.then(function (val) {
                return collection.persist(val);
            });
        } else if (remove) {
            ajax.then(function () {
                return collection.del(objectId ? objectId : old_id);
            });
        } else if (drop) {
            ajax.then(function () {
                return collection.drop();
            });
        }
        ajax.fail(function (err) {
            if (err.status !== 0) return deferred.reject(err);
            self.startCheckingConnectivity();
            // May be, it'd be better to reject with a custom message and sending the result anyway.
            // So that, the developer can notify their users that they are working offline.
            var success = function (val) {
                if (insert || update || remove || drop) {
                    var id = drop ? ($.now() * -1).toString() : (remove ? objectId : (update ? old_id : val._id));
                    self.addPendingRequest(id, settings).then(function () {
                        deferred.resolve(val);
                    });
                } else {
                    deferred.resolve(val);
                }
            };
            if (getAll) {
                collection.query(query).then(success);
            } else if (getOne) {
                collection.get(objectId).then(success);
            } else if (insert || update) {
                collection.persist(data).then(success);
            } else if (remove) {
                collection.del(objectId).then(success);
            } else if (drop) {
                collection.drop().then(success);
            }
        });
        ajax.done(function (val) {
            deferred.resolve(val);
        });
        return deferred.promise();
    };

};

/**
 * Retrieves an instance of KidoOffline.
 *
 * @returns {KidoOffline}
 */
Kido.prototype.offline = function () {
    if (!this._offline) this._offline = new KidoOffline(this);
    return this._offline;
};

/** Web Worker **/
/*
var checkConnectivityInterval,
    checkConnectivityURL,
    checkConnectivityDelayTime;

self.addEventListener("message", function (event) {
    var msg = event.data;
    switch (msg.command) {
        case "start":
            checkConnectivityURL = msg.data.url;
            checkConnectivityDelayTime = msg.data.delay;
            self.start();
            break;
        case "stop":
            self.stop();
            break;
    }
}, false);

self.stop = function () {
    clearInterval(checkConnectivityInterval);
    self.postMessage({
        event: "log",
        data: "Worker is stopped"
    });
    self.postMessage({
        event: "stopped"
    });
    self.close();
};

self.start = function () {
    self.postMessage({
        event: "log",
        data: "Worker is started"
    });
    checkConnectivityInterval = setInterval(function () {
        self.doesConnectionExist();
    }, checkConnectivityDelayTime);
};

self.doesConnectionExist = function () {
    self.postMessage({
        event: "log",
        data: "Worker is checking connection..."
    });
    var xhr = new XMLHttpRequest();
    var randomNum = Math.round(Math.random() * 10000);
    xhr.open("HEAD", checkConnectivityURL + "?rand=" + randomNum, false);
    try {
        xhr.send();
        if (xhr.status !== 0) {
            self.postMessage({
                event: "log",
                data: "Worker detected connection :)"
            });
            self.postMessage({
                event: "up"
            });
        }
    } catch (e) {
        self.postMessage({
            event: "log",
            data: "Worker did not detect connection :("
        });
    }
};
*/
