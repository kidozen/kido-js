jQuery.extend({

	crossDomain: function(options) {
	
		var deferred = $.Deferred();

		if (!XMLHttpRequest && !XDomainRequest) {
			throw 'Unsupported Browser.';
		}

		var request = new XMLHttpRequest();
		
		if(request.withCredentials == undefined) {
			throw 'Browser doesn\'t support CORS.';
		}
	
		var handler = function(evtXHR) {

			if (request.readyState == 4) {

                if (request.status == 200) {
                	
                	var data = null;

                	if (request.responseXML != null) {
                		data = request.responseXML
                	}
                    else if(request.responseText != null) {
						try
						{
						   data = JSON.parse(request.responseText);
						}
						catch(e)
						{
						   data = request.responseText;
						}
                    }

                    deferred.resolve(data);
                }
        	}
		};

		request.open(options.type, options.url, true);
		request.onreadystatechange = handler;
		request.send();

		return deferred;
			
			/* TODO: Make this work on IE
			else if (XDomainRequest)
			{
				if (options.headers) 
				{
					for(var headerName in options.headers)
					{
						request.setRequestHeader(headerName, options.headers[headerName]);
					}
				}

			 	// IE8
			 	var xdr = new XDomainRequest();
			 	xdr.open(options.method, options.url);
			 	xdr.send();
			}*/
	}

});
/*
    json2.js
    2011-10-19

    Public Domain.

    NO WARRANTY EXPRESSED OR IMPLIED. USE AT YOUR OWN RISK.

    See http://www.JSON.org/js.html


    This code should be minified before deployment.
    See http://javascript.crockford.com/jsmin.html

    USE YOUR OWN COPY. IT IS EXTREMELY UNWISE TO LOAD CODE FROM SERVERS YOU DO
    NOT CONTROL.


    This file creates a global JSON object containing two methods: stringify
    and parse.

        JSON.stringify(value, replacer, space)
            value       any JavaScript value, usually an object or array.

            replacer    an optional parameter that determines how object
                        values are stringified for objects. It can be a
                        function or an array of strings.

            space       an optional parameter that specifies the indentation
                        of nested structures. If it is omitted, the text will
                        be packed without extra whitespace. If it is a number,
                        it will specify the number of spaces to indent at each
                        level. If it is a string (such as '\t' or '&nbsp;'),
                        it contains the characters used to indent at each level.

            This method produces a JSON text from a JavaScript value.

            When an object value is found, if the object contains a toJSON
            method, its toJSON method will be called and the result will be
            stringified. A toJSON method does not serialize: it returns the
            value represented by the name/value pair that should be serialized,
            or undefined if nothing should be serialized. The toJSON method
            will be passed the key associated with the value, and this will be
            bound to the value

            For example, this would serialize Dates as ISO strings.

                Date.prototype.toJSON = function (key) {
                    function f(n) {
                        // Format integers to have at least two digits.
                        return n < 10 ? '0' + n : n;
                    }

                    return this.getUTCFullYear()   + '-' +
                         f(this.getUTCMonth() + 1) + '-' +
                         f(this.getUTCDate())      + 'T' +
                         f(this.getUTCHours())     + ':' +
                         f(this.getUTCMinutes())   + ':' +
                         f(this.getUTCSeconds())   + 'Z';
                };

            You can provide an optional replacer method. It will be passed the
            key and value of each member, with this bound to the containing
            object. The value that is returned from your method will be
            serialized. If your method returns undefined, then the member will
            be excluded from the serialization.

            If the replacer parameter is an array of strings, then it will be
            used to select the members to be serialized. It filters the results
            such that only members with keys listed in the replacer array are
            stringified.

            Values that do not have JSON representations, such as undefined or
            functions, will not be serialized. Such values in objects will be
            dropped; in arrays they will be replaced with null. You can use
            a replacer function to replace those with JSON values.
            JSON.stringify(undefined) returns undefined.

            The optional space parameter produces a stringification of the
            value that is filled with line breaks and indentation to make it
            easier to read.

            If the space parameter is a non-empty string, then that string will
            be used for indentation. If the space parameter is a number, then
            the indentation will be that many spaces.

            Example:

            text = JSON.stringify(['e', {pluribus: 'unum'}]);
            // text is '["e",{"pluribus":"unum"}]'


            text = JSON.stringify(['e', {pluribus: 'unum'}], null, '\t');
            // text is '[\n\t"e",\n\t{\n\t\t"pluribus": "unum"\n\t}\n]'

            text = JSON.stringify([new Date()], function (key, value) {
                return this[key] instanceof Date ?
                    'Date(' + this[key] + ')' : value;
            });
            // text is '["Date(---current time---)"]'


        JSON.parse(text, reviver)
            This method parses a JSON text to produce an object or array.
            It can throw a SyntaxError exception.

            The optional reviver parameter is a function that can filter and
            transform the results. It receives each of the keys and values,
            and its return value is used instead of the original value.
            If it returns what it received, then the structure is not modified.
            If it returns undefined then the member is deleted.

            Example:

            // Parse the text. Values that look like ISO date strings will
            // be converted to Date objects.

            myData = JSON.parse(text, function (key, value) {
                var a;
                if (typeof value === 'string') {
                    a =
/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2}(?:\.\d*)?)Z$/.exec(value);
                    if (a) {
                        return new Date(Date.UTC(+a[1], +a[2] - 1, +a[3], +a[4],
                            +a[5], +a[6]));
                    }
                }
                return value;
            });

            myData = JSON.parse('["Date(09/09/2001)"]', function (key, value) {
                var d;
                if (typeof value === 'string' &&
                        value.slice(0, 5) === 'Date(' &&
                        value.slice(-1) === ')') {
                    d = new Date(value.slice(5, -1));
                    if (d) {
                        return d;
                    }
                }
                return value;
            });


    This is a reference implementation. You are free to copy, modify, or
    redistribute.
*/

