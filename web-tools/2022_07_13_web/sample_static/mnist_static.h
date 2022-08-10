// === [mnist_linked_llvm] static library ===
//
// To use:
//  - Include this header and generated object into your program 
//  - At runtime: retrieve library name from host binary 
//  - Query library from mnist_linked_llvm_library_query()<< 
//  - Feed library into static_library_loader 
//
// === Automatically generated file. DO NOT EDIT! === 

#ifndef IREE_GENERATED_STATIC_EXECUTABLE_LIBRARY_MNIST_LINKED_LLVM_
#define IREE_GENERATED_STATIC_EXECUTABLE_LIBRARY_MNIST_LINKED_LLVM_

#include "iree/hal/local/executable_library.h"

#if __cplusplus
extern "C" {
#endif // __cplusplus

const iree_hal_executable_library_header_t**
mnist_linked_llvm_library_query(
iree_hal_executable_library_version_t max_version, const iree_hal_executable_environment_v0_t* environment);

#if __cplusplus
}
#endif // __cplusplus

#endif // IREE_GENERATED_STATIC_EXECUTABLE_LIBRARY_MNIST_LINKED_LLVM_
