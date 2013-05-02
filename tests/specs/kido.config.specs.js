describe("kido config", function () {

	this.timeout(10000);

	it("should get all config values", function ( done ) {

		var config = new Kido().config();

		config
			.set("foo", {name:"foo"})
			.fail(done)
			.done(function () {

				config
					.getAll()
					.fail(done)
					.done(function (names) {

						//assert
						expect(names).to.be.an("array");
						expect(names.length).to.be.greaterThan(0);
						done();
					});
			});
	});

	it("set a string value", function( done ) {

		var config = new Kido().config();

		config
			.set("foo", "bar")
			.fail(done)
			.done(function () {

				config
					.get("foo")
					.fail(done)
					.done(function ( foo ) {

						expect(foo).to.be.ok();
						expect(foo).to.be.equal("bar");
						done();
					});
			});
	});

	it("should set a json object value", function ( done ) {

		var config = new Kido().config();

		config
			.set("foo", { a: 2 })
			.fail(done)
			.done(function () {

				config
					.get("foo")
					.fail(done)
					.done(function ( foo ) {

						expect(foo).to.be.ok();
						expect(foo.a).to.be.equal(2);
						done();
					});
			});
	});

	it("should delete a value", function ( done ) {

		var config = new Kido().config();

		//create a temp value foo.
		config
			.set("foo", "bar")
			.fail(done)
			.done(function () {

				//delete foo
				config
					.del("foo")
					.fail(done)
					.done(function () {

						//make sure it doesn"t exist anymore
						config
							.get("foo")
							.fail(done)
							.done(function ( foo ) {

								expect(foo).to.be.equal(null);
								done();
							});
					});
			});
	});
});
