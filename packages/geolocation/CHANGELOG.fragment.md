# macOS geolocation

- Add Core Location support for the existing geolocation capability on native macOS hosts. Permission checks preserve granted, denied, and unsupported outcomes; position requests support accuracy, timeout, and cached-position age options.
- Keep unsupported behavior when native metadata or application location purpose strings are missing. macOS applications must configure their purpose strings and, when sandboxed, the location entitlement described in the package README.
