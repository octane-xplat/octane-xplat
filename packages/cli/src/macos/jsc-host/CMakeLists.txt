cmake_minimum_required(VERSION 4.0)
project(xplat_macos_jsc_host C OBJC)

if(NOT APPLE)
  message(FATAL_ERROR "The macOS AppKit host builds for macOS only")
endif()

foreach(arch IN LISTS CMAKE_OSX_ARCHITECTURES)
  if(NOT arch STREQUAL "arm64" AND NOT arch STREQUAL "x86_64")
    message(FATAL_ERROR "The macOS AppKit host builds for arm64 or x86_64 only")
  endif()
endforeach()

if(NOT DEFINED XPLAT_JSC_SOURCE_DIR)
  message(FATAL_ERROR "Set XPLAT_JSC_SOURCE_DIR to the pinned libjsc/libnapi source directory")
endif()

add_subdirectory("${XPLAT_JSC_SOURCE_DIR}/libjsc" libjsc)
add_subdirectory("${XPLAT_JSC_SOURCE_DIR}/libnapi" libnapi)

add_executable(xplat-macos-host host.m)
target_link_libraries(xplat-macos-host PRIVATE napi_static "-framework AppKit")
set_target_properties(xplat-macos-host PROPERTIES ENABLE_EXPORTS ON)
target_link_options(xplat-macos-host PRIVATE
  "-Wl,-force_load,$<TARGET_FILE:napi_static>"
  "-Wl,-export_dynamic"
)
