/**
 * Module dependencies
 */
var Experiment = require("../experiment");
var logger = require("../logger");
var util = require('util');
var _ = require("lodash");

/**
 * Create local experiment
 *
 * @param <String> name the experiment
 * @param <String> page_id gives the starging page_id for experiment
 */

var createLocalExperiment = function(folder, name, page_ids, callback) {
    try {
        page_ids = page_ids.split(',');
        for (var i = 0; i < page_ids.length; i++) {
            page_ids[i] = parseInt(page_ids[i]);
        }
        if (!util.isArray(page_ids)) {
            page_ids = [page_ids];
        }
    } catch (e) {
        page_ids = [];
    }

    var success = Experiment.create({
        name: name,
        page_ids: page_ids,
        holdback: 500
    }, folder);
    if (success) {
        if (!_.isFunction(callback)) {
            logger.log("info", "created experiment \"" + name + "\" in folder " + folder);
        } else {
            callback(success);
        }
    } else {
        logger.log("error", "failed to create experiment");
    }
};

/**
 * The export. Create a remote or local experiment
 *
 * @param <String> name the experiment
 * @param <String> page_id gives the starging page_id for experiment
 */
module.exports = function(folder, name, page_ids, callback) {
    createLocalExperiment(folder, name, page_ids, callback);
};
