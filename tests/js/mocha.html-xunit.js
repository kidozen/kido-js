var HTMLXunit = (function (){


  var Base = Mocha.reporters.Base
  , utils = Mocha.utils
  , escape = utils.escape;

/**
 * Save timer references to avoid Sinon interfering (see GH-237).
 */

var Date = global.Date
  , setTimeout = global.setTimeout
  , setInterval = global.setInterval
  , clearTimeout = global.clearTimeout
  , clearInterval = global.clearInterval;

var buff = '';
var consoleLog = function (str) {
  buff += str + '\n';
};

/**
 * Initialize a new `HtmlXunit` reporter.
 *
 * @param {Runner} runner
 * @api public
 */

function HTMLXunit(runner, root) {
  Base.call(this, runner);

  var self = this
    , stats = this.stats
    , tests = []
    , report = fragment('<div id="mocha-report"></div>');

  root = root || document.getElementById('mocha');

  if (!root) return error('#mocha div missing, add it to your document');

  root.appendChild(report);

  runner.on('pass', function(test){
    tests.push(test);
  });
  
  runner.on('fail', function(test){
    tests.push(test);
  });

  runner.on('end', function(){
    consoleLog(tag('testsuite', {
        name: 'Mocha Tests'
      , tests: stats.tests
      , failures: stats.failures
      , errors: stats.failures
      , skip: stats.tests - stats.failures - stats.passes
      , timestamp: (new Date).toUTCString()
      , time: stats.duration / 1000
    }, false));

    tests.forEach(test);
    consoleLog('</testsuite>');    

    var pre = fragment('<pre>' + escape(buff) + '</pre>');
    report.appendChild(pre);
  });
}

/**
 * Output tag for the given `test.`
 */

function test(test) {
  var attrs = {
      classname: test.parent.fullTitle()
    , name: test.title
    , time: test.duration / 1000
  };

  if ('failed' == test.state) {
    var err = test.err;
    attrs.message = escape(err.message);
    consoleLog(tag('testcase', attrs, false, tag('failure', attrs, false, cdata(err.stack))));
  } else if (test.pending) {
    consoleLog(tag('testcase', attrs, false, tag('skipped', {}, true)));
  } else {
    consoleLog(tag('testcase', attrs, true) );
  }
}

/**
 * HTML tag helper.
 */

function tag(name, attrs, close, content) {
  var end = close ? '/>' : '>'
    , pairs = []
    , tag;

  for (var key in attrs) {
    pairs.push(key + '="' + escape(attrs[key]) + '"');
  }

  tag = '<' + name + (pairs.length ? ' ' + pairs.join(' ') : '') + end;
  if (content) tag += content + '</' + name + end;
  return tag;
}

/**
 * Return cdata escaped CDATA `str`.
 */

function cdata(str) {
  return '<![CDATA[' + escape(str) + ']]>';
}

function fragment(html) {
  var args = arguments
    , div = document.createElement('div')
    , i = 1;

  div.innerHTML = html.replace(/%([se])/g, function(_, type){
    switch (type) {
      case 's': return String(args[i++]);
      case 'e': return escape(args[i++]);
    }
  });

  return div.firstChild;
}

return HTMLXunit;  
})();
