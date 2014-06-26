describe("kido local storage", function () {

    var object = {
        property1: 'test',
        property2: 1234
    };

    it('should insert an item in local storage', function (done) {
        var collection = new Kido().localStorage().collection('should-insert');
        collection.persist(object).pipe(function (inserted) {
            expect(inserted).to.have.property('_id');
            expect(inserted._id).to.be.a('string');
            expect(parseInt(inserted._id)).to.be.lessThan(0);
            return collection.get(inserted._id);
        }).done(function (retrieved) {
            expect(retrieved).to.have.property('property1');
            expect(retrieved).to.have.property('property2');
            expect(retrieved.property1).to.be.equal('test');
            expect(retrieved.property2).to.be.equal(1234);
            done();
        }).fail(function (jqXHR, textStatus, errorThrown) {
            done(new Error('Failed with status:' + jqXHR.status + ', responseText:' + jqXHR.responseText + ', textStatus:' + textStatus + ', errorThrown:' + errorThrown));
        });
    });

    it('should update an item in local storage', function (done) {
        var collection = new Kido().localStorage().collection('should-update');
        collection.persist(object).pipe(function (inserted) {
            return collection.get(inserted._id);
        }).pipe(function (retrieved) {
            retrieved.property1 = 'modified';
            retrieved.property2 = 4321;
            return collection.persist(retrieved);
        }).done(function (updated) {
            expect(updated).to.have.property('property1');
            expect(updated).to.have.property('property2');
            expect(updated.property1).to.be.equal('modified');
            expect(updated.property2).to.be.equal(4321);
            done();
        }).fail(function (jqXHR, textStatus, errorThrown) {
            done(new Error('Failed with status:' + jqXHR.status + ', responseText:' + jqXHR.responseText + ', textStatus:' + textStatus + ', errorThrown:' + errorThrown));
        });
    });

    // TODO: fix
    it('should delete an item from local storage', function (done) {
        var collection = new Kido().localStorage().collection('should-delete');
        collection.persist(object).pipe(function (inserted) {
            return collection.del(inserted._id);
        }).pipe(function () {
            // TODO: get is not rejecting the promise if item not found
            return collection.get(inserted._id);
        }).done(function () {
            done(new Error('Should have failed'));
        }).fail(function (err) {
            expect(err).to.be.equal('Item not found');
            done();
        });
    });

});