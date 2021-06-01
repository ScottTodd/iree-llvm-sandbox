# MLIR Pipeline Visualizer

Tools to visualize which dialects exist throughout MLIR compilation pipelines.

Goal: interactive chart showing how many ops of each dialect exist over time

x-axis: compilation stages (linearized by disabling threading)
y-axis: number of ops
one series per dialect

## Current Usage

* Build IREE
* Run `iree-opt iree_input.mlir -iree-transformation-pipeline -iree-hal-target-backends=dylib-llvm-aot -mlir-disable-threading -print-ir-after-all -print-ir-module-scope -mlir-elide-elementsattrs-if-larger=8 2> out_summary.txt > /dev/null`
* Install nodejs
* Run `node visualize.js --input=samples/iree_ir.mlir > out_summary.txt`
  * Sample output: https://gist.github.com/ScottTodd/75623c1bebd52dc005d0466033155232

## Future Plans

* MLIR instrumentation in C++ that produces JSON which contains statistics after each pass
  * post-processing a dump of `-print-ir-after-all -print-ir-module-scope` is inefficient and inaccurate, better to run with a native understanding of MLIR and avoid intermediate outputs
* JavaScript that visualizes a JSON file with those statistics (maybe based on [this](https://observablehq.com/@mbostock/revenue-by-music-format-1973-2018))
* Interactive / more detailed charts
  * Add dialect overview descriptions to each series
  * Add pass overview descriptions to each time point
  * Connect time points with MLIR snippets in CodeMirror views
  * Select a series -> highlight ops in that dialect within the CodeMirror view
  * Select an op -> show which ops later on in compilation originated from that op
