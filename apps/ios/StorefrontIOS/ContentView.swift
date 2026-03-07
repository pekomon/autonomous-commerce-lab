import Foundation
import SwiftUI

struct ContentView: View {
    private let repository: StorefrontRepository
    @StateObject private var viewModel: ProductsListViewModel

    init(repository: StorefrontRepository) {
        self.repository = repository
        _viewModel = StateObject(wrappedValue: ProductsListViewModel(repository: repository))
    }

    var body: some View {
        NavigationStack {
            VStack(alignment: .leading, spacing: 12) {
                searchAndFilterSection

                if viewModel.isLoading {
                    ProgressView("Loading products...")
                        .frame(maxWidth: .infinity, alignment: .center)
                }

                if let categoryErrorMessage = viewModel.categoryErrorMessage {
                    VStack(alignment: .leading, spacing: 6) {
                        Text(categoryErrorMessage)
                            .foregroundStyle(.red)
                        Button("Retry categories") {
                            viewModel.retry()
                        }
                    }
                }

                if let productErrorMessage = viewModel.productErrorMessage {
                    VStack(alignment: .leading, spacing: 6) {
                        Text(productErrorMessage)
                            .foregroundStyle(.red)
                        Button("Retry products") {
                            viewModel.retryProducts()
                        }
                    }
                }

                if !viewModel.isLoading,
                   viewModel.productErrorMessage == nil,
                   viewModel.products.isEmpty
                {
                    Text("No products found. Try changing search, category, or sort.")
                        .foregroundStyle(.secondary)
                }

                ScrollView {
                    LazyVStack(alignment: .leading, spacing: 12) {
                        ForEach(viewModel.products) { product in
                            NavigationLink {
                                ProductDetailView(productID: product.id, repository: repository)
                            } label: {
                                ProductRowView(product: product)
                            }
                            .buttonStyle(.plain)
                        }

                        if viewModel.isLoadingMore {
                            ProgressView("Loading more...")
                                .frame(maxWidth: .infinity)
                        }

                        if !viewModel.isLoading,
                           !viewModel.isLoadingMore,
                           viewModel.hasMore
                        {
                            Button("Load more") {
                                viewModel.onLoadMoreTapped()
                            }
                            .buttonStyle(.bordered)
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
                    .padding(.vertical, 4)
                }
            }
            .padding()
            .navigationTitle("Storefront")
        }
    }

    private var searchAndFilterSection: some View {
        VStack(alignment: .leading, spacing: 10) {
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
            .pickerStyle(.menu)

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
            .pickerStyle(.menu)
        }
    }
}

private struct ProductRowView: View {
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
                    RoundedRectangle(cornerRadius: 8)
                        .fill(Color.gray.opacity(0.2))
                        .overlay {
                            Text("No image")
                                .font(.caption)
                                .foregroundStyle(.secondary)
                        }
                }
            }
            .frame(width: 84, height: 84)
            .clipShape(RoundedRectangle(cornerRadius: 8))

            VStack(alignment: .leading, spacing: 6) {
                Text(product.title)
                    .font(.headline)
                    .foregroundStyle(.primary)
                    .multilineTextAlignment(.leading)
                Text(formatPrice(amountInCents: product.priceAmount, currencyCode: product.currency))
                    .font(.subheadline)
                    .foregroundStyle(.blue)

                if !product.description.isEmpty {
                    Text(product.description)
                        .font(.footnote)
                        .foregroundStyle(.secondary)
                        .lineLimit(2)
                }
            }

            Spacer()
        }
        .padding(10)
        .background(Color(.secondarySystemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 10))
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
            VStack(alignment: .leading, spacing: 12) {
                if viewModel.loading {
                    ProgressView("Loading details...")
                } else if let errorMessage = viewModel.errorMessage {
                    VStack(alignment: .leading, spacing: 8) {
                        Text(errorMessage)
                            .foregroundStyle(.red)
                        Button("Retry") {
                            Task {
                                await viewModel.load()
                            }
                        }
                        .buttonStyle(.bordered)
                    }
                } else if let product = viewModel.product {
                    imageGallery(images: product.imageURLs)

                    Text(product.title)
                        .font(.title2)
                        .bold()

                    Text(formatPrice(amountInCents: product.priceAmount, currencyCode: product.currency))
                        .font(.title3)
                        .foregroundStyle(.blue)

                    if !product.description.isEmpty {
                        Text(product.description)
                            .font(.body)
                    }

                    if !product.categories.isEmpty {
                        chipSection(title: "Categories", values: product.categories.map(\.name))
                    }

                    if !product.tags.isEmpty {
                        chipSection(title: "Tags", values: product.tags)
                    }
                }
            }
            .padding()
        }
        .navigationTitle("Product")
        .navigationBarTitleDisplayMode(.inline)
    }

    private func imageGallery(images: [URL]) -> some View {
        VStack(alignment: .leading, spacing: 8) {
            if images.isEmpty {
                RoundedRectangle(cornerRadius: 12)
                    .fill(Color.gray.opacity(0.2))
                    .frame(height: 220)
                    .overlay {
                        Text("No image")
                            .foregroundStyle(.secondary)
                    }
            } else {
                TabView(selection: $selectedImageIndex) {
                    ForEach(Array(images.enumerated()), id: \.offset) { index, url in
                        AsyncImage(url: url) { phase in
                            switch phase {
                            case let .success(image):
                                image
                                    .resizable()
                                    .scaledToFit()
                            default:
                                RoundedRectangle(cornerRadius: 12)
                                    .fill(Color.gray.opacity(0.2))
                            }
                        }
                        .tag(index)
                    }
                }
                .frame(height: 220)
                .tabViewStyle(.page)

                ScrollView(.horizontal, showsIndicators: false) {
                    HStack(spacing: 8) {
                        ForEach(Array(images.enumerated()), id: \.offset) { index, url in
                            AsyncImage(url: url) { phase in
                                switch phase {
                                case let .success(image):
                                    image
                                        .resizable()
                                        .scaledToFill()
                                default:
                                    RoundedRectangle(cornerRadius: 8)
                                        .fill(Color.gray.opacity(0.2))
                                }
                            }
                            .frame(width: 64, height: 64)
                            .clipShape(RoundedRectangle(cornerRadius: 8))
                            .overlay(
                                RoundedRectangle(cornerRadius: 8)
                                    .stroke(selectedImageIndex == index ? Color.blue : .clear, lineWidth: 2)
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

    private func chipSection(title: String, values: [String]) -> some View {
        VStack(alignment: .leading, spacing: 6) {
            Text(title)
                .font(.headline)

            FlexibleChipView(values: values)
        }
    }
}

private struct FlexibleChipView: View {
    let values: [String]

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            ForEach(chunk(values, size: 3), id: \.self) { row in
                HStack(spacing: 8) {
                    ForEach(row, id: \.self) { value in
                        Text(value)
                            .font(.caption)
                            .padding(.horizontal, 10)
                            .padding(.vertical, 5)
                            .background(Color(.tertiarySystemFill))
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
