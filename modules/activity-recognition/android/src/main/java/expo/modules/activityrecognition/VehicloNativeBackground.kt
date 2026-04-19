package expo.modules.activityrecognition

import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.location.Location
import android.os.Build
import android.os.IBinder
import androidx.core.app.NotificationCompat
import com.google.android.gms.location.*
import org.json.JSONArray
import org.json.JSONObject

// ── Shared Preferences for Native Trip Storage ──
object TripStore {
    private const val PREFS = "vehiclo_native_tracking"
    fun addDistance(context: Context, distance: Float) {
        val prefs = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
        val current = prefs.getFloat("pending_km", 0f)
        prefs.edit().putFloat("pending_km", current + (distance / 1000f)).apply()
    }
    fun addRoutePoint(context: Context, lat: Double, lng: Double) {
        val prefs = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
        val existing = prefs.getString("pending_route", "[]") ?: "[]"
        val arr = JSONArray(existing)
        val point = JSONObject().apply {
            put("lat", lat)
            put("lng", lng)
            put("time", System.currentTimeMillis())
        }
        arr.put(point)
        prefs.edit().putString("pending_route", arr.toString()).apply()
    }
    fun getPendingKm(context: Context): Float {
        return context.getSharedPreferences(PREFS, Context.MODE_PRIVATE).getFloat("pending_km", 0f)
    }
    fun getPendingRoute(context: Context): String {
        return context.getSharedPreferences(PREFS, Context.MODE_PRIVATE).getString("pending_route", "[]") ?: "[]"
    }
    fun clearTrip(context: Context) {
        context.getSharedPreferences(PREFS, Context.MODE_PRIVATE).edit()
            .putFloat("pending_km", 0f)
            .putString("pending_route", "[]")
            .apply()
    }
}

// ── Foreground Service for GPS Tracking when Driving ──
class VehicloTrackerService : Service() {
    private lateinit var fusedLocationClient: FusedLocationProviderClient
    private lateinit var locationCallback: LocationCallback
    private var lastLocation: Location? = null

    override fun onCreate() {
        super.onCreate()
        fusedLocationClient = LocationServices.getFusedLocationProviderClient(this)
        
        createNotificationChannel()
        val notification = NotificationCompat.Builder(this, "vehiclo_tracking")
            .setContentTitle("Vehiclo")
            .setContentText("Auto-tracking your drive...")
            // Fallback icon since we don't know the exact resource ID, standard android icon works
            .setSmallIcon(android.R.drawable.ic_menu_mylocation)
            .build()
            
        startForeground(1992, notification)

        locationCallback = object : LocationCallback() {
            override fun onLocationResult(locationResult: LocationResult) {
                for (location in locationResult.locations) {
                    // Record GPS coordinate for route drawing
                    TripStore.addRoutePoint(this@VehicloTrackerService, location.latitude, location.longitude)
                    
                    lastLocation?.let { prev ->
                        val distance = prev.distanceTo(location)
                        // Filter GPS noise, only accumulate if moved more than 5m
                        if (distance in 5.0..5000.0) {
                            TripStore.addDistance(this@VehicloTrackerService, distance)
                        }
                    }
                    lastLocation = location
                }
            }
        }
        
        val request = LocationRequest.Builder(Priority.PRIORITY_HIGH_ACCURACY, 5000)
            .setMinUpdateDistanceMeters(20f)
            .build()
            
        try {
            fusedLocationClient.requestLocationUpdates(request, locationCallback, null)
        } catch (e: SecurityException) {
            e.printStackTrace()
            stopSelf()
        }
    }

    override fun onDestroy() {
        super.onDestroy()
        fusedLocationClient.removeLocationUpdates(locationCallback)
    }

    override fun onBind(intent: Intent?): IBinder? = null

    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel("vehiclo_tracking", "Drive Tracking", NotificationManager.IMPORTANCE_LOW)
            val manager = getSystemService(NotificationManager::class.java)
            manager.createNotificationChannel(channel)
        }
    }
}

// ── Broadcast Receiver for Activity Recognition ──
class ActivityTransitionReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
        if (ActivityTransitionResult.hasResult(intent)) {
            val result = ActivityTransitionResult.extractResult(intent)
            for (event in result!!.transitionEvents) {
                if (event.activityType == DetectedActivity.IN_VEHICLE) {
                    val serviceIntent = Intent(context, VehicloTrackerService::class.java)
                    if (event.transitionType == ActivityTransition.ACTIVITY_TRANSITION_ENTER) {
                        // Started driving -> Start GPS Tracking Service
                        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                            context.startForegroundService(serviceIntent)
                        } else {
                            context.startService(serviceIntent)
                        }
                    } else if (event.transitionType == ActivityTransition.ACTIVITY_TRANSITION_EXIT) {
                        // Stopped driving -> Stop GPS tracking
                        context.stopService(serviceIntent)
                    }
                }
            }
        }
    }
}
