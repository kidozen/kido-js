var page = require('webpage').create(),
    fs = require('fs'),
    timeout = false,
    system = require('system'),
    address;

if (system.args.length === 1) {
    console.log('Usage: run.js <some URL> [output file]');
    phantom.exit();
};

var address = system.args[1],
    output  = system.args[2]; // || 'output.xml';

console.log('Output: ', output);

page.open(address, function (status) {

    if (status !== 'success') {
        console.log('failed to load the tests');
        phantom.exit(1);
        return;
    }

    setTimeout(function () { timeout = true; }, 260000);

    var check = function () {

        var finished = page.evaluate(function () {
            return $('.finished').length > 0;
        });

        if (finished) {

            console.log('finished running tests');

            if (output)
                report();
            else
                print();
        }
        else {
            if(timeout) {
                console.error("execution of unit tests timed out");
                phantom.exit(500);
            }
            setTimeout(check, 500);
        }
    };

    var print = function () {

        var tests = page.evaluate(function () {

            var list = [];
            $('.test').each(function () {
                list.push({
                        success: $(this).hasClass('pass'),
                        name: $(this).find('h2').text(),
                        error: $(this).find('pre.error').text()
                    });
            });
            return list;
        });

        var errors = 0;
        for(var i in tests) {
            var test = tests[i];
            if (!test.success) {
                console.error('---');
                console.error(test.name+':');
                console.error(test.error);
                console.error('---');
                errors++;
            }
        }
        console.log('Finished: ' + tests.length + ' tests ran. ' + errors + ' failed.');
        phantom.exit();
    };

    var report = function () {

        var report = page.evaluate(function () {
            return $('#mocha-report pre').text();
        });

        console.log('saving report to: ' + output);
        fs.write(output, report, 'w');
        //console.log(report);
        phantom.exit();
    };

    setTimeout(check, 500);

});