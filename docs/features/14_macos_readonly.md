# Feature 14: macOS desktop client (read-only storefront)

## What changed

- Added a native macOS app under `apps/macos` using Swift + SwiftUI.
- Implemented read-only catalog browsing via Supabase PostgREST:
  - Search with debounced updates
  - Category filter
  - Sort selector
  - `Load more` pagination
- Implemented a desktop-oriented split view:
  - Sidebar with search, category, sort, and product list
  - Detail panel with image gallery, title, price, description, tags, and categories
- Reused the existing shared storefront helper layer for:
  - Query building
  - Price formatting
  - Search state handling
  - Public image URL composition
- Added simple loading, error, empty, and no-selection states.

## Local config and secrets

Do not commit real Supabase values.

1. Copy:

```bash
cp apps/macos/Config/Local.example.xcconfig apps/macos/Config/Local.xcconfig
```

2. Set values in `Local.xcconfig`:

```xcconfig
SUPABASE_URL =
SUPABASE_ANON_KEY =
```

Runtime config is read from `Info.plist` values backed by xcconfig build settings.

## How to run

### Xcode

1. Open `apps/macos/StorefrontMacOS.xcodeproj`.
2. Select scheme `StorefrontMacOS`.
3. Run on macOS.

### CLI build

```bash
xcodebuild \
  -project apps/macos/StorefrontMacOS.xcodeproj \
  -scheme StorefrontMacOS \
  -configuration Debug \
  -destination 'platform=macOS' \
  CODE_SIGNING_ALLOWED=NO \
  CODE_SIGNING_REQUIRED=NO \
  build
```

## Tests

The shared pure Swift storefront helpers continue to be covered in `apps/ios/StorefrontCore`, including query building, empty category filter behavior, price formatting, search state handling, and public image URL composition:

```bash
swift test --package-path apps/ios/StorefrontCore
```

## CI

Added a lightweight `macos-build` job in `.github/workflows/ci.yml`:

- Copies the local example config.
- Builds the macOS app without signing.
- Does not require secrets.

## Known limitations

- No auth, cart, or checkout in this feature.
- In-memory repository cache is process-local (no TTL/invalidation).
- Category filtering requires an additional `product_categories` request.
- The macOS app reuses the shared Apple storefront helpers from `apps/ios/StorefrontCore`; broader multi-platform packaging can be revisited later if this area grows.
