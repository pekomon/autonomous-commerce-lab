package com.autonomouscommerce.android.data

import java.text.NumberFormat
import java.util.Currency
import java.util.Locale

fun formatPrice(priceAmount: Int, currencyCode: String): String {
    val formatter = NumberFormat.getCurrencyInstance(Locale.US)
    val currency = runCatching { Currency.getInstance(currencyCode) }
        .getOrDefault(Currency.getInstance("USD"))
    formatter.currency = currency
    return formatter.format(priceAmount / 100.0)
}
