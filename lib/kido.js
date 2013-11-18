/**
 * Kido - Kidozen representation of an Application.
 *
 * Use the Kido class to gain access to all the application's backend services.
 */
var Kido = function (name, marketplace) {

    var self = this;

    if (!(this instanceof Kido)) return new Kido();

    //leave this for backward compatibility.
    this.name = name || 'local';
    this.marketplace = marketplace;

    //initialize variables
    this.local  = this.name === 'local';
    this.active = !!marketplace;
    this.authenticated = this.active ? false : true;

    if (this.active) {
        this.authConfig = $.ajax({
            url: this.marketplace + "/publicapi/apps?name=" + this.name
        }).pipe(function (config) {
            self.url = config[0].url.substring(0, config[0].url.length - 1);
            return config[0].authConfig;
        });
    }

    function wsTrustToken (opts) {
        var template = '<s:Envelope xmlns:s="http://www.w3.org/2003/05/soap-envelope" xmlns:a="http://www.w3.org/2005/08/addressing" xmlns:u="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-utility-1.0.xsd"><s:Header><a:Action s:mustUnderstand="1">http://docs.oasis-open.org/ws-sx/ws-trust/200512/RST/Issue</a:Action><a:To s:mustUnderstand="1">[To]</a:To><o:Security s:mustUnderstand="1" xmlns:o="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-secext-1.0.xsd"><o:UsernameToken u:Id="uuid-6a13a244-dac6-42c1-84c5-cbb345b0c4c4-1"><o:Username>[Username]</o:Username><o:Password Type="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-username-token-profile-1.0#PasswordText">[Password]</o:Password></o:UsernameToken></o:Security></s:Header><s:Body><trust:RequestSecurityToken xmlns:trust="http://docs.oasis-open.org/ws-sx/ws-trust/200512"><wsp:AppliesTo xmlns:wsp="http://schemas.xmlsoap.org/ws/2004/09/policy"><a:EndpointReference><a:Address>[ApplyTo]</a:Address></a:EndpointReference></wsp:AppliesTo><trust:KeyType>http://docs.oasis-open.org/ws-sx/ws-trust/200512/Bearer</trust:KeyType><trust:RequestType>http://docs.oasis-open.org/ws-sx/ws-trust/200512/Issue</trust:RequestType><trust:TokenType>urn:oasis:names:tc:SAML:2.0:assertion</trust:TokenType></trust:RequestSecurityToken></s:Body></s:Envelope>';
        return $.ajax({
                    dataType: 'XML',
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

    this.authenticate = function (user, pass, prov) {
        
        if (!this.active) throw new Error("No need to authenticate to this Web App");
        
        this.token = this.authConfig.pipe(function (config) {
            var ips = config.identityProviders;
            prov = prov || Object.keys(ips)[0];
            var ip = ips[prov];

            if (!ip) throw new Error("Invalid Identity Provider");
            if (!ip.protocol) throw new Error("Invalid Identity Provider Protocol");

            var getToken;
            if (ip.protocol.toLowerCase() === "wrapv0.9")
                getToken = wrapToken;
            else if (ip.protocol.toLowerCase() === "ws-trust")
                getToken = wsTrustToken;
            else
                throw new Error("Protocol not supported yet.");

            return getToken({
                user: user,
                pass: pass,
                scope: config.authServiceScope,
                endpoint: ip.endpoint
            }).pipe(function (body){
                var assertion = (/<Assertion(.*)<\/Assertion>/.exec(body) || [])[0];
                if (!assertion) throw new Error("Unable to get a token from IDP");
                //get a kidozen token
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
                    self.authenticated = true;
                    token.token = 'WRAP access_token="' + token.rawToken + '"';
                    console.log("authenticated");
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
            return self.token.pipe(function (token) {
                opts.url = self.url + opts.url;
                opts.headers = opts.headers || {};
                opts.headers.authorization = token.token;
                console.log('opts', opts);
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
};