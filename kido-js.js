// KidoZen Javascript SDK v0.1.6.
// Copyright (c) 2013 Kidozen, Inc. MIT Licensed
/**
 * Kido - Kidozen representation of an Application.
 *
 * Use the Kido class to gain access to all the application's backend services.
 */

// make sure JSON.parse and JSON.stringify exist.
if (!JSON || !JSON.parse || !JSON.stringify) throw "KidoZen requires JSON.stringify. Try adding a polyfil lib like json2.js";

/**
 * Kido is the main class to manage Kidozen services.
 *
 * @param {string} [name=]
 * @param {string} [marketplace=]
 * @returns {Kido}
 * @constructor
 */
var Kido = function (name, marketplace) {

    if (!(this instanceof Kido)) return new Kido();

    if (typeof marketplace !== 'undefined') {
        if (marketplace.indexOf('://') === -1) {
            marketplace = 'https://' + marketplace;
        } else if (marketplace.indexOf('http://') !== 0 && marketplace.indexOf('https://') !== 0) {
            throw "Marketplace url must begin with https://";
        }
    }

    var self = this;
    var _username = null; // keep the username, password and provider
    var _password = null; // in memory as private variables in order
    var _provider = null; // to refresh tokens when they expire.

    // initialize properties
    this.name = name || 'local';  // backward compatibility
    this.marketplace = marketplace;
    this.local = this.name === 'local';
    this.hosted = !marketplace;
    this.authenticated = this.hosted ? true : false;

    // get the application security configuration in case of
    // hosted authentication.
    if (!this.hosted) {
        this.authConfig = $.ajax({
            url: this.marketplace + "/publicapi/apps?name=" + this.name
        }).then(function (config) {
            if (!config || !config.length) {
                return $.Deferred().reject("Application configuration not found.");
            }
            self.url = config[0].url.substring(0, config[0].url.length - 1);
            return config[0].authConfig;
        }, function () {
            return $.Deferred().reject("Unable to retrieve application configuration. Either there is no internet connection or the marketplace url is invalid.");
        });
    }

    /**
     * authenticate to the KidoZen Application using the IDP in the app
     * security configuration.
     * Optional params: user, pass, prov (for active auth)
     * @public
     */
    this.authenticate = function () {
        if (self.hosted) return $.Deferred().reject("No need to authenticate to this Web App");
        var authArgs = arguments;
        self.token = self.authConfig.then(function (config) {
            if (authArgs.length === 0) {
                return passiveAuth(config);
            }

            var ips = config.identityProviders;
            var prov = authArgs[2] || Object.keys(ips)[0];
            var ip = ips[prov];

            if (!ip) return $.Deferred().reject("Invalid Identity Provider");
            if (!ip.protocol) return $.Deferred().reject("Invalid Identity Provider Protocol");

            return activeAuth(config, authArgs[0], authArgs[1], authArgs[2], ip);
        });
        return self.token;
    };

    /**
     * send an http request to kidozen.
     * @param {Object} settings - settings as in jQuery.ajax settings.
     * @private
     */
    this.send = function (settings) {
        //validate request
        if (!settings.url)
            return $.Deferred().reject({ msg: "Not a valid ajax URL.", error: "Invalid URL"});

        var defaults = {
            type: "POST",
            cache: true
        };

        var opts = $.extend({}, defaults, settings);

        if (opts.data && !opts.contentType)
            opts.contentType = "application/json";

        if (!self.hosted && self.authenticated) {
            return self.token
                .then(function (token) {
                    // if the token expired, then user the cached credentials
                    // to refresh the KidoZen token.
                    if (token.expiresOn < new Date().getTime()) {
                        if (_username && _password && _provider) {
                            return self.authenticate(_username, _password, _provider);
                        } else {
                            return self.authenticate();
                        }
                    }
                    return token;
                })
                .then(function (token) {
                    opts.url = self.url + opts.url;
                    opts.headers = opts.headers || {};
                    opts.headers.authorization = token.token;
                    return executeAjaxRequest(opts);
                });
        }
        return executeAjaxRequest(opts);
    };

    /**
     * make a GET http request to kidozen.
     *
     * @param url {string}      - url for GET.
     * @param settings {Object} - optional settings as in $.ajax settings.
     * @private
     */
    this.get = function (url, settings) {
        settings = $.extend({ url: url, type: "GET"}, settings || {});
        return self.send(settings);
    };


    /**
     * make a POST http request to kidozen.
     *
     * @param url {string}
     * @param data {Object}     - data to POST in the http body.
     * @param settings {Object} - optional settings as in $.ajax settings.
     * @private
     */
    this.post = function (url, data, settings) {
        settings = $.extend({
            url: url,
            type: "POST",
            data: data ? JSON.stringify(data) : null
        }, settings || {});
        return self.send(settings);
    };

    /**
     * make a DELETE http request to kidozen.
     * @param url {string}      - url for GET.
     * @param settings {Object} - optional settings as in $.ajax settings.
     * @private
     */
    this.del = function (url, settings) {
        settings = $.extend({url: url, type: "DELETE"}, settings || {});
        return self.send(settings);
    };

    // Helper methods

    /**
     * Executes an HTTP request
     * @param {Object} settings
     * @returns {Deferred}
     * @private
     */
    function executeAjaxRequest(settings) {
        // Check if caching is not enabled
        if (typeof settings.kidoService === 'undefined' || (!settings.kidoService.caching && !settings.kidoService.queueing)) {
            return $.ajax(settings);
        }
        return self.offline().ajax(settings);
    }

    /**
     * Ws-Trust strategy for authentication
     * @private
     */
    function wsTrustToken(opts) {
        var template = '<s:Envelope xmlns:s="http://www.w3.org/2003/05/soap-envelope" xmlns:a="http://www.w3.org/2005/08/addressing" xmlns:u="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-utility-1.0.xsd"><s:Header><a:Action s:mustUnderstand="1">http://docs.oasis-open.org/ws-sx/ws-trust/200512/RST/Issue</a:Action><a:To s:mustUnderstand="1">[To]</a:To><o:Security s:mustUnderstand="1" xmlns:o="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-secext-1.0.xsd"><o:UsernameToken u:Id="uuid-6a13a244-dac6-42c1-84c5-cbb345b0c4c4-1"><o:Username>[Username]</o:Username><o:Password Type="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-username-token-profile-1.0#PasswordText">[Password]</o:Password></o:UsernameToken></o:Security></s:Header><s:Body><trust:RequestSecurityToken xmlns:trust="http://docs.oasis-open.org/ws-sx/ws-trust/200512"><wsp:AppliesTo xmlns:wsp="http://schemas.xmlsoap.org/ws/2004/09/policy"><a:EndpointReference><a:Address>[ApplyTo]</a:Address></a:EndpointReference></wsp:AppliesTo><trust:KeyType>http://docs.oasis-open.org/ws-sx/ws-trust/200512/Bearer</trust:KeyType><trust:RequestType>http://docs.oasis-open.org/ws-sx/ws-trust/200512/Issue</trust:RequestType><trust:TokenType>urn:oasis:names:tc:SAML:2.0:assertion</trust:TokenType></trust:RequestSecurityToken></s:Body></s:Envelope>';
        return $.ajax({
            dataType: 'text',
            crossDomain: true,
            url: opts.endpoint,
            type: 'POST',
            data: template
                .replace("[To]", opts.endpoint)
                .replace("[Username]", opts.user)
                .replace("[Password]", opts.pass)
                .replace("[ApplyTo]", opts.scope),
            headers: {
                'Content-Type': 'application/soap+xml; charset=utf-8'
            }
        });
    }

    /**
     * wrapv0.9 strategy for authentication
     * @private
     */
    function wrapToken(opts) {
        var form = {
            "wrap_name": opts.user,
            "wrap_password": opts.pass,
            "wrap_scope": opts.scope
        };
        return $.ajax({
            url: opts.endpoint,
            data: form,
            type: 'POST',
            dataType: 'text'
        });
    }

    /**
     * InAppBrowser authentication
     * @private
     */
    function passiveAuth(config) {
        if (!config.signInUrl) {
            return $.Deferred().reject('Passive Authentication not supported.');
        }
        if (typeof window.atob === 'undefined') {
            return $.Deferred().reject('Browser does not support window.atob()');
        }
        var deferred = $.Deferred();
        var ref = window.open(config.signInUrl, '_blank', 'location=yes');
        ref.addEventListener('loadstop', function (event) {
            ref.executeScript({
                code: 'document.title;'
            }, function (values) {
                var refTitle = values[0];
                if (refTitle.indexOf('Success payload=') !== -1) {
                    ref.close();
                    var token = JSON.parse(window.atob(refTitle.replace('Success payload=', '')));
                    // rawToken is verified for backwards compatibility
                    if (!token || (!token.access_token && !token.rawToken)) {
                        return deferred.reject('Unable to retrieve KidoZen token.');
                    }
                    self.authenticated = true;
                    deferred.resolve(processToken(token));
                }
            });
        });
        return deferred.promise();
    }

    /**
     * Form based authentication
     * @private
     */
    function activeAuth(config, user, pass, prov, ip) {
        var getToken;
        if (ip.protocol.toLowerCase() === "wrapv0.9")
            getToken = wrapToken;
        else if (ip.protocol.toLowerCase() === "ws-trust")
            getToken = wsTrustToken;
        else
            return $.Deferred().reject("Protocol not supported yet.");

        return getToken({
            user: user,
            pass: pass,
            scope: config.authServiceScope,
            endpoint: ip.endpoint
        }).then(function (body) {
            var assertion = (/<Assertion(.*)<\/Assertion>/.exec(body) || [])[0];
            if (!assertion) return $.Deferred().reject("Unable to get a token from IDP");
            // get a kidozen token
            var postRequest = {
                url: config.authServiceEndpoint,
                type: "POST",
                data: {
                    wrap_assertion: assertion,
                    wrap_scope: config.applicationScope,
                    wrap_assertion_format: "SAML"
                }
            };
            return $.ajax(postRequest).then(function (token) {
                // make sure we got a token
                // rawToken is verified for backwards compatibility
                if (!token || (!token.access_token && !token.rawToken)) {
                    return $.Deferred().reject("Unable to retrieve KidoZen token.");
                }
                self.authenticated = true;
                _username = user;
                _password = pass;
                _provider = prov;
                return processToken(token);
            });
        });
    }

    /**
     * Process the token and modifies expiration time
     * @private
     */
    function processToken(token) {
        // rawToken is verified for backwards compatibility
        var access_token = token.access_token ? token.access_token : token.rawToken;
        token.token = 'WRAP access_token="' + access_token + '"';
        // parse the token and get the claims and the expiration date.
        var tokenData = decodeURIComponent(access_token);
        var claims = tokenData.split("&");
        token.claims = claims;
        for (var i in claims) {
            var c = claims[i];
            if (c.indexOf("ExpiresOn") > -1) {
                // adjust the expiration 20 seconds before it actually
                // expires so that it doesn't expire due to latency.
                token.expiresOn = ~~(c.split("=")[1]) * 1000 - 20 * 1000;
                break;
            }
        }
        return token;
    }

};

