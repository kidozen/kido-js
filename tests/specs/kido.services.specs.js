describe("kido services", function () {

    it("should invoke a method", function (done) {
        new Kido()
            .services("echo")
            .invoke("send", { foo: "bar" })
            .done(function (data) {
                expect(data.foo).to.be.equal("bar");
                done();
            })
            .fail(function (jqXHR, textStatus, errorThrown) {
                done(new Error("Failed with status:" + jqXHR.status + ", responseText:" + jqXHR.responseText + ", textStatus:" + textStatus + ", errorThrown:" + errorThrown));
            });
    });

    it("should fail when method fails", function (done) {
        new Kido()
            .services("echo")
            .invoke("fail", { foo: "bar" })
            .fail(function (data) {
                expect(data.foo).to.be.equal("bar");
                done();
            });
    });

    it("should invoke using defaults", function (done) {
        new Kido()
            .services("echo")
            .defaults({ kido: "zen" })
            .invoke("send", { foo: "bar" })
            .done(function (data) {
                expect(data.foo).to.be.equal("bar");
                expect(data.kido).to.be.equal("zen");
                done();
            })
            .fail(function (jqXHR, textStatus, errorThrown) {
                done(new Error("Failed with status:" + jqXHR.status + ", responseText:" + jqXHR.responseText + ", textStatus:" + textStatus + ", errorThrown:" + errorThrown));
            });
    });

    it("should only re-use the defaults on subsequent calls", function (done) {
        this.timeout(12000);
        var echo = new Kido().services("echo").defaults({ kido: "zen" });
        echo
            .invoke("send", { foo: "bar" })
            .pipe(function (data) {
                expect(data.foo).to.be.equal("bar");
                expect(data.kido).to.be.equal("zen");
                return echo
                    .invoke("send", { hello: "world" })
                    .done(function (data) {
                        expect(data.hello).to.be.equal("world");
                        expect(data.kido).to.be.equal("zen");
                        expect(data.foo).to.be.equal(undefined);
                        done();
                    });
            })
            .fail(function (jqXHR, textStatus, errorThrown) {
                done(new Error("Failed with status:" + jqXHR.status + ", responseText:" + jqXHR.responseText + ", textStatus:" + textStatus + ", errorThrown:" + errorThrown));
            });
    });

});
