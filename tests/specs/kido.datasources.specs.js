describe("kido datasources", function () {

    it("should query a datasource", function ( done ) {

        new Kido()
            .datasources("test-query")
            .query()
            .done(function ( data ) {
                expect(data).to.be.ok();
                expect(data.status).to.be.equal(200);
                done();
            })
            .fail(function (jqXHR, textStatus, errorThrown){
                done(new Error("Failed with status:"+jqXHR.status+", responseText:"+jqXHR.responseText+", textStatus:"+textStatus+", errorThrown:"+errorThrown));
            });
    });

    it("should invoke an operation", function ( done ) {

        new Kido()
            .datasources("test-operation")
            .invoke()
            .done(function ( data ) {            	
            	expect(data).to.be.ok();
            	expect(data.status).to.be.equal(200);
                done();
            })
            .fail(function (jqXHR, textStatus, errorThrown){
                done(new Error("Failed with status:"+jqXHR.status+", responseText:"+jqXHR.responseText+", textStatus:"+textStatus+", errorThrown:"+errorThrown));
            });
    });

    it("should fail when trying to query an operation", function (done) {
        new Kido()
            .datasources("test-operation")
            .query()
            .fail(function ( jqXHR, textStatus, errorThrown ) {
                expect(jqXHR.status).to.be.equal(405);
                done();
            });
    });

    it("should fail when trying to query a non-existant datasource", function (done) {
        new Kido()
            .datasources("non-existant-operation")
            .query()
            .fail(function (jqXHR, textStatus, errorThrown){
            	expect(jqXHR.status).to.be.equal(404);
            	done();
            });
    });

    it("should fail when trying to invoke a non-existant datasource", function (done) {
        new Kido()
            .datasources("non-existant-operation")
            .invoke()
            .fail(function (jqXHR, textStatus, errorThrown){
            	expect(jqXHR.status).to.be.equal(404);
            	done();
            });
    });

    it("should support querying a datasource with a timeout", function (done) {
        new Kido()
            .datasources("test-query")
            .query(10)
            .done(function ( data ) {        	
            	expect(data.status).to.be.equal(200);
                done();
            })
            .fail(function (jqXHR, textStatus, errorThrown){
                done(new Error("Failed with status:"+jqXHR.status+", responseText:"+jqXHR.responseText+", textStatus:"+textStatus+", errorThrown:"+errorThrown));
            });
    });

    it("should support invoking an operation ds with a timeout", function (done) {
        new Kido()
            .datasources("test-operation")
            .invoke(20)
            .done(function ( data ) {          	
            	expect(data.status).to.be.equal(200);
                done();
            })
            .fail(function (jqXHR, textStatus, errorThrown){
                done(new Error("Failed with status:"+jqXHR.status+", responseText:"+jqXHR.responseText+", textStatus:"+textStatus+", errorThrown:"+errorThrown));
            });
    });

    it("should support querying a datasource with args", function (done) {
        new Kido()
            .datasources("test-query")
            .query({foo:"bar", baz:"bat"},10)
            .done(function ( data ) {           
                expect(data.status).to.be.equal(200);
                done();
            })
            .fail(function (jqXHR, textStatus, errorThrown){
                done(new Error("Failed with status:"+jqXHR.status+", responseText:"+jqXHR.responseText+", textStatus:"+textStatus+", errorThrown:"+errorThrown));
            });
    });

    it("should support invoking an operation ds with args", function (done) {
        new Kido()
            .datasources("test-operation")
            .invoke({foo:"bar", baz:"bat"},20)
            .done(function ( data ) {           
                expect(data.status).to.be.equal(200);
                done();
            })
            .fail(function (jqXHR, textStatus, errorThrown){
                done(new Error("Failed with status:"+jqXHR.status+", responseText:"+jqXHR.responseText+", textStatus:"+textStatus+", errorThrown:"+errorThrown));
            });
    });

});