/**
 * Access to the configuration backend service.
 *
 * @param kidoApp {Kido} - instance of the Kido class.
 * @returns {KidoConfig}
 * @constructor
 */
var KidoConfig = function (kidoApp) {

    if (!(this instanceof KidoConfig)) return new KidoConfig(kidoApp);
    if (!kidoApp) throw "The 'kidoApp' argument is required by the KidoConfig class.";

    /**
     * @type {KidoConfig}
     */
    var self = this;
    /**
     * @type {Kido}
     */
    this.app = kidoApp;
    /**
     * @constant {string}
     */
    this.SERVICE_NAME = "config";

    this.set = function (name, data) {
        if (!name) throw "The config key 'name' is required to set a value.";
        return self.app.post("/config/" + name, data);
    };

    this.get = function (name) {
        if (!name) throw "The config key 'name' is required to retrieve the value.";
        return self.app.get("/config/" + name);
    };

    this.getAll = function () {
        return self.app.get("/config");
    };

    this.del = function (name) {
        if (!name) throw "The config key 'name' is required to delete a value.";
        return self.app.del("/config/" + name);
    };
};

/**
 * Retrieves a singleton instance of KidoConfig.
 *
 * @returns {KidoConfig}
 */
Kido.prototype.config = function () {
    if (!this._config) this._config = new KidoConfig(this);
    return this._config;
};

/**
 * Access to the email backend service.
 *
 * @param kidoApp {Kido} - instance of the Kido class.
 * @returns {KidoEmail}
 * @constructor
 */
