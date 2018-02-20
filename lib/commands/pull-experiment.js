/**
 * Module depencies
 */
var logger = require("../logger");
var OptimizelyClient = require('optimizely-x-node-client');
var readConfig = require("../read-config");
var Project = require("../project");
var createExperiment = require("../commands/create-experiment");
var createVariation = require("../commands/create-variation");
var Variation = require("../variation");

var path = require('path');
var fileUtil = require("../file-util");

/**
 * pull all pages
 *
 * @param <String> id
 * @param <Program> program
 * @param <Project> project
 */


var buildVariations = function(filename, experiment, inboundVariations){
    var fileVariationIds = [];
    logger.log('info', experiment.getVariations())
    for (var i = 0; i < experiment.getVariations().length; i++) { // NOTE for each variation file
        var varPath = path.resolve(process.cwd(), experiment.getVariations()[i]);
        var fileVariation = new Variation({}, path.dirname(varPath));
        if (!fileVariation.loadFromFile()) throw new Error('Could not load variation from file: ' + fullVarPath);
        fileVariationIds.push(fileVariation.attributes.id)
    }


    for (var i = 0; i < experiment.getVariations().length; i++) { // NOTE for each variation file
        var varPath = path.resolve(process.cwd(), experiment.getVariations()[i]);
        var fullVarPath = path.dirname(varPath);
        var fileVariation = new Variation({}, fullVarPath);
        if (!fileVariation.loadFromFile()) throw new Error('Could not load variation from file: ' + fullVarPath);

        for (var j = 0; j < inboundVariations.length; j++) { // NOTE for each API variation
            var thisVariationId = inboundVariations[j].variation_id;
            if(
                fileVariationIds.indexOf(thisVariationId) === -1 || //if this variation_id doesn't live in a file
                (fileVariationIds.indexOf(thisVariationId) > -1 && //Or if it does
                fileVariation.attributes.id === thisVariationId) // and it is currently being looped
            ) {
                var writeFile = "variation-"+j;
                if (j === 0) { // NOTE if Original does not have an id, apply the id JS/CSS
                    writeFile = "original"
                }
                createVariation(filename, writeFile, inboundVariations[j].name, inboundVariations[j].weight, function(variation){
                    // logger.log('info', JSON.stringify(inboundVariations[j]));
                    // console.log(thisVariationId);
                    for (var k = 0; k < inboundVariations[j].actions.length; k++) {
                        for (var l = 0; l < inboundVariations[j].actions[k].changes.length; l++) {
                            var theChange = inboundVariations[j].actions[k].changes[l]
                            if (theChange.type === "custom_css") {
                                fileUtil.writeText(path.join(fullVarPath, "variation.css"), theChange.value);
                            } else if (theChange.type === "custom_code") {
                                fileUtil.writeText(path.join(fullVarPath, "variation.js"), theChange.value);
                            }
                        }
                    }

                    variation.attributes.id = thisVariationId;
                    variation.saveAttributes();
                });
            }
        }
    }

    logger.log('info', "Experiment: "+experiment.attributes.id+" pulled into "+filename)
}

var pullExperiment = function(filename, experimentId) {
    // logger.log('info', experimentId);
    var project = new Project({}, path.normalize(this.baseDir + "/.."));
    project.loadFromFile();
    var id = project.attributes.id;
    var self = this;
    var optClient;
    readConfig("token")
        .then(function(token) {
            optClient = new OptimizelyClient({
                accessToken: token
            });
            return optClient.getExperiment({
                "id": experimentId
            }).then(function(data) {
                createExperiment(filename, data.payload.name, ""+data.payload.page_ids, function(experiment){
                    experiment.attributes.id = parseInt(experimentId);
                    experiment.saveAttributes();
                    buildVariations(filename, experiment, data.payload.variations)
                });
            });
        })
        .catch(function(e) {
            logger.log("error", "unable to pull project: " + e.message);
            console.error(e.stack);
        });
};

module.exports = function(filename, experimentId) {
    // logger.log("info", filename)
    pullExperiment(filename, experimentId);
};
