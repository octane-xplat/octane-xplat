### Platform switches restore a rejected controlled value

On iOS and Android, a controlled `UISwitch` or `MaterialSwitch` whose `onChange` does not update `value` now returns to the owned checked state instead of staying toggled. Accepted and uncontrolled changes are unchanged. No application changes are required.
