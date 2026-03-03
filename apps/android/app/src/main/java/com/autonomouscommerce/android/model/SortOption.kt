package com.autonomouscommerce.android.model

enum class SortOption(
    val label: String,
    val apiOrder: String,
) {
    Newest("Newest", "created_at.desc"),
    PriceLowToHigh("Price low -> high", "price_amount.asc"),
    PriceHighToLow("Price high -> low", "price_amount.desc"),
}
