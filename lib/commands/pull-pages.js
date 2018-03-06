/**
 * Module depencies
 */
var logger = require("../logger");
var OptimizelyClient = require('optimizely-x-node-client');
var readConfig = require("../read-config");
var Project = require("../project");
var path = require('path');
var fileUtil = require("../file-util");

var pageObj = [];
var iPages = 0;
var metricObj = [];
//can you believe metric pages array starts at 1?
var iMetrics = 1;

// Pages.JS_FILE_NAME = "optPages.json";
/**
 * pull all pages
 *
 * @param <String> id
 * @param <Program> program
 * @param <Project> project
 */

var buildMetrics = function(id, filename, pages){
    var perPage = 100;
    readConfig("token")
        .then(function(token) {
            optClient = new OptimizelyClient({
                accessToken: token
            });
            return optClient.getEvents({
                "project_id": id,
                "per_page": perPage,
                "page": iMetrics
            }).then(function(data) {
                if (data.payload.length === perPage) {
                    metricObj = metricObj.concat(data.payload);
                    iMetrics++;
                    buildMetrics(id, filename, pages);
                } else {
                    metricObj = metricObj.concat(data.payload);
                    var metrics = metricObj;
                    var builtJson = [];
                    builtJson.custom_metrics = [];
                    for (var i = 0; i < pages.length; i++) {
                        pages[i].metrics = [];
                        for (var j = 0; j < metrics.length; j++) {
                            if (metrics[j].page_id === pages[i].id) {
                                metrics[j].event_id = metrics[j].id;
                                pages[i].metrics.push(metrics[j])
                            }
                        }
                        builtJson.push(pages[i]);
                    }
                    for (var k = 0; k < metrics.length; k++) {
                        if (metrics[k].event_type === "custom" || metrics[k].event_type === "pageview") {
                            metrics[k].event_id = metrics[k].id;
                            builtJson.custom_metrics.push(metrics[k]);
                        }
                    }
                    builtJson.push(builtJson.custom_metrics);
                    fileUtil.writeJSON(filename, builtJson);
                }
            });

        })
        .catch(function(e) {
            logger.log("error", "unable to pull project: " + e.message);
            console.error(e.stack);
        });
}

var pullAllPages = function(filename, isMetrics) {
    var perPage = 100;
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
            return optClient.getPages({
                "project_id": id,
                "per_page": perPage,
                "page": iPages
            }).then(function(data) {
                if (data.payload.length === perPage) {
                    pageObj = pageObj.concat(data.payload);
                    iPages++;
                    pullAllPages(filename, isMetrics);
                } else {
                    pageObj = pageObj.concat(data.payload);
                    if (isMetrics) {
                        buildMetrics(id, filename, pageObj)
                    } else {
                        fileUtil.writeJSON(filename, pageObj)
                    }
                }
            });

        })
        .catch(function(e) {
            logger.log("error", "unable to pull project: " + e.message);
            console.error(e.stack);
        });
};

module.exports = function(filename, programs) {
    logger.log("info", filename)
    pullAllPages(filename, programs.metrics);
};
