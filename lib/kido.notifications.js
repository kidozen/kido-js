Kido.prototype.notifications = function() {

    var parentKido = this;

    return {
        // channel: A string specifying channel's name
        // type: Optional. Only applies to Windows Phone devices.
        //      Valid string values are 'toast', 'tile' or 'raw'.
        //      Default value is 'toast'.
        // title: Main notification's text
        // text: Optional. Secondary notification's text
        // badge: Optional. Integer
        // image: Optional. String
        // param: Optional. Any kind of data with aditional information

        send: function (channel, title, text, type, badge, image, param) {
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
        }
    };
};