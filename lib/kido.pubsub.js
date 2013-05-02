Kido.prototype.pubsub = function(application) {
    var parentKido = this;
    application = application || "local";
    return {
        channel: function(channelName){
            return { 
                publish: function(obj){
                    return parentKido.send({
                        url: "/pubsub/" + application + "/" + channelName,
                        type: "POST",
                        data: JSON.stringify(obj),
                        dataType: 'text'
                    });
                },
                subscribe: function(cb){
                    var socket = io.connect('/pubsub');
                    
                    socket.on('connect', function () {
                        socket.emit('bindToChannel', { application: application, channel: channelName});
                    });

                    socket.on('bindAccepted', function(m){
                        socket.on(m.responseChannelName, cb);
                    });

                    return function(){
                        socket.disconnect();
                    };
                }
            };
        }
    };
};