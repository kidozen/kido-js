#!/usr/bin/env node

/**
 * module dependencies.
 */

var pkg         = require('./package'),
    path        = require("path"),
    fs          = require('fs'),
    compressor  = require('node-minify'),
    kido        = require('kido/lib'),
    spawn       = require('child_process').spawn;


/**
 * module varibles.
 */

var async             = {async:true},
    win               = require('os').platform() == 'win32',
    phantomjs         = path.join(__dirname, win ? "bin/phantomjs-1.9.0-windows/phantomjs.exe" : "bin/phantomjs-1.9.0-macosx/bin/phantomjs"),
    phantomjsRunner   = path.join(__dirname, 'tests', 'runner.js'),
    jsDir             = path.join(__dirname,"/lib/"),
    fileOut           = pkg.name + '.js',
    fileOutMin        = pkg.name + '.min.js',
    fileOutForTests   = path.join(__dirname, 'tests', 'js', 'kido.js'),
    fileOutForSamples = path.join(__dirname, 'samples', 'js', 'kido.js'),
    copyright         = path.join(__dirname, 'tmp', 'copyright.txt'),
    fileOutMinTmp     = path.join(__dirname, 'tmp', 'kido.min.js'),
    files             = [
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
        path.join(jsDir,"kido.storage.indexes.js"),
        path.join(jsDir,"kido.services.js"),
        path.join(jsDir,"kido.datasources.js")
    ];


desc('clean');
task('clean', function () {

    console.log('');

    [copyright, fileOut, fileOutMin, fileOutMinTmp, fileOutForTests, fileOutForSamples].forEach(safeDelete);

    console.log('');
    console.log('Successfully cleaned files.');
});


desc('creates a temporary directory.');
directory('tmp');


desc('prepares the copyright for unify and minify');
task('copyright', ['tmp'], function () {
    var header = "// KidoZen Javascript SDK v" + pkg.version + ".\n" +
                 "// Copyright (c) 2013 Kidozen, Inc. MIT Licensed";
    fs.writeFileSync(copyright, header, 'utf8');
});


desc('unify the SDK with the copyright label.');
task('unify', ['clean', 'copyright'], async, function () {

    console.log('');
    console.log('Unifying files to: ' + fileOut);
    // Using Google Closure
    new compressor.minify({
        type: 'no-compress',
        fileIn: [copyright].concat(files),
        fileOut: fileOut,
        callback: function(err){

            if ( err ) {
                console.error('unable to unify.');
                console.error(err);
                complete();
            }

            console.log('Copying file to tests folder.');
            fs.createReadStream(fileOut)
                .pipe(fs.createWriteStream(fileOutForTests));

            console.log('Copying file to samples folder.');
            fs.createReadStream(fileOut)
                .pipe(fs.createWriteStream(fileOutForSamples));

            //give a few seconds for the files to be copied.
            setTimeout(complete, 2 * 1000);
        }
    });
});


desc('applies the gcc to the sdk files and outputs to a tmp folder.');
task('gcc', ['tmp'], async, function () {

    console.log('');
    console.log('building version ' + pkg.version + ' of ' + pkg.name);

    // Using Google Closure
    new compressor.minify({
        type: 'gcc',
        fileIn: files,
        fileOut: fileOutMinTmp,
        callback: function(err){
            if (err) {
                console.error('minify');
                console.error(err);
            }
            complete();
        }
    });
});


desc('minifies the sdk and adds the copyright label.');
task('minify', ['clean', 'copyright', 'gcc'], async, function () {

    new compressor.minify({
        type: 'no-compress',
        fileIn: [copyright, fileOutMinTmp],
        fileOut: fileOutMin,
        callback: function (err) {

            if (err) {
                console.error('unable to minify and add copyright.');
                console.error(err);
            }
            complete();
        }});
});


desc('cleans, unifies and minifies the sdk');
task('build', ['unify', 'minify']);


desc('runs the unit tests against an actual kidozen environment');
task('test', ['build'], async, function () {
    test();
});


desc('runs the unit tests and outputs a report in xunit format');
task('report', async, function ( output ) {

    if (!output) {
        console.log('No output option defined, using "tests.xml".');
        test('tests.xml');
    } else {
        console.log('Exporting tests report to ' + output);
        test(output);
    }
});


desc('unifies and minifies the files.');
task('default', ['build']);


/**
 * helpers
 */

var safeDelete = function (file) {
    if (fs.existsSync(file)) {
        console.log('cleaning ' + file);
        fs.unlinkSync(file);
    }
};

var test = function ( output ) {

    //first run the kido emulator.
    emulate(function ( err ) {

        if (err) {
            console.error('An error occurred while trying to start emulator:');
            console.error(err);
            return complete();
        }

        console.log('Running tests');

        //use spawn to preserve color on console.
        var options = { stdio: 'inherit' },
            url = 'http://localhost:3000' + (output ? '#xunit' : '');

        console.log("Testing url: ", url);

        sp = spawn(phantomjs, [phantomjsRunner, url, output || ''], options);
        sp.on('close', function ( code ) {

            console.log('');

            if (code !== 0)
                console.error('Unable to run tests with phantomjs');
            else
                console.info('Tests ran Successfully');

            process.exit();
        });
    });
};

var emulate = function ( cb ) {

    var app = process.env.KIDO_JS_APP,
        hosting = process.env.KIDO_JS_HOSTING,
        user = process.env.KIDO_JS_USER,
        pass = process.env.KIDO_JS_PASS;

    if (!app || !hosting || !user || !pass) {
        console.error('The following environment variables are required:');
        console.error('KIDO_JS_APP     - kidozen application.');
        console.error('KIDO_JS_HOSTING - domain for your kidozen environment.');
        console.error('KIDO_JS_USER    - kidozen user name.');
        console.error('KIDO_JS_PASS    - kidozen user password.');
        console.error('(ie: demo, mycompany.kidocloud.com, mycompany@kidozen.com, mysecret)');
        console.error('Usage: jake test KIDO_JS_APP=demo KID...');
        process.exit(1);
    }

    console.log('');
    console.log('Starting emulator...');

    var config = { hosting: hosting, user: user, pass: pass },
        api    = kido(config),
        folder = path.join(__dirname, 'tests'),
        credentials = {
            username: user,
            password: pass,
            ip: { 
                name: "Kidozen",
                activeEndpoint: "https://identity.kidozen.com/wrapv0.9",
                protocol: "wrapv0.9"
            }
        };

    api.emulate(credentials,app, folder, cb);
};




