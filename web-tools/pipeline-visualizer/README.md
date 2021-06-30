# MLIR Pipeline Visualizer

Tools to visualize which dialects exist throughout MLIR compilation pipelines.

Goal: interactive chart showing how many ops of each dialect exist over time

x-axis: compilation stages (linearized by disabling threading)
y-axis: number of ops
one series per dialect

**Demo**: https://scotttodd.github.io/iree-llvm-sandbox/web-tools/pipeline-visualizer/

## Current Usage

Data prep:

* Check out this branch from a fork of LLVM:
  https://github.com/scotttodd/llvm-project/tree/dataviz
* Run with some `*-opt` or `*-translate` tool with
  `-mlir-disable-threading -pass-data-visualization`
* Copy the output from `llvm::dbgs()` to a JSON file (TODO: add a flag -> file)
  * segment outputs from different PassPipelines by searching for `\n\]\[`

TODO: find a way to land that code ;)

Running the visualization:

* Check out _this_ project and start a webserver (e.g. `python3 -m http.server`)
  in this directory
* Copy your .json file into `data/`
* Load the index.html page in your web browser and set `?data=./data/file_name.json`

TODO: support drag-and-drop on the hosted page

## Future Plans

* Interactive / more detailed charts
  * Add dialect overview descriptions to each series
  * Add pass overview descriptions to each time point
  * Connect time points with MLIR snippets in CodeMirror views (from `-print-ir-after-all`)
  * Select a series -> highlight ops in that dialect within the CodeMirror view
  * Select an op -> show which ops later on in compilation originated from that op
