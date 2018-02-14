/**
 * Module depencies
 */
var logger = require("../logger");
var OptimizelyClient = require('optimizely-x-node-client');
var readConfig = require("../read-config");
var Project = require("../project");


/**
 * pull a remote project down via the api
 * optionally retrieve experiments and variations
 * and write project.json
 *
 * @param <String> id
 * @param <Program> program
 * @param <Project> project
 */
var pullRemoteProject = function(id, program) {
  logger.log("info", "pulling remote Optimizely project " + id);
  var optClient;
  readConfig("token")
    .then(function(token) {
      optClient = new OptimizelyClient({accessToken:token});
      return optClient.getProject(id)
        .then(function(data) {
          var projectArgs = {
              'id' : data.payload.id,
              'name' : data.payload.name,
              'include_jquery' : data.payload.web_snippet.include_jquery
          };
          var theProject = new Project(projectArgs);
          return theProject.save();
        });
    })
    .catch(function (e) {
      logger.log("error", "unable to pull project: " + e.message);
      console.error(e.stack);
    });
};

var createLocalProject = function(id, program) {
  var defaultAttrs = {
    id: parseInt(id),
    web_snippet: {
        include_jquery: !!program.jquery
    }
  };
  var theProject = new Project(defaultAttrs, "./");
  return theProject.save();
};

/**
 * Initialize a remote, pulled or local (default) project
 *
 * @param <String> id
 * @param <Program> program
 */
module.exports = function(id, program) {
  logger.log("info", "initializing project " + id);
  if (program.remote) {
    pullRemoteProject(id, program);
  } else {
    createLocalProject(id, program);
  }
  logger.log("info", "initialized project " + id);
};
