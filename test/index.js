"use strict";

var assert = require('core-assert'),
    json = require('nano-json'),
    timer = require('nano-timer'),
    Promise = require('nano-promise'),
    util = require('util'),
    fs = require('nano-fs');


/* ------------------------------------------------------------------------ */
function Logger(stage, job) {

	var context = job.sched.name + ':' + job.name + '#' + stage;

	this.stage = stage;
	this.job = job;
	var acc = this.acc = [];
	this.dumps = [];

	this.log = function (code, format, a, b, etc) {
		acc.push(util.format('  %s: %s', context, util.format.apply(util.format, Array.prototype.slice.call(arguments, 1))));
	};

	this.trace = function () {
		this.log.apply(this, Array.prototype.concat.apply(['trace'], arguments));
	};

	this.warn = function (code, format, a, b, etc) {
		acc.push(util.format('W.%s: warning: %s', context, util.format.apply(util.format, Array.prototype.slice.call(arguments, 1))));
	};

	this.error = function (format, a, b, etc) {
		acc.push(util.format('E.%s: error: %s', context, util.format.apply(util.format, Array.prototype.slice.call(arguments, 1))));
	};

	this.fail = function (format, a, b, etc) {
		acc.push(util.format('F.%s: FAIL: %s', context, util.format.apply(util.format, arguments)));
	};

	this.writeListing = function (name, data) {
		this.dumps.push({
			name: name, 
			data: data
		});

		return Promise.resolve();
	};
}

Logger.prototype = {
};



var folder = require('../index.js'),
	opts = {
			dist_folder: __dirname+'/dist',
			sources_folder: __dirname+'/src'
		},
    job = {
		name: 'test',
		sched: {
			name: 'test',
			opts: opts
		}
	};

function fsinit(log, data) {
	return fs.empty(opts.dist_folder)
		.catch(function () {
			return fs.mkpath(opts.dist_folder);
		})
		.then(function () {
			var folders = [
				'/folder', '/ololo', '/one/two', '/one/two-1'
			];
			return Promise.all(folders.map(function (path) {
				return fs.mkpath(opts.dist_folder+path);
			}));
		})
		.then(function () {
			var files = [
				'/folder/1.txt', '/folder/2.txt', '/one/two/foo.bar', '/one/two/bar.foo', '/one/two-1/oops'
			];
			return Promise.all(files.map(function (path) {
				return fs.writeFile(opts.dist_folder+path, path, 'utf8');
			}));
		})
		.then(function () {
			return [ log, data ];
		})
		.catch(function (e) {
			log.error('%j', e);
		});
}

suite('folder.dist-clean', function () {
	test('create dist-folder', function (done) {

		var log = new Logger('dist-clean', job),
		    data = {
					opts: opts
				};

		fs.remove(opts.dist_folder)
			.catch(function () {})
			.then(function () { return [log, data]; })
			.spread(folder['dist-clean'])
			.then(function () {
				return fs.readdir(opts.dist_folder).then(function (list) {
					assert.strictEqual(list.length, 0);
					done();
				});
			}).catch(done);
	});

	test('empty dist-folder', function (done) {

		var log = new Logger('dist-clean', job),
		    data = {
					opts: opts
				};

		fsinit(log, data)
			.then(function () {
				return fs.readdir(opts.dist_folder).then(function (list) {
					assert.strictEqual(list.length, 3);
					return [ log, data ];
				});
			})
			.spread(folder['dist-clean'])
			.then(function () {
				return fs.readdir(opts.dist_folder).then(function (list) {
					assert.strictEqual(list.length, 0);
					done();
				});
			}).catch(function (e) {
				if (log.acc.length)
					console.log(log.acc);
				done(e);
			});
	});
});
