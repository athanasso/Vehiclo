package expo.modules.mymodule

import android.content.Intent
import android.net.Uri
import android.os.Bundle
import android.speech.RecognitionListener
import android.speech.RecognizerIntent
import android.speech.SpeechRecognizer
import com.google.mlkit.vision.common.InputImage
import com.google.mlkit.vision.text.TextRecognition
import com.google.mlkit.vision.text.latin.TextRecognizerOptions
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import expo.modules.kotlin.Promise

class MyModule : Module() {
  private var speechRecognizer: SpeechRecognizer? = null

  override fun definition() = ModuleDefinition {
    Name("MyModule")
    Events("onSpeechResults", "onSpeechError")

    Function("startListening") { ->
      val activity = appContext.currentActivity ?: return@Function false
      
      activity.runOnUiThread {
        speechRecognizer?.destroy()
        speechRecognizer = SpeechRecognizer.createSpeechRecognizer(activity).apply {
          setRecognitionListener(object : RecognitionListener {
            override fun onReadyForSpeech(params: Bundle?) {}
            override fun onBeginningOfSpeech() {}
            override fun onRmsChanged(rmsdB: Float) {}
            override fun onBufferReceived(buffer: ByteArray?) {}
            override fun onEndOfSpeech() {}
            override fun onError(error: Int) {
              sendEvent("onSpeechError", mapOf("error" to error.toString()))
            }
            override fun onResults(results: Bundle?) {
              val matches = results?.getStringArrayList(SpeechRecognizer.RESULTS_RECOGNITION)
              if (!matches.isNullOrEmpty()) {
                  sendEvent("onSpeechResults", mapOf("text" to matches[0], "isFinal" to true))
              }
            }
            override fun onPartialResults(results: Bundle?) {
              val matches = results?.getStringArrayList(SpeechRecognizer.RESULTS_RECOGNITION)
              if (!matches.isNullOrEmpty()) {
                  sendEvent("onSpeechResults", mapOf("text" to matches[0], "isFinal" to false))
              }
            }
            override fun onEvent(eventType: Int, params: Bundle?) {}
          })

          val intent = Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH).apply {
            putExtra(RecognizerIntent.EXTRA_LANGUAGE_MODEL, RecognizerIntent.LANGUAGE_MODEL_FREE_FORM)
            putExtra(RecognizerIntent.EXTRA_PARTIAL_RESULTS, true)
          }
          startListening(intent)
        }
      }
      return@Function true
    }

    Function("stopListening") { ->
      val activity = appContext.currentActivity ?: return@Function false
      activity.runOnUiThread {
        speechRecognizer?.stopListening()
      }
      return@Function true
    }

    AsyncFunction("recognizeText") { imageUri: String, promise: Promise ->
      try {
        val context = appContext.reactContext ?: throw Exception("No React Context")
        val uri = Uri.parse(imageUri)
        val image = InputImage.fromFilePath(context, uri)
        
        val recognizer = TextRecognition.getClient(TextRecognizerOptions.DEFAULT_OPTIONS)

        recognizer.process(image)
          .addOnSuccessListener { visionText ->
            promise.resolve(visionText.text)
          }
          .addOnFailureListener { e ->
            promise.reject("OCR_FAILED", e.message ?: "Failed to read image", e)
          }
      } catch (e: Exception) {
        promise.reject("OCR_ERROR", e.message ?: "Error parsing image", e)
      }
    }
  }
}
