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
var fs = require('fs');


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
    for (var i = 0; i < experiment.getVariations().length; i++) { // NOTE for each variation file
        var varPath = path.resolve(process.cwd(), experiment.getVariations()[i]);
        var fileVariation = new Variation({}, path.dirname(varPath));
        if (!fileVariation.loadFromFile()) throw new Error('Could not load variation from file: ' + fullVarPath);
        fileVariationIds.push(fileVariation.attributes.id)
    }

    var builtVariationIds = []
    for (var i = 0; i < experiment.getVariations().length; i++) { // NOTE for each variation file
        var varPath = path.resolve(process.cwd(), experiment.getVariations()[i]);
        var fullVarPath = path.dirname(varPath);
        var fileVariation = new Variation({}, fullVarPath);
        if (!fileVariation.loadFromFile()) throw new Error('Could not load variation from file: ' + fullVarPath);

        for (var j = 0; j < inboundVariations.length; j++) { // NOTE for each API variation
            var thisVariationId = inboundVariations[j].variation_id;
            if(
                builtVariationIds.indexOf(thisVariationId) === -1 &&
                fileVariationIds.indexOf(thisVariationId) === -1 || // if this variation_id doesn't live in a file
                (fileVariationIds.indexOf(thisVariationId) > -1 && // Or if it does
                fileVariation.attributes.id === thisVariationId) // and it is currently being looped
            ) {
                builtVariationIds.push(thisVariationId)

                logger.log('info', inboundVariations[j].name)
                //IF this file exists locally, write to that one.
                var writeFile = ""
                if (fileVariation.baseDir) {
                    writeFile = ""+fileVariation.baseDir.split("/").slice(-1)
                } else {
                    // if the remote's id is not found locally

                    // if the remote's name is Original,
                    if (inboundVariations[j].name === "Original") {
                        // TOD not worrie about below
                        // TODO if there is a file called original, which doesn't have an ID
                        writeFile = "original"
                    }



                    // logger.log("info", fs.existsSync(path.join(fullVarPath, "variation-1")))
                    // else if (true) {
                    //     fs.existsSync(path.join(fullVarPath, "variation-1"))
                    // }
                    // if variation-(index) doesn't exist
                        // write to variation-(index)
                    // else loop untill variation-(index) doesn't exist
                }
                logger.log("info", path.join(fullVarPath, "variation-2"))

                createVariation(filename, writeFile, inboundVariations[j].name, ""+inboundVariations[j].weight, function(variation){
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

                    logger.log('info', "Variation "+variation.attributes.name+" pulled into "+filename+ "/"+writeFile+" (variation id "+variation.attributes.id+")");
                });
            }
        }
    }
}

var pullExperiment = function(filename, experimentId) {
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
                    for (var l = 0; l < data.payload.changes.length; l++) {
                        var theChange = data.payload.changes[l]
                        if (theChange.type === "custom_css") {
                            fileUtil.writeText(path.join(filename, "global.css"), theChange.value);
                        } else if (theChange.type === "custom_code") {
                            fileUtil.writeText(path.join(filename, "global.js"), theChange.value);
                        }
                    }

                    experiment.attributes.id = parseInt(experimentId);
                    experiment.saveAttributes();

                    logger.log('info', "Experiment "+experiment.attributes.name+" pulled into "+filename+ " (id "+experiment.attributes.id+")")
                    buildVariations(filename, experiment, data.payload.variations)
                });
            });
        })
        .catch(function(e) {
            logger.log("error", "unable to pull project: " + e.message);
            if (e.stack) {
            console.error(e.stack);
            }
        });
};

module.exports = function(filename, experimentId) {
    // logger.log("info", filename)
    pullExperiment(filename, experimentId);
};
