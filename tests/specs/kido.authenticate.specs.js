describe("kido authentication", function () {
	
	beforeEach(function () {
		this.server = sinon.fakeServer.create();
	});
	afterEach(function () {
		this.server.restore();
	});
	
	it("should get the application's security configuration", function () {
		var kido = new Kido('tasks', 'armonia.kidocloud.com');
		expect(this.server.requests.length).to.be.equal(1);
		expect(this.server.requests[0].method).to.be.equal('GET');
		expect(this.server.requests[0].url).to.be.equal('armonia.kidocloud.com/publicapi/apps?name=tasks');
	});

	it("should fail when application's security configuration is not found", function (done) {
		//fake app not found
		this.server.respondWith([200, { "Content-Type": "application/json" }, '[]']);
		var kido = new Kido('tasks', 'armonia.kidocloud.com');
		this.server.respond();
		kido
			.authenticate('user1', 'pass1', 'Kidozen')
			.done(function() {
				done("should have failed.");
			})
			.fail(function (err) {
				expect(err).to.include.string('Application configuration not found');
				done();
			});
	});

	it("should authenticate against wrap IDP", function () {
		this.server.respondWith([200, { "Content-Type": "application/json" }, JSON.stringify([{
			url: "https://tasks.armonia.kidocloud.com",
			authConfig: {
				applicationScope: "http://tasks.armonia.kidocloud.com/",
				authServiceScope: "https://kido-armonia.accesscontrol.windows.net/",
				authServiceEndpoint: "https://armonia.kidocloud.com/auth/v1/WRAPv0.9",
				identityProviders: {
					Kidozen: {
						protocol: "wrapv0.9",
						endpoint: "https://identity.dev.kidozen.com/WRAPv0.9"
					}
				}
			}
		}])]);
		var kido = new Kido('tasks', 'armonia.kidocloud.com');
		this.server.respond();
		this.server.requests = [];
		kido.authenticate('user1', 'pass1', 'Kidozen');
		expect(this.server.requests.length).to.be.equal(1);
		expect(this.server.requests[0].method).to.be.equal('POST');
		expect(this.server.requests[0].url).to.be.equal('https://identity.dev.kidozen.com/WRAPv0.9');
		//make sure we are using wrap
		var body = decodeURIComponent(this.server.requests[0].requestBody).split("&");
		expect(body).to.include.string("wrap_name=user1");
		expect(body).to.include.string("wrap_password=pass1");
		expect(body).to.include.string("wrap_scope=https://kido-armonia.accesscontrol.windows.net/");
	});
});
