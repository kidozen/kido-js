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
    fileOut           = pkg.name + '-' + pkg.version + '.js',
    fileOutMin        = pkg.name + '-' + pkg.version + '.min.js',
    fileOutForTests   = path.join(__dirname, 'tests', 'js', 'kido.js'),
    fileOutForSamples = path.join(__dirname, 'samples', 'js', 'kido.js'),
    files             = [
        path.join(jsDir,"jquery.crossdomain.js"),
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
        path.join(jsDir,"kido.storage.indexes.js"),
        path.join(jsDir,"kido.services.js")
    ];


desc('clean');
task('clean', function () {

    console.log('');

    [fileOut, fileOutMin, fileOutForTests, fileOutForSamples].forEach(safeDelete);

    console.log('');
    console.log('Successfully cleaned files.');
});

desc('unify');
task('unify', ['clean'], async, function () {

    console.log('');
    console.log('Unifying files to: ' + fileOut);
    // Using Google Closure
    new compressor.minify({
        type: 'no-compress',
        fileIn: files,
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

            console.log('Copying file to samples folder.')
            fs.createReadStream(fileOut)
                .pipe(fs.createWriteStream(fileOutForSamples));

            //give a few seconds for the files to be copied.
            setTimeout(complete, 2 * 1000);
        }
    });
});

desc('minifies the sdk');
task('minify', ['clean'], async, function () {

    console.log('');
    console.log('building version ' + pkg.version + ' of ' + pkg.name);

    // Using Google Closure
    new compressor.minify({
        type: 'gcc',
        fileIn: files,
        fileOut: fileOutMin,
        callback: function(err){
            if (err) {
                console.error('unable to unify and minify');
                console.error(err);
            }
            complete();
        }
    });
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
        folder = path.join(__dirname, 'tests');

    api.emulate(app, folder, cb);
};




