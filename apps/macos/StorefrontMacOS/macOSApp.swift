import SwiftUI

@main
struct StorefrontMacOSApp: App {
    private let repository: StorefrontRepository?
    private let configurationError: String?

    init() {
        let config = SupabaseRuntimeConfig.fromBundle()
        if let error = config.validationError {
            configurationError = error
            repository = nil
        } else {
            configurationError = nil
            repository = SupabaseStorefrontRepository(apiClient: SupabaseAPIClient(config: config), config: config)
        }
    }

    var body: some Scene {
        WindowGroup {
            if let repository {
                ContentView(repository: repository)
            } else {
                ConfigurationMissingView(
                    message: configurationError ?? "Supabase configuration is missing."
                )
            }
        }
        .defaultSize(width: 1280, height: 820)
    }
}

private struct ConfigurationMissingView: View {
    let message: String

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Storefront macOS configuration required")
                .font(.headline)

            Text(message)
                .foregroundStyle(.red)

            Text("Create apps/macos/Config/Local.xcconfig from Local.example.xcconfig and set SUPABASE_URL and SUPABASE_ANON_KEY.")
                .font(.footnote)
                .foregroundStyle(.secondary)
        }
        .padding(24)
        .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .center)
    }
}
