# Feature 13: iOS client (read-only storefront)

## What changed

- Added a native iOS app under `apps/ios` using Swift + SwiftUI.
- Implemented read-only catalog browsing via Supabase PostgREST:
  - Products list with debounced search
  - Category filter (All + fetched categories)
  - Sort selector (Newest, Price low -> high, Price high -> low)
  - `Load more` pagination
- Implemented product detail:
  - Main image gallery + thumbnails
  - Title, price, description, tags, categories
- Added minimal architecture:
  - `SupabaseAPIClient`
  - `SupabaseStorefrontRepository`
  - `ProductsListViewModel`
  - `ProductDetailViewModel`
- Added simple loading/error/empty states on list and detail screens.

## Local config and secrets

Do not commit real Supabase values.

1. Copy:

```bash
cp apps/ios/Config/Local.example.xcconfig apps/ios/Config/Local.xcconfig
```

2. Set values in `Local.xcconfig`:

```xcconfig
SUPABASE_URL = https:$(SLASH)$(SLASH)your-project-ref.supabase.co
SUPABASE_ANON_KEY =
```

Runtime config is read from `Info.plist` values backed by xcconfig build settings.
Use `https:$(SLASH)$(SLASH)...` in `.xcconfig`; a raw `https://...` URL is truncated by xcconfig comment parsing.

## How to run

### Xcode

1. Open `apps/ios/StorefrontIOS.xcodeproj`.
2. Select scheme `StorefrontIOS`.
3. Run on an iOS simulator.

### CLI build (simulator, no signing)

```bash
xcodebuild \
  -project apps/ios/StorefrontIOS.xcodeproj \
  -scheme StorefrontIOS \
  -configuration Debug \
  -destination 'generic/platform=iOS Simulator' \
  -derivedDataPath /tmp/ios-derived \
  CODE_SIGNING_ALLOWED=NO \
  CODE_SIGNING_REQUIRED=NO \
  build
```

## Tests

Added pure Swift unit tests for query building, public image URL composition, and price formatting in a lightweight Swift package:

```bash
swift test --package-path apps/ios/StorefrontCore
```

## CI

Added `ios-build` job in `.github/workflows/ci.yml`:

- Builds the Xcode project for iOS simulator without signing.
- Runs `swift test` for `apps/ios/StorefrontCore`.
- Uses local example config and does not require secrets.

## Known limitations

- No auth, cart, or checkout in this feature.
- In-memory repository cache is process-local (no TTL/invalidation).
- Category filtering requires an additional `product_categories` request.
- CI validates build and pure Swift tests; it does not run full UI automation in this feature.
