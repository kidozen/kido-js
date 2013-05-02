;
Kido.prototype.security = function() {

    var parentKido = this;

    return {
        kido: parentKido,

        getLoggedInUser : function(){
            return parentKido.send({
			            url: "/user" ,
                        type: "GET",
                        dataType: "json"
		    });
        },
        getOriginalToken : function(){
            return parentKido.send({
			            url: "/user/original-token" ,
                        type: "GET",
                        dataType: "json"
		    });
        }           

    };
};