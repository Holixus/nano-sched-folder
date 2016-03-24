"use strict";

var fs = require('nano-fs'),
    Promise = require('nano-promise'),
    Path = require('path');

module.exports = {

'dist-clean': function (log, data) {
	var dist_folder = data.dist_folder || (data.opts && data.opts.dist_folder);
	return fs.empty(dist_folder)
		.catch(function (e) {
			/* istanbul ignore if */
			if (!(e instanceof Error) || e.code !== 'ENOENT')
				throw e;
			return fs.mkpath(dist_folder);
		});
}

};
