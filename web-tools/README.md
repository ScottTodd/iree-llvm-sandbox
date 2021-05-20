# Prototype Web Tools for MLIR / IREE

This folder contains a set of prototype web-based tools for interacting with MLIR, inspired by tools like [Compiler Explorer](https://godbolt.org/), [JSFiddle](https://jsfiddle.net/), and [WasmFiddle](https://wasdk.github.io/WasmFiddle/).

The hope is to shine some light on the possibilities in this space, generate interest, and see which directions the community wants to explore further.

## Motivating Use Cases

* Interactive documentation for passes
  * Start with a few sample inputs then let readers edit them to see how the output changes
* Compiler explorer
  * Freeform [input, flags, tool] -> output(s) playground
* Pipeline inspection
  * Parse through step-by-step compilation output then create interactive visualizations
  * Highlight compilation stages with interesting properties (e.g. dialect conversion, memory planning)
  * Visualize statistics like how many ops in each dialect exist after each pass or how much IR exists in a top level module
  * Show/hide generic passes like canonicalize/CSE
* Bug reproducers
  * Share a URL that runs a tool at a specific commit on an input file with a set of flags

See https://mlir.llvm.org/getting_started/openprojects/ for other other ideas.

### Background

On IREE we published sample compilation output for some representative models as reference material (see one snapshot [here](https://github.com/google/iree/tree/99c6ce409783eaffb37dd46f3f4a6ef761556f99/docs/ir_examples)). These pages were useful to point at when discussing compilation stages, when looking for non-test examples of certain IR patterns, etc.

We also had some early tools that put a slider UI on compilation stages letting you swipe through and visually inspect as progressive optimizations were made.

## Technical Foundations

TODO(scotttodd): Web tech, Emscripten, syntax highlighting, etc.

<!-- Emscripten -->
<!-- Why the web? -->
<!-- Modular tools -->
<!-- Syntax highlighting -->
<!-- Code editor -->

### Compiling MLIR-based tools through Emscripten

General references:

* Install `emsdk`: https://emscripten.org/docs/getting_started/downloads.html
* Read https://emscripten.org/docs/compiling/Building-Projects.html
* LLVM cross compilation: https://llvm.org/docs/HowToCrossCompileLLVM.html
* LLVM CMake options: https://llvm.org/docs/CMake.html

Project specific guides:

* MLIR: [gist](https://gist.github.com/ScottTodd/f30d9d26254de82648de37d5ed445cbc)
* IREE: [gist](https://gist.github.com/ScottTodd/7898981998cefb60902d4fbc8a471ccf)

#### Considerations

Binary size

Build type (Debug/Release)

Optional components (e.g. frontends/backends)

### MLIR Flags

| Flag                                    | Use here                                                    |
|-----------------------------------------|-------------------------------------------------------------|
| `-print-ir-after-all`                   | Print the full output of a compilation pipeline             |
| `-mlir-disable-threading`               | Run single threaded for consistent ordering                 |
| `-mlir-elide-elementsattrs-if-larger=N` | Elide large attributes (e.g. model weights) to trim outputs |

See also https://mlir.llvm.org/getting_started/Debugging/
