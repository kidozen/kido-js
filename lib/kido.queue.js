Kido.prototype.queues = function(queueInstance) {
    var parentKido = this;
    queueInstance = queueInstance || "local";
    return {
        queue: function(queueName){
            return {
                push: function(obj){
                    return parentKido.send({
                        url: "/queue/" + queueInstance + "/" + queueName,
                        type: "POST",
                        data: JSON.stringify(obj),
                        dataType: 'text'
                    });
                },
                dequeue: function(){
                    return parentKido.send({
                        url: "/queue/" + queueInstance + "/" + queueName + "/next",
                        type: "DELETE"
                    });
                }
            };
        }
    };
};