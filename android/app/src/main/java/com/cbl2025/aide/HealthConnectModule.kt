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
        HealthPermission.getReadPermission(BloodPressureRecord::class),
        HealthPermission.getReadPermission(HeartRateRecord::class),
        HealthPermission.getReadPermission(OxygenSaturationRecord::class),
        HealthPermission.getReadPermission(StepsRecord::class),
        HealthPermission.getReadPermission(BodyTemperatureRecord::class),
        HealthPermission.getReadPermission(SleepSessionRecord::class),
        HealthPermission.getReadPermission(TotalCaloriesBurnedRecord::class),
        HealthPermission.getReadPermission(HeartRateVariabilityRmssdRecord::class),
    )

    init {
        reactContext.addActivityEventListener(this)
    }

    override fun getName(): String = "HealthConnectModule"

    override fun onActivityResult(activity: Activity, requestCode: Int, resultCode: Int, data: Intent?) {}
    override fun onNewIntent(intent: Intent) {}

    private suspend fun getGrantedPermissions(): Set<String> {
        return HealthConnectClient.getOrCreate(reactApplicationContext)
            .permissionController
            .getGrantedPermissions()
    }

    @ReactMethod
    fun checkHealthConnectStatus(promise: Promise) {
        scope.launch {
            try {
                val intent = Intent(healthConnectAction)
                val packageManager = reactApplicationContext.packageManager
                val isInstalled = intent.resolveActivity(packageManager) != null

                val grantedPermissions = if (isInstalled) {
                    getGrantedPermissions()
                } else {
                    emptySet()
                }

                val allPermissionsGranted =
                    requestedPermissions.all { grantedPermissions.contains(it) }

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
                promise.reject("ERR_HEALTH", e.message, e)
            }
        }
    }

    @ReactMethod
    fun getHealthConnectStatus(promise: Promise) {
        checkHealthConnectStatus(promise)
    }

    @ReactMethod
    fun openHealthConnectSettings(promise: Promise) {
        try {
            val activity = reactApplicationContext.currentActivity
            if (activity == null) {
                promise.reject("ERR_NO_ACTIVITY", "Android Activity is null")
                return
            }

            val intent = Intent(healthConnectAction)
            activity.startActivity(intent)
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("ERR_OPEN_SETTINGS", e.message, e)
        }
    }

    @ReactMethod
    fun requestPermissions(promise: Promise) {
        scope.launch {
            try {
                val grantedPermissions = getGrantedPermissions()
                val allPermissionsGranted =
                    requestedPermissions.all { grantedPermissions.contains(it) }

                if (allPermissionsGranted) {
                    val result = Arguments.createMap().apply {
                        putBoolean("granted", true)
                        putBoolean("denied", false)
                        putBoolean("opened", false)
                        putArray("grantedPermissions", Arguments.fromList(grantedPermissions.toList()))
                    }
                    promise.resolve(result)
                    return@launch
                }

                val activity = reactApplicationContext.currentActivity
                if (activity == null) {
                    promise.reject("ERR_NO_ACTIVITY", "Android Activity is null")
                    return@launch
                }

                val intent = Intent(healthConnectAction)
                activity.startActivity(intent)

                val result = Arguments.createMap().apply {
                    putBoolean("granted", false)
                    putBoolean("denied", false)
                    putBoolean("opened", true)
                    putArray("grantedPermissions", Arguments.fromList(grantedPermissions.toList()))
                }

                promise.resolve(result)
            } catch (e: Exception) {
                promise.reject("ERR_OPEN_SETTINGS", e.message, e)
            }
        }
    }
}