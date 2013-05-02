
jQuery.support.cors = ('withCredentials' in new XMLHttpRequest());

var Kido = function(name, baseUrl)
{
    if (!(this instanceof Kido)) return new Kido(name);
    if (!name) name = 'local';

    this.applicationName = name;
    this.baseUrl = baseUrl || "";
    this.user = null;
    
    this.send = function(settings)
    {
        settings.url = this.baseUrl + settings.url;

        //if(!settings.dataType)
        //  settings.dataType = "json";

        if(settings.type.toUpperCase() === "GET") {
            if(this.isCrossDomain(settings.url)) {
                settings.dataType = "jsonp";
            }
        }
        else {
            if(this.isCrossDomain(settings.url)) {
                var rej = $.Deferred();
                rej.reject({ msg: "Cross Domain Posting is not available.", error: "No JSONP Posting"});
                return rej;
            }
        }

        settings = $.extend({}, {
            url: "",
            type: "POST",
            cache: settings.cache || true
        }, settings);

        if(!(settings.contentType) && (settings.data)) {// || settings.type.toUpperCase() === "GET")) {
            settings.contentType = "application/json";
        }

        if(settings.url && settings.url !== "") {
            return $.ajax(settings);
        }
        else {
            var rej = $.Deferred();
            rej.reject({ 
                msg: "Not a valid ajax URL.",
                error: "invalid url"
            });
            return rej;
        }
    };

    this.loginWsTrust = function(url, user, password, scope)
    {
        // --------------------------------------------------------
        // remove after renewToken method was implemented correctly
        loginUrl = url;
        loginUser = user;
        loginPassword  = password;
        loginScope = scope;
        // --------------------------------------------------------

        var templates  = { rst : '<s:Envelope xmlns:s="http://www.w3.org/2003/05/soap-envelope" xmlns:a="http://www.w3.org/2005/08/addressing" xmlns:u="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-utility-1.0.xsd"><s:Header><a:Action s:mustUnderstand="1">http://docs.oasis-open.org/ws-sx/ws-trust/200512/RST/Issue</a:Action><a:To s:mustUnderstand="1">[To]</a:To><o:Security s:mustUnderstand="1" xmlns:o="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-secext-1.0.xsd"><o:UsernameToken u:Id="uuid-6a13a244-dac6-42c1-84c5-cbb345b0c4c4-1"><o:Username>[Username]</o:Username><o:Password Type="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-username-token-profile-1.0#PasswordText">[Password]</o:Password></o:UsernameToken></o:Security></s:Header><s:Body><trust:RequestSecurityToken xmlns:trust="http://docs.oasis-open.org/ws-sx/ws-trust/200512"><wsp:AppliesTo xmlns:wsp="http://schemas.xmlsoap.org/ws/2004/09/policy"><a:EndpointReference><a:Address>[ApplyTo]</a:Address></a:EndpointReference></wsp:AppliesTo><trust:KeyType>http://docs.oasis-open.org/ws-sx/ws-trust/200512/Bearer</trust:KeyType><trust:RequestType>http://docs.oasis-open.org/ws-sx/ws-trust/200512/Issue</trust:RequestType><trust:TokenType>urn:oasis:names:tc:SAML:2.0:assertion</trust:TokenType></trust:RequestSecurityToken></s:Body></s:Envelope>' };
        var message = templates.rst
            .replace("[To]", url)
            .replace("[Username]", usr)
            .replace("[Password]", password)
            .replace("[ApplyTo]", scope);
        
        $.ajax({
            url: url,
            method: 'POST',
            data: message,
            headers: {
                'Content-Type': 'application/soap+xml; charset=utf-8',
                'Content-Length': message.length
            },
            success: function(data, textStatus, jqXHR)
            {
                var samlToken = parseRstr(data);
                setKidoToken(samlToken);
            }
        });
    };

    this.isCrossDomain = function(url) {
        if(jQuery.support.cors) {
            return false;
        }
        var siteHost = window.location.host,
            targetHost = jQuery.url.setUrl(url).attr("host");

        if(!targetHost || targetHost === "") {
            return false; //relative url
        }
        if(siteHost != targetHost) {
            return true;
        }
        return false;
    };

    this.logout = function()
    {
        kidoToken = null;
        kidoTokenExpiration = null;

        // --------------------------------------------------------
        // remove after renewToken method was implemented correctly
        loginUrl = null;
        loginUser = null;
        loginPassword  = null;
        loginScope = null;
        // --------------------------------------------------------
    };

    this.renewToken = function()
    {
        // TODO: implement a real renewToken  request against IP
        login(loginUrl, loginUser, loginPassword, loginScope);
    };

    // var isKidoTokenValid = function()
    // {
    // //   if (kidoTokenExpiration && (kidoTokenExpiration > (new Date()))) {
    // //       return true;
    // //   }

    // //   kidoToken = null;
    // //   kidoTokenExpiration = null;

    // //   // --------------------------------------------------------
    // //   // remove after renewToken method was implemented correctly
    // //   loginUrl = null;
    // //   loginUser = null;
    // //   loginPassword  = null;
    // //   loginScope = null;
    // //   // --------------------------------------------------------
    // //   return false;
    // };

    // var setKidoToken = function(samlToken)
    // {
    //  $.ajax({
    //      url: acsWrapEndpoint,
    //      port: '443',
    //      path: uri.pathname,
    //      method: 'POST',
    //      success: function(data, textStatus, jqXHR)
    //      {
    //          var dataParsed = decodeURI(data);
    //          kidoToken = dataParsed.wrap_access_token;
    //          kidoTokenExpiration = getExpiration(dataparsed.wrap_access_token_expires_in);
    //      }
    //  });
    // };

    var getExpiration = function(expiresInSeconds)
    {
        return new Date((new Date()).getTime() + (expiresIn * 1000));
    };

    var parseRstr = function(rstr){
        var startOfAssertion = rstr.indexOf('<Assertion ');
        var endOfAssertion = rstr.indexOf('</Assertion>') + '</Assertion>'.length;
        var token = rstr.substring(startOfAssertion, endOfAssertion);
        
        return token;
    };

    var parseUrl = function(url)
    {
        var segments = url.split('/');
        var instance = {
            port: 443,
            host: segments[2],
            path: "/" + (segments.length>3) ? segments.slice(3).join('/') : ""
        };
        
        if (instance.host.indexOf(':')!==-1)
        {
            var parts = instance.host.split(':');
            instance.host = parts[0];
            instance.port = parseInt(parts[1], 10);
        }
        
        return instance;
    };
};