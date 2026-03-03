# Android App

Read-only storefront Android client built with Kotlin and Jetpack Compose.

## Local setup

1. Copy local config template:

```bash
cp local.properties.example local.properties
```

2. Fill values in `local.properties`:

```properties
SUPABASE_URL=
SUPABASE_ANON_KEY=
```

Do not commit real credentials.

## Build

```bash
./gradlew :app:assembleDebug
```

## Test

```bash
./gradlew :app:testDebugUnitTest
```
