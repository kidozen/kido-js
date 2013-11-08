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

    this.authenticate = function (user, pass, prov) {
        
        if (!this.active) throw new Error("No need to authenticate to this Web App");
        
        this.token = this.authConfig.pipe(function (config) {
            var ips = config.identityProviders;
            prov = prov || Object.keys(ips)[0];
            var ip = ips[prov];

            if (!ip) throw new Error("Invalid Identity Provider");
            if (!ip.protocol) throw new Error("Invalid Identity Provider Protocol");
            if (ip.protocol.toLowerCase() !== "wrapv0.9") throw new Error("Protocol not supported yet.");

            var form = {
                "wrap_name": user,
                "wrap_password": pass,
                "wrap_scope": config.authServiceScope
            };

            return $.ajax({url: ip.endpoint, data: form, type: 'POST', dataType: 'text'}).pipe(function (body){
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
            url: "",
            type: "POST",
            cache: true
        };
        
        var opts = $.extend({}, defaults, settings);

        if (opts.data && !opts.contentType)
            opts.contentType = "application/json";

        if (self.active && self.authenticated) {
            return self.token.pipe(function (token) {
                opts.url = self.url + opts.url;
                // opts.url = opts.url.replace('https', 'http');
                opts.headers = opts.headers || {};
                opts.headers.authorization = token.token;
                // opts.xhrFields = {
                //     withCredentials: true
                // };
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