describe("kido logging", function () {

    this.timeout(10000);

    function doneWithError(jqXHR, textStatus, errorThrown) {
        console.log("Oops!");
        this(new Error("Failed with status:" + jqXHR.status + ", responseText:" + jqXHR.responseText + ", textStatus:" + textStatus + ", errorThrown:" + errorThrown));
    }

    it("should insert a log event", function (done) {
        var logging = new Kido().logging();
        logging
            .writeInfo("something great happened.")
            .fail(function (jqXHR, textStatus, errorThrown) {
                done(new Error("Failed with status:" + jqXHR.status + ", responseText:" + jqXHR.responseText + ", textStatus:" + textStatus + ", errorThrown:" + errorThrown));
            })
            .done(function () {
                done();
            });
    });

    it("should get all the logs", function (done) {
        var logging = new Kido().logging();
        logging
            .get()
            .fail(function (jqXHR, textStatus, errorThrown) {
                done(new Error("Failed with status:" + jqXHR.status + ", responseText:" + jqXHR.responseText + ", textStatus:" + textStatus + ", errorThrown:" + errorThrown));
            })
            .done(function (evts) {
                expect(evts).to.be.an('array');
                expect(evts.length).to.be.greaterThan(-1);
                done();
            });
    });

    it("should clear log and log that it's been cleared", function (done) {
        var logging = new Kido().logging();
        $.when(logging.writeInfo('first'), logging.writeInfo('second')).then(function () {
            return logging.clear();
        }).then(function () {
            return logging.get();
        }).done(function (evts) {
            expect(evts.length).to.be.equal(0);
            done();
        }).fail(doneWithError.bind(done));
    });

});
