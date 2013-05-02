#!/usr/bin/env node

var pkg  = require('./package'),
    path = require("path");

console.log('')
console.log('building version ' + pkg.version + ' of ' + pkg.name);

var jsDir      = path.join(__dirname,"/lib/"),
    fileOut = pkg.name + '-' + pkg.version + '.js',
    minFileOut = pkg.name + '-' + pkg.version + '.min.js',
    files = [path.join(jsDir,"jquery.crossdomain.js"),
            path.join(jsDir,"json2.js"),
            path.join(jsDir,"kido.identity.wsTrustClient.js"),
            path.join(jsDir,"kido.js"),
            path.join(jsDir,"kido.config.js"),
            path.join(jsDir,"kido.email.js"),
            path.join(jsDir,"kido.logging.js"),
            path.join(jsDir,"kido.notifications.js"),
            path.join(jsDir,"kido.pubsub.js"),
            path.join(jsDir,"kido.queue.js"),
            path.join(jsDir,"kido.security.js"),
            path.join(jsDir,"kido.sms.js"),
            path.join(jsDir,"kido.storage.js"),
            path.join(jsDir,"kido.indexes.js"),
            path.join(jsDir,"kido.updater.js")];

var compressor = require('node-minify');

// Using Google Closure
new compressor.minify({
    type: 'no-compress',
    fileIn: files,
    fileOut: fileOut,
    callback: function(err){
        if ( err ) {
            console.error('unable to unify.');
            console.error(err);
            return;
        }

        var fs = require('fs');
        fs.createReadStream(fileOut)
            .pipe(fs.createWriteStream(path.join(__dirname, 'tests', fileOut)));

        fs.createReadStream(fileOut)
            .pipe(fs.createWriteStream(path.join(__dirname, 'samples', 'js', fileOut)));
    }
});

// Using Google Closure
new compressor.minify({
    type: 'gcc',
    fileIn: files,
    fileOut: minFileOut,
    callback: function(err){
        if (err) {
            console.error('unable to unify and minify');
            console.error(err);
        }
    }
});

