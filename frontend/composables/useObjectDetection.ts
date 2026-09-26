import { ref, shallowRef } from 'vue';
import * as cocoSsd from '@tensorflow-models/coco-ssd';
import '@tensorflow/tfjs';

export const useObjectDetection = () => {
  const model = shallowRef<cocoSsd.ObjectDetection | null>(null);
  const isModelLoading = ref(false);
  const objectDetectionError = ref('');
  const lastWarningTime = ref(0);
  
  let detectionInterval: NodeJS.Timeout | null = null;
  let cellPhoneCounter = 0;
  let isDetecting = false;

  const loadModel = async () => {
    if (model.value) return;
    try {
      isModelLoading.value = true;
      objectDetectionError.value = '';
      // Load ultra-lightweight mobile architecture for maximum FPS and speed
      model.value = await cocoSsd.load({ base: 'lite_mobilenet_v2' });
      console.info('[ObjectDetection] COCO-SSD lite model loaded successfully.');
    } catch (err: any) {
      console.error('Object detection model failed to load', err);
      // Fallback load without explicit base config if lite_mobilenet_v2 fails
      try {
        model.value = await cocoSsd.load();
      } catch (fallbackErr) {
        objectDetectionError.value = 'Failed to load object detection model.';
      }
    } finally {
      isModelLoading.value = false;
    }
  };

  const startDetection = async (
    videoElement: HTMLVideoElement, 
    logEventCallback: (type: string, meta?: any) => void, 
    warningCallback: (msg: string) => void
  ) => {
    if (detectionInterval) {
      clearInterval(detectionInterval);
      detectionInterval = null;
    }

    if (!model.value) {
      console.info('[ObjectDetection] Model not ready yet. Pre-loading COCO-SSD model...');
      if (isModelLoading.value) {
        let attempts = 0;
        while (!model.value && attempts < 30) {
          await new Promise(res => setTimeout(res, 300));
          attempts++;
        }
      } else {
        await loadModel();
      }
      if (!model.value) {
        console.error('[ObjectDetection] Failed to start object detection: Model failed to load.');
        return;
      }
    }

    console.info('[ObjectDetection] Ultra-fast instant mobile phone detection loop active.');
    cellPhoneCounter = 0;
    isDetecting = false;

    // Fast 150ms cadence for instantaneous secondary device & phone detection
    detectionInterval = setInterval(async () => {
      if (videoElement && videoElement.readyState >= 2 && model.value && !isDetecting) {
        try {
          isDetecting = true;
          // minScore: 0.45 captures vertical, horizontal, screen-on/off mobile phones immediately
          const predictions = await model.value.detect(videoElement, 6, 0.45);
          
          const TARGET_CLASSES = ['cell phone', 'phone', 'mobile phone', 'telephone'];
          const phonePrediction = predictions.find(
            p => p && p.class && TARGET_CLASSES.includes(p.class.toLowerCase()) && p.score >= 0.45
          );
          
          if (phonePrediction) {
            const now = Date.now();
            const confidence = Math.round(phonePrediction.score * 100);

            // Instant trigger on detection
            if (now - lastWarningTime.value > 3500) { // 3.5s warning throttle
              lastWarningTime.value = now;
              logEventCallback('mobile_phone_detected', { object: 'Mobile Phone', confidence: `${confidence}%` });
              warningCallback(`Mobile phone detected. Please put away all unauthorized devices immediately.`);
            }
          }
        } catch (e) {
          console.warn('Object estimation error:', e);
        } finally {
          isDetecting = false;
        }
      }
    }, 150);
  };

  const stopDetection = () => {
    if (detectionInterval) {
      clearInterval(detectionInterval);
      detectionInterval = null;
    }
    isDetecting = false;
  };

  const resetWarningTimers = (gracePeriodMs = 3000) => {
    lastWarningTime.value = Date.now() + gracePeriodMs;
    cellPhoneCounter = 0;
  };

  return {
    loadModel,
    startDetection,
    stopDetection,
    resetWarningTimers,
    isModelLoading,
    objectDetectionError
  };
};

