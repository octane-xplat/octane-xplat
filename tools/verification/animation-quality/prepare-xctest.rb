# Uses the xcodeproj gem already supplied by the iOS CocoaPods toolchain.
# Generates a standalone UI-test project; never launches or captures a device.
require 'fileutils'
require 'xcodeproj'

output = ARGV.fetch(0) { abort 'Usage: ruby prepare-xctest.rb NEW_OUTPUT_DIRECTORY' }
abort 'Output exists; choose a new directory' if File.exist?(output)
FileUtils.mkdir_p(output)
project = Xcodeproj::Project.new(File.join(output, 'AnimationQuality.xcodeproj'))
target = project.new_target(:ui_test_bundle, 'AnimationQualityTests', :ios, '17.0')
source = project.main_group.new_file(File.expand_path('AnimationQualityTests.swift', __dir__))
target.source_build_phase.add_file_reference(source)
target.build_configurations.each do |configuration|
  configuration.build_settings.merge!({
    'SWIFT_VERSION' => '5.0',
    'PRODUCT_BUNDLE_IDENTIFIER' => 'org.octanexplat.animationquality.tests',
    'GENERATE_INFOPLIST_FILE' => 'YES',
    'CODE_SIGN_STYLE' => 'Automatic',
    'SWIFT_OPTIMIZATION_LEVEL' => '-O',
    'ENABLE_TESTABILITY' => 'YES'
  })
  team = ENV['XPLAT_IOS_DEVELOPMENT_TEAM']
  configuration.build_settings['DEVELOPMENT_TEAM'] = team if team
end
project.save
scheme = Xcodeproj::XCScheme.new
scheme.add_build_target(target)
scheme.add_test_target(target)
scheme.test_action.build_configuration = 'Release'
scheme.test_action.code_coverage_enabled = false
scheme.test_action.disable_main_thread_checker = true
scheme.save_as(project.path, 'AnimationQuality')
puts project.path
puts 'Before execution: disable debugger, diagnostics and automatic screenshots in the test scheme. See README.md.'
