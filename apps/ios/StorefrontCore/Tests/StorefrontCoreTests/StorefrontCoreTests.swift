import Foundation
import XCTest
@testable import StorefrontCore

final class StorefrontCoreTests: XCTestCase {
    func testBuildProductsQueryItemsIncludesPaginationSortAndSearch() {
        let items = PostgrestQueryBuilder.buildProductsQueryItems(
            query: "  camera_100%  ",
            sortOption: .priceLowToHigh,
            page: 2,
            pageSize: 20,
            productIDsFilter: ["prod-1", "prod-2"]
        )

        let map = Dictionary(uniqueKeysWithValues: items.map { ($0.name, $0.value ?? "") })

        XCTAssertEqual(map["order"], "price_amount.asc")
        XCTAssertEqual(map["limit"], "21")
        XCTAssertEqual(map["offset"], "20")
        XCTAssertEqual(map["or"], "(title.ilike.*camera\\_100\\%*,description.ilike.*camera\\_100\\%*)")
        XCTAssertEqual(map["id"], "in.(prod-1,prod-2)")
    }

    func testBuildProductsCacheKeyNormalizesTrimAndCase() {
        let key = PostgrestQueryBuilder.buildProductsCacheKey(
            query: "  Camera  ",
            categoryID: "cat-1",
            sortOption: .newest,
            page: 2,
            pageSize: 20
        )

        XCTAssertEqual(key, "camera|cat-1|newest|2|20")
    }

    func testBuildProductsQueryItemsKeepsEmptyCategoryFilterExplicit() {
        let items = PostgrestQueryBuilder.buildProductsQueryItems(
            query: "",
            sortOption: .newest,
            page: 1,
            pageSize: 20,
            productIDsFilter: []
        )

        let map = Dictionary(uniqueKeysWithValues: items.map { ($0.name, $0.value ?? "") })

        XCTAssertEqual(map["id"], "in.()")
        XCTAssertNil(map["or"])
    }

    func testResolveSelectedProductIDFallsBackWhenCurrentSelectionDisappears() {
        let resolved = resolveSelectedProductID(
            currentSelection: "prod-2",
            availableProductIDs: ["prod-4", "prod-5"]
        )

        XCTAssertEqual(resolved, "prod-4")
    }

    func testFormatPriceFallsBackToUsdForInvalidCurrency() {
        XCTAssertEqual(formatPrice(amountInCents: 1234, currencyCode: "INVALID"), "$12.34")
    }

    func testPendingSearchQueryStateCommitsLatestInputBeforeDebounceCompletes() {
        var state = PendingSearchQueryState(activeQuery: "older query")

        state.updateInput("  latest camera  ")

        XCTAssertEqual(state.commitPendingInput(), "latest camera")
        XCTAssertEqual(state.activeQuery, "latest camera")
    }

    func testBuildPublicImageURLTrimsBaseURLAndEncodesPathSegments() {
        let url = buildPublicImageURL(
            baseURL: " https://example.supabase.co/ ",
            path: "catalog folder/hero image.png"
        )

        XCTAssertEqual(
            url?.absoluteString,
            "https://example.supabase.co/storage/v1/object/public/product-images/catalog%20folder/hero%20image.png"
        )
    }
}
