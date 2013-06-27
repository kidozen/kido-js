describe("kido storage", function () {

	this.timeout(10000);

	it("should get all the object sets", function ( done ) {

		var storage = new Kido().storage();

		storage
			.objectSet('just-in-case')
			.insert({name:'foo'})
			.fail(function (jqXHR, textStatus, errorThrown){
	            done(new Error("Failed with status:"+jqXHR.status+", responseText:"+jqXHR.responseText+", textStatus:"+textStatus+", errorThrown:"+errorThrown));
			})
			.done(function () {

				storage
					.getObjectSetNames()
					.fail(function (jqXHR, textStatus, errorThrown){
			            done(new Error("Failed with status:"+jqXHR.status+", responseText:"+jqXHR.responseText+", textStatus:"+textStatus+", errorThrown:"+errorThrown));
					})
					.done(function (names) {

						//assert
						expect(names).to.be.an('array');
						expect(names.length).to.be.greaterThan(-1);
						done();
					});
			});
	});
	
	it("should drop an object set", function ( done ) {

		var objectSet = new Kido().storage().objectSet('foo');

		//insert an object in order to create the object set.
		objectSet
			.insert({name:'it should create the object set'})
			.fail(function (jqXHR, textStatus, errorThrown){
	            done(new Error("Failed with status:"+jqXHR.status+", responseText:"+jqXHR.responseText+", textStatus:"+textStatus+", errorThrown:"+errorThrown));
			})
			.done(function ( obj ) {

				objectSet
					.drop()
					.fail(function (jqXHR, textStatus, errorThrown){
			            done(new Error("Failed with status:"+jqXHR.status+", responseText:"+jqXHR.responseText+", textStatus:"+textStatus+", errorThrown:"+errorThrown));
					})
					.done(function ( obj ) {

						new Kido().storage()
							.getObjectSetNames()
							.fail(function (jqXHR, textStatus, errorThrown){
					            done(new Error("Failed with status:"+jqXHR.status+", responseText:"+jqXHR.responseText+", textStatus:"+textStatus+", errorThrown:"+errorThrown));
							})
							.done(function ( names ) {
								
								var exists = false;
								for(var i in names) {
									if (names[i] === 'foo') {
										exists = true;
									}
								}
								expect(exists).to.not.be.ok();
								done();
							});
					});
			});
	});

	it("should insert object and add metadata", function ( done ) {

		var objectSet = new Kido().storage().objectSet('foo');

		objectSet
			.insert({name:'it should insert object'})
			.fail(function (jqXHR, textStatus, errorThrown){
	            done(new Error("Failed with status:"+jqXHR.status+", responseText:"+jqXHR.responseText+", textStatus:"+textStatus+", errorThrown:"+errorThrown));
			})
			.done(function ( obj ) {
				//asserts
				expect(obj).to.be.an('object');
				expect(obj._id).to.be.ok();
				expect(obj._metadata).to.be.ok();
				expect(obj._metadata.createdBy).to.be.ok();
				expect(obj._metadata.createdOn).to.be.ok();
				expect(obj._metadata.sync).to.equal(1);
				expect(obj._metadata.isPrivate).to.not.be.ok();
				done();
			});
	});

	it("should get object by id", function ( done ) {

		var objectSet = new Kido().storage().objectSet('foo');
		
		//insert an object.
		objectSet
			.insert({name:'it should insert object'})
			.fail(function (jqXHR, textStatus, errorThrown){
	            done(new Error("Failed with status:"+jqXHR.status+", responseText:"+jqXHR.responseText+", textStatus:"+textStatus+", errorThrown:"+errorThrown));
			})
			.done(function ( obj ) {
				//now get it by _id
				objectSet
					.get(obj._id)
					.fail(function (jqXHR, textStatus, errorThrown){
			            done(new Error("Failed with status:"+jqXHR.status+", responseText:"+jqXHR.responseText+", textStatus:"+textStatus+", errorThrown:"+errorThrown));
					})
					.done(function ( retrieved ) {
						//assert
						expect(retrieved).to.be.ok();
						expect(retrieved._id).to.be.ok();
						expect(obj._id).to.be.equal(retrieved._id);
						expect(obj.name).to.be.equal(retrieved.name);
						done();
					});
			});
	});

	it("should fail if id is empty", function () {

		var objectSet = new Kido().storage().objectSet('foo');
		
		try
		{
			objectSet.get();
			expect().fail();
		}
		catch(e)
		{
			expect(true).to.be.ok();
		}
	});

	it("should delete object", function ( done ) {

		var objectSet = new Kido().storage().objectSet('foo');

		objectSet
			.insert({name:'it should insert object'})
			.fail(function (jqXHR, textStatus, errorThrown){
	            done(new Error("Failed with status:"+jqXHR.status+", responseText:"+jqXHR.responseText+", textStatus:"+textStatus+", errorThrown:"+errorThrown));
			})
			.done(function ( obj ) {

				objectSet
					.del(obj._id)
					.fail(function (jqXHR, textStatus, errorThrown){
			            done(new Error("Failed with status:"+jqXHR.status+", responseText:"+jqXHR.responseText+", textStatus:"+textStatus+", errorThrown:"+errorThrown));
					})
					.done(function() {

						objectSet
							.get(obj._id)
							.fail(function (jqXHR, textStatus, errorThrown){
					            done(new Error("Failed with status:"+jqXHR.status+", responseText:"+jqXHR.responseText+", textStatus:"+textStatus+", errorThrown:"+errorThrown));
							})
							.done(function ( empty ) {
								expect(empty).to.be.equal(null);
								done();
							});
					});
			});
	});
	
	it("should update object and it's metadata", function ( done ) {

		var objectSet = new Kido().storage().objectSet('foo');

		objectSet
			.insert({name:'it should insert object'})
			.fail(function (jqXHR, textStatus, errorThrown){
	            done(new Error("Failed with status:"+jqXHR.status+", responseText:"+jqXHR.responseText+", textStatus:"+textStatus+", errorThrown:"+errorThrown));
			})
			.done(function ( obj ) {

				obj.name = 'new name';
				objectSet
					.update(obj)
					.fail(function (jqXHR, textStatus, errorThrown){
			            done(new Error("Failed with status:"+jqXHR.status+", responseText:"+jqXHR.responseText+", textStatus:"+textStatus+", errorThrown:"+errorThrown));
					})
					.done(function ( updObj ) {

						expect(updObj.name).to.be.equal('new name');
						expect(updObj._metadata.sync).to.be.equal(obj._metadata.sync + 1);

						done();
					});
			});
	});

	it("should fail when sync is out of date", function ( done ) {
		
		var objectSet = new Kido().storage().objectSet('foo');

		objectSet
			.insert({name:'it should insert object'})
			.fail(function (jqXHR, textStatus, errorThrown){
	            done(new Error("Failed with status:"+jqXHR.status+", responseText:"+jqXHR.responseText+", textStatus:"+textStatus+", errorThrown:"+errorThrown));
			})
			.done(function ( obj ) {

				obj.name = 'new name';
				objectSet
					.update(obj)
					.fail(function (jqXHR, textStatus, errorThrown){
			            done(new Error("Failed with status:"+jqXHR.status+", responseText:"+jqXHR.responseText+", textStatus:"+textStatus+", errorThrown:"+errorThrown));
					})
					.done(function ( updObj) {
						
						updObj._metadata.sync = updObj._metadata.sync - 1;
						objectSet
							.update(updObj)
							.fail(function ( err ) {
								
								expect(err.status).to.be.equal(409);
								expect(err.body.name).to.be.equal(obj.name);
								expect(err.body._metadata).to.be.ok();
								expect(err.body._metadata.sync).to.be.ok();
								
								done();
							});
					});
			});
	});

	it("should save object when object is new", function ( done ) {
		
		var objectSet = new Kido().storage().objectSet('foo');
		
		//insert an object.
		objectSet
			.save({name:'it should insert object'})
			.fail(function (jqXHR, textStatus, errorThrown){
	            done(new Error("Failed with status:"+jqXHR.status+", responseText:"+jqXHR.responseText+", textStatus:"+textStatus+", errorThrown:"+errorThrown));
			})
			.done(function ( obj ) {

				expect(obj).to.be.ok();
				expect(obj._id).to.be.ok();
				expect(obj.name).to.be.equal('it should insert object');

				done();
			});
	});

	it("should save object when object is not new", function ( done ) {
		
		var objectSet = new Kido().storage().objectSet('foo');
		
		//insert an object.
		objectSet
			.save({name:'it should insert object'})
			.fail(function (jqXHR, textStatus, errorThrown){
	            done(new Error("Failed with status:"+jqXHR.status+", responseText:"+jqXHR.responseText+", textStatus:"+textStatus+", errorThrown:"+errorThrown));
			})
			.done(function ( obj ) {
				
				obj.name = 'new name';
				objectSet
					.save(obj)
					.fail(function (jqXHR, textStatus, errorThrown){
			            done(new Error("Failed with status:"+jqXHR.status+", responseText:"+jqXHR.responseText+", textStatus:"+textStatus+", errorThrown:"+errorThrown));
					})
					.done(function ( newObj) {
						
						expect(newObj).to.be.ok();
						expect(newObj._id).to.be.equal(obj._id);
						expect(newObj.name).to.be.equal('new name');

						done();
					});
			});
	});

	it("should query all objects", function ( done ) {

		var objectSet = new Kido().storage().objectSet('foo');
		
		//insert an object.
		objectSet
			.insert({name:'it should insert object'})
			.fail(function (jqXHR, textStatus, errorThrown){
	            done(new Error("Failed with status:"+jqXHR.status+", responseText:"+jqXHR.responseText+", textStatus:"+textStatus+", errorThrown:"+errorThrown));
			})
			.done(function ( obj ) {
				//query objects
				objectSet
					.query({})
					.fail(function (jqXHR, textStatus, errorThrown){
			            done(new Error("Failed with status:"+jqXHR.status+", responseText:"+jqXHR.responseText+", textStatus:"+textStatus+", errorThrown:"+errorThrown));
					})
					.done(function ( list ) {
						//asserts
						expect(list).to.be.ok();
						expect(list.length > 0).to.be.ok();

						done();
					});
			});
	});

	it("should query objects by field", function ( done ) {
		
		var objectSet = new Kido().storage().objectSet('xyz');

		objectSet
			.drop()
			.always(function () {
				
				$
					.when(objectSet.insert({name: 'john'}), objectSet.insert({name: 'jake'}))
					.fail(function (jqXHR, textStatus, errorThrown){
			            done(new Error("Failed with status:"+jqXHR.status+", responseText:"+jqXHR.responseText+", textStatus:"+textStatus+", errorThrown:"+errorThrown));
					})
					.done(function () {

						//query for john.
						objectSet
							.query({name:'john'})
							.fail(function (jqXHR, textStatus, errorThrown){
					            done(new Error("Failed with status:"+jqXHR.status+", responseText:"+jqXHR.responseText+", textStatus:"+textStatus+", errorThrown:"+errorThrown));
							})
							.done(function ( list ) {

								expect(list).to.be.an('array');
								expect(list.length).to.be.equal(1);
								expect(list[0].name).to.be.equal('john');

								done();
							});
					});	
			});
		
	});
	
});
