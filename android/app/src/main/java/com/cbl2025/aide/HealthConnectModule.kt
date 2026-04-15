package com.cbl2025.aide

import android.app.Activity
import android.content.Intent
import android.util.Log
import androidx.health.connect.client.HealthConnectClient
import androidx.health.connect.client.permission.HealthPermission
import androidx.health.connect.client.records.BloodPressureRecord
import androidx.health.connect.client.records.BodyTemperatureRecord
import androidx.health.connect.client.records.HeartRateRecord
import androidx.health.connect.client.records.HeartRateVariabilityRmssdRecord
import androidx.health.connect.client.records.OxygenSaturationRecord
import androidx.health.connect.client.records.SleepSessionRecord
import androidx.health.connect.client.records.StepsRecord
import androidx.health.connect.client.records.TotalCaloriesBurnedRecord
import com.facebook.react.bridge.ActivityEventListener
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.launch

class HealthConnectModule(reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext), ActivityEventListener {

    private val logTag = "HealthConnectModule"
    private val healthConnectAction = "androidx.health.ACTION_HEALTH_CONNECT_SETTINGS"
    private val providerPackageName = "com.google.android.apps.healthdata"
    private val scope = CoroutineScope(SupervisorJob() + Dispatchers.IO)
    private val requestedPermissions = setOf(
        HealthPermission.getReadPermission(BloodPressureRecord::class),      // Tensão arterial
        HealthPermission.getReadPermission(HeartRateRecord::class),           // Freq. cardíaca / Batimentos
        HealthPermission.getReadPermission(OxygenSaturationRecord::class),    // Oxigénio (SpO2)
        HealthPermission.getReadPermission(StepsRecord::class),               // Passos
        HealthPermission.getReadPermission(BodyTemperatureRecord::class),     // Temperatura
        HealthPermission.getReadPermission(SleepSessionRecord::class),        // Sono
        HealthPermission.getReadPermission(TotalCaloriesBurnedRecord::class), // Calorias
        HealthPermission.getReadPermission(HeartRateVariabilityRmssdRecord::class), // Stress (HRV proxy)
    )
    init {
        reactContext.addActivityEventListener(this)
    }

    override fun getName(): String = "HealthConnectModule"

    override fun onActivityResult(
        activity: Activity,
        requestCode: Int,
        resultCode: Int,
        data: Intent?
    ) {
    }

    override fun onNewIntent(intent: Intent) {
    }

    private suspend fun getGrantedPermissions(): Set<String> {
        Log.d(logTag, "Fetching granted permissions from Health Connect")
        return HealthConnectClient.getOrCreate(reactApplicationContext)
            .permissionController
            .getGrantedPermissions()
    }

    @ReactMethod
    fun checkHealthConnectStatus(promise: Promise) {
        Log.d(logTag, "checkHealthConnectStatus called")
        scope.launch {
            try {
                val intent = Intent(healthConnectAction)
                val packageManager = reactApplicationContext.packageManager
                val isInstalled = intent.resolveActivity(packageManager) != null
                Log.d(logTag, "Health Connect installed=$isInstalled")
                val grantedPermissions = if (isInstalled) {
                    getGrantedPermissions()
                } else {
                    emptySet()
                }
                val allPermissionsGranted =
                    requestedPermissions.all { grantedPermissions.contains(it) }
                Log.d(
                    logTag,
                    "Status resolved installed=$isInstalled grantedCount=${grantedPermissions.size} allGranted=$allPermissionsGranted"
                )

                val result = Arguments.createMap().apply {
                    putBoolean("installed", isInstalled)
                    putBoolean("available", isInstalled)
                    putBoolean("needsUpdate", false)
                    putBoolean("permissionsGranted", allPermissionsGranted)
                    putInt("grantedPermissionsCount", grantedPermissions.size)
                    putInt("sdkStatus", if (isInstalled) 3 else 1)
                    putString("providerPackageName", providerPackageName)
                }

                promise.resolve(result)
            } catch (e: Exception) {
                Log.e(logTag, "checkHealthConnectStatus failed", e)
                promise.reject("ERR_HEALTH", e.message, e)
            }
        }
    }

    @ReactMethod
    fun getHealthConnectStatus(promise: Promise) {
        try {
            checkHealthConnectStatus(promise)
        } catch (e: Exception) {
            promise.reject("ERR_HEALTH", e.message, e)
        }
    }

    @ReactMethod
    fun openHealthConnectSettings(promise: Promise) {
        Log.d(logTag, "openHealthConnectSettings called")
        try {
            val activity = reactApplicationContext.currentActivity
            if (activity == null) {
                Log.e(logTag, "openHealthConnectSettings failed: current activity is null")
                promise.reject("ERR_NO_ACTIVITY", "Android Activity is null")
                return
            }

            val intent = Intent(healthConnectAction)
            Log.d(logTag, "Opening Health Connect settings")
            activity.startActivity(intent)
            promise.resolve(true)
        } catch (e: Exception) {
            Log.e(logTag, "openHealthConnectSettings failed", e)
            promise.reject("ERR_OPEN_SETTINGS", e.message, e)
        }
    }

    @ReactMethod
    fun requestPermissions(promise: Promise) {
        Log.d(logTag, "requestPermissions called")
        scope.launch {
            try {
                val grantedPermissions = getGrantedPermissions()
                val allPermissionsGranted =
                    requestedPermissions.all { grantedPermissions.contains(it) }
                Log.d(
                    logTag,
                    "requestPermissions current grantedCount=${grantedPermissions.size} allGranted=$allPermissionsGranted"
                )

                if (allPermissionsGranted) {
                    val result = Arguments.createMap().apply {
                        putBoolean("granted", true)
                        putBoolean("denied", false)
                        putBoolean("opened", false)
                        putArray("grantedPermissions", Arguments.fromList(grantedPermissions.toList()))
                    }
                    Log.d(logTag, "Permissions already granted, resolving without opening settings")
                    promise.resolve(result)
                    return@launch
                }

                val activity = reactApplicationContext.currentActivity
                if (activity == null) {
                    Log.e(logTag, "requestPermissions failed: current activity is null")
                    promise.reject("ERR_NO_ACTIVITY", "Android Activity is null")
                    return@launch
                }

                val intent = Intent(healthConnectAction)
                Log.d(logTag, "Permissions missing, opening Health Connect settings")
                activity.startActivity(intent)

                val result = Arguments.createMap().apply {
                    putBoolean("granted", false)
                    putBoolean("denied", false)
                    putBoolean("opened", true)
                    putArray("grantedPermissions", Arguments.fromList(grantedPermissions.toList()))
                }
                Log.d(logTag, "Settings opened, resolving to JS")
                promise.resolve(result)
            } catch (e: Exception) {
                Log.e(logTag, "requestPermissions failed", e)
                promise.reject("ERR_OPEN_SETTINGS", e.message, e)
            }
        }
    }
}
