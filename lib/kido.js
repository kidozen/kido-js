/**
 * Kido - Kidozen representation of an Application.
 *
 * Use the Kido class to gain access to all the application's backend services.
 */

//make sure JSON.parse and JSON.stringify exist.

if (!JSON || !JSON.parse || !JSON.stringify) throw "KidoZen requires JSON.stringify. Try adding a polyfil lib like json2.js";

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
    this.name          = name || 'local';  // backward compatibility
    this.marketplace   = marketplace;
    this.local         = this.name === 'local';
    this.hosted        = !marketplace;
    this.authenticated = this.hosted ? true : false;

    // get the application security configuration in case of
    // hosted authentication.
    if (!this.hosted) {
        this.authConfig = $.ajax({
            url: this.marketplace + "/publicapi/apps?name=" + this.name
        }).pipe(function (config) {
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
     * @api public
     */
    this.authenticate = function () {
        if (this.hosted) return $.Deferred().reject("No need to authenticate to this Web App");
        var authArgs = arguments;
        this.token = this.authConfig.pipe(function (config) {
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
        return this.token;
    };

    /**
     * send an http request to kidozen.
     * @param {object} settings - settings as in jQuery.ajax settings.
     * @api private.
     */
    this.send = function ( settings ) {
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
                .pipe(function (token) {
                    // if the token expired, then user the cached credentials
                    // to refresh the KidoZen token.
                    if (token.expiresOn < new Date().getTime()) {
                        return self.authenticate(_username, _password, _provider);
                    }
                    return token;
                })
                .pipe(function (token) {
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
     * @param settings {object} - optional settings as in $.ajax settings.
     * @api private
     */
    this.get = function ( url, settings ) {
        settings = $.extend({ url: url, type: "GET"}, settings || {});
        return self.send(settings);
    };


    /**
     * make a POST http request to kidozen.
     *
     * @param url {string}
     * @param data {object}     - data to POST in the http body.
     * @param settings {object} - optional settings as in $.ajax. settings.
     * @api private.
     */
    this.post = function ( url, data, settings ) {
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
     * @param settings {object} - optional settings as in $.ajax settings.
     * @api private
     */
     this.del = function ( url, settings ) {
        settings = $.extend({url: url, type: "DELETE"}, settings || {});
        return self.send(settings);
    };

    // Helper methods

    /**
     * Executes a HTTP request
     * @param {object} settings
     * @returns {*}
     * @api private
     */
    function executeAjaxRequest (settings) {
        // TODO: this condition must check if the developer wants to use "caching" when there's no connection
        if (typeof settings.kidoService === 'undefined') {
            return $.ajax(settings);
        }

        var data = settings.data,
            service = settings.kidoService.service,
            name = settings.kidoService.name,
            objectId = settings.kidoService.objectId,
            query = settings.kidoService.query,
            method = settings.type.toLowerCase(),
            collection = self.localStorage().collection(service + '.' + name),
            getOne = (method === 'get' && objectId),
            getAll = (method === 'get' && !objectId),
            insert = (method === 'post' && data),
            update = (method === 'put' && data),
            remove = (method === 'delete' && objectId),
            drop   = (method === 'delete' && !objectId),
            object = data ? JSON.parse(data) : null,
            old_id = object ? object._id : null,
            local  = (objectId && parseInt(objectId) < 0) || (old_id && parseInt(old_id) < 0);

        if (local) {
            if (getOne) {
                return collection.get(objectId);
            } else if (remove) {
                return collection.del(objectId).pipe(function () {
                    return collection.localStorage.removePendingRequest(objectId);
                });
            } else if (update) {
                settings.type = 'POST';
                delete object._id;
                settings.data = JSON.stringify(object);
                objectId = null;
            }
        }

        var deferred = $.Deferred();
        // TODO: see if we can fire an event when the connection is back, and execute the pending requests then
        collection.localStorage.executePendingRequests().always(function () {
            var ajax = $.ajax(settings);
            if (getAll || insert || update) {
                ajax.pipe(function (val) {
                    return collection.persist(val);
                });
            } else if (remove) {
                ajax.pipe(function () {
                    return collection.del(objectId ? objectId : old_id);
                });
            } else if (drop) {
                ajax.pipe(function () {
                    return collection.drop();
                });
            }
            ajax.fail(function (err) {
                if (err.status !== 0) return deferred.reject(err);
                // TODO: check
                // May be, it'd be better to reject with a custom message and sending the result anyway.
                // So that, the developer can notify their users that they are working offline.
                var success = function (val) {
                    if (insert || update || remove || drop) {
                        var id = drop ? ($.now() * -1).toString() : (remove ? objectId : (update ? old_id : val._id));
                        collection.localStorage.addPendingRequest(id, settings).then(function () {
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
        });
        return deferred.promise();
    }

    /**
     * Ws-Trust strategy for authentication
     * @api private
     */
    function wsTrustToken (opts) {
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
     * @api private
     */
    function wrapToken (opts) {
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
     * @api private
     */
    function passiveAuth (config) {
        if (!config.signInUrl) {
            return $.Deferred().reject('Passive Authentication not supported.');
        }
        if (typeof window.atob === 'undefined') {
            return $.Deferred().reject('Browser does not support window.atob()');
        }
        var deferred = $.Deferred();
        var ref = window.open(config.signInUrl, '_blank', 'location=yes');
        ref.addEventListener('loadstop' , function (event) {
            ref.executeScript({
                code: 'document.title;'
            }, function (values) {
                var refTitle = values[0];
                if (refTitle.indexOf('Success payload=') !== -1) {
                    ref.close();
                    var token = JSON.parse(window.atob(refTitle.replace('Success payload=', '')));
                    if (!token || !token.access_token) {
                        return deferred.reject('Unable to retrieve KidoZen token.');
                    }
                    deferred.resolve(processToken(token));
                }
            });
        });
        return deferred.promise();
    }

    /**
     * Form based authentication
     * @api private
     */
    function activeAuth (config, user, pass, prov, ip) {
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
        }).pipe(function (body){
            var assertion = (/<Assertion(.*)<\/Assertion>/.exec(body) || [])[0];
            if (!assertion) return $.Deferred().reject("Unable to get a token from IDP");
            // get a kidozen token
            var postRequest = {
                url : config.authServiceEndpoint,
                type : "POST",
                data : {
                    wrap_assertion : assertion,
                    wrap_scope : config.applicationScope,
                    wrap_assertion_format : "SAML"
                }
            };
            return $.ajax(postRequest).pipe(function (token) {
                // make sure we got a token
                if (!token || !token.access_token)
                    return $.Deferred().reject("Unable to retrieve KidoZen token.");
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
     * @api private
     */
    function processToken (token) {
        token.token = 'WRAP access_token="' + token.access_token + '"';
        // parse the token and get the claims and the expiration date.
        var tokenData = decodeURIComponent(token.access_token);
        var claims = tokenData.split("&");
        token.claims = claims;
        for (var i in claims) {
            var c = claims[i];
            if (c.indexOf("ExpiresOn") > -1) {
                // adjust the expiration 20 seconds before it actually
                // expires so that it doesn't expire due to latency.
                token.expiresOn = ~~(c.split("=")[1]) * 1000 - 20*1000;
                break;
            }
        }
        return token;
    }

};
