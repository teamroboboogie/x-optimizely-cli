var fs = require("fs");
var path = require("path");
var _ = require("lodash");

var Experiment = require("../experiment");
var Variation = require("../variation");
var logger = require("../logger");

var createLocalVariation = function(experiment, folder, name, weight, callback) {
  var success = Variation.create({
    name: name,
    weight: weight
  }, path.join(experiment.baseDir, folder));
  if (success) {
    if (!_.isFunction(callback)) {
        logger.log("info", "created variation " + name + " in folder " + folder);
        logger.log("info", "confirm the weights of each variation add up to 10000");s
    } else {
        callback(success);
    }
  } else {
    logger.log("error", "failed to create variation");
  }
};

module.exports = function(identifier, folder, name, weight, callback) {
  var experiment = Experiment.locateAndLoad(identifier);
  if (experiment) {
    createLocalVariation(experiment, folder, name, weight, callback);
  } else {
    console.log("no local experiment found by: " + identifier + ". Please specify experiment folder, id or name");
  }
};
