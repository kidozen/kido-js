$(document).ready(function() {

module('jQuery Cross-Domain Plugin');

test("Have CORS Support", function () {

	ok(XMLHttpRequest != undefined, 'XMLHttpRequest is not there.');

	var request = new XMLHttpRequest();
    
    ok(((request.withCredentials != undefined) || (XDomainRequest != undefined)), 'Browser doesn\'t support CORS');

})

test("Should perform a cross-domain GET", function() {
	
	stop();

	$.crossDomain({
		type: 'GET',
		url: 'http://ucommbieber.unl.edu/CORS/cors.php'
	})
	.done(function (result) {
		
		ok(result != undefined, 'result is undefined');
		start();
	})
})


test("Should perform a cross-domain POST", function() {
	
	stop();

	$.crossDomain({
		type: 'POST',
		url: 'http://ucommbieber.unl.edu/CORS/cors.php',
		headers: {
			'Content-Type' : 'application/json',
		},
		data: { name: 'Lean' }
	})
	.done(function (result) {
		
		ok(result != undefined, 'result is undefined');
		start();
	});
})

});