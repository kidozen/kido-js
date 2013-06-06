describe("kido services", function () {

	it("should invoke a method", function ( done ) {

		new Kido()
			.services("echo")
			.invoke("send", { foo: "bar" })
			.done(function ( data ) {
				expect(data.foo).to.be.equal("bar");
				done();
			})
			.fail(done);
	});

	it("should invoke using defaults", function ( done ) {

		new Kido()
			.services("echo")
			.defaults({ kido: "zen" })
			.invoke("send", { foo: "bar" })
			.done(function ( data ) {
				expect(data.foo).to.be.equal("bar");
				expect(data.kido).to.be.equal("zen");
				done();
			})
			.fail(done);
	});
});