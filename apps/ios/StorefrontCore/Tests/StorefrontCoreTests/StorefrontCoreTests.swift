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

    func testFormatPriceFallsBackToUsdForInvalidCurrency() {
        XCTAssertEqual(formatPrice(amountInCents: 1234, currencyCode: "INVALID"), "$12.34")
    }
}
