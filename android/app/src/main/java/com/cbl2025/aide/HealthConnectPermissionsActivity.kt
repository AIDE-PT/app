package com.cbl2025.aide

import android.content.Intent
import android.net.Uri
import android.os.Bundle
import androidx.appcompat.app.AlertDialog
import androidx.appcompat.app.AppCompatActivity

class HealthConnectPermissionsActivity : AppCompatActivity() {
  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)
    showPermissionsRationale()
  }

  private fun showPermissionsRationale() {
    AlertDialog.Builder(this)
      .setTitle("Health Connect permissions")
      .setMessage(
        "This app reads steps, heart rate, blood pressure, oxygen, temperature, sleep, calories and stress data from Health Connect. " +
          "All health data stays under the user's Health Connect consent controls."
      )
      .setPositiveButton("Open privacy policy") { _, _ ->
        openPrivacyPolicy()
      }
      .setNegativeButton("Close") { _, _ ->
        finish()
      }
      .setOnCancelListener {
        finish()
      }
      .show()
  }

  private fun openPrivacyPolicy() {
    // Keep this URL aligned with the privacy policy declared in Google Play Console.
    val intent = Intent(
      Intent.ACTION_VIEW,
      Uri.parse("https://example.com/privacy"),
    )
    startActivity(intent)
    finish()
  }
}
