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
var Kido = function (name, marketplace, options) {

    if (!(this instanceof Kido)) return new Kido();

    if (typeof $ === 'undefined') throw "jQuery 1.8 or above is required to use the Kido SDK.";
    if (typeof $.fn === 'undefined' || typeof $.fn.jquery === 'undefined') throw "Could not determine jQuery version.";
    var $version = $.fn.jquery.split('.');
    if (parseInt($version[0]) < 2 && parseInt($version[1]) < 8) throw "jQuery 1.8 or above is required to use the Kido SDK.";

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
    this.isNative = (document.URL.indexOf('http://') === -1 && document.URL.indexOf('https://') === -1);
    
    if (typeof options === 'object') {
        if (typeof options.token === 'object') {
            this.authenticated = true;
            this.url = marketplace;
            this.token = $.Deferred().resolve(processToken(options.token));
        }
        if (typeof options.username === 'string') {
            _username = options.username;
        }
        if (typeof options.password === 'string') {
            _password = options.password;
        }
        if (typeof options.provider === 'string') {
            _provider = options.provider;
        }
    }

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
        if (self.isNative) {
            // cordova
            ref.addEventListener('loadstop', function (event) {
                ref.executeScript({
                    code: 'document.title;'
                }, function (values) {
                    var refTitle = values[0];
                    if (refTitle.indexOf('Success payload=') !== -1) {
                        try {
                            var token = processTokenForPassiveAuth(refTitle);
                            self.authenticated = true;
                            deferred.resolve(token);
                        } catch (err) {
                            deferred.reject('Unable to retrieve KidoZen token.');
                        }
                        ref.close();
                    }
                });
            });
            ref.addEventListener('loaderror', function(event) {
                deferred.reject('InAppBrowser error loading page.');
                ref.close();
            });
            ref.addEventListener('exit', function(event) {
                deferred.reject('InAppBrowser has exited.');
            });
        } else {
            // browser
            window.addEventListener('message', function(event) {
                var signInUrl = document.createElement('a');
                signInUrl.href = config.signInUrl;
                if (event.origin !== (signInUrl.protocol + '//' + signInUrl.host)) {
                    return deferred.reject('Unable to retrieve KidoZen token.');
                }
                try {
                    var token = processTokenForPassiveAuth(event.data);
                    self.authenticated = true;
                    deferred.resolve(token);
                } catch (err) {
                    deferred.reject('Unable to retrieve KidoZen token.');
                }
                ref.close();
            }, false);
        }
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
     * for the passive authentication strategy
     * @private
     */
    function processTokenForPassiveAuth(token) {
        if (token.indexOf('Success payload=') === -1) {
            throw 'Unable to retrieve KidoZen token.';
        }
        token = JSON.parse(window.atob(token.replace('Success payload=', '')));
        // rawToken is verified for backwards compatibility
        if (!token || (!token.access_token && !token.rawToken)) {
            throw 'Unable to retrieve KidoZen token.';
        }
        return processToken(token);
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
