
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