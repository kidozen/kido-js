Kido.prototype.storage = function(name) {

	var storageName = name || 'local';
	var parentKido = this;

    return {
		// Name of the storage, valid values are:
		// local, global and any application name.
		name: storageName,
		kido: parentKido,

		getObjectSetNames: function()
		{
			return parentKido.send({
					url: "/storage/" +	(storageName==='local' ? parentKido.applicationName : storageName),
					type: "GET"
				});
		},

		objectSet: function(name)
		{
			return new ObjectSet(name, this);
		}
	};
};

ObjectSet = function(name, parentStorage)
{
	var objectSetName = name || 'default';
	var self = this;

	this.storage =  parentStorage;
	this.name = objectSetName;

	self.invoke = function(data) {
		if (!data) throw "data argument is required";
		if (!data.settings) throw "data.settings property is required";

		var params = [];
		if (data.query) params.push("query=" + JSON.stringify(data.query));
		if (data.options) params.push("options=" + JSON.stringify(data.options));
		if (data.fields) params.push("fields=" + JSON.stringify(data.fields));
		if (data.isPrivate === true || data.isPrivate === false) params.push("isPrivate=" + data.isPrivate);

		data.settings.url = "/storage/" +
			(parentStorage.name=='local' ? parentStorage.kido.applicationName : parentStorage.name) + "/" +
			objectSetName +
			(data.objectId ? "/" + data.objectId : "") +
			(data.indexes ? "/" + data.indexes : "") +
			(params.length ? "?" + params.join("&") : "");

		data.settings.url = encodeURI(data.settings.url);

		data.settings.cache = data.cache;

		return parentStorage.kido.send(data.settings);
	};

	// Stores a new obj into the set
	self.insert = function(obj, isPrivate) {
		
		if(!obj) throw "obj argument is requiered.";

		obj._id = undefined;

		var data = {
			settings: {
				type: "POST",
				data: JSON.stringify(obj)
		}};

		if (isPrivate) data.isPrivate = isPrivate;

		return self.invoke(data).pipe(function(result) {
			return $.extend({}, obj, result);
		});
	};

	// Updates an existing object, the object instance
	// must contains the object's key
	self.update = function(obj, isPrivate){
		
		if(!obj) throw "obj argument is requiered.";

		var data = {
			settings: {
				type: "PUT",
				data: JSON.stringify(obj)
		}};

		if (isPrivate) data.isPrivate = isPrivate;

		return self
				.invoke(data)
				.pipe(function(result) {
					return $.extend({}, obj, result);
				}, function ( err ) {

					if (err.status === 409) {
						try
						{
							err.body = JSON.parse(err.responseText);
						}
						catch(e)
						{
						}
					}
					return err;
				});
	};

	// Inserts or updates the object instance.
	// If the object instance contains the object's key
	// then this function will update it, if the object
	// instance doesn't contain the object's key then this
	// function will try to insert it
	self.save = function(obj, isPrivate){
		if(!obj) throw "obj argument is requiered.";

		if(obj && obj._id && obj._id.length > 0) {
			return this.update(obj, isPrivate);
		}
		else {
			return this.insert(obj, isPrivate);
		}
	};

	// Retrieves an object by its key
	self.get = function(objectId){

		var result = $.Deferred();
		if(!objectId) throw "objectId is required";
		else {

			self
				.invoke ({
					settings: { type: "GET" },
					objectId: objectId,
					cache: false
				})
				.fail(function ( err ) {
					if (err.status === 404) {
						result.resolve(null);
					} else {
						result.reject(err);
					}
				})
				.done(function ( obj ) { result.resolve(obj); });
		}
		return result;
	};

	// Executes the query
	self.query = function(query, fields, options, cache){
		return self.invoke ({
			settings: { type: "GET" },
			query: query,
			fields: fields,
			options: options,
			cache: cache
		});
	};

	// Delete an object from the set by its key
	self.del = function(objectId){
		return self.invoke ({
			settings: { type: "DELETE", dataType: 'text' },
			objectId: objectId
		});
	};

	self.drop = function(){
		return self.invoke ({
			settings: { type: "DELETE", dataType: 'text' }
		});
	};
};