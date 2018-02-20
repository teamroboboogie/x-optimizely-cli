#!/usr/bin/env node

var program = require("commander");
var tabtabCommander = require('@teamroboboogie/tabtab-commander');
var path = require("path");
var xOptcliPackage = require(path.join(__dirname, "../", "package.json"));
var logger = require("../lib/logger.js");

/* commands */
var loadCommand = function(cmd) {
  var self = this;
  return function() {
    require("../lib/commands/" + cmd)
      .apply(self, arguments);
  }
}

//default log level
logger.debugLevel = 'info';

function increaseVerbosity(v) {
  logger.debugLevel = 'debug';
}

program
  .version(xOptcliPackage.version)
  .usage(" - " + xOptcliPackage.description)
  .description(xOptcliPackage.description)
  .option("-v --verbose", "show debug output", increaseVerbosity)

program
  .command("experiment <folder> <name> <page_ids>")
  .description("Create Local Experiment")
  .action(loadCommand("create-experiment"));

program
  .command("host <path> [port] [host]")
  .option("-s --ssl", "SSL")
  .option("-o --open", "Open the index page")
  .description("Host variation locally")
  .action(loadCommand("host"));

program
  .command("init <project_id>")
  .description("Initialize an Optimizely X project.")
  .option("-r --remote", "initialize from remote project")
  .option("-j --jquery", "include jquery (local project only)")
  .action(loadCommand("init-project"));

program
  .command("pull-pages <file>")
  .description("pulls all pages for project into json file")
  .option("-m --metrics", "build with metrics")
  .action(loadCommand("pull-pages"));

program
  .command("push-experiment <path>")
  .description("Push an experiment to Optimizely X")
  .action(loadCommand("push-experiment"));

program
  .command("set-token <token>")
  .description("Set the Optimizely X API token in a project folder")
  .action(loadCommand("set-token"));

program
  .command("variation <experiment> <folder> <name> <traffic_allocation>")
  .description("Create Local Variation")
  .action(loadCommand("create-variation"));

program
    .command("pull-experiment <file> <experiment_id>")
    .description("pulls specific experiment to file")
    .action(loadCommand("pull-experiment"));

//Show help if no arguments are passed
if (!process.argv.slice(2).length) {
  program._name = process.argv[1];
  program._name = program._name.substr(program._name.lastIndexOf("/") + 1);
  program.outputHelp();
}

tabtabCommander.init(program, 'xoptcli');

program.parse(process.argv);
