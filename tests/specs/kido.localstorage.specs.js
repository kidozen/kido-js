describe("kido local storage", function () {

    var array = [
        {
            _id: 1,
            property1: 'test',
            property2: 1234
        },
        {
            _id: 2,
            property1: 'other test',
            property2: 4321
        }
    ];

    var object = {
        property1: 'test',
        property2: 1234
    };

    var object2 = {
        property1: 'test 2',
        property2: 2345
    };

    it('should store an array in local storage', function (done) {
        var collection = new Kido().localStorage().collection('should-store');
        collection.persist(array).then(function () {
            return collection.length();
        }).done(function (length) {
            expect(length).to.be.equal(2);
            done();
        }).fail(function (jqXHR, textStatus, errorThrown) {
            done(new Error('Failed with status:' + jqXHR.status + ', responseText:' + jqXHR.responseText + ', textStatus:' + textStatus + ', errorThrown:' + errorThrown));
        });
    });

    it('should insert an item in local storage', function (done) {
        var collection = new Kido().localStorage().collection('should-insert');
        collection.persist(object).then(function (inserted) {
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
        collection.persist(object).then(function (inserted) {
            return collection.get(inserted._id);
        }).then(function (retrieved) {
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

    it('should fail when trying to get a non existent object', function (done) {
        var collection = new Kido().localStorage().collection('empty-store');
        collection.get('non-existent-id').done(function () {
            done(new Error('Should have failed'));
        }).fail(function (err) {
            expect(err).to.be.equal('Item not found');
            done();
        });
    });

    it('should delete an item from local storage', function (done) {
        var collection = new Kido().localStorage().collection('should-delete');
        collection.persist(object).then(function (inserted) {
            return collection.del(inserted._id);
        }).then(function () {
            return collection.get(object._id);
        }).done(function () {
            done(new Error('Should have failed'));
        }).fail(function (err) {
            expect(err).to.be.equal('Item not found');
            done();
        });
    });

    it('should drop a collection from local storage', function (done) {
        var collection = new Kido().localStorage().collection('should-drop');
        collection.persist(object).then(function () {
            return collection.persist(object2);
        }).then(function () {
            return collection.drop();
        }).then(function () {
            return collection.length();
        }).done(function (collection_length) {
            expect(collection_length).to.be.equal(0);
            done();
        }).fail(function (jqXHR, textStatus, errorThrown) {
            done(new Error('Failed with status:' + jqXHR.status + ', responseText:' + jqXHR.responseText + ', textStatus:' + textStatus + ', errorThrown:' + errorThrown));
        });
    });

});