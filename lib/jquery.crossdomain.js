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