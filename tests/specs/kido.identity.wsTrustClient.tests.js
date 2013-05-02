$(document).ready(function() {
	// body...
module('WS-Trust Client');

test("Have CORS Support", function () {

	ok(XMLHttpRequest != undefined, 'XMLHttpRequest is not there.');

	var request = new XMLHttpRequest();
    
    ok(((request.withCredentials != undefined) || (XDomainRequest != undefined)), 'Browser doesn\'t support CORS');

})

test("Should request a Token using WS-Trust", function() {
	var client = new wsTrustClient('https://armoniabank.com/adfs/services/trust/13/UsernameMixed');
	
	stop();
  
  	client.requestToken({
  		username: 'Leandro Boffi',
		password: 'arm0nia',
		scope: 'https://jazz-auth.accesscontrol.windows.net/'
	})
  	.done(function (data, textStatus, jqXHR) {
		ok(true);
		start();
		//alert(JSON.stringify(data));
	})
	.fail(function (jqXHR, textStatus, errorThrown) {
		
		ok(false, JSON.stringify(jqXHR));
		//alert(JSON.stringify(textStatus));

		start();
	});
});

});