describe("kido email", function () {

    it("should throw if no 'to'", function (done) {
        var email = new Kido().email();
        try {
            email.send(null, 'email@kidozen.com');
            done(new Error("didn't throw"))
        } catch (e) {
            done();
        }
    });

    it("should throw if no 'from'", function (done) {
        var email = new Kido().email();
        try {
            email.send('email@kidozen.com', null);
            done(new Error("didn't throw"));
        } catch (e) {
            done();
        }
    });

    it("should send an email", function (done) {
        this.timeout(5000);
        var email = new Kido().email();
        email
            .send('nobody@kidozen.com', 'no-reply@kidozen.com')
            .fail(function (jqXHR, textStatus, errorThrown) {
                done(new Error("Failed with status:" + jqXHR.status + ", responseText:" + jqXHR.responseText + ", textStatus:" + textStatus + ", errorThrown:" + errorThrown));
            })
            .done(function () {
                done();
            });
    });

});
