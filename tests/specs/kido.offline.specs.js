describe("kido offline", function () {

    it('should throw an error if no settings are passed to ajax method', function (done) {
        try {
            new Kido().offline().ajax();
        } catch (e) {
            expect(e).to.be.equal("The 'settings' argument is required.");
            done();
        }
    });

    it('should execute an ajax call and success if there is connection', function (done) {
        // TODO
        done();
    });

    it('should execute an ajax call and success if there is not connection', function (done) {
        // TODO
        done();
    });

    it('should add pending requests to a queue if there is not connection', function (done) {
        // TODO
        done();
    });

    it('should execute pending requests stored in the queue when the connection is back', function (done) {
        // TODO
        done();
    });

});