var KidoEmail = function (kidoApp) {

    /** Validations **/
    if (!(this instanceof KidoEmail)) return new KidoEmail(kidoApp);
    if (!kidoApp) throw "The 'kidoApp' argument is required by the KidoEmail class.";

    /**
     * @type {KidoEmail}
     */
    var self = this;
    /**
     * @type {Kido}
     */
    this.app = kidoApp;
    /**
     * @constant {string}
     */
    this.SERVICE_NAME = "email";

    this.send = function (from, to, subject, bodyText, bodyHtml, attachments, timeout) {

        if (from && typeof from === 'object') {
            var mail = from;
            from = mail.from;
            to = mail.to;
            subject = mail.subject;
            bodyText = mail.bodyText;
            bodyHtml = mail.bodyHtml;
            attachments = mail.attachments;
            timeout = mail.timeout;
        }

        if (!from) throw "The 'from' argument is required to send an email.";
        if (!to) throw "The 'to' argument is required to send an email.";

        if (!attachments && bodyHtml instanceof Array) {
            attachments = bodyHtml;
            bodyHtml = null;
        }
        //construct email object.
        mail = { to: to, from: from };
        if (typeof(subject) === 'string' && subject.length > 0) mail.subject = subject;
        if (typeof(bodyText) === 'string' && bodyText.length > 0) mail.bodyText = bodyText;
        if (typeof(bodyHtml) === 'string' && bodyHtml.length > 0) mail.bodyHtml = bodyHtml;
        if (attachments instanceof Array) mail.attachments = attachments;

        return self.app.send({
            url: "/email",
            type: "POST",
            data: JSON.stringify(mail),
            timeout: timeout || 15 * 60 * 1000 // 15 minutes
        });
    };

    this.attach = function (formOrName, data, progress) {

        if (formOrName instanceof HTMLFormElement) {
            formOrName = new FormData(formOrName);
        }

        if (formOrName instanceof HTMLInputElement) {
            if (!(formOrName.type) || formOrName.type.toLowerCase() !== 'file') throw "HTML Input element must be of type 'file'.";
            formOrName = formOrName.files[0]
        }

        if (formOrName instanceof File) {
            var file = formOrName;
            formOrName = new FormData();
            formOrName.append(file.name, file);
        }

        if (formOrName instanceof FormData) {
            if (typeof(data) === 'function') {
                progress = data;
                data = null;
            }
        } else if (typeof(formOrName) === 'string') {
            var name = formOrName;
            formOrName = new FormData();

            if (!data || typeof(data) === 'function') throw "if a name was specified, 'data' argument is required.";
            if (typeof data === 'string')   data = new Blob([data], { type: "text/text" });
            if (!(data instanceof Blob))    throw "'data' argument must be a string, a Blob instance or a File instance.";

            formOrName.append(name, data, name);
        } else {
            throw "The argument 'formOrName' is invalid.";
        }

        var dfd = new jQuery.Deferred();

        var success = function (e) {
            dfd.resolve(JSON.parse(e.currentTarget.response));
        };

        var failure = function (e) {
            dfd.reject(e.currentTarget);
        };

        var oXHR = new XMLHttpRequest();
        if (oXHR.upload && typeof progress === 'function') oXHR.upload.addEventListener('progress', progress, false);
        oXHR.addEventListener('load', success, false);
        oXHR.addEventListener('error', failure, false);
        oXHR.addEventListener('abort', failure, false);
        oXHR.open('POST', '/email/attachments');
        oXHR.send(formOrName);

        return dfd.promise();
    };
};

/**
 * Retrieves a singleton instance of KidoEmail.
 *
 * @returns {KidoEmail}
 */
Kido.prototype.email = function () {
    if (!this._email) this._email = new KidoEmail(this);
    return this._email;
};

/**
 * Access to the logging backend service.
 *
 * @param kidoApp {Kido} - instance of the Kido class.
 * @returns {KidoLogging}
 * @constructor
 */
var KidoLogging = function (kidoApp) {

    if (!(this instanceof KidoLogging)) return new KidoLogging(kidoApp);
    if (!kidoApp) throw "The 'kidoApp' argument is required by the KidoLogging class.";

    /**
     * @type {KidoLogging}
     */
    var self = this;
    /**
     * @type {Kido}
     */
    this.app = kidoApp;
    /**
     * @constant {string}
     */
    this.SERVICE_NAME = "logging";

    this.writeVerbose = function (data) {
        return self.write(data, 0);
    };

    this.writeInfo = function (data) {
        return self.write(data, 1);
    };

    this.writeWarning = function (data) {
        return self.write(data, 2);
    };

    this.writeError = function (data) {
        return self.write(data, 3);
    };

    this.writeCritical = function (data) {
        return self.write(data, 4);
    };

    this.write = function (data, level, message) {
        if (!data) throw "'data' argument is requiered.";
        if (!level && level !== 0) throw "'level' argument is required.";
        if (!(level >= 0 && level <= 4)) throw "'level' argument must be an integer number between 0 and 4.";

        return self.app.send({
            url: "/api/v3/logging/log?level=" + level + (message ? ("&message=" + encodeURIComponent(message)) : ""),
            type: "POST",
            data: JSON.stringify(data)
        });
    };

    this.query = function (query) {
        var params = [];
        if (query) params.push("query=" + JSON.stringify(query));

        return self.app.send({
            url: "/api/v3/logging/log" + ((params.length > 0) ? ("?" + params.join("&")) : ""),
            type: "GET"
        });
    };

    this.get = function (since, level, skip, limit) {
        var query = {
            query: {},
            sort: [
                {
                    "@timestamp": {
                        "order": "desc"
                    }
                }
            ],
            filter: {}
        };

        if (!level) {
            query.query.match_all = {};
        } else {
            query.query.match = {
                level: {
                    query: level,
                    operator: "and"
                }
            };
        }
        if (since) {
            if (!(since instanceof Date)) throw "'Since' argument accepts only null or Date values.";
            query.filter = {
                range: {
                    "@timestamp": {
                        gte: since
                    }
                }
            };
        }

        if (skip) {
            query.from = skip;
        }

        if (limit) {
            query.size = limit;
        }

        return self.query(query);
    };

    this.clear = function () {
        return self.app.send({
            url: "/api/v3/logging/log",
            type: "DELETE",
            dataType: 'text'
        });
    };

};

/**
 * Retrieves a singleton instance of KidoLogging.
 *
 * @returns {KidoLogging}
 */
Kido.prototype.logging = function () {
    if (!this._logging) this._logging = new KidoLogging(this);
    return this._logging;
};

/**
 * Access to the Notifications backend service.
 *
 * @param kidoApp {Kido} - instance of the Kido class.
 * @returns {KidoNotifications}
 * @constructor
 */
