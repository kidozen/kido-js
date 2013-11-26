/**
 * Kido - Kidozen representation of an Application.
 *
 * Use the Kido class to gain access to all the application's backend services.
 */

//make sure JSON.parse and JSON.stringify exist.

if (!JSON || !JSON.parse || !JSON.stringify) throw "KidoZen requires JSON.stringify. Try adding a polyfil lib like json2.js";

var Kido = function (name, marketplace) {

    if (!(this instanceof Kido)) return new Kido();
    
    var self = this;
    var _username = null; // keep the username, password and provider
    var _password = null; // in memory as private variables in order
    var _provider = null; // to refresh tokens when they expire.
    
    // initialize properties
    this.name          = name || 'local';  // backward compatibility
    this.marketplace   = marketplace;
    this.local         = this.name === 'local';
    this.active        = !!marketplace;
    this.authenticated = this.active ? false : true;

    // get the application security configuration in case of
    // active authentication.
    if (this.active) {
        this.authConfig = $.ajax({
            url: this.marketplace + "/publicapi/apps?name=" + this.name
        }).pipe(function (config) {
            if (!config || !config.length)
                return $.Deferred().reject("Application configuration not found.");
            self.url = config[0].url.substring(0, config[0].url.length - 1);
            return config[0].authConfig;
        });
    }

    /**
     * authenticate to the KidoZen Application using the IDP in the app
     * security configuration.
     * @api public
     */
    this.authenticate = function (user, pass, prov) {
        
        if (!this.active) return $.Deferred().reject("No need to authenticate to this Web App");
        
        this.token = this.authConfig.pipe(function (config) {
            var ips = config.identityProviders;
            prov = prov || Object.keys(ips)[0];
            var ip = ips[prov];

            if (!ip) return $.Deferred().reject("Invalid Identity Provider");
            if (!ip.protocol) return $.Deferred().reject("Invalid Identity Provider Protocol");

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
                    if (!token || !token.rawToken)
                        return $.Deferred().reject("Unable to retrieve KidoZen token.");
                    self.authenticated = true;
                    _username = user;
                    _password = pass;
                    _provider = prov;
                    token.token = 'WRAP access_token="' + token.rawToken + '"';
                    // parse the token and get the claims and the expiration date.
                    var tokenData = decodeURIComponent(token.rawToken);
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
                });
            });
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

        if (self.active && self.authenticated) {
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
                    return $.ajax(opts);
                });
        }
        return $.ajax(opts);
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
};