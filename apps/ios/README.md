# iOS App

Native read-only storefront app built with Swift and SwiftUI.

## Local configuration

1. Copy local config template:

```bash
cp Config/Local.example.xcconfig Config/Local.xcconfig
```

2. Set local-only values in `Config/Local.xcconfig`:

```xcconfig
SUPABASE_URL = https:$(SLASH)$(SLASH)your-project-ref.supabase.co
SUPABASE_ANON_KEY =
```

Do not commit real credentials.
Note: in `.xcconfig` files, a raw `https://...` value is parsed incorrectly because `//` starts a comment. Use `https:$(SLASH)$(SLASH)...`.

## Build in Xcode

1. Open `StorefrontIOS.xcodeproj`.
2. Select the `StorefrontIOS` scheme.
3. Build and run on an iOS simulator.

## Build from CLI

```bash
xcodebuild \
  -project StorefrontIOS.xcodeproj \
  -scheme StorefrontIOS \
  -destination 'generic/platform=iOS Simulator' \
  -derivedDataPath /tmp/ios-derived \
  CODE_SIGNING_ALLOWED=NO \
  CODE_SIGNING_REQUIRED=NO \
  build
```

## Swift tests

```bash
swift test --package-path StorefrontCore
```
