// RUN: mlir-proto-opt -linalg-tensor-codegen-strategy="distribute-to-gpu-ids" %s | FileCheck %s

func private @foo(%A: tensor<64x64xf32>,
                  %B: tensor<64x64xf32>) -> tensor<64x64xf32>

func @distribute_for_gpu(%A: tensor<64x64xf32>,
                         %B: tensor<64x64xf32>) -> tensor<64x64xf32> {
  %c0 = constant 0 : index
  %c16 = constant 16 : index
  %c64 = constant 64 : index
  %c24 = constant 24 : index
  %0 = linalg.tiled_loop (%i, %j) = (%c0, %c0) to (%c64, %c64) step (%c24, %c16)
      ins (%A_ = %A: tensor<64x64xf32>) outs (%B_ = %B:tensor<64x64xf32>) {
    %0 = call @foo(%A_, %B_)
      : (tensor<64x64xf32>, tensor<64x64xf32>) -> tensor<64x64xf32>
    linalg.yield %0 : tensor<64x64xf32>
  }
  return %0 : tensor<64x64xf32>
}

// CHECK-DAG: #[[$MAP0:.+]] = affine_map<()[s0] -> (s0 * 24)>
// CHECK-DAG: #[[$MAP1:.+]] = affine_map<()[s0] -> (s0 * 16)>

// CHECK-LABEL: func @distribute_for_gpu
// CHECK:  %[[C64:.*]] = constant 64 : index

// CHECK-DAG:  %[[GPU_BLOCK_Y:.*]] = "gpu.block_id"() {dimension = "y"}
// CHECK-DAG:  %[[GPU_GRID_DIM_Y:.*]] = "gpu.grid_dim"() {dimension = "y"}
// CHECK-DAG:  %[[GPU_BLOCK_X:.*]] = "gpu.block_id"() {dimension = "x"}
// CHECK-DAG:  %[[GPU_GRID_DIM_X:.*]] = "gpu.grid_dim"() {dimension = "x"}

// CHECK-DAG:  %[[LB_I:.*]] = affine.apply #[[$MAP0]](){{\[}}%[[GPU_BLOCK_Y]]]
// CHECK-DAG:  %[[STEP_I:.*]] = affine.apply #[[$MAP0]](){{\[}}%[[GPU_GRID_DIM_Y]]]
// CHECK-DAG:  %[[LB_J:.*]] = affine.apply #[[$MAP1]](){{\[}}%[[GPU_BLOCK_X]]]
// CHECK-DAG:  %[[STEP_J:.*]] = affine.apply #[[$MAP1]](){{\[}}%[[GPU_GRID_DIM_X]]]

// CHECK:  linalg.tiled_loop (%[[I:.*]], %[[J:.*]]) = (%[[LB_I]], %[[LB_J]])
// CHECK-SAME: to (%[[C64]], %[[C64]]) step (%[[STEP_I]], %[[STEP_J]])

