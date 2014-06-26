describe("kido local storage", function () {

    var object = {
        property1: 'test',
        property2: 1234
    };

    it("should insert an item in local storage", function (done) {
        var collection = new Kido().localStorage().collection('test');
        collection.persist(object).then(function (inserted_object) {
            expect(inserted_object).to.have.property('_id');
            expect(inserted_object._id).to.be.a('string');
            expect(parseInt(inserted_object._id)).to.be.lessThan(0);
            return collection.get(inserted_object._id).done(function (retrieved_object) {
                expect(retrieved_object).to.have.property('property1');
                expect(retrieved_object).to.have.property('property2');
                expect(retrieved_object.property1).to.be.equal('test');
                expect(retrieved_object.property2).to.be.equal(1234);
                done();
            });
        }).fail(function (err) {
            done(new Error(err));
        });
    });

    it("should update an item in local storage", function (done) {
        var collection = new Kido().localStorage().collection('test');
        collection.persist(object).pipe(function (inserted_object) {
            return collection.get(inserted_object._id);
        }).pipe(function (retrieved_object) {
            retrieved_object.property1 = 'modified';
            retrieved_object.property2 = 4321;
            return collection.persist(retrieved_object).then(function(updated_object) {
                expect(updated_object).to.have.property('property1');
                expect(updated_object).to.have.property('property2');
                expect(updated_object.property1).to.be.equal('modified');
                expect(updated_object.property2).to.be.equal(4321);
                done();
            });
        }).fail(function (err) {
            done(new Error(err));
        });
    });

});