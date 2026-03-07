import SwiftUI

@main
struct StorefrontIOSApp: App {
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
                    message: configurationError ?? "Supabase configuration is missing.",
                )
            }
        }
    }
}

private struct ConfigurationMissingView: View {
    let message: String

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Storefront iOS configuration required")
                .font(.headline)

            Text(message)
                .foregroundStyle(.red)

            Text("Create apps/ios/Config/Local.xcconfig from Local.example.xcconfig and set SUPABASE_URL and SUPABASE_ANON_KEY.")
                .font(.footnote)
                .foregroundStyle(.secondary)
        }
        .padding()
    }
}
