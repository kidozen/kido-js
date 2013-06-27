//leaving pubsub out of build server.
describe.skip("kido pubsub", function () {

	this.timeout(120000);

	
	it("should publish a message on a subscribed channel", function ( done ) {

		var pubsub = new Kido().pubsub(),
			chat   = pubsub.channel('chat');

		var disposeChannel = chat.subscribe(function(message){

				//assert
				expect(message.greeting).to.be.equal('hello');
				//clean up
				disposeChannel();
				done();			
			});

		//give enough time for subscribing the channel.
		setTimeout(function () {
			chat
				.publish({greeting: "hello"})
				.fail(function (jqXHR, textStatus, errorThrown){
		            done(new Error("Failed with status:"+jqXHR.status+", responseText:"+jqXHR.responseText+", textStatus:"+textStatus+", errorThrown:"+errorThrown));
				})
				.done(function () { console.log('sent')});

		}, 20000);
	});
	

	it("should unsubscribe and stop receiving messages", function ( done ) {

		var pubsub = new Kido().pubsub(),
			chat   = pubsub.channel('chat2'), //avoid conflict with previous test.
			recvd  = false;

		var disposeChannel = chat
			.subscribe(function(message){

				console.log('recvd');
				//make sure we don't receive two messages.
				if (recvd) {
					done(new Error('received twice'));
					return;
				}

				//first time, flag as received.
				recvd = true;

				//unsubscribe
				disposeChannel();

				//give some time to unsubscribe.
				setTimeout(function () {

					chat
						.publish({greeting:"hello again"})
						.fail(function (jqXHR, textStatus, errorThrown){
				            done(new Error("Failed with status:"+jqXHR.status+", responseText:"+jqXHR.responseText+", textStatus:"+textStatus+", errorThrown:"+errorThrown));
						})
						.done(function () {

							console.log('sent again');
							//give it some time to fail then pass the test.
							setTimeout(done, 8000);
						});
				}, 4000);	
			});

		//give enough time for subscribing the channel.
		setTimeout(function () {
			chat
				.publish({greeting: "hello"})
				.fail(function (jqXHR, textStatus, errorThrown){
		            done(new Error("Failed with status:"+jqXHR.status+", responseText:"+jqXHR.responseText+", textStatus:"+textStatus+", errorThrown:"+errorThrown));
				})
				.done(function () { console.log('sent')});

		}, 20000);

	});
});