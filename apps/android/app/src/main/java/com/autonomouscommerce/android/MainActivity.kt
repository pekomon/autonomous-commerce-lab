package com.autonomouscommerce.android

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import com.autonomouscommerce.android.data.SupabaseStorefrontRepository
import com.autonomouscommerce.android.ui.StorefrontApp
import okhttp3.OkHttpClient

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        setContent {
            val repository = SupabaseStorefrontRepository(
                supabaseUrl = BuildConfig.SUPABASE_URL,
                supabaseAnonKey = BuildConfig.SUPABASE_ANON_KEY,
                httpClient = OkHttpClient(),
            )

            MaterialTheme {
                Surface {
                    StorefrontApp(repository = repository)
                }
            }
        }
    }
}