var KidoNotifications = function (kidoApp) {

    if (!(this instanceof KidoNotifications)) return new KidoNotifications(kidoApp);
    if (!kidoApp) throw "The 'kidoApp' argument is required by the KidoNotifications class.";

    /**
     * @type {KidoNotifications}
     */
    var self = this;
    /**
     * @type {Kido}
     */
    this.app = kidoApp;
    /**
     * @constant {string}
     */
    this.SERVICE_NAME = "notifications";

    this.send = function (channel, title, text, type, badge, image, param) {

        if (!channel) throw "'channel' argument is required.";
        if (!title) throw "'title' argument is required.";

        var notification = { title: title };
        if (typeof(type) === 'string' && type) notification.type = type;
        if (typeof(text) === 'string' && text) notification.text = text;
        if (typeof(image) === 'string' && image) notification.image = image;
        if (typeof(badge) === 'number') notification.badge = badge;
        if (param) notification.param = param;

        return self.app.send({
            url: "/notifications/push/local/" + channel,
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
     * @public
     */
    this.subscribe = function (deviceId, channel, subscriptionId, platform) {

        if (!deviceId) throw "'deviceId' argument is required.";
        if (!channel) throw "'channel' argument is required.";
        if (!subscriptionId) throw "'subscriptionId' argument is required.";
        if (!platform) throw "'platform' is required. Use one of: gcm, apns, c2dm, mpns or wns.";

        return self.app.send({
            url: "/notifications/subscriptions/local/" + channel,
            type: "POST",
            data: JSON.stringify({
                deviceId: deviceId,
                subscriptionId: subscriptionId,
                platform: platform
            })
        });
    };
};

/**
 * Retrieves a singleton instance of KidoNotifications.
 *
 * @returns {KidoNotifications}
 */
Kido.prototype.notifications = function () {
    if (!this._notifications) this._notifications = new KidoNotifications(this);
    return this._notifications;
};

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

/**
 * Access to the Security backend service.
 *
 * @param kidoApp {Kido} - instance of the Kido class.
 * @returns {KidoSecurity}
 * @constructor
 */
var KidoSecurity = function (kidoApp) {

    if (!(this instanceof KidoSecurity)) return new KidoSecurity(kidoApp);
    if (!kidoApp) throw "The 'kidoApp' argument is required by the KidoSecurity class.";

    /**
     * @type {KidoSecurity}
     */
    var self = this;
    /**
     * @type {Kido}
     */
    this.app = kidoApp;
    /**
     * @constant {string}
     */
    this.SERVICE_NAME = "security";

    this.getLoggedInUser = function () {
        return self.app.get("/user");
    };

    this.getOriginalToken = function () {
        return self.app.get("/user/original-token");
    };
};

/**
 * Retrieves a singleton instance of KidoSecurity.
 *
 * @returns {KidoSecurity}
 */
Kido.prototype.security = function () {
    if (!this._security) this._security = new KidoSecurity(this);
    return this._security;
};

/**
 * Access to the Sms backend service.
 *
 * @param {Kido} kidoApp - instance of the Kido class.
 * @param {{queueing: boolean}} [options={}]
 * @returns {KidoSms}
 * @constructor
 */
var KidoSms = function (kidoApp, options) {

    if (!(this instanceof KidoSms)) return new KidoSms(kidoApp);
    if (!kidoApp) throw "The 'kidoApp' argument is required by the KidoSms class.";
    if (!options) options = { queueing: false };

    /**
     * @type {KidoSms}
     */
    var self = this;
    /**
     * @type {Kido}
     */
    this.app = kidoApp;
    /**
     * @constant {string}
     */
    this.SERVICE_NAME = "sms";
    /**
     * @type {boolean}
     */
    this.caching = false;
    /**
     * @type {boolean}
     */
    this.queueing = options.queueing || false;

    /**
     * Sends a text message to a mobile phone.
     *
     * @param {string|number} to
     * @param {string} message
     * @returns {Deferred}
     */
    this.send = function (to, message) {
        if (!to) throw "The 'to' argument is required to send an sms.";
        if (!message) throw "The 'message' argument is required to send an sms.";

        var settings = {
            url: "/sms?to=" + encodeURIComponent(to) + "&message=" + encodeURIComponent(message),
            type: "POST"
        };

        // Offline configuration
        settings.kidoService = {
            service: self.SERVICE_NAME,
            caching: self.caching,
            queueing: self.queueing
        };

        return self.app.send(settings);
    };

    /**
     * Retrieves the status of a message.
     *
     * @param {string} messageId
     * @returns {Deferred}
     */
    this.getStatus = function (messageId) {
        if (!messageId) throw "The 'messageId' argument is required to get message status";
        return self.app.get("/sms/" + messageId);
    };
};

/**
 * Retrieves a singleton instance of KidoSms.
 *
 * @param {{queueing: boolean}} [options={}]
 * @returns {KidoSms}
 */
Kido.prototype.sms = function (options) {
    if (!this._sms) this._sms = new KidoSms(this, options);
    return this._sms;
};

/**
 * Access to the object storage backend service.
 * You can use this through the storage() helper in Kido.
 * ie: var tasks = new Kido().storage().objectSet("tasks");
 *
 * @param {Kido} kidoApp
 * @returns {KidoStorage}
 * @constructor
 */
var KidoStorage = function (kidoApp) {

    if (!(this instanceof KidoStorage)) return new KidoStorage(kidoApp);

    /**
     * @type {KidoStorage}
     */
    var self = this;
    /**
     * @type {Kido}
     */
    this.app = kidoApp;
    /**
     * @constant {string}
     */
    this.SERVICE_NAME = "storage";
    /**
     * @type {string}
     */
    this.rootUrl = "/storage/local";

    /**
     * Retrieves the names of the object sets
     *
     * @returns {Deferred}
     * @public
     */
    this.getObjectSetNames = function () {
        return self.app.get(self.rootUrl);
    };

    /**
     * Retrieves an object set with given name.
     *
     * @param {string} name
     * @param {{caching: boolean, queueing: boolean}} [options={}]
     * @returns {KidoObjectSet}
     * @public
     */
    this.objectSet = function (name, options) {
        return new KidoObjectSet(name, this, options);
    };
};

/**
 * @param {string} name
 * @param {KidoStorage} parentStorage
 * @param {{caching: boolean, queueing: boolean}} [options={}]
 * @returns {KidoObjectSet}
 * @constructor
 */
var KidoObjectSet = function (name, parentStorage, options) {

    if (!(this instanceof KidoObjectSet)) return new KidoObjectSet(name, parentStorage);
    if (!parentStorage) throw "KidoObjectSet needs a parent KidoStorage object.";
    if (!options) options = { caching: false, queueing: false };

    /**
     * @type {KidoObjectSet}
     */
    var self = this;
    /**
     * @type {KidoStorage}
     */
    this.storage = parentStorage;
    /**
     * @type {string}
     */
    this.name = name || 'default';
    /**
     * @type {string}
     */
    this.rootUrl = this.storage.rootUrl + "/" + this.name;
    /**
     * @type {boolean}
     */
    this.caching = options.caching || false;
    /**
     * @type {boolean}
     */
    this.queueing = options.queueing || false;

    /**
     * Invokes an operation on an object set.
     *
     * @param {Object} data
     * @returns {Deferred}
     * @private
     */
    this.invoke = function (data) {

        if (!data) throw "The storage 'data' argument is required";
        if (!data.settings) throw "The storage 'data.settings' property is required.";

        var params = [];
        if (data.query) params.push("query=" + JSON.stringify(data.query));
        if (data.options) params.push("options=" + JSON.stringify(data.options));
        if (data.fields) params.push("fields=" + JSON.stringify(data.fields));
        if (data.isPrivate) params.push("isPrivate=true");

        //the URL format is /storage/local/{objectset}/{objectId}
        data.settings.url =
            self.rootUrl +
            (data.objectId ? "/" + data.objectId : "") +
            (data.indexes ? "/" + data.indexes : "") +
            (params.length ? "?" + params.join("&") : "");
        data.settings.url = encodeURI(data.settings.url);
        data.settings.cache = data.cache;

        // Offline configuration
        data.settings.kidoService = {
            service: self.storage.SERVICE_NAME,
            collection: self.name,
            objectId: data.objectId,
            query: data.query,
            caching: self.caching,
            queueing: self.queueing
        };

        return self.storage.app.send(data.settings);
    };

    /**
     * Inserts an object in the KidoZen Object Storage backend service.
     *
     * @param {Object} obj                - the object to store.
     * @param {boolean} [isPrivate=false] - whether the object is private for that user.
     * @returns {Deferred}
     * @public
     */
    this.insert = function (obj, isPrivate) {

        if (!obj) throw "The object set 'obj' argument is requiered in order to insert.";

        /**
         * we should not modify the original object to avoid problems on the
         * front end. The assumption should be that a new (or copy) object
         * will be returned when inserting/updating.
         */
        obj = $.extend({}, obj);

        //remove the _id in case somebody is trying to insert the same object
        //multiple times.
        obj._id = undefined;

        var data = {
            settings: {
                type: "POST",
                data: JSON.stringify(obj)
            },
            isPrivate: isPrivate
        };

        return self.invoke(data).then(function (result) {
            return $.extend(obj, result);
        });
    };


    /**
     * Updates an existing object, the object instance
     * must contains the object's key.
     *
     * @param {Object} obj
     * @param {boolean} [isPrivate=false]
     * @returns {Deferred}
     * @public
     */
    this.update = function (obj, isPrivate) {

        if (!obj) throw "obj argument is requiered.";

        obj = $.extend({}, obj);

        var data = {
            settings: {
                type: "PUT",
                data: JSON.stringify(obj)
            },
            isPrivate: !!isPrivate
        };

        return self
            .invoke(data)
            .then(function (result) {
                return $.extend(obj, result);
            }, function (err) {

                //if there is an error with the sync field for concurrency
                //check, add the details to the error object.
                if (err.status === 409) {
                    try {
                        err.body = JSON.parse(err.responseText);
                    }
                    catch (e) {
                    }
                }
                return err;
            });
    };

    /**
     * Inserts or updates the object instance.
     * If the object instance contains the object's key
     * then this function will update it, if the object
     * instance doesn't contain the object's key then this
     * function will try to insert it.
     *
     * @param {Object} obj
     * @param {boolean} [isPrivate=false]
     * @returns {Deferred}
     * @public
     */
    this.save = function (obj, isPrivate) {

        if (!obj) throw "obj argument is requiered.";

        obj = $.extend({}, obj);

        if (obj._id && obj._id.length > 0) {
            return self.update(obj, isPrivate);
        }
        else {
            return self.insert(obj, isPrivate);
        }
    };


    /**
     * Retrieves an object by its key.
     *
     * @param {string} objectId
     * @returns {Deferred}
     * @public
     */
    this.get = function (objectId) {

        if (!objectId) throw "objectId is required";

        var result = $.Deferred();

        self
            .invoke({
                settings: { type: "GET" },
                objectId: objectId,
                cache: false
            })
            .fail(function (err) {
                if (err.status === 404) {
                    result.resolve(null);
                } else {
                    result.reject(err);
                }
            })
            .done(function (obj) {
                result.resolve(obj);
            });

        return result;
    };


    /**
     * Executes the query.
     *
     * @param [query=]
     * @param [fields=]
     * @param [options=]
     * @param [cache=]
     * @returns {Deferred}
     * @public
     */
    this.query = function (query, fields, options, cache) {
        return self.invoke({
            settings: { type: "GET" },
            query: query,
            fields: fields,
            options: options,
            cache: cache
        });
    };


    /**
     * Delete an object from the set by its key.
     *
     * @param {string} objectId
     * @returns {Deferred}
     * @public
     */
    this.del = function (objectId) {
        return self.invoke({
            settings: { type: "DELETE", dataType: 'text' },
            objectId: objectId
        });
    };


    /**
     * Drops the entire object set.
     *
     * @returns {Deferred}
     * @public
     */
    this.drop = function () {
        return self.invoke({
            settings: { type: "DELETE", dataType: 'text' }
        });
    };
};

/**
 * Retrieves a singleton instance of KidoStorage.
 *
 * @returns {KidoStorage}
 */
Kido.prototype.storage = function () {
    if (!this._storage) this._storage = new KidoStorage(this);
    return this._storage;
};

/**
 * Access to the storage backend service, to manage object set indexes.
 *
 * @param objectSet {KidoObjectSet} - instance of the KidoObjectSet class.
 * @returns {KidoStorageIndexes}
 * @constructor
 */
var KidoStorageIndexes = function (objectSet) {

    if (!(this instanceof KidoStorageIndexes)) return new KidoStorageIndexes(objectSet);
    if (!objectSet) throw "The 'objectSet' argument is required by the KidoStorageIndexes class.";

    /**
     * @type {KidoStorageIndexes}
     */
    var self = this;
    /**
     * @type {KidoObjectSet}
     */
    this.objectSet = objectSet;
    /**
     * @constant {string}
     */
    this.SERVICE_NAME = "storageindexes";

    this.all = function () {
        var data = {
            indexes: "indexes",
            settings: {
                type: "GET"
            }};
        return self.objectSet.invoke(data);
    };

    this.get = function (name) {

        if (!name) throw "The 'name' argument is required to retrieve an object set index.";

        var data = {
            indexes: "indexes?name=" + name,
            settings: {
                type: "GET"
            }};
        return self.objectSet.invoke(data);
    };

    this.del = function (name) {

        if (!name) throw "The 'name' argument is required to delete an object set index.";

        var data = {
            indexes: "indexes/" + name,
            settings: {
                type: "DELETE"
            }};
        return self.objectSet.invoke(data);
    };

    //spec: JSON string with the index's specification. {lastName:1, firstName:1}
    //safe: fire and forget will be overrided
    //sparse: A "sparse index" is an index that only includes documents with the indexed field.
    //background: creates the index in the background, yielding whenever possible
    //dropDups: a unique index cannot be created on a key that has pre-existing duplicate: values. If you would like to create the index anyway, keeping the first document the database: indexes and deleting all subsequent documents that have duplicate value
    //min: for geospatial indexes set the lower bound for the co-ordinates
    //max: for geospatial indexes set the high bound for the co-ordinates.
    //please refer to: http://www.mongodb.org/display/DOCS/Indexes#Indexes-CreationOptions
    this.create = function (spec, safe, unique, sparse, background, dropDups, min, max) {

        if (!spec) throw "The 'spec' argument is required to create an index.";
        if (!safe) safe = false;
        if (!unique) unique = false;
        if (!sparse) sparse = false;
        if (!background) background = false;
        if (!dropDups) dropDups = false;

        var index = {
            spec: spec,
            options: { safe: safe, unique: unique, sparse: sparse, background: background, dropDups: dropDups }
        };

        if (min && min.toString() != "0") index.options.min = min;
        if (max && max.toString() != "0") index.options.max = max;

        var data = {
            indexes: "indexes",
            settings: {
                type: "POST",
                data: JSON.stringify(index)
            }};
        return self.objectSet.invoke(data);
    };
};

/**
 * Retrieves a singleton instance of KidoStorageIndexes.
 *
 * @returns {KidoStorageIndexes}
 */
KidoObjectSet.prototype.indexes = function () {
    if (!this._indexes) this._indexes = new KidoStorageIndexes(this);
    return this._indexes;
};

/**
 * Access to the Enterprise Services backend service.
 *
 * @param kidoApp {Kido} - instance of the Kido class.
 * @param name
 * @returns {KidoService}
 * @constructor
 */
var KidoService = function (kidoApp, name) {

    if (!(this instanceof KidoService)) return new KidoService(kidoApp);
    if (!kidoApp) throw "The 'kidoApp' argument is required by the KidoService class.";

    /**
     * @type {KidoService}
     */
    var self = this;
    /**
     * @type {Kido}
     */
    this.app = kidoApp;
    /**
     * @type {string}
     */
    this.name = name;
    /**
     * @type {Object}
     * @private
     */
    this._defaults = {};
    /**
     * @constant {string}
     */
    this.SERVICE_NAME = "services";

    /**
     * Sets default options.
     *
     * @param {Object} opts
     * @returns {KidoService}
     * @public
     */
    this.defaults = function (opts) {
        self._defaults = $.extend(self._defaults, opts || {});
        return self;
    };

    /**
     * Invokes a configured Enterprice API Service method.
     *
     * @param {string} name
     * @param {Object} [opts={}]
     * @param {number} [timeout=]
     * @returns {Deferred}
     * @public
     */
    this.invoke = function (name, opts, timeout) {
        var result = $.Deferred();
        var args = $.extend({}, self._defaults, opts);
        var settings = timeout ? { headers: { "timeout": timeout } } : {};
        self.app
            .post("/api/services/" + self.name + "/invoke/" + name, args, settings)
            .done(function (res) {
                if (res.error) {
                    return result.reject(res.error);
                }
                result.resolve(res.data || res);
            })
            .fail(function (err) {
                result.reject(err);
            });
        return result;
    };
};

/**
 * Retrieves an instance of KidoService;
 *
 * @param {string} name
 * @returns {KidoService}
 */
Kido.prototype.services = function (name) {
    return new KidoService(this, name);
};

/**
 * Access to the Datasources backend service.
 *
 * @param kidoApp {Kido} - instance of the Kido class.
 * @param name {string}
 * @param {{caching: boolean, queueing: boolean, timeout: number}} [options={}]
 * @returns {KidoDatasource}
 * @constructor
 */
var KidoDatasource = function (kidoApp, name, options) {

    if (!(this instanceof KidoDatasource)) return new KidoDatasource(kidoApp, name);
    if (!kidoApp) throw "The 'kidoApp' argument is required by the KidoDatasource class.";
    if (!name) throw "The 'name' argument is required by the KidoDatasource class.";
    if (!options) options = { caching: false, queueing: false, timeout: null };

    /**
     * @type {KidoDatasource}
     */
    var self = this;
    /**
     * @type {Kido}
     */
    this.app = kidoApp;
    /**
     * @constant {string}
     */
    this.SERVICE_NAME = "datasources";
    /**
     * @type {string}
     */
    this.name = name;
    /**
     * @type {Object}
     * @private
     */
    this._defaults = {};
    /**
     * @type {boolean}
     */
    this.caching = options.caching || false;
    /**
     * @type {boolean}
     */
    this.queueing = options.queueing || false;
    /**
     * @type {number}
     */
    this.timeout = options.timeout || null;


    /**
     * Sets default options.
     *
     * @param {Object} opts
     * @returns {KidoDatasource}
     * @public
     */
    this.defaults = function (opts) {
        self._defaults = $.extend(self._defaults, opts || {});
        return self;
    };

    /**
     * Queries a configured Enterprice API Data source.
     *
     * @param {Object} [opts={}]
     * @returns {Deferred}
     * @public
     */
    this.query = function (opts) {
        var result = $.Deferred();
        var args = $.extend({}, self._defaults, opts);
        var qs = Object.keys(args).length > 0 ? "?" + $.param(args) : "";
        var settings = self.timeout ? { headers: { "timeout": self.timeout } } : {};

        // Offline configuration
        settings.kidoService = {
            service: self.SERVICE_NAME,
            collection: self.name,
            caching: self.caching,
            queueing: false
        };

        self.app
            .get("/api/v2/datasources/" + self.name + qs, settings)
            .done(function (res) {
                if (res.error) {
                    return result.reject(res.error);
                }
                result.resolve(res.data || res);
            })
            .fail(function (err) {
                result.reject(err);
            });
        return result;
    };

    /**
     * Invokes a configured Enterprice API Data source method.
     *
     * @param {Object} [opts={}]
     * @returns {Deferred}
     * @public
     */
    this.invoke = function (opts) {
        var result = $.Deferred();
        var args = $.extend({}, self._defaults, opts);
        var settings = self.timeout ? { headers: { "timeout": self.timeout } } : {};

        // Offline configuration
        settings.kidoService = {
            service: self.SERVICE_NAME,
            collection: self.name,
            caching: false,
            queueing: self.queueing
        };

        self.app
            .post("/api/v2/datasources/" + self.name, args, settings)
            .done(function (res) {
                if (res.error) {
                    return result.reject(res.error);
                }
                result.resolve(res.data || res);
            })
            .fail(function (err) {
                result.reject(err);
            });
        return result;
    };
};

/**
 * Retrieves an instance of KidoDatasource.
 *
 * @param {string} name
 * @param {{caching: boolean, queueing: boolean, timeout: number}} [options={}]
 * @returns {KidoDatasource}
 */
Kido.prototype.datasources = function (name, options) {
    return new KidoDatasource(this, name, options);
};

/**
 * Access to the web browser/Cordova storage service.
 * You can use this through the localStorage() helper in Kido.
 * ie: var tasks = new Kido().localStorage().collection("tasks");
 *
 * @param {Kido} kidoApp
 * @returns {KidoLocalStorage}
 * @constructor
 */
var KidoLocalStorage = function (kidoApp) {

    if (!(this instanceof KidoLocalStorage)) return new KidoLocalStorage(kidoApp);
    if (!localforage) throw "KidoLocalStorage needs Mozilla LocalForage to be able to work.";

    /**
     * @type {KidoLocalStorage}
     */
    var self = this;
    /**
     * @type {Kido}
     */
    this.app = kidoApp;
    /**
     * @constant {string}
     */
    this.SERVICE_NAME = "localstorage";

    /** Local Forage configuration and helper methods **/
    localforage.config({
        name: 'kidozen',
        storeName: 'kidozen'
    });

    var LOCAL_FORAGE_DELAY = 50;

    /**
     * Local Forage setItem method with jQuery deferred interface.
     *
     * @param {string} key
     * @param {Object} value
     * @returns {Deferred}
     */
    localforage.setItemAsync = function (key, value) {
        var deferred = $.Deferred();
        localforage.setItem(key, value).then(function (item) {
            setTimeout(function () {
                deferred.resolve(item);
            }, LOCAL_FORAGE_DELAY);
        }, function () {
            deferred.reject();
        });
        return deferred.promise();
    };

    /**
     * Local Forage getItem method with jQuery deferred interface.
     *
     * @param {string} key
     * @returns {Deferred}
     */
    localforage.getItemAsync = function (key) {
        var deferred = $.Deferred();
        localforage.getItem(key).then(function (item) {
            setTimeout(function () {
                deferred.resolve(item);
            }, LOCAL_FORAGE_DELAY);
        }, function () {
            deferred.reject();
        });
        return deferred.promise();
    };

    /**
     * Local Forage removeItem method with jQuery deferred interface.
     *
     * @param {string} key
     * @returns {Deferred}
     */
    localforage.removeItemAsync = function (key) {
        var deferred = $.Deferred();
        localforage.removeItem(key).then(function () {
            setTimeout(function () {
                deferred.resolve();
            }, LOCAL_FORAGE_DELAY);
        });
        return deferred.promise();
    };

    /**
     * Returns a new local storage collection.
     *
     * @param {string} name
     * @returns {KidoLocalStorageCollection}
     * @public
     */
    this.collection = function (name) {
        return new KidoLocalStorageCollection(name, this);
    };

};

/**
 * @param {string} name
 * @param {KidoLocalStorage} parentLocalStorage
 * @returns {KidoLocalStorageCollection}
 * @constructor
 */
var KidoLocalStorageCollection = function (name, parentLocalStorage) {

    /**
     * @type {KidoLocalStorageCollection}
     */
    var self = this;

    /** Validations **/
    if (!(this instanceof KidoLocalStorageCollection)) return new KidoLocalStorageCollection(name, parentLocalStorage);
    if (!name) throw "KidoLocalStorageCollection needs a name to be created.";
    if (!parentLocalStorage) throw "KidoLocalStorageCollection needs a parent KidoLocalStorage object.";

    /**
     * @type {KidoLocalStorage}
     */
    this.localStorage = parentLocalStorage;
    /**
     * @type {string}
     */
    this.name = 'kido.' + name;

    /**
     * @param {object[]} values
     * @returns {Deferred}
     * @private
     */
    this.storeCollection = function (values) {
        return localforage.setItemAsync(self.name, values);
    };

    /**
     * @param {Object} new_val
     * @returns {Deferred}
     * @private
     */
    this.insertItem = function (new_val) {
        new_val._id = ($.now() * -1).toString();
        return self.query().then(function (values) {
            values.push(new_val);
            return self.storeCollection(values).then(function () {
                return new_val;
            });
        });
    };

    /**
     * @param {Object} new_val
     * @returns {Deferred}
     * @private
     */
    this.updateItem = function (new_val) {
        return self.query().then(function (values) {
            if (!values) values = [];
            var val, i;
            for (i = 0; val = values[i]; i++) {
                if (val._id === new_val._id) {
                    values[i] = new_val;
                    break;
                }
            }
            // item not found
            if (values.length !== 0 && values.length === i) {
                // check if exists in the dictionary and if it does
                // replace the id with the new one and persist the object
                return self.localStorage.app.offline().getNewIdFromDictionary(new_val._id).then(function (new_id) {
                    new_val._id = new_id;
                    return self.updateItem(new_val);
                }, function () {
                    values.push(new_val);
                    return self.storeCollection(values).then(function () {
                        return new_val;
                    });
                });
            } else if (values.length === 0) {
                values.push(new_val);
            }
            return self.storeCollection(values).then(function () {
                return new_val;
            });
        });
    };

    /**
     * Persists an object or array in Local Storage.
     *
     * @param {Object} new_val
     * @returns {Deferred}
     * @public
     */
    this.persist = function (new_val) {
        if (!new_val) throw "The 'new_val' argument is required in order to insert.";
        if (typeof new_val !== 'object') new_val = JSON.parse(new_val);
        if ($.isArray(new_val)) {
            return self.storeCollection(new_val);
        } else if (typeof new_val._id !== 'undefined') {
            return self.updateItem(new_val);
        } else {
            return self.insertItem(new_val);
        }
    };


    /**
     * Retrieves an object by its key from Local Storage.
     *
     * @param id
     * @param {boolean} [from_dictionary=false]
     * @returns {Deferred}
     * @public
     */
    this.get = function (id, from_dictionary) {
        if (!id) throw "The 'id' argument is required in order to get.";
        if (!from_dictionary) from_dictionary = false;
        return self.query().then(function (values) {
            var val;
            for (var i = 0; val = values[i]; i++) {
                if (val._id === id) {
                    return val;
                }
            }
            if (!from_dictionary) {
                // if item not found, check if exists in the dictionary and look for it by the new id
                return self.localStorage.app.offline().getNewIdFromDictionary(id).then(function (new_id) {
                    return self.get(new_id, true);
                });
            }
            return $.Deferred().reject('Item not found');
        });
    };


    /**
     * Retrieves an array of matching objects from Local Storage.
     *
     * @param {Object} [query=]
     * @returns {Deferred}
     * @public
     */
    this.query = function (query) {
        return localforage.getItemAsync(self.name).then(function (values) {
            if (!values) values = [];
            if (typeof query === 'undefined') {
                return values;
            } else {
                for (var q in query) {
                    values = $.map(values, function (val) {
                        return val[q] === query[q] ? val : null;
                    });
                }
                return values;
            }
        });
    };


    /**
     * Deletes an object from Local Storage by its key.
     *
     * @param id
     * @returns {Deferred}
     * @public
     */
    this.del = function (id) {
        if (!id) throw "The 'id' argument is required in order to delete.";
        return self.query().then(function (values) {
            values = $.map(values, function (val) {
                return val._id !== id ? val : null;
            });
            return self.persist(values);
        });
    };


    /**
     * Drops the entire collection from Local Storage.
     *
     * @returns {Deferred}
     * @public
     */
    this.drop = function () {
        return localforage.removeItemAsync(self.name);
    };

    /**
     * Retrieves the quantity of stored items
     *
     * @returns {Deferred}
     * @public
     */
    this.length = function () {
        return self.query().then(function (values) {
            return values.length;
        });
    };
};

/**
 * Retrieves a singleton instance of KidoLocalStorage.
 *
 * @returns {KidoLocalStorage}
 */
Kido.prototype.localStorage = function () {
    if (!this._localStorage) this._localStorage = new KidoLocalStorage(this);
    return this._localStorage;
};

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
     * @constant {string}
     */
    this.SERVICE_NAME = "offline";
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
     * @private
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
     * @param {Object} request
     * @returns {Deferred}
     * @private
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
     * @returns {Deferred}
     * @private
     */
    this.removePendingRequest = function (object_id) {
        return pending_requests.del(object_id);
    };

    /**
     * Retrieves the request data by its key.
     *
     * @param {string} object_id
     * @returns {Deferred}
     * @private
     */
    this.getPendingRequestObject = function (object_id) {
        return pending_requests.get(object_id, true).then(function (req) {
            return JSON.parse(req.request.data);
        });
    };

    /**
     * Executes the requests stored in the pending requests queue.
     *
     * @returns {Deferred}
     * @private
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
     * @returns {Deferred}
     * @private
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
     * @param {Object} req
     * @param {Object} res
     * @returns {Deferred}
     * @private
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
     * @returns {Deferred}
     * @public
     */
    this.getNewIdFromDictionary = function (old_id) {
        return dictionary.get(old_id, true).then(function (item) {
            return item.new_id;
        });
    };

    /**
     * Executes ajax requests or stores it in a queue if it fails
     *
     * @param {Object} settings
     * @returns {Deferred}
     * @public
     */
    this.ajax = function (settings) {
        if (!settings) throw "The 'settings' argument is required.";
        var data = settings.data,
            service = settings.kidoService.service,
            name = settings.kidoService.collection,
            objectId = settings.kidoService.objectId,
            query = settings.kidoService.query,
            caching = settings.kidoService.caching,
            queueing = settings.kidoService.queueing,
            method = settings.type.toLowerCase(),
            getOne = (method === 'get' && objectId),
            getAll = (method === 'get' && !objectId),
            insert = (method === 'post' && data),
            update = (method === 'put' && data),
            remove = (method === 'delete' && objectId),
            drop = (method === 'delete' && !objectId),
            request = $.ajax(settings),
            deferred = $.Deferred();

        if (caching) {
            // Client-side caching is enabled
            var collection = self.app.localStorage().collection(service + '.' + name),
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

            if (getOne || getAll) {
                request.then(function (val) {
                    return collection.persist(val);
                });
            } else if (insert || update) {
                request.then(function (val) {
                    object._id = val._id ? val._id : (object._id ? object._id : null);
                    object._metadata = val._metadata ? val._metadata : (object._metadata ? object._metadata : null);
                    return collection.persist(object);
                });
            } else if (remove) {
                request.then(function () {
                    return collection.del(objectId ? objectId : old_id);
                });
            } else if (drop) {
                request.then(function () {
                    return collection.drop();
                });
            }
        }

        request.fail(function (err) {
            if (err.status !== 0) return deferred.reject(err);
            self.startCheckingConnectivity();
            // May be, it'd be better to reject with a custom message and sending the result anyway.
            // So that, the developer can notify their users that they are working offline.
            if (queueing && !caching) {
                // Only queueing requests
                if (!getOne && !getAll) {
                    var id = ($.now() * -1).toString();
                    self.addPendingRequest(id, settings).then(function () {
                        deferred.reject(err);
                    });
                } else {
                    deferred.reject(err);
                }
            } else if (caching) {
                // Caching data
                var success = function (val) {
                    if (queueing && (insert || update || remove || drop)) {
                        // Queueing requests
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
            } else {
                deferred.reject(err);
            }
        });

        request.done(function (val) {
            deferred.resolve(val);
        });

        return deferred.promise();
    };

};

/**
 * Retrieves a singleton instance of KidoOffline.
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
};*/
