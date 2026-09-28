cmake_minimum_required(VERSION 4.0)
project(bare_macos_spike C)

set(SPIKE_DEPS_DIR "${CMAKE_CURRENT_SOURCE_DIR}/../../../../research/bare-macos" CACHE PATH "Local upstream clones")
add_subdirectory("${SPIKE_DEPS_DIR}/libjsc" libjsc)
add_subdirectory("${SPIKE_DEPS_DIR}/libnapi" libnapi)

add_executable(minimal-host minimal-host.c)
target_link_libraries(minimal-host PRIVATE napi_shared "-framework CoreFoundation")
target_link_options(minimal-host PRIVATE "-Wl,-rpath,@executable_path")
