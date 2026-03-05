# Feature 12: Android client (read-only storefront)

## What changed

- Added a native Android app under `apps/android` using Kotlin + Jetpack Compose.
- Implemented read-only catalog browsing with Supabase REST:
  - Product list screen with debounced search
  - Category filter (All + fetched categories)
  - Sort selector (Newest, Price low -> high, Price high -> low)
  - Load more pagination
- Implemented product detail screen:
  - Main image
  - Thumbnails gallery
  - Categories, tags, title, description, and price
- Added a minimal architecture:
  - `SupabaseStorefrontRepository`
  - `ProductsViewModel`
  - `ProductDetailViewModel`
  - Compose screens + navigation
- Added unit tests for pure logic:
  - REST query builder
  - Cache key generation
  - Price formatting
- Added Compose UI tests for products empty-state rendering.

## Local setup (secrets)

Do not commit real Supabase values.

1. Copy `apps/android/local.properties.example` to `apps/android/local.properties`.
2. Fill local values:

```properties
SUPABASE_URL=
SUPABASE_ANON_KEY=
```

The app reads these values into `BuildConfig` fields at build time.

## How to run

```bash
cd apps/android
./gradlew :app:assembleDebug
```

You can then run the app from Android Studio or install the debug APK from `apps/android/app/build/outputs/apk/debug/`.

## CI

- Added Android CI job in `.github/workflows/ci.yml`.
- The job runs a lightweight assemble build:

```bash
cd apps/android
./gradlew :app:assembleDebug
```

## Known limitations

- No auth, cart, or checkout in this feature.
- In-memory repository cache has no TTL/invalidation and is process-local.
- Category filtering is resolved with an additional `product_categories` request before products fetch.
- Error handling is intentionally simple and user-facing messages are generic.
