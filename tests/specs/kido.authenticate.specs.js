describe("kido authentication", function () {

    this.timeout(10000);
    
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
        expect(this.server.requests[0].url).to.be.equal('https://armonia.kidocloud.com/publicapi/apps?name=tasks');
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

    var wrapConfig = {
        url: "https://tasks.armonia.kidocloud.com/",
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
    };
    it("should authenticate against wrap IDP", function () {
        this.server.respondWith([200, { "Content-Type": "application/json" }, JSON.stringify([wrapConfig])]);
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

    var idpToken = "<t:RequestSecurityTokenResponse xmlns:t=\"http://schemas.xmlsoap.org/ws/2005/02/trust\"><t:Lifetime><wsu:Created xmlns:wsu=\"http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-utility-1.0.xsd\">2013-11-26T17:01:06.028Z</wsu:Created><wsu:Expires xmlns:wsu=\"http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-utility-1.0.xsd\">2013-11-26T18:01:06.028Z</wsu:Expires></t:Lifetime><wsp:AppliesTo xmlns:wsp=\"http://schemas.xmlsoap.org/ws/2004/09/policy\"><EndpointReference xmlns=\"http://www.w3.org/2005/08/addressing\"><Address>https://kido-armonia.accesscontrol.windows.net/</Address></EndpointReference></wsp:AppliesTo><t:RequestedSecurityToken><Assertion ID=\"_94ace9ff-87de-45d9-a7f7-84196ae11d4a\" IssueInstant=\"2013-11-26T17:01:06.152Z\" Version=\"2.0\" xmlns=\"urn:oasis:names:tc:SAML:2.0:assertion\"><Issuer>https://identity.kidozen.com/</Issuer><ds:Signature xmlns:ds=\"http://www.w3.org/2000/09/xmldsig#\"><ds:SignedInfo><ds:CanonicalizationMethod Algorithm=\"http://www.w3.org/2001/10/xml-exc-c14n#\" /><ds:SignatureMethod Algorithm=\"http://www.w3.org/2001/04/xmldsig-more#rsa-sha256\" /><ds:Reference URI=\"#_94ace9ff-87de-45d9-a7f7-84196ae11d4a\"><ds:Transforms><ds:Transform Algorithm=\"http://www.w3.org/2000/09/xmldsig#enveloped-signature\" /><ds:Transform Algorithm=\"http://www.w3.org/2001/10/xml-exc-c14n#\" /></ds:Transforms><ds:DigestMethod Algorithm=\"http://www.w3.org/2001/04/xmlenc#sha256\" /><ds:DigestValue>nrED9IloYkq+7dyPBEaZSnpbABTSWyQTMN6ACvGERCY=</ds:DigestValue></ds:Reference></ds:SignedInfo><ds:SignatureValue>ZIGSybyAM1fvOPWNgHxXtRroe8lBAo8MyySrrbYJbtoKOTfkf72+8RODwOQc5ZzhsYmKwCunV6ClKhy8FA74tQ+Z6yXZMatwxnTqyTKWvCsER3ur8iiESB7itH1JiBB81pzfoA2MLJdLOaQDoaylk7fyoSuwrUrLHfGho7JNWtI=</ds:SignatureValue><KeyInfo xmlns=\"http://www.w3.org/2000/09/xmldsig#\"><X509Data><X509Certificate>MIICDzCCAXygAwIBAgIQVWXAvbbQyI5BcFe0ssmeKTAJBgUrDgMCHQUAMB8xHTAbBgNVBAMTFGlkZW50aXR5LmtpZG96ZW4uY29tMB4XDTEyMDcwNTE4NTEzNFoXDTM5MTIzMTIzNTk1OVowHzEdMBsGA1UEAxMUaWRlbnRpdHkua2lkb3plbi5jb20wgZ8wDQYJKoZIhvcNAQEBBQADgY0AMIGJAoGBAJ1GPvzmIZ5OO5by9Qn2fsSuLIJWHfewRzgxcZ6SykzmjD4H1aGOtjUg5EFgQ/HWxa16oJ+afWa0dyeXAiLl5gas71FzgzeODL1STIuyLXFVLQvIJX/HTQU+qcMBlwsscdvVaJSYQsI3OC8Ny5GZvt1Jj2G9TzMTg2hLk5OfO1zxAgMBAAGjVDBSMFAGA1UdAQRJMEeAEDSvlNc0zNIzPd7NykB3GAWhITAfMR0wGwYDVQQDExRpZGVudGl0eS5raWRvemVuLmNvbYIQVWXAvbbQyI5BcFe0ssmeKTAJBgUrDgMCHQUAA4GBAIMmDNzL+Kl5omgxKRTgNWMSZAaMLgAo2GVnZyQ26mc3v+sNHRUJYJzdYOpU6l/P2d9YnijDz7VKfOQzsPu5lHK5s0NiKPaSb07wJBWCNe3iwuUNZg2xg/szhiNSWdq93vKJG1mmeiJSuMlMafJVqxC6K5atypwNNBKbpJEj4w5+</X509Certificate></X509Data></KeyInfo></ds:Signature><Subject><SubjectConfirmation Method=\"urn:oasis:names:tc:SAML:2.0:cm:bearer\" /></Subject><Conditions NotBefore=\"2013-11-26T17:01:06.028Z\" NotOnOrAfter=\"2013-11-26T18:01:06.028Z\"><AudienceRestriction><Audience>https://kido-armonia.accesscontrol.windows.net/</Audience></AudienceRestriction></Conditions><AttributeStatement><Attribute Name=\"http://schemas.kidozen.com/domain\"><AttributeValue>kidozen.com</AttributeValue></Attribute><Attribute Name=\"http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name\"><AttributeValue>Armonia Admin</AttributeValue></Attribute><Attribute Name=\"http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress\"><AttributeValue>armonia@kidozen.com</AttributeValue></Attribute></AttributeStatement></Assertion></t:RequestedSecurityToken><t:RequestedAttachedReference><SecurityTokenReference d3p1:TokenType=\"http://docs.oasis-open.org/wss/oasis-wss-saml-token-profile-1.1#SAMLV2.0\" xmlns:d3p1=\"http://docs.oasis-open.org/wss/oasis-wss-wssecurity-secext-1.1.xsd\" xmlns=\"http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-secext-1.0.xsd\"><KeyIdentifier ValueType=\"http://docs.oasis-open.org/wss/oasis-wss-saml-token-profile-1.1#SAMLID\">_94ace9ff-87de-45d9-a7f7-84196ae11d4a</KeyIdentifier></SecurityTokenReference></t:RequestedAttachedReference><t:RequestedUnattachedReference><SecurityTokenReference d3p1:TokenType=\"http://docs.oasis-open.org/wss/oasis-wss-saml-token-profile-1.1#SAMLV2.0\" xmlns:d3p1=\"http://docs.oasis-open.org/wss/oasis-wss-wssecurity-secext-1.1.xsd\" xmlns=\"http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-secext-1.0.xsd\"><KeyIdentifier ValueType=\"http://docs.oasis-open.org/wss/oasis-wss-saml-token-profile-1.1#SAMLID\">_94ace9ff-87de-45d9-c9f7-84176ae11d4a</KeyIdentifier></SecurityTokenReference></t:RequestedUnattachedReference><t:TokenType>urn:oasis:names:tc:SAML:2.0:assertion</t:TokenType><t:RequestType>http://schemas.xmlsoap.org/ws/2005/02/trust/Issue</t:RequestType><t:KeyType>http://schemas.xmlsoap.org/ws/2005/05/identity/NoProofKey</t:KeyType></t:RequestSecurityTokenResponse>";
    it("should request a KidoZen token with the IDP assertion", function () {
        // get application configuration
        this.server.respondWith([200, { "Content-Type": "application/json" }, JSON.stringify([wrapConfig])]);
        var kido = new Kido('tasks', 'armonia.kidocloud.com');
        this.server.respond();
        kido.authenticate('user1', 'pass1', 'Kidozen');
        // get the token from the IDP
        this.server.respondWith([200, { "Content-Type": "text/xml" }, idpToken]);
        this.server.respond();
        // the last request should be the one to exchange the idp token
        // for a kidozen token.
        expect(this.server.requests.length).to.be.equal(3);
        expect(this.server.requests[2].method).to.be.equal('POST');
        expect(this.server.requests[2].url).to.be.equal("https://armonia.kidocloud.com/auth/v1/WRAPv0.9");
        var body = decodeURIComponent(this.server.requests[2].requestBody).split("&");
        expect(body).to.include.string("wrap_scope=http://tasks.armonia.kidocloud.com/");
        expect(body).to.include.string("wrap_assertion_format=SAML");
        // make sure the assertion is being included
        var assertion = body.filter(function (i) {
            return i.indexOf('wrap_assertion=') === 0;
        });
        expect(assertion.length).to.be.equal(1);
        expect(assertion[0].length).to.be.greaterThan('wrap_assertion='.length);
    });

    it("should fail when KidoZen token is invalid", function (done) {
        // this may happen if you pass the wrong parameters to the KidoZen
        // authentication endpoint.
        // get application configuration
        this.server.respondWith([200, { "Content-Type": "application/json" }, JSON.stringify([wrapConfig])]);
        var kido = new Kido('tasks', 'armonia.kidocloud.com');
        this.server.respond();
        kido.authenticate('user1', 'pass1', 'Kidozen').fail(function (err) {
            expect(err).to.be.equal("Unable to retrieve KidoZen token.");
            done();
        });
        // get the token from the IDP
        this.server.respondWith([200, { "Content-Type": "text/xml" }, idpToken]);
        this.server.respond();
        // the last request should be the one to exchange the idp token
        // for a kidozen token.
        this.server.respondWith([400, { "Content-Type": "text/plain"}, "unable to create token"]);
        this.server.respond();
    });
    
    var tomorrow = ~~(new Date().getTime() / 1000) + 86400;
    var kidozenToken = {
        "access_token": "http%3a%2f%2fschemas.kidozen.com%2fdomain=kidozen.com&http%3a%2f%2fschemas.kidozen.com%2fusersource=Admins+(Kidozen)&http%3a%2f%2fschemas.xmlsoap.org%2fws%2f2005%2f05%2fidentity%2fclaims%2femailaddress=armonia%40kidozen.com&http%3a%2f%2fschemas.xmlsoap.org%2fws%2f2005%2f05%2fidentity%2fclaims%2fname=Armonia+Admin&http%3a%2f%2fschemas.kidozen.com%2frole=Application+Admin&http%3a%2f%2fschemas.kidozen.com%2faction=allow+all+*&http%3a%2f%2fschemas.microsoft.com%2faccesscontrolservice%2f2010%2f07%2fclaims%2fidentityprovider=https%3a%2f%2fidentity.kidozen.com%2f&Audience=http%3a%2f%2ftasks.armonia.kidocloud.com%2f&"+
                    "ExpiresOn="+tomorrow+"&"+
                    "Issuer=https%3a%2f%2fkido-armonia.accesscontrol.windows.net%2f&HMACSHA256=mDEGilqWwMLoTgV27YrjbwERYp81jPE17m%2bHfsvPsSM%3d",
        "expirationTime": "2013-11-26T19:37:23.856Z"
    };
    it("should send the KidoZen token in service calls", function () {
        // get application configuration
        this.server.respondWith([200, { "Content-Type": "application/json" }, JSON.stringify([wrapConfig])]);
        var kido = new Kido('tasks', 'armonia.kidocloud.com');
        this.server.respond();
        kido.authenticate('user1', 'pass1', 'Kidozen');
        // get the token from the IDP
        this.server.respondWith(/identity/,[200, { "Content-Type": "text/xml" }, idpToken]);
        this.server.respondWith(/armonia/, [200, { "Content-Type": "application/json"}, JSON.stringify(kidozenToken)]);
        this.server.respond();
        // attempt to get something from storage service
        kido.storage().objectSet("tasks").query({});
        expect(this.server.requests.length).to.be.equal(4);
        expect(this.server.requests[3].method).to.be.equal('GET');
        expect(this.server.requests[3].url).to.be.equal('https://tasks.armonia.kidocloud.com/storage/local/tasks?query=%7B%7D');
        expect(this.server.requests[3].requestHeaders.authorization).to.be.equal('WRAP access_token="'+kidozenToken.access_token+'"');
    });

    it("should refresh the token when it expires", function () {
        var now = ~~(new Date().getTime() / 1000);
        var expiredToken = {
            "access_token": "http%3a%2f%2fschemas.kidozen.com%2fdomain=kidozen.com&http%3a%2f%2fschemas.kidozen.com%2fusersource=Admins+(Kidozen)&http%3a%2f%2fschemas.xmlsoap.org%2fws%2f2005%2f05%2fidentity%2fclaims%2femailaddress=armonia%40kidozen.com&http%3a%2f%2fschemas.xmlsoap.org%2fws%2f2005%2f05%2fidentity%2fclaims%2fname=Armonia+Admin&http%3a%2f%2fschemas.kidozen.com%2frole=Application+Admin&http%3a%2f%2fschemas.kidozen.com%2faction=allow+all+*&http%3a%2f%2fschemas.microsoft.com%2faccesscontrolservice%2f2010%2f07%2fclaims%2fidentityprovider=https%3a%2f%2fidentity.kidozen.com%2f&Audience=http%3a%2f%2ftasks.armonia.kidocloud.com%2f&"+
                        "ExpiresOn=" + now + "&"+
                        "Issuer=https%3a%2f%2fkido-armonia.accesscontrol.windows.net%2f&HMACSHA256=mDEGilqWwMLoTgV27YrjbwERYp81jPE17m%2bHfsvPsSM%3d"
        };
        // get application configuration
        this.server.respondWith(/publicapi/, [200, { "Content-Type": "application/json" }, JSON.stringify([wrapConfig])]);
        var kido = new Kido('tasks', 'armonia.kidocloud.com');
        this.server.respond();
        kido.authenticate('user1', 'pass1', 'Kidozen');
        // get the token from the IDP
        this.server.respondWith(/identity/,[200, { "Content-Type": "text/xml" }, idpToken]);
        this.server.respondWith(/armonia/, [200, { "Content-Type": "application/json"}, JSON.stringify(expiredToken)]);
        this.server.respond();
        // attempt to get something from storage service
        // since the kidozen token is expired, it should attempt to
        // start the authentication flow again.
        kido.storage().objectSet("tasks").query({});
        expect(this.server.requests.length).to.be.equal(4);
        expect(this.server.requests[3].method).to.be.equal('POST');
        expect(this.server.requests[3].url).to.be.equal('https://identity.dev.kidozen.com/WRAPv0.9');
        // once the token is retrieved from IDP, a KidoZen token
        // is refreshed (request number 5). Once we have a new token
        // we should query storge (request number 6).
        this.server.respond();
        expect(this.server.requests.length).to.be.equal(6);
        expect(this.server.requests[5].method).to.be.equal('GET');
        expect(this.server.requests[5].url).to.be.equal('https://tasks.armonia.kidocloud.com/storage/local/tasks?query=%7B%7D');
        expect(this.server.requests[5].requestHeaders.authorization).to.be.ok();
    });

    // TODO: fix the following two tests
    it("should throw exception if invalid marketplace url", function (done) {
        var kido = new Kido("tasks", "completely-wrong-url://.com");
        expect(kido).to.not.be.an('object');
    });

    it("should return error if invalid marketplace", function (done) {
        var kido = new Kido("tasks", "https://invalid-tenant-url.com");
        kido.authenticate().fail(function (err) {
            expect(err).to.be.equal("Unable to retrieve application configuration. Invalid marketplace url.");
        });
    });

});
