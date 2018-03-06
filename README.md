# Optimizely X Command Line Interface

x-optimizely-cli (`xoptcli`) is a command line tool giving developers the power to build Optimizely X experiments, link pages to experiments, create variations, and push your experiments with variations and pages intact to Optimizely's X platform using the Optimizely v2 REST API.

x-optimizely-cli includes a command line executable that also integrates with either [Tampermonkey](https://chrome.google.com/webstore/detail/tampermonkey/dhdgffkkebhmkfjojejmpbldmpobfkfo?hl=en) (Google Chrome) or [Greasemonkey](https://addons.mozilla.org/en-US/firefox/addon/greasemonkey/) (Firefox) extension for local development.

x-optimizely-cli was developed by [roboboogie](https://teamroboboogie.com) to increase our experimentation velocity. We like to build tests using our editors and using git for version control. This makes it much simpler, faster and more familiar. Thanks to [FunnelEnvy](http://www.funnelenvy.com/) for giving us such a great product in [optimizely-cli](http://www.funnelenvy.com/optimizely-cli/) for Optimizely Classic from which we based this tool on. We also want to thank [Web Marketing ROI](https://www.webmarketingroi.com/) for releasing [optimizely-x-cli](https://github.com/webmarketingroi/optimizely-x-cli) which was a great reference from which our final tool has been put together.

Bonus: If you already are using optimizely-cli, you can run x-optimizely-cli in the same directory.

## Getting started.

#### Dependencies
You'll need to have node.js installed locally to run `xoptcli`. To view variations locally you can use either the Tampermonkey or Greasemonkey extensions. We've included a script at the end to help running your tests locally with the aformentioned extensions.

#### Installation
This will install x-optimizely-cli on your system and give you access to the `xoptcli` executable globally.
```
npm i -g @teamroboboogie/x-optimizely-cli
```

#### Setting up your testing directory:
Create a directory to host your Optimizely project locally and change directories.
```
cd ~
mkdir xoptcli-test
cd ~/xoptcli-test
```
## Commands
#### View help page
Lets you view available commands.
```
xoptcli or xoptcli -h, -help
```
- Options:
  - `-h, --help` - view available commands
<br>

#### Set Token for API calls
First [generate an API token](https://help.optimizely.com/Integrate_Other_Platforms/Generate_a_personal_access_token_in_Optimizely_X_Web), then run this command. This will create a hidden directory labeled `.optclix` with your API token.
```
xoptcli set-token <token>
```
- Arguments:
  - `<token>` - API token generated through Optimizely.
  - Sample Call: `xoptcli set-token 1:7robo847SYSwow9384GS-Fr488GJslkjLKUIJNkjlkjis_ioi_2`
<br>

#### Initialize a new Optimizely X project locally.
Initializes a new Optimizely X project in the directory you are currently in, creating a project.json file with the `project_id`.
```
xoptcli init <project_id>
```
- Arguments:
  - `<project_id>` – The project ID from optimizely where you want to host experiments in this directory. Required.
    - Type: integer. Example: 1740413223
  - Sample Call: `xoptcli init 1740413223`
<br>

#### Create a local experiment
Creates a local experiment with an "Original" variation that has a starting weight or traffic allocation of 100%. Optimizely uses a scale of 10000, so that's what you will see in original/variation.json. <page_ids> are attached to all variations using experiment.json.
```
xoptcli experiment <folder> <name> <page_ids>
```
- Arguments:
  - `<folder>` – The name of the local directory for the new experiment. Required.
    - Type: string. Example: "robo-test"
  - `<name>` – The name of the new experiment you will see in Optimizely X. Required.
    - Type: string. Example: "Test3:Funnel"
  - `<page_ids>` - As many page IDs, but at least one, which to attach to your experiment. Page IDs must be created through Optimizely X before adding them to your experiment. Required.
    - Type: string of comma separated values. Example: "10198685817, 10248681248"
  - Sample Call: `xoptcli experiment "robo-test" "Test3:Funnel" "10198685817,10248681248"`
<br>

#### Create a local variation
Creates a local variation and builds the necessary source files. Setting <traffic_allocation> here will necessitate an update to the other variations so that total <traffic_allocation> adds up to 10000 before pushing to Optimizely.
```
xoptcli variation <experiment> <folder> <name> <traffic_allocation>
```
- Arguments:
  - `<experiment>` - The directory for this experiment. Required.
    - Type: directory name as a path. Example: roboboogie-test/
  - `<folder>` - The name of the local folder for the new variation. Required.
    - Type: string. Example: "variation-1"
  - `<name>` – The name of the new variation you will see in Optimizely X. Required.
    - Type: string. Example: "v:1 variation directory name"
  - `<traffic_allocation>` - The weight or traffic allocation allotted to the variation with a total <traffic_allocation> adding up to 10000.
    - Type: string. Example: "5000"
  - Sample call: `xoptcli variation roboboogie-test/ "variation-1" "v:1 variation directory name" "5000"`
<br>

#### Push experiment to Optimizely X
Creates or udates an experiment and all variation to your Optimizely X project. On create, it will assign a default metric "Overall Revenue", because it is required by the API to have a metric.
```
xoptcli push-experiment <path>
```
- Options:
  - `-m, --metrics` – push with metrics (will overwrite remote metrics). 
- Arguments:
  - `<path>` - the path to the directory of the experiment you want to push.
    - Type: directory name as a path. Example: roboboogie-test/
  - Sample Call: `xoptcli push-experiment roboboogie-test/`
<br>

#### Pull Experiment
Pulls a specific experiment to a specific file, allowing you to sync whats on Optimizely X with your local project folder. As of right now we do not support multiple versions of code for different pages in the same experiment (it's even confusing to type that out!).
```
xoptcli pull-experiment <folder> <experiment_id>
```
- Options:
  - `-m, --metrics` – pull with metrics (syncing with local metrics). Unfortunately the experiment api does not return the name of a metric. If it exists locally it will retain the name, but otherwise it may be preferable to search for the event_id within your "pull-pages -m" output.
- Arguments:
  - `<folder>` - name of folder where you want put the experiment, will write over experiment. Required.
    - Type: string. Example: "my-great-experiment"
  - `<experiment_id>` - id of experiment you want pulled.
    - Type: integer. Example: 11124913096
  - Sample Call: `xoptcli pull-experiment "my-great-experiment" 11124913096`
<br>

#### Pull all pages for a project
Pulls all pages for a project into a single json file. This is mostly for reference.
```
xoptcli pull-pages [options] <file>
```
- Options:
  - `-m, --metrics` – Pull all metrics with pages.
- Arguments:
  - `<file>` - name of file where you want to store the json dump. Required.
    - Type: string. Example: "pages.json"
  - Sample Call: `xoptcli pull-pages -m pages.json`
<br>

#### Host variation locally
Host a variation locally. Add `xoptcli=activate` as a parameter after you've run the command below and your preferred extension will inject the CSS and JS of the variation you choose. Or point your browser at http(s)://localhost:8080 (default port) for usage info. If you are using the `-s` option, your browser may need you to give it permission to load unsafe scripts before script injection can take place. You can do that by going to http(s)://localhost:8080 and toggeling the advanced section and then clicking the "proceed to unsafe localhost" option.
```
xoptcli host [option] <path> [port]
```
- Options:
  - -s --ssl – host over https
- Arguments:
  - `<path>` - the path to the directory of the variation you want to host. Required.
    - Type: directory name as a path. Example: roboboogie-test/variation-1
  - `<port>` - the port where you want to host the server. Optional: Default is 8080.
    - Type: integer. Example: 8082
  - Sample Call: `xoptcli host -s roboboogie-test/variation-1/ 8082`
<br>

### In Progress:

#### Tab Completion
If you're using a mac and have a bash_profile, you can get access to tab completion by running the following:
```
xoptcli completion >> ~/.bash_profile && source ~/.bash_profile
```
This will add code to your bash_profile to make the commands available and then tell bash to source your newly updated profile. If you are using a mac and don't have a bash_profile, check out [this one](https://github.com/supertopher/dotfiles/blob/master/.bash_profile) that updates your git prompts, letting you know when you need to push code.
<br>

<!-- darius -->
If a remote variation doesn't exist locally, a folder will be created for it. Defaulting to something like "variation-1", depending on the index on the remote. eg, a variation in the first slot within optimizely gui will always be named "original in a local variation"

---

As promised, here is an injection script for local development from FunnelEnvy that you can add to Tampermonkey or Greasemonkey:
```
// ==UserScript==
// @name         Optimizely-cli Injection Script
// @author       FunnelEnvy
// @homepage     http://www.funnelenvy.com/optimizely-cli
// @source       https://github.com/funnelenvy/optimizely-cli
// @namespace    optcli
// @description  Inject local experiment JS / CSS into a Chrome page for development
// @include      /xoptcli=activate/
// @require      http://ajax.googleapis.com/ajax/libs/jquery/1.6.4/jquery.js
// ==/UserScript==

var scriptElement = document.createElement('script');
scriptElement.type = 'text/javascript';
scriptElement.src =  '//localhost:8080/variation.js';
document.head.appendChild(scriptElement);

var stylesheet = document.createElement('link');
stylesheet.rel = 'stylesheet';
stylesheet.href = '//localhost:8080/variation.css';
document.head.appendChild(stylesheet);
```

Copyright and license
Code copyright 2018 roboboogie. Released under the Apache 2.0 License.
