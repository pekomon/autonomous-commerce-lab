import SwiftUI

struct ContentView: View {
    private let repository: StorefrontRepository
    @StateObject private var viewModel: ProductsListViewModel
    @State private var selectedProductID: String?

    init(repository: StorefrontRepository) {
        self.repository = repository
        _viewModel = StateObject(wrappedValue: ProductsListViewModel(repository: repository))
    }

    var body: some View {
        NavigationSplitView {
            sidebar
        } detail: {
            detailPane
        }
        .frame(minWidth: 1040, minHeight: 720)
        .navigationSplitViewStyle(.balanced)
        .onAppear {
            syncSelection(with: viewModel.products.map(\.id))
        }
        .onChange(of: viewModel.products.map(\.id)) { productIDs in
            syncSelection(with: productIDs)
        }
    }

    private var sidebar: some View {
        VStack(alignment: .leading, spacing: 14) {
            controlsSection

            if let categoryErrorMessage = viewModel.categoryErrorMessage {
                InlineErrorCard(
                    title: "Category filters unavailable",
                    message: categoryErrorMessage,
                    retryTitle: "Retry filters",
                    action: viewModel.retry
                )
            }

            if let productErrorMessage = viewModel.productErrorMessage {
                InlineErrorCard(
                    title: "Products unavailable",
                    message: productErrorMessage,
                    retryTitle: "Retry products",
                    action: viewModel.retryProducts
                )
            }

            if viewModel.isLoading, viewModel.products.isEmpty {
                VStack(alignment: .leading, spacing: 10) {
                    ProgressView("Loading products...")
                    Text("Fetching active products from Supabase.")
                        .font(.footnote)
                        .foregroundStyle(.secondary)
                }
                .frame(maxWidth: .infinity, alignment: .leading)
                .padding(.vertical, 8)
            } else if !viewModel.isLoading,
                      viewModel.productErrorMessage == nil,
                      viewModel.products.isEmpty
            {
                ContentUnavailableSidebar()
            } else {
                productsList
            }
        }
        .padding(16)
        .navigationTitle("Storefront")
    }

    private var controlsSection: some View {
        VStack(alignment: .leading, spacing: 10) {
            Text("Browse catalog")
                .font(.title2)
                .fontWeight(.semibold)

            TextField(
                "Search products",
                text: Binding(
                    get: { viewModel.queryInput },
                    set: { value in
                        viewModel.onSearchInputChanged(value)
                    }
                )
            )
            .textFieldStyle(.roundedBorder)

            HStack(spacing: 12) {
                VStack(alignment: .leading, spacing: 6) {
                    Text("Category")
                        .font(.caption)
                        .foregroundStyle(.secondary)
                    Picker("Category", selection: Binding(
                        get: { viewModel.selectedCategoryID },
                        set: { value in
                            viewModel.onCategoryChanged(value)
                        }
                    )) {
                        Text("All categories").tag(allCategoriesId)
                        ForEach(viewModel.categories) { category in
                            Text(category.name).tag(category.id)
                        }
                    }
                    .labelsHidden()
                    .frame(maxWidth: .infinity)
                }

                VStack(alignment: .leading, spacing: 6) {
                    Text("Sort")
                        .font(.caption)
                        .foregroundStyle(.secondary)
                    Picker("Sort", selection: Binding(
                        get: { viewModel.selectedSort },
                        set: { value in
                            viewModel.onSortChanged(value)
                        }
                    )) {
                        ForEach(ProductSortOption.allCases) { option in
                            Text(option.label).tag(option)
                        }
                    }
                    .labelsHidden()
                    .frame(maxWidth: .infinity)
                }
            }
        }
    }

