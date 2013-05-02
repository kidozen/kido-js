Kido.prototype.updater = function(cb) {
    var parentKido = this;
    this.pubsub().channel("auto-updater", function(msg){
        if(cb(msg)){
            location.reload(true);
        }
    });
};