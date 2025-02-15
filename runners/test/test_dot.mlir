// RUN: mlir-proto-opt %s -linalg-tensor-codegen-strategy="anchor-func=init_and_dot anchor-op=linalg.dot tile-sizes=20" |\
// RUN: mlir-proto-opt -linalg-tensor-codegen-strategy="anchor-func=init_and_dot anchor-op=linalg.dot tile-sizes=10" |\
// RUN: mlir-proto-opt -linalg-tensor-codegen-strategy="anchor-func=init_and_dot anchor-op=linalg.dot tile-sizes=2 pad hoist-padding=1" |\
// TODO: Vectorizing linalg.dot requires 0-D vectors, disable for now.
// R-UN: mlir-proto-opt -linalg-tensor-codegen-strategy="anchor-func=init_and_dot anchor-op=linalg.dot vectorize vector-contract-lowering=false vectorize-padding" |\
// RUN: mlir-proto-opt -linalg-comprehensive-bufferize-inplace |\
// RUN: tee | FileCheck %s

// CHECK-DAG: #[[$MAP1:.*]] = affine_map<(d0)[s0] -> (d0 + s0)>
// CHECK-DAG: #[[$MAP5:.*]] = affine_map<(d0)[s0, s1] -> (d0 * s1 + s0)>

// CHECK-LABEL: func @init_and_dot(
//  CHECK-SAME:       %[[A:[0-9a-zA-Z]+]]: memref<
//  CHECK-SAME:       %[[B:[0-9a-zA-Z]+]]: memref<
//  CHECK-SAME:       %[[C:[0-9a-zA-Z]+]]: memref<
func @init_and_dot(%a: tensor<64xf32>, %b: tensor<64xf32>, %c: tensor<f32>) -> tensor<f32>
// TODO: activate manually for now.
// attributes { passthrough = [["target-cpu", "skylake-avx512"], ["prefer-vector-width", "512"]]}
//
// Manually set up `__writeable_func_buffer_args_attr__` to allow writing tests in the absence of
// an external function call.
attributes { __writeable_func_buffer_args_attr__ = ["none", "none", "true"] }
{
//       CHECK:   constant 0.0
  %v0 = constant 0.0 : f32

//   CHECK-NOT:   memref.alloc
//       CHECK:   linalg.fill(%[[C]], %{{.*}}) : memref<f32>, f32
  %d = linalg.fill(%c, %v0) : tensor<f32>, f32 -> tensor<f32>

//       CHECK:   scf.for %[[I:.*]]
//       CHECK:     scf.for %[[II:.*]]
//       CHECK:       %[[PACK_B:.*]] = memref.alloc(%{{.*}}) : memref<?x2xf32>
//       CHECK:       %[[PACK_A:.*]] = memref.alloc(%{{.*}}) : memref<?x2xf32>
//       CHECK:       scf.for %[[III_PACK_B:.*]]
//       CHECK:         %[[sB:.*]] = memref.subview %[[PACK_B]]
//       CHECK:         linalg.copy(%{{.*}}, %[[sB]]) : memref<2xf32, #[[$MAP5]]>, memref<2xf32, #[[$MAP1]]>
//       CHECK:       scf.for %[[III_PACK_A:.*]]
//       CHECK:         %[[sA:.*]] = memref.subview %[[PACK_A]]
//       CHECK:         linalg.copy(%{{.*}}, %[[sA]]) : memref<2xf32, #[[$MAP5]]>, memref<2xf32, #[[$MAP1]]>
//       CHECK:       scf.for %[[III:.*]]
//       CHECK:         %[[sA:.*]] = memref.subview %[[PACK_A]][%{{.*}}, 0] [1, 2] [1, 1] : memref<?x2xf32> to memref<2xf32, #[[$MAP1]]>
//       CHECK:         %[[sB:.*]] = memref.subview %[[PACK_B]][%{{.*}}, 0] [1, 2] [1, 1] : memref<?x2xf32> to memref<2xf32, #[[$MAP1]]>
//       CHECK:         linalg.dot ins(%[[sA]], %[[sB]] : memref<2xf32, #[[$MAP1]]>, memref<2xf32, #[[$MAP1]]>) outs(%[[C]] : memref<f32>)
//       CHECK:       memref.dealloc %[[PACK_A]] : memref<?x2xf32>
//       CHECK:       memref.dealloc %[[PACK_B]] : memref<?x2xf32>
  %e = linalg.dot ins(%a, %b : tensor<64xf32>, tensor<64xf32>)
    outs(%d: tensor<f32>) -> tensor<f32>

//   CHECK-NOT:   memref.alloc
//   CHECK-NOT:   copy
//       CHECK:   return
  return %e : tensor<f32>
}


