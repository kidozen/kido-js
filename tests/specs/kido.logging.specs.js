describe("kido logging", function () {

	this.timeout(10000);

	it("should insert a log event", function ( done ) {

		var logging = new Kido().logging();

		logging
			.writeInfo("something great happened.")
			.fail(done)
			.done(function () {
				done();
			});
	});

	it("should get all the logs", function ( done ) {

		var logging = new Kido().logging();

		logging
			.get()
			.fail(done)
			.done(function ( evts ) {

				expect(evts).to.be.an('array');
				expect(evts.length).to.be.greaterThan(-1);
				done();
			});
	});

	it("should clear log and log that it's been cleared", function ( done ) {

		this.timeout(20 * 1000);
		
		var logging = new Kido().logging();

		$.when(logging.writeInfo('first'), logging.writeInfo('second'))
			.fail(done)
			.done(function () {

				logging
					.clear()
					.fail(done)
					.done(function () {

						logging
							.get()
							.fail(done)
							.done(function (evts) {

								expect(evts.length).to.be.equal(1);
								done();
							});
					});
			});
	});
});