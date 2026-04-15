package expo.modules.activityrecognition

import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.os.Build
import com.google.android.gms.location.ActivityRecognition
import com.google.android.gms.location.ActivityTransition
import com.google.android.gms.location.ActivityTransitionRequest
import com.google.android.gms.location.DetectedActivity
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class ActivityRecognitionModule : Module() {
  private val context: Context
    get() = appContext.reactContext ?: throw Exception("React context not available")

  private fun getPendingIntent(): PendingIntent {
    val intent = Intent(context, ActivityTransitionReceiver::class.java)
    val flags = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
      PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_MUTABLE
    } else {
      PendingIntent.FLAG_UPDATE_CURRENT
    }
    return PendingIntent.getBroadcast(context, 100, intent, flags)
  }

  override fun definition() = ModuleDefinition {
    Name("ActivityRecognition")

    AsyncFunction("startObserving") { ->
      val transitions = mutableListOf<ActivityTransition>()
      
      transitions.add(
        ActivityTransition.Builder()
          .setActivityType(DetectedActivity.IN_VEHICLE)
          .setActivityTransition(ActivityTransition.ACTIVITY_TRANSITION_ENTER)
          .build()
      )
      
      transitions.add(
        ActivityTransition.Builder()
          .setActivityType(DetectedActivity.IN_VEHICLE)
          .setActivityTransition(ActivityTransition.ACTIVITY_TRANSITION_EXIT)
          .build()
      )

      val request = ActivityTransitionRequest(transitions)
      val client = ActivityRecognition.getClient(context)
      
      try {
        client.requestActivityTransitionUpdates(request, getPendingIntent())
        true
      } catch (e: SecurityException) {
        false
      }
    }

    AsyncFunction("stopObserving") { ->
      val client = ActivityRecognition.getClient(context)
      try {
        client.removeActivityTransitionUpdates(getPendingIntent())
        
        // Also ensure service is stopped if it's currently running
        context.stopService(Intent(context, VehicloTrackerService::class.java))
        true
      } catch (e: SecurityException) {
        false
      }
    }

    AsyncFunction("getPendingDistanceKm") { ->
      TripStore.getPendingKm(context)
    }

    AsyncFunction("clearPendingDistance") { ->
      TripStore.clearTrip(context)
    }
  }
}
