describe("kido sms", function () {

    it("should throw if no 'to' on send", function (done) {
        var sms = new Kido().sms();
        try {
            sms.send(null, 'message');
            done(new Error("didn't throw"))
        } catch (e) {
            done();
        }
    });

    it("should throw if no 'message' on send", function (done) {
        var sms = new Kido().sms();
        try {
            sms.send('+15005550006', null);
            done(new Error("didn't throw"));
        } catch (e) {
            done();
        }
    });

    it("should throw if no 'messageId' on getStatus", function (done) {
        var sms = new Kido().sms();
        try {
            sms.getStatus(null);
            done(new Error("didn't throw"))
        } catch (e) {
            done();
        }
    });

    it.skip("should send an sms", function (done) {
        this.timeout(5000);
        var sms = new Kido().sms();
        sms
            .send('+15005550006', 'test send from kido-js')
            .fail(function (jqXHR, textStatus, errorThrown) {
                done(new Error("Send SMS Failed with status:" + jqXHR.status + ", responseText:" + jqXHR.responseText + ", textStatus:" + textStatus + ", errorThrown:" + errorThrown));
            })
            .done(function (result) {
                expect(result.messageId).to.be.ok();
                expect(result.status).to.be.ok();
                done();
            });
    });

    it.skip("should send an sms with queueing enabled", function (done) {
        this.timeout(5000);
        var sms = new Kido().sms({ queueing: true });
        sms
            .send('+15005550006', 'test with queueing enabled send from kido-js')
            .fail(function (jqXHR, textStatus, errorThrown) {
                done(new Error("Send SMS Failed with status:" + jqXHR.status + ", responseText:" + jqXHR.responseText + ", textStatus:" + textStatus + ", errorThrown:" + errorThrown));
            })
            .done(function (result) {
                expect(result.messageId).to.be.ok();
                expect(result.status).to.be.ok();
                done();
            });
    });

    it.skip("should query sms status", function (done) {
        this.timeout(5000);
        var sms = new Kido().sms();
        sms
            .send('+15005550006', 'test queryStatus from kido-js')
            .fail(function (jqXHR, textStatus, errorThrown) {
                done(new Error("Send SMS Failed with status:" + jqXHR.status + ", responseText:" + jqXHR.responseText + ", textStatus:" + textStatus + ", errorThrown:" + errorThrown));
            })
            .done(function (result) {
                sms
                    .getStatus(result.messageId)
                    .fail(function (jqXHR, textStatus, errorThrown) {
                        done(new Error("Query SMS Status Failed with status:" + jqXHR.status + ", responseText:" + jqXHR.responseText + ", textStatus:" + textStatus + ", errorThrown:" + errorThrown));
                    })
                    .done(function (status) {
                        expect(status).to.be.ok();
                        console.log("status", status);
                        done();
                    });
            });
    });

});
