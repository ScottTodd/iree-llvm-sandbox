# 2022_07_13 Web Demo

This is a snapshot of IREE's web platform integration as of July 13, 2022.

* Source code in the main IREE repo:

  [experimental/web/](https://github.com/iree-org/iree/tree/main/experimental/web)
* Colab notebook going from TF -> `demo_wasm.vmfb`, `demo_vmvx.vmfb`, etc.:

  [![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/ScottTodd/iree-llvm-sandbox/blob/web-tools/web-tools/2022_07_13_web/IREE_Cross_Compilation_Demo.ipynb)
* "Dynamic" sample webpage that can load and run web-compatible IREE programs ("iree-run-module" equivalent):

  [sample dynamic](https://scotttodd.github.io/iree-llvm-sandbox/web-tools/2022_07_13_web/sample_dynamic/?program=demo_wasm.vmfb&function=reduce_sum&arguments=3xf32%3D1.0%2C+2.0%2C+3.0&iterations=1)
* "Static" sample webpage running an MNIST handwritten digits detector:

  [sample static](https://scotttodd.github.io/iree-llvm-sandbox/web-tools/2022_07_13_web/sample_static/)
