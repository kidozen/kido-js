describe("kido queues", function () {

	this.timeout(10000);
	
	it("should dequeue a pushed item", function ( done ) {

		var queue = new Kido().queues().queue('foo');

		//push an object first.
		queue
			.push({greeting: "hello"})
			.fail(done)
			.done(function () {

				queue
					.dequeue()
					.fail(done)
					.done(function (msg) {

						expect(msg).to.be.ok();
						expect(msg.greeting).to.be.equal("hello");
						done();
					});
			});
	});
});