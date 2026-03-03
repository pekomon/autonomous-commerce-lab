package com.autonomouscommerce.android.data

import org.junit.Assert.assertEquals
import org.junit.Test

class PriceFormatterTest {
    @Test
    fun `formatPrice formats cents in requested currency`() {
        assertEquals("$12.34", formatPrice(priceAmount = 1234, currencyCode = "USD"))
    }

    @Test
    fun `formatPrice falls back to USD on invalid currency`() {
        assertEquals("$12.34", formatPrice(priceAmount = 1234, currencyCode = "INVALID"))
    }
}
