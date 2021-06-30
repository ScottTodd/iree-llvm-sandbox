# MLIR Pipeline Visualizer

Tools to visualize which dialects exist throughout MLIR compilation pipelines.

Goal: interactive chart showing how many ops of each dialect exist over time

x-axis: compilation stages (linearized by disabling threading)
y-axis: number of ops
one series per dialect

## Current Usage

* Check out this branch from a fork of LLVM:
  https://github.com/scotttodd/llvm-project/tree/dataviz
* Run with some `*-opt` or `*-translate` tool with
  `-mlir-disable-threading -pass-data-visualization`
* Copy the output from `llvm::dbgs()` to a JSON file (TODO: add a flag -> file)
  * segment outputs from different PassPipelines by searching for `\n\]\[`

## Future Plans

* MLIR instrumentation in C++ that produces JSON which contains statistics after each pass
  * post-processing a dump of `-print-ir-after-all -print-ir-module-scope` is inefficient and inaccurate, better to run with a native understanding of MLIR and avoid intermediate outputs
* JavaScript that visualizes a JSON file with those statistics (maybe based on [this](https://observablehq.com/@mbostock/revenue-by-music-format-1973-2018) or [this](https://canvasjs.com/javascript-charts/stacked-column-chart/))
* Interactive / more detailed charts
  * Add dialect overview descriptions to each series
  * Add pass overview descriptions to each time point
  * Connect time points with MLIR snippets in CodeMirror views (from `-print-ir-after-all`)
  * Select a series -> highlight ops in that dialect within the CodeMirror view
  * Select an op -> show which ops later on in compilation originated from that op