    private var productsList: some View {
        List(selection: $selectedProductID) {
            ForEach(viewModel.products) { product in
                ProductSidebarRow(product: product)
                    .tag(product.id)
            }

            if viewModel.isLoadingMore {
                HStack {
                    Spacer()
                    ProgressView("Loading more...")
                    Spacer()
                }
                .tag("loading-more")
            }

            if !viewModel.isLoading,
               !viewModel.isLoadingMore,
               viewModel.hasMore
            {
                Button("Load more") {
                    viewModel.onLoadMoreTapped()
                }
                .buttonStyle(.borderless)
            }

            if !viewModel.isLoading,
               !viewModel.hasMore,
               !viewModel.products.isEmpty
            {
                Text("End of results")
                    .font(.footnote)
                    .foregroundStyle(.secondary)
            }
        }
        .listStyle(.inset)
    }

    @ViewBuilder
    private var detailPane: some View {
        if let selectedProductID {
            ProductDetailView(productID: selectedProductID, repository: repository)
        } else {
            EmptySelectionView()
        }
    }

    private func syncSelection(with productIDs: [String]) {
        if let selectedProductID, productIDs.contains(selectedProductID) {
            return
        }

        selectedProductID = productIDs.first
    }
}

private struct ProductSidebarRow: View {
    let product: ProductSummary

    var body: some View {
        HStack(alignment: .top, spacing: 12) {
            AsyncImage(url: product.thumbnailURL) { phase in
                switch phase {
                case let .success(image):
                    image
                        .resizable()
                        .scaledToFill()
                default:
                    RoundedRectangle(cornerRadius: 10)
                        .fill(Color(nsColor: .quaternaryLabelColor))
                        .overlay {
                            Text("No image")
                                .font(.caption2)
                                .foregroundStyle(.secondary)
                        }
                }
            }
            .frame(width: 68, height: 68)
            .clipShape(RoundedRectangle(cornerRadius: 10))

            VStack(alignment: .leading, spacing: 6) {
                Text(product.title)
                    .font(.headline)
                    .lineLimit(2)

                Text(formatPrice(amountInCents: product.priceAmount, currencyCode: product.currency))
                    .font(.subheadline)
                    .foregroundStyle(.orange)

                if !product.description.isEmpty {
                    Text(product.description)
                        .font(.footnote)
                        .foregroundStyle(.secondary)
                        .lineLimit(2)
                }
            }
        }
        .padding(.vertical, 4)
    }
}

private struct ProductDetailView: View {
    @StateObject private var viewModel: ProductDetailViewModel
    @State private var selectedImageIndex = 0

