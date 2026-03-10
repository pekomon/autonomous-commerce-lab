# macOS App

Native read-only storefront app built with Swift and SwiftUI for macOS.

## Local configuration

1. Copy the local config template:

```bash
cp Config/Local.example.xcconfig Config/Local.xcconfig
```

2. Set local-only values in `Config/Local.xcconfig`:

```xcconfig
SUPABASE_URL =
SUPABASE_ANON_KEY =
```

Do not commit real credentials.

## Build in Xcode

1. Open `StorefrontMacOS.xcodeproj`.
2. Select the `StorefrontMacOS` scheme.
3. Build and run on macOS.

## Build from CLI

```bash
xcodebuild \
  -project StorefrontMacOS.xcodeproj \
  -scheme StorefrontMacOS \
  -configuration Debug \
  -destination 'platform=macOS' \
  CODE_SIGNING_ALLOWED=NO \
  CODE_SIGNING_REQUIRED=NO \
  build
```

## Shared Swift tests

The shared pure Swift storefront helpers are tested here:

```bash
swift test --package-path ../ios/StorefrontCore
```
