Kidozen Javascript SDK
======================

You can use the Javascript SDK to build HTML5 Web Applications that run in the KidoZen platform. For more information about KidoZen, visit our [website](http://kidozen.com).

##Using the SDK

In order to use the SDK in your web applications you can download the unified and minified versions of the SDK, or you can generate it from the source code. Before you can add the reference to the SDK, you will have to make sure you have this dependencies already reference:

- jQuery
- json2 (optional for older browsers)
- socket.io (optional for pubsub only)

In order to add the reference, copy the sdk to your app's folder (in this case we used /js) and add the following in your HTML files:

	<script src="/js/kido.js"></script>

Note: The SDK files usually contain the version number in their name, for instance: kido-js-0.1.0.js and kido-js-0.1.0.min.js, so make sure to reference using the right file name.

##Building the SDK from the source

If you want to contribute, fix, modify or try a custom version of the KidoZen SDK or simply work with the source code, you can clone this repository and follow these instructions to build it:

Download and install [node.js](http://nodejs.org). Version 0.8.14 is known to work well for us.

Clone the repository with git:

	git clone https://github.com/kidozen/kido-js.git

Install dependencies:

	cd kido-js
	npm install

Install jake (a task runner built on node.js):

	npm install -g jake

Run jake task to build the SDK:

	jake

Notice: that the unify and minify tasks are using node-minify which in turns requires `Java` to be installed and accessible through the `PATH` environment variable.

##Running the tests

Notice that our unit tests run against an actual instance of KidoZen. This means you will need to have a valid KidoZen environment with an actual app to run these tests. If you haven't done so yet, you can go to [http://kidozen.com](http://kidozen.com) to sign up.

In order to run the tests you will need four pieces of information:

- KIDO_JS_APP		- the name of the app you will run the tests against.
- KIDO_JS_HOSTING	- the domain of your KidoZen environment (ie: mycompany.kidocloud.com)
- KIDO_JS_USER		- the kidozen user you were provided upon registration
- KIDO_JS_PASS		- the password for your kidozen user



There are two ways in which you can set these values in your environment, one option is to save these variables into your environment variables.For instructions on how to set up environment variables, you should check based on your operating system. Once you have them configured, you can run the tests with the following jake task:

	jake test

The other option, is to set the environment variables using jake. In this case you need to run the task like this:

	jake test KIDO_JS_APP=myapp KIDO_JS_HOSTING=mycompany.kidocloud.com KIDO_JS_USER=mycompany@kidozen.com KIDO_JS_PASS=mysecret

Under the hood, the jake task is setting a proxy against your KidoZen environment, and then it's using phantom.js to run the tests using a headless browser and reporting the result to your command line.

If you want to run the tests from a browser, you can do so by installing the kido client tool:

	npm install -g kido

Save your credentials for your hosting:

	kido hosting mycompany.kidocloud.com

Run the emulator from the tests folder:

	cd tests
	kido app-run myapp mycompany.kidocloud.com

Now you are ready to open http://localhost:3000 from any browser.

##Running the samples

Running the samples is pretty similar to running the tests from the browser, but you will use a different folder.

Install the kido client tool (if you haven't):

	npm install -g kido

Start the emulator from the samples folder:

	cd samples
	kido app-run myapp mycompany.kidocloud.com

Open http://localhost:3000 from your browser.

##FAQs

###I don't have the `npm` command, where can I get it?

Npm tool is installed together with node.js. If you have problems installing node.js, let us know.

###Why am I getting 'command not found' when running jake or kido?

Either you forgot the `-g` option when executing the npm command, or the folder where the global binaries are stored is not in your `PATH` environment variable.

###Found a problem with the kido tool, where can I report it?

You can do so in the github repository [here](https://github.com/kidozen/kido).

##License

The MIT License (MIT), Copyright (c) 2013 Kidozen, Inc.