    init(productID: String, repository: StorefrontRepository) {
        _viewModel = StateObject(wrappedValue: ProductDetailViewModel(productID: productID, repository: repository))
    }

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 18) {
                if viewModel.loading {
                    VStack(alignment: .leading, spacing: 10) {
                        ProgressView("Loading details...")
                        Text("Fetching product details and images.")
                            .font(.footnote)
                            .foregroundStyle(.secondary)
                    }
                } else if let errorMessage = viewModel.errorMessage {
                    InlineErrorCard(
                        title: "Product detail unavailable",
                        message: errorMessage,
                        retryTitle: "Retry",
                        action: {
                            Task {
                                await viewModel.load()
                            }
                        }
                    )
                } else if let product = viewModel.product {
                    imageGallery(images: product.imageURLs)

                    VStack(alignment: .leading, spacing: 8) {
                        Text(product.title)
                            .font(.largeTitle)
                            .fontWeight(.semibold)

                        Text(formatPrice(amountInCents: product.priceAmount, currencyCode: product.currency))
                            .font(.title2)
                            .foregroundStyle(.orange)
                    }

                    if !product.description.isEmpty {
                        sectionBlock(title: "Description") {
                            Text(product.description)
                                .textSelection(.enabled)
                        }
                    }

                    if !product.categories.isEmpty {
                        sectionBlock(title: "Categories") {
                            TagWrapView(values: product.categories.map(\.name))
                        }
                    }

                    if !product.tags.isEmpty {
                        sectionBlock(title: "Tags") {
                            TagWrapView(values: product.tags)
                        }
                    }
                }
            }
            .padding(24)
            .frame(maxWidth: .infinity, alignment: .leading)
        }
        .background(Color(nsColor: .windowBackgroundColor))
    }

    private func imageGallery(images: [URL]) -> some View {
        VStack(alignment: .leading, spacing: 12) {
            if let currentURL = images[safe: selectedImageIndex] {
                AsyncImage(url: currentURL) { phase in
                    switch phase {
                    case let .success(image):
                        image
                            .resizable()
                            .scaledToFit()
                    default:
                        RoundedRectangle(cornerRadius: 16)
                            .fill(Color(nsColor: .controlBackgroundColor))
                            .overlay {
                                ProgressView()
                            }
                    }
                }
                .frame(maxWidth: .infinity)
                .frame(height: 340)
                .background(Color(nsColor: .underPageBackgroundColor))
                .clipShape(RoundedRectangle(cornerRadius: 16))
            } else {
                RoundedRectangle(cornerRadius: 16)
                    .fill(Color(nsColor: .controlBackgroundColor))
                    .frame(height: 340)
                    .overlay {
                        Text("No image")
                            .foregroundStyle(.secondary)
                    }
            }

            if !images.isEmpty {
                ScrollView(.horizontal, showsIndicators: false) {
                    HStack(spacing: 10) {
                        ForEach(Array(images.enumerated()), id: \.offset) { index, url in
                            AsyncImage(url: url) { phase in
                                switch phase {
                                case let .success(image):
                                    image
                                        .resizable()
                                        .scaledToFill()
                                default:
                                    RoundedRectangle(cornerRadius: 8)
                                        .fill(Color(nsColor: .quaternaryLabelColor))
                                }
                            }
                            .frame(width: 88, height: 88)
                            .clipShape(RoundedRectangle(cornerRadius: 8))
                            .overlay(
                                RoundedRectangle(cornerRadius: 8)
                                    .stroke(selectedImageIndex == index ? Color.orange : Color.clear, lineWidth: 2)
                            )
                            .onTapGesture {
                                selectedImageIndex = index
                            }
                        }
                    }
                }
            }
        }
    }

    private func sectionBlock<Content: View>(title: String, @ViewBuilder content: () -> Content) -> some View {
        VStack(alignment: .leading, spacing: 10) {
            Text(title)
                .font(.headline)
            content()
        }
    }
}

private struct TagWrapView: View {
    let values: [String]

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            ForEach(chunk(values, size: 4), id: \.self) { row in
                HStack(spacing: 8) {
                    ForEach(row, id: \.self) { value in
                        Text(value)
                            .font(.caption)
                            .padding(.horizontal, 10)
                            .padding(.vertical, 6)
                            .background(Color(nsColor: .controlBackgroundColor))
                            .clipShape(Capsule())
                    }
                    Spacer(minLength: 0)
                }
            }
        }
    }

    private func chunk(_ items: [String], size: Int) -> [[String]] {
        stride(from: 0, to: items.count, by: size).map { start in
            Array(items[start ..< min(start + size, items.count)])
        }
    }
}

private struct InlineErrorCard: View {
    let title: String
    let message: String
    let retryTitle: String
    let action: () -> Void

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text(title)
                .font(.headline)
            Text(message)
                .foregroundStyle(.red)
            Button(retryTitle, action: action)
                .buttonStyle(.bordered)
        }
        .padding(12)
        .background(Color(nsColor: .controlBackgroundColor))
        .clipShape(RoundedRectangle(cornerRadius: 12))
    }
}

private struct ContentUnavailableSidebar: View {
    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("No products found")
                .font(.headline)
            Text("Try changing search, category, or sort to broaden the result set.")
                .foregroundStyle(.secondary)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(.vertical, 8)
    }
}

private struct EmptySelectionView: View {
    var body: some View {
        VStack(alignment: .leading, spacing: 10) {
            Text("Select a product")
                .font(.title2)
                .fontWeight(.semibold)
            Text("Choose a product from the sidebar to view images, description, tags, and categories.")
                .foregroundStyle(.secondary)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .center)
        .padding(32)
        .background(Color(nsColor: .windowBackgroundColor))
    }
}

private extension Array {
    subscript(safe index: Int) -> Element? {
        guard indices.contains(index) else {
            return nil
        }

        return self[index]
    }
}
