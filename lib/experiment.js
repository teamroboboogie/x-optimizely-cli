var glob = require('glob');
var fs = require('fs');
var path = require('path');
var util = require('util');
var _ = require("lodash");

var fileUtil = require("./file-util");
var logger = require("./logger");
var Variation = require("./variation");
var OptCLIBase = require("./optcli-base");
var Project = require("./project");
var Variation = require("./variation");

function Experiment(attributes, baseDir) {
    Experiment.super_.call(this, attributes, baseDir);
}

Experiment.JSON_FILE_NAME = "experiment.json";
Experiment.JS_FILE_NAME = "global.js";
Experiment.CSS_FILE_NAME = "global.css";

util.inherits(Experiment, OptCLIBase);

Experiment.create = function(attrs, baseDir) {
    //create directory
    fileUtil.writeDir(baseDir);

    fileUtil.writeText(path.join(baseDir, Experiment.CSS_FILE_NAME));
    fileUtil.writeText(path.join(baseDir, Experiment.JS_FILE_NAME));
    fileUtil.writeJSON(path.join(baseDir, Experiment.JSON_FILE_NAME), attrs);

    if (!fs.existsSync(baseDir + "/original")) {
        Variation.create({
            name: "Original",
            weight: "10000"
        }, baseDir + "/original");
    }

    return new Experiment(attrs, baseDir);
}

Experiment.locateAndLoad = function(identifier) {
    var experiment = null;
    if (fs.existsSync(identifier) && fs.lstatSync(identifier).isDirectory()) {
        experiment = new Experiment({}, identifier);
        if (!experiment.loadFromFile()) return false;
    } else {
        var attrs = {};
        glob.sync("**/" + Experiment.JSON_FILE_NAME).forEach(function(jsonFile) {
            if (experiment) return;
            try {
                var attrs = JSON.parse(fs.readFileSync(jsonFile), {
                    encoding: "utf-8"
                });
                if (identifier === String(attrs.id) || identifier === attrs.name) {
                    experiment = new Experiment(attrs, path.dirName(jsonFile));
                    return experiment;
                }
            } catch (e) {
                logger.log("warn", "could not parse " + jsonFile);
                return false;
            }
        })
    }
    return experiment;
}

Experiment.prototype.getJSPath = function() {
    return this.getFilePath(Experiment.JS_FILE_NAME);
}

Experiment.prototype.getCSSPath = function() {
    return this.getFilePath(Experiment.CSS_FILE_NAME);
}

Experiment.prototype.getCSS = function() {
    return fileUtil.loadFile(this.getCSSPath()) || "";
}

Experiment.prototype.getJS = function() {
    return fileUtil.loadFile(this.getJSPath()) || "";
}

Experiment.prototype.getVariations = function() {
    return glob.sync(this.baseDir + '/**/' + Variation.JSON_FILE_NAME);
}

Experiment.prototype.checkForPages = function(client) {
    var project = new Project({}, path.normalize(this.baseDir + "/.."));
    project.loadFromFile();
    var theClient = client;
    var self = this;

    if (self.attributes.page_ids.length === 0) {
        logger.log('info', 'No page id added. To view variations within optimizely UI, please add at least one within experiment.json')
    }
    return Promise.resolve(client); //Just move on
}

Experiment.prototype.updateVariationIds = function(data){
    var variations = this.getVariations();
    variations.forEach(function(variationPath) {
        var varPath = path.resolve(process.cwd(), variationPath);
        varPath = path.dirname(varPath);
        var variation = new Variation({}, varPath);
        if (!variation.loadFromFile()) throw new Error('Could not load variation from file: ' + varPath);
        for (var i = 0; i < data.payload.variations.length; i++) {
            if (variation.attributes.name === data.payload.variations[i].name) {
                variation.attributes.id = data.payload.variations[i].variation_id
            }
        }
        variation.saveAttributes();
    });
}

Experiment.prototype.generateExperimentArguments = function(isCreate){
    //find the project - assume it's one directory above
    var project = new Project({}, path.normalize(this.baseDir + "/.."));
    project.loadFromFile();

    var theExperiment = this;
    //create new experiment
    var expArgs = {
        "project_id": project.attributes.id,
        "name": theExperiment.attributes.name,
        "type": "a/b",
        "holdback": theExperiment.attributes.holdback, //QUESTION should we support holdback as an attribute
        "variations": [],
        "changes": [{
                "type": "custom_css",
                "value": theExperiment.getCSS()
            },
            {
                "type": "custom_code",
                "value": theExperiment.getJS()
            },
        ],
        "page_ids": theExperiment.attributes.page_ids
    };
    if (isCreate) {
        expArgs.metrics = [{
            "aggregator": "sum",
            "field": "revenue",
            "scope": "visitor",
            "winning_direction": "increasing"
        }];
    }

    var variations = theExperiment.getVariations();

    if (theExperiment.attributes.page_ids.length === 0) throw new Error ('Experiment should have at least one page_id in experiment.json')
    if (variations.length == 0) throw new Error('Experiment should have at least one variation');

    var variationNames = []
    variations.forEach(function(variationPath) {
        var varPath = path.resolve(process.cwd(), variationPath);
        varPath = path.dirname(varPath);
        var variation = new Variation({}, varPath);

        if (!variation.loadFromFile()) throw new Error('Could not load variation from file: ' + varPath);
        if (variationNames.indexOf(variation.attributes.name) !== -1) throw new Error('Unique names are required, rename: ' + variation.attributes.name);
        variationNames.push(variation.attributes.name);

        var variationArgs = {
            "weight": parseInt(variation.attributes.weight),
            "name": variation.attributes.name,
            "variation_id": variation.attributes.id,
            "actions": []
        };

        for (var i = 0; i < theExperiment.attributes.page_ids.length; i++) {
            if (variation.getJS() || variation.getCSS()) {
                variationArgs.actions.push(
                    {
                        "changes": [],
                        "page_id": theExperiment.attributes.page_ids[i]
                    }
                );

                if (variation.getJS()) {
                    variationArgs.actions[i].changes.push({
                        "type": "custom_code",
                        "value": variation.getJS()
                    });
                }

                if (variation.getCSS()) {
                    variationArgs.actions[i].changes.push({
                        "type": "custom_css",
                        "value": variation.getCSS()
                    });
                }
            }
        }

        expArgs.variations.push(variationArgs);
    });

    // console.log("%o", JSON.stringify(expArgs));
    // logger.log("info", expArgs)
    return expArgs;
};

Experiment.prototype.createRemote = function(client) {
    var self = this;
    return client.createExperiment({}, self.generateExperimentArguments(true)).then(function(data) {
                logger.log("info", "creating remote experiment");
                //update the id
                self.attributes.id = data.payload.id;
                self.saveAttributes();

                self.updateVariationIds(data);
                logger.log("info", "created remote experiment: " + data.payload.id);
            }, function(error) {
                logger.log("error", error.message);
            });
}

Experiment.prototype.updateRemote = function(client) {
    //update existing experiment
    logger.log("info", "updating remote experiment");

    var self = this;
    return client.updateExperiment({
            "id": self.attributes.id
        }, self.generateExperimentArguments()).then(function(data) {
            self.updateVariationIds(data);
            logger.log("info", "updated remote experiment: " + data.payload.id);
        }, function(error) {
            logger.log("error", error.message);
        }).catch(function(e) {
            logger.log("error", "unable to update remote experiment: " + e.message);
            console.error(e.stack);
        });
}

Experiment.prototype.saveAttributes = function() {
    fileUtil.writeJSON(path.join(this.baseDir, Experiment.JSON_FILE_NAME), this
        .attributes);
}

Experiment.prototype.getOptcliURL = function() {
    var optcliURL;
    var appendToURL;
    optcliURL = this.attributes.edit_url;
    optcliURL.indexOf('?') === -1 ?
        appendToURL = '?optcli=activate' :
        appendToURL = '&optcli=activate';
    optcliURL.indexOf('#') === -1 ?
        optcliURL += appendToURL :
        optcliURL = optcliURL.replace('#', appendToURL + '#');

    return optcliURL;
}

module.exports = Experiment;