/*jslint evil: true, regexp: true */

/*members "", "\b", "\t", "\n", "\f", "\r", "\"", JSON, "\\", apply,
    call, charCodeAt, getUTCDate, getUTCFullYear, getUTCHours,
    getUTCMinutes, getUTCMonth, getUTCSeconds, hasOwnProperty, join,
    lastIndex, length, parse, prototype, push, replace, slice, stringify,
    test, toJSON, toString, valueOf
*/


// Create a JSON object only if one does not already exist. We create the
// methods in a closure to avoid creating global variables.

var JSON;
if (!JSON) {
    JSON = {};
}

(function () {
    'use strict';

    function f(n) {
        // Format integers to have at least two digits.
        return n < 10 ? '0' + n : n;
    }

    if (typeof Date.prototype.toJSON !== 'function') {

        Date.prototype.toJSON = function (key) {

            return isFinite(this.valueOf())
                ? this.getUTCFullYear()     + '-' +
                    f(this.getUTCMonth() + 1) + '-' +
                    f(this.getUTCDate())      + 'T' +
                    f(this.getUTCHours())     + ':' +
                    f(this.getUTCMinutes())   + ':' +
                    f(this.getUTCSeconds())   + 'Z'
                : null;
        };

        String.prototype.toJSON      =
            Number.prototype.toJSON  =
            Boolean.prototype.toJSON = function (key) {
                return this.valueOf();
            };
    }

    var cx = /[\u0000\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g,
        escapable = /[\\\"\x00-\x1f\x7f-\x9f\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g,
        gap,
        indent,
        meta = {    // table of character substitutions
            '\b': '\\b',
            '\t': '\\t',
            '\n': '\\n',
            '\f': '\\f',
            '\r': '\\r',
            '"' : '\\"',
            '\\': '\\\\'
        },
        rep;


    function quote(string) {

// If the string contains no control characters, no quote characters, and no
// backslash characters, then we can safely slap some quotes around it.
// Otherwise we must also replace the offending characters with safe escape
// sequences.

        escapable.lastIndex = 0;
        return escapable.test(string) ? '"' + string.replace(escapable, function (a) {
            var c = meta[a];
            return typeof c === 'string'
                ? c
                : '\\u' + ('0000' + a.charCodeAt(0).toString(16)).slice(-4);
        }) + '"' : '"' + string + '"';
    }


    function str(key, holder) {

// Produce a string from holder[key].

        var i,          // The loop counter.
            k,          // The member key.
            v,          // The member value.
            length,
            mind = gap,
            partial,
            value = holder[key];

// If the value has a toJSON method, call it to obtain a replacement value.

        if (value && typeof value === 'object' &&
                typeof value.toJSON === 'function') {
            value = value.toJSON(key);
        }

// If we were called with a replacer function, then call the replacer to
// obtain a replacement value.

        if (typeof rep === 'function') {
            value = rep.call(holder, key, value);
        }

// What happens next depends on the value's type.

        switch (typeof value) {
        case 'string':
            return quote(value);

        case 'number':

// JSON numbers must be finite. Encode non-finite numbers as null.

            return isFinite(value) ? String(value) : 'null';

        case 'boolean':
        case 'null':

// If the value is a boolean or null, convert it to a string. Note:
// typeof null does not produce 'null'. The case is included here in
// the remote chance that this gets fixed someday.

            return String(value);

// If the type is 'object', we might be dealing with an object or an array or
// null.

        case 'object':

// Due to a specification blunder in ECMAScript, typeof null is 'object',
// so watch out for that case.

            if (!value) {
                return 'null';
            }

// Make an array to hold the partial results of stringifying this object value.

            gap += indent;
            partial = [];

// Is the value an array?

            if (Object.prototype.toString.apply(value) === '[object Array]') {

// The value is an array. Stringify every element. Use null as a placeholder
// for non-JSON values.

                length = value.length;
                for (i = 0; i < length; i += 1) {
                    partial[i] = str(i, value) || 'null';
                }

// Join all of the elements together, separated with commas, and wrap them in
// brackets.

                v = partial.length === 0
                    ? '[]'
                    : gap
                    ? '[\n' + gap + partial.join(',\n' + gap) + '\n' + mind + ']'
                    : '[' + partial.join(',') + ']';
                gap = mind;
                return v;
            }

// If the replacer is an array, use it to select the members to be stringified.

            if (rep && typeof rep === 'object') {
                length = rep.length;
                for (i = 0; i < length; i += 1) {
                    if (typeof rep[i] === 'string') {
                        k = rep[i];
                        v = str(k, value);
                        if (v) {
                            partial.push(quote(k) + (gap ? ': ' : ':') + v);
                        }
                    }
                }
            } else {

// Otherwise, iterate through all of the keys in the object.

                for (k in value) {
                    if (Object.prototype.hasOwnProperty.call(value, k)) {
                        v = str(k, value);
                        if (v) {
                            partial.push(quote(k) + (gap ? ': ' : ':') + v);
                        }
                    }
                }
            }

// Join all of the member texts together, separated with commas,
// and wrap them in braces.

            v = partial.length === 0
                ? '{}'
                : gap
                ? '{\n' + gap + partial.join(',\n' + gap) + '\n' + mind + '}'
                : '{' + partial.join(',') + '}';
            gap = mind;
            return v;
        }
    }

// If the JSON object does not yet have a stringify method, give it one.

    if (typeof JSON.stringify !== 'function') {
        JSON.stringify = function (value, replacer, space) {

// The stringify method takes a value and an optional replacer, and an optional
// space parameter, and returns a JSON text. The replacer can be a function
// that can replace values, or an array of strings that will select the keys.
// A default replacer method can be provided. Use of the space parameter can
// produce text that is more easily readable.

            var i;
            gap = '';
            indent = '';

// If the space parameter is a number, make an indent string containing that
// many spaces.

            if (typeof space === 'number') {
                for (i = 0; i < space; i += 1) {
                    indent += ' ';
                }

// If the space parameter is a string, it will be used as the indent string.

            } else if (typeof space === 'string') {
                indent = space;
            }

// If there is a replacer, it must be a function or an array.
// Otherwise, throw an error.

            rep = replacer;
            if (replacer && typeof replacer !== 'function' &&
                    (typeof replacer !== 'object' ||
                    typeof replacer.length !== 'number')) {
                throw new Error('JSON.stringify');
            }

// Make a fake root object containing our value under the key of ''.
// Return the result of stringifying the value.

            return str('', {'': value});
        };
    }


// If the JSON object does not yet have a parse method, give it one.

    if (typeof JSON.parse !== 'function') {
        JSON.parse = function (text, reviver) {

// The parse method takes a text and an optional reviver function, and returns
// a JavaScript value if the text is a valid JSON text.

            var j;

            function walk(holder, key) {

// The walk method is used to recursively walk the resulting structure so
// that modifications can be made.

                var k, v, value = holder[key];
                if (value && typeof value === 'object') {
                    for (k in value) {
                        if (Object.prototype.hasOwnProperty.call(value, k)) {
                            v = walk(value, k);
                            if (v !== undefined) {
                                value[k] = v;
                            } else {
                                delete value[k];
                            }
                        }
                    }
                }
                return reviver.call(holder, key, value);
            }


// Parsing happens in four stages. In the first stage, we replace certain
// Unicode characters with escape sequences. JavaScript handles many characters
// incorrectly, either silently deleting them, or treating them as line endings.

            text = String(text);
            cx.lastIndex = 0;
            if (cx.test(text)) {
                text = text.replace(cx, function (a) {
                    return '\\u' +
                        ('0000' + a.charCodeAt(0).toString(16)).slice(-4);
                });
            }

// In the second stage, we run the text against regular expressions that look
// for non-JSON patterns. We are especially concerned with '()' and 'new'
// because they can cause invocation, and '=' because it can cause mutation.
// But just to be safe, we want to reject all unexpected forms.

// We split the second stage into 4 regexp operations in order to work around
// crippling inefficiencies in IE's and Safari's regexp engines. First we
// replace the JSON backslash pairs with '@' (a non-JSON character). Second, we
// replace all simple value tokens with ']' characters. Third, we delete all
// open brackets that follow a colon or comma or that begin the text. Finally,
// we look to see that the remaining characters are only whitespace or ']' or
// ',' or ':' or '{' or '}'. If that is so, then the text is safe for eval.

            if (/^[\],:{}\s]*$/
                    .test(text.replace(/\\(?:["\\\/bfnrt]|u[0-9a-fA-F]{4})/g, '@')
                        .replace(/"[^"\\\n\r]*"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?/g, ']')
                        .replace(/(?:^|:|,)(?:\s*\[)+/g, ''))) {

// In the third stage we use the eval function to compile the text into a
// JavaScript structure. The '{' operator is subject to a syntactic ambiguity
// in JavaScript: it can begin a block or an object literal. We wrap the text
// in parens to eliminate the ambiguity.

                j = eval('(' + text + ')');

// In the optional fourth stage, we recursively walk the new structure, passing
// each name/value pair to a reviver function for possible transformation.

                return typeof reviver === 'function'
                    ? walk({'': j}, '')
                    : j;
            }

// If the text is not JSON parseable, then a SyntaxError is thrown.

            throw new SyntaxError('JSON.parse');
        };
    }
}());

wsTrustClient = function(endpointAddress) {

    var endpoint = endpointAddress;

    var templates  = {
        rst : '<s:Envelope xmlns:s="http://www.w3.org/2003/05/soap-envelope" xmlns:a="http://www.w3.org/2005/08/addressing" xmlns:u="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-utility-1.0.xsd"><s:Header><a:Action s:mustUnderstand="1">http://docs.oasis-open.org/ws-sx/ws-trust/200512/RST/Issue</a:Action><a:To s:mustUnderstand="1">[To]</a:To><o:Security s:mustUnderstand="1" xmlns:o="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-secext-1.0.xsd"><o:UsernameToken u:Id="uuid-6a13a244-dac6-42c1-84c5-cbb345b0c4c4-1"><o:Username>[Username]</o:Username><o:Password Type="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-username-token-profile-1.0#PasswordText">[Password]</o:Password></o:UsernameToken></o:Security></s:Header><s:Body><trust:RequestSecurityToken xmlns:trust="http://docs.oasis-open.org/ws-sx/ws-trust/200512"><wsp:AppliesTo xmlns:wsp="http://schemas.xmlsoap.org/ws/2004/09/policy"><a:EndpointReference><a:Address>[ApplyTo]</a:Address></a:EndpointReference></wsp:AppliesTo><trust:KeyType>http://docs.oasis-open.org/ws-sx/ws-trust/200512/Bearer</trust:KeyType><trust:RequestType>http://docs.oasis-open.org/ws-sx/ws-trust/200512/Issue</trust:RequestType><trust:TokenType>urn:oasis:names:tc:SAML:2.0:assertion</trust:TokenType></trust:RequestSecurityToken></s:Body></s:Envelope>'
    };

    this.requestToken = function (options) {

        var message = templates.rst
            .replace("[To]", endpoint)
            .replace("[Username]", options.username)
            .replace("[Password]", options.password)
            .replace("[ApplyTo]", options.scope);


        return $.ajax({
                    dataType: 'XML',
                    crossDomain: true,
                    url: endpoint,
                    type: 'POST',
                    data: message,
                    headers: {
                        'Content-Type': 'application/soap+xml; charset=utf-8',
                        'Content-Length': message.length
                    }
                });
    };

    function handler(evtXHR)
    {
        if (invocation.readyState == 4)
        {
                if (invocation.status == 200)
                {
                    var response = invocation.responseXML;
                }
                else
                {
                    alert("Invocation Errors Occured");
                }
        }
    }

    var parseRstr = function(rstr){
        var startOfAssertion = rstr.indexOf('<Assertion ');
        var endOfAssertion = rstr.indexOf('</Assertion>') + '</Assertion>'.length;
        var token = rstr.substring(startOfAssertion, endOfAssertion);
        
        return token;
    };
}

/**
 * Kido - Kidozen representation of an Application.
 *
 * Use the Kido class to gain access to all the application's backend services.
 */

var Kido = function() {

    var self = this;

    if (!(this instanceof Kido)) return new Kido();

    //leave this for backward compatibility.
    this.name = 'local';

    /**
     * send an http request to kidozen.
     * @param {object} settings - settings as in jQuery.ajax settings.
     * @api private.
     */

    this.send = function ( settings ) {

        settings.url = settings.url
        settings = $.extend({
            url: "",
            type: "POST",
            cache: true
        }, settings);


        if(!settings.contentType && settings.data) settings.contentType = "application/json";

        if(!settings.url) {
            return $.Deferred().reject({ msg: "Not a valid ajax URL.", error: "Invalid URL"});
        }

        return $.ajax(settings);

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

/**
 * access to the configuration backend service.
 *
 * @param kidoApp {object} - instance of the Kido class.
 */

var KidoConfig = function ( kidoApp ) {

    var self = this;

    if (!(this instanceof KidoConfig)) return new KidoConfig(kidoApp);
    if (!kidoApp) throw "The 'kidoApp' argument is required by the KidoConfig class.";
    
    this.app = kidoApp;

    this.set = function ( name, data ) {

        if(!name) throw "The config key 'name' is required to set a value.";

        return self.app.post("/config/" + name, data);
    };

    this.get = function ( name ) {

        if(!name) throw "The config key 'name' is required to retrieve the value.";

        return self.app.get("/config/" + name);
    };

    this.getAll = function () {

        return self.app.get("/config");

    };

    this.del = function (name) {

        if(!name) throw "The config key 'name' is required to delete a value.";

        return self.app.del("/config/" + name);
    };

};


/**
 * add a singleton helper to Kido to retrieve an instance of KidoConfig.
 *
 * @api public
 */

Kido.prototype.config = function() {

    if (!this._config) this._config = new KidoConfig(this);

    return this._config;
};

/**
 * access to the email backend service.
 *
 * @param kidoApp {object} - instance of the Kido class.
 */

var KidoEmail = function ( kidoApp ) {

    var self = this;

    if (!(this instanceof KidoEmail)) return new KidoEmail(kidoApp);
    if (!kidoApp) throw "The 'kidoApp' argument is required by the KidoEmail class.";

    this.app = kidoApp;

    this.send = function (from, to, subject, bodyText, bodyHtml) {

        if (!to) throw "The 'to' argument is required to send an email.";
        if (!from) throw "The 'from' argument is required to send an email.";

        var mail = { to: to, from: from };
        if (typeof(subject)  ==='string' && subject.length>0 ) mail.subject  = subject;
        if (typeof(bodyText) ==='string' && bodyText.length>0) mail.bodyText = bodyText;
        if (typeof(bodyHtml) ==='string' && bodyHtml.length>0) mail.bodyHtml = bodyHtml;

        return self.app.send({
            url: "/email",
            type: "POST",
            data: JSON.stringify(mail)
        });
    };
};

/**
 * add a singleton helper to Kido to retrieve an instance of KidoEmail.
 *
 * @api public
 */

Kido.prototype.email = function() {

    if (!this._email) this._email = new KidoEmail(this);

    return this._email;
};

/**
 * access to the logging backend service.
 *
 * @param kidoApp {object} - instance of the Kido class.
 */

var KidoLogging = function ( kidoApp ) {

    var self = this;

    if (!(this instanceof KidoLogging)) return new KidoLogging(kidoApp);
    if (!kidoApp) throw "The 'kidoApp' argument is required by the KidoLogging class.";
    
    this.app = kidoApp;

    this.writeVerbose = function (data) {
        return this.write(data, 0);
    };

    this.writeInfo = function (data) {
        return this.write(data, 1);
    };

    this.writeWarning = function (data) {
        return this.write(data, 2);
    };

    this.writeError = function (data) {
        return this.write(data, 3);
    };

    this.writeCritical = function (data) {
        return this.write(data, 4);
    };

    this.write = function (data, level) {

        if(!data) throw "'data' argument is requiered.";
        if (!level && level!==0) throw "'level' argument is required.";
        if (!(level>=0 && level<=4)) throw "'level' argument must be an integer number between 0 and 4.";

        return self.app.send({
            url: "/logging?level=" + level,
            type: "POST",
            data: JSON.stringify(data)
        });
    };

    this.query = function (query, options) {
        var params = [];
        if (query) params.push("query=" + JSON.stringify(query));
        if (options) params.push("options=" + JSON.stringify(options));

        return self.app.send({
            url: "/logging" + ((params.length>0) ? ("?" + params.join("&")) : ""),
            type: "GET"
        });
    };

    this.get = function(since, level, skip, limit) {

        var query = {};

        if (level)
            query.level = level;

        if (since) {
            if (!(since instanceof Date)) throw "'Since' argument accepts only null or Date values.";
            query.dateTime = { $gt: since };
        } else {
            query.dateTime = {"$exists":true};
        }

        var options = { $sort: { dateTime: -1 } };
        if (skip) options.$skip = skip;
        if (limit) options.$limit = limit;

        return self.query(query, options);
    };

    this.clear = function () {
        return self.app.send({
            url: "/logging",
            type: "DELETE",
            dataType: 'text'
        });
    };
};


/**
 * singleton access to a KidoLogging instance.
 */

Kido.prototype.logging = function() {

    if (!this._logging) this._logging = new KidoLogging(this);
    return this._logging;
};

/**
 * access to the Notifications backend service.
 *
 * @param kidoApp {object} - instance of the Kido class.
 */

var KidoNotifications = function ( kidoApp ) {

    var self = this;

    if (!(this instanceof KidoNotifications)) return new KidoNotifications(kidoApp);
    if (!kidoApp) throw "The 'kidoApp' argument is required by the KidoNotifications class.";

    this.app = kidoApp;

    this.send = function (channel, title, text, type, badge, image, param) {

        if (!channel) throw "'channel' argument is required.";
        if (!title) throw "'title' argument is required.";

        var notification = { title: title };
        if (typeof(type)==='string' && type) notification.type = type;
        if (typeof(text)==='string' && text) notification.text = text;
        if (typeof(image)==='string' && image) notification.image = image;
        if (typeof(badge)==='number') notification.badge = badge;
        if (param) notification.param = param;

        return parentKido.send({
            url: "/notifications/push/" + parentKido.applicationName + "/" + channel,
            type: "POST",
            data: JSON.stringify(notification)
        });
    };
};

Kido.prototype.notifications = function() {

    if (!this._notifications) this._notifications = new KidoNotifications(this);
    return this._notifications;
};

/**
 * access to the Pubsub backend service.
 *
 * @param kidoApp {object} - instance of the Kido class.
 */

var KidoPubsub = function ( kidoApp ) {

    var self = this;

    if (!(this instanceof KidoPubsub)) return new KidoPubsub(kidoApp);
    if (!kidoApp) throw "The 'kidoApp' argument is required by the KidoPubsub class.";

    this.app = kidoApp;

    this.channel = function ( name ) {

        return new KidoPubsubChannel(name, self.app);
    };
};

var KidoPubsubChannel = function ( name, app ) {

    var self = this;

    this.name = name;
    this.app = app;

    this.publish = function ( data ) {
        return self.app.send({
            url: "/pubsub/" + self.app.name + "/" + self.name,
            type: "POST",
            data: JSON.stringify(data),
            dataType: 'text'
        });
    };

    this.subscribe = function ( cb ) {

        var socket = io.connect('/pubsub');

        socket.on('connect', function () {
            socket.emit('bindToChannel', { application: self.app.name, channel: self.name });
        });

        socket.on('bindAccepted', function(m){
            socket.on(m.responseChannelName, cb);
        });

        return function(){
            socket.disconnect();
        };
    };
};

Kido.prototype.pubsub = function () {

    if (!this._pubsub) this._pubsub = new KidoPubsub(this);
    return this._pubsub;
};

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

/**
 * access to the Security backend service.
 *
 * @param kidoApp {object} - instance of the Kido class.
 */

var KidoSecurity = function ( kidoApp ) {

    var self = this;

    if (!(this instanceof KidoSecurity)) return new KidoSecurity(kidoApp);
    if (!kidoApp) throw "The 'kidoApp' argument is required by the KidoSecurity class.";

    this.app = kidoApp;

    this.getLoggedInUser = function () {
        return self.app.get("/user");
    };

    this.getOriginalToken = function () {
        return self.app.get("/user/original-token");
    };
};

Kido.prototype.security = function() {

    if (!this._security) this._security = new KidoSecurity(this);
    return this._security;
};

/**
 * access to the Sms backend service.
 *
 * @param kidoApp {object} - instance of the Kido class.
 */

var KidoSms = function ( kidoApp ) {

    var self = this;

    if (!(this instanceof KidoSms)) return new KidoSms(kidoApp);
    if (!kidoApp) throw "The 'kidoApp' argument is required by the KidoSms class.";

    this.app = kidoApp;

    this.send = function ( to, message ) {
        return self.app.post({
            url: "/sms?to=" + encodeURIComponent(to) + "&message=" + encodeURIComponent(message),
            headers : { "Content-Length": 0 }
        });
    };

    this.getStatus = function ( messageId ) {
        return self.app.get("/sms/" + messageId);
    };
};

Kido.prototype.sms = function() {

    if (!this._sms) this._sms = new KidoSms(this);
    return this._sms;
};

/**
 * access to the object storage backend service.
 *
 * You can use this through the storage() helper in Kido ie:
 * ie: var tasks = new Kido().storage().objectSet("tasks");
 */

var KidoStorage = function ( kidoApp ) {

    var self = this;

    if (!(this instanceof KidoStorage)) return new KidoStorage(kidoApp);

    this.app = kidoApp;
    this.rootUrl = "/storage/" + this.app.name;

    this.getObjectSetNames = function () {
        return self.app.get(self.rootUrl);
    };

    this.objectSet = function ( name ) {
        return new KidoObjectSet(name, this);
    };
};

var KidoObjectSet = function ( name, parentStorage ) {

    var self = this;

    //validations

    if (!(this instanceof KidoObjectSet)) return new KidoObjectSet(name, parentStorage);
    if (!parentStorage) throw "KidoObjectSet needs a parent KidoStorage object.";

    //propeties

    this.storage =  parentStorage;
    this.name = name || 'default';
    this.rootUrl = this.storage.rootUrl + "/" + this.name;


    /** methods **/

    /**
     * @api private
     */

    this.invoke = function ( data ) {

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

        return self.storage.app.send(data.settings);
    };


    /**
     * inserts an object in the KidoZen Object Storage backend service.
     *
     * @param obj {object}        - the object to store.
     * @param isPrivate {boolean} - whether the object is private for that
     *                              user.
     * @api public
     */

    this.insert = function ( obj, isPrivate ) {

        if(!obj) throw "The object set 'obj' argument is requiered in order to insert.";

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

        return self.invoke(data).pipe(function ( result ) {
            return $.extend(obj, result);
        });
    };

    
    /**
     * Updates an existing object, the object instance
     * must contains the object's key
     */

    this.update = function ( obj, isPrivate ) {

        if(!obj) throw "obj argument is requiered.";

        obj = $.extend({}, obj);

        var data = {
            settings: {
                type: "PUT",
                data: JSON.stringify(obj)
            },
            isPrivate: isPrivate
        };

        return self
                .invoke(data)
                .pipe(function ( result ) {
                    return $.extend(obj, result);
                }, function ( err ) {

                    //if there is an error with the sync field for concurrency
                    //check, add the details to the error object.
                    if (err.status === 409) {
                        try
                        {
                            err.body = JSON.parse(err.responseText);
                        }
                        catch(e)
                        {
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
     * function will try to insert it
     *
     * @api public
     */

    this.save = function ( obj, isPrivate ){

        if(!obj) throw "obj argument is requiered.";

        obj = $.extend({}, obj);

        if(obj._id && obj._id.length > 0) {
            return self.update(obj, isPrivate);
        }
        else {
            return self.insert(obj, isPrivate);
        }
    };


    /**
     * Retrieves an object by its key
     */

    this.get = function ( objectId ) {

        if(!objectId) throw "objectId is required";

        var result = $.Deferred();

        self
            .invoke ({
                settings: { type: "GET" },
                objectId: objectId,
                cache: false
            })
            .fail(function ( err ) {
                if (err.status === 404) {
                    result.resolve(null);
                } else {
                    result.reject(err);
                }
            })
            .done(function ( obj ) { result.resolve(obj); });

        return result;
    };


    /**
     * Executes the query
     */

    this.query = function ( query, fields, options, cache ) {

        return self.invoke ({
            settings: { type: "GET" },
            query: query,
            fields: fields,
            options: options,
            cache: cache
        });
    };


    /**
     * Delete an object from the set by its key
     */

    this.del = function ( objectId ) {
        return self.invoke ({
            settings: { type: "DELETE", dataType: 'text' },
            objectId: objectId
        });
    };


    /**
     * drops the entire object set.
     */

    this.drop = function () {
        return self.invoke ({
            settings: { type: "DELETE", dataType: 'text' }
        });
    };
};


Kido.prototype.storage = function () {

    if (!this._storage) this._storage = new KidoStorage(this);

    return this._storage;
};


/**
 * access to the storage backend service, to manage object set indexes.
 *
 * @param objectSet {object} - instance of the KidoObjectSet class.
 */

var KidoStorageIndexes = function ( objectSet ) {

    var self = this;

    if (!(this instanceof KidoStorageIndexes)) return new KidoStorageIndexes(objectSet);
    if (!objectSet) throw "The 'objectSet' argument is required by the KidoStorageIndexes class.";

    this.objectSet = objectSet;

    this.all = function () {

        var data = {
            indexes: "indexes",
            settings: {
                type: "GET"
        }};

        return self.objectSet.invoke(data);
    };

    this.get = function (name) {

        if(!name) throw "The 'name' argument is required to retrieve an object set index.";

        var data = {
            indexes: "indexes?name=" + name,
            settings: {
                type: "GET"
        }};

        return self.objectSet.invoke(data);
    };

    this.del = function (name) {
        if(!name) throw "The 'name' argument is required to delete an object set index.";

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

        if(!spec) throw "The 'spec' argument is required to create an index.";
        if(!safe) safe = false;
        if(!unique) unique = false;
        if(!sparse) sparse = false;
        if(!background) background = false;
        if(!dropDups) dropDups = false;

        var index = {
            spec: spec,
            options: { safe: safe, unique: unique, sparse: sparse, background: background, dropDups: dropDups }
        };

        if(min && min.toString() != "0") index.options.min = min;
        if(max && max.toString() != "0") index.options.max = max;

        var data = {
            indexes: "indexes",
            settings: {
                type: "POST",
                data: JSON.stringify(index)
        }};

        return self.objectSet.invoke(data);
    };
};

KidoObjectSet.prototype.indexes = function() {

    if (!this._indexes) this._indexes = new KidoStorageIndexes(this);

    return this._indexes;
};

/**
 * access to the Enterprise Services backend service.
 *
 * @param kidoApp {object} - instance of the Kido class.
 */

var KidoService = function ( kidoApp, name ) {

    var self = this;

    if (!(this instanceof KidoService)) return new KidoService(kidoApp);
    if (!kidoApp) throw "The 'kidoApp' argument is required by the KidoService class.";

    /** variables **/

    this.app = kidoApp;
    this.name = name;
    this._defaults = {};


    /** methods **/

    this.defaults = function ( opts ) {

        self._defaults = $.extend(self._defaults, opts || {});
        return self;
    };


    this.invoke = function ( name, opts ) {

        var args = $.extend(self._defaults, opts);
        return self.app.post("/api/services/" + self.name + "/invoke/" + name, args);
    };
};

Kido.prototype.services = function ( name ) {
    return new KidoService(this, name);
};