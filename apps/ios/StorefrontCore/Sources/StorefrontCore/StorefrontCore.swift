import Foundation

public enum ProductSortOption: String, CaseIterable, Identifiable {
    case newest
    case priceLowToHigh
    case priceHighToLow

    public var id: String { rawValue }

    public var label: String {
        switch self {
        case .newest:
            return "Newest"
        case .priceLowToHigh:
            return "Price low -> high"
        case .priceHighToLow:
            return "Price high -> low"
        }
    }

    public var orderValue: String {
        switch self {
        case .newest:
            return "created_at.desc"
        case .priceLowToHigh:
            return "price_amount.asc"
        case .priceHighToLow:
            return "price_amount.desc"
        }
    }
}

public enum PostgrestQueryBuilder {
    public static func buildProductsCacheKey(
        query: String,
        categoryID: String,
        sortOption: ProductSortOption,
        page: Int,
        pageSize: Int
    ) -> String {
        "\(query.trimmingCharacters(in: .whitespacesAndNewlines).lowercased())|\(categoryID)|\(sortOption.rawValue)|\(page)|\(pageSize)"
    }

    public static func buildProductsQueryItems(
        query: String,
        sortOption: ProductSortOption,
        page: Int,
        pageSize: Int,
        productIDsFilter: [String]? = nil
    ) -> [URLQueryItem] {
        let safePage = max(1, page)
        let offset = (safePage - 1) * pageSize

        var items = [
            URLQueryItem(name: "select", value: "id,title,description,price_amount,currency,tags,created_at,status"),
            URLQueryItem(name: "status", value: "eq.active"),
            URLQueryItem(name: "order", value: sortOption.orderValue),
            URLQueryItem(name: "limit", value: String(pageSize + 1)),
            URLQueryItem(name: "offset", value: String(offset)),
        ]

        let trimmedQuery = query.trimmingCharacters(in: .whitespacesAndNewlines)
        if !trimmedQuery.isEmpty {
            let escaped = trimmedQuery
                .replacingOccurrences(of: "%", with: "\\%")
                .replacingOccurrences(of: "_", with: "\\_")
                .replacingOccurrences(of: ",", with: "")
                .replacingOccurrences(of: "(", with: "")
                .replacingOccurrences(of: ")", with: "")
            items.append(URLQueryItem(name: "or", value: "(title.ilike.*\(escaped)*,description.ilike.*\(escaped)*)"))
        }

        if let productIDsFilter {
            if productIDsFilter.isEmpty {
                items.append(URLQueryItem(name: "id", value: "in.()"))
            } else {
                items.append(URLQueryItem(name: "id", value: "in.(\(productIDsFilter.joined(separator: ",")))"))
            }
        }

        return items
    }
}

public struct PendingSearchQueryState: Equatable {
    public private(set) var queryInput: String
    public private(set) var activeQuery: String

    public init(queryInput: String = "", activeQuery: String = "") {
        self.queryInput = queryInput
        self.activeQuery = activeQuery
    }

    public mutating func updateInput(_ value: String) {
        queryInput = value
    }

    @discardableResult
    public mutating func commitPendingInput() -> String {
        activeQuery = queryInput.trimmingCharacters(in: .whitespacesAndNewlines)
        return activeQuery
    }
}

public func resolveSelectedProductID(
    currentSelection: String?,
    availableProductIDs: [String]
) -> String? {
    if let currentSelection, availableProductIDs.contains(currentSelection) {
        return currentSelection
    }

    return availableProductIDs.first
}

public func formatPrice(amountInCents: Int, currencyCode: String) -> String {
    let formatter = NumberFormatter()
    formatter.numberStyle = .currency
    formatter.locale = Locale(identifier: "en_US")

    if ["USD", "EUR"].contains(currencyCode) {
        formatter.currencyCode = currencyCode
    } else {
        formatter.currencyCode = "USD"
    }

    return formatter.string(from: NSNumber(value: Double(amountInCents) / 100.0)) ?? "-"
}

public func buildPublicImageURL(
    baseURL: String,
    path: String,
    bucketName: String = "product-images"
) -> URL? {
    let trimmedBaseURL = baseURL
        .trimmingCharacters(in: .whitespacesAndNewlines)
        .trimmingCharacters(in: CharacterSet(charactersIn: "/"))
    guard !trimmedBaseURL.isEmpty else {
        return nil
    }

    let encodedPath = path
        .split(separator: "/")
        .map { part in
            String(part).addingPercentEncoding(withAllowedCharacters: .urlPathAllowed) ?? String(part)
        }
        .joined(separator: "/")

    return URL(string: "\(trimmedBaseURL)/storage/v1/object/public/\(bucketName)/\(encodedPath)")
}
