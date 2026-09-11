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

  const loadModel = async () => {
    try {
      isModelLoading.value = true;
      objectDetectionError.value = '';
      model.value = await cocoSsd.load();
    } catch (err: any) {
      console.error('Object detection model failed to load', err);
      objectDetectionError.value = 'Failed to load object detection model.';
    } finally {
      isModelLoading.value = false;
    }
  };

  const startDetection = async (videoElement: HTMLVideoElement, logEventCallback: (type: string, meta?: any) => void, warningCallback: (msg: string) => void) => {
    if (detectionInterval) {
      clearInterval(detectionInterval);
      detectionInterval = null;
    }

    if (!model.value) {
      console.info('[ObjectDetection] Model not ready yet. Waiting for COCO-SSD model...');
      if (isModelLoading.value) {
        let attempts = 0;
        while (!model.value && attempts < 30) {
          await new Promise(res => setTimeout(res, 500));
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

    console.info('[ObjectDetection] Object & phone detection loop active.');

    // Run every 800ms
    detectionInterval = setInterval(async () => {
      if (videoElement && videoElement.readyState >= 2 && model.value) {
        try {
          const predictions = await model.value.detect(videoElement);
          const hasCellPhone = predictions.some(p => p.class === 'cell phone' && p.score > 0.5);
          
          if (hasCellPhone) {
            cellPhoneCounter++;
            if (cellPhoneCounter >= 1) { // Immediate 1-hit detection
              cellPhoneCounter = 0;
              logEventCallback('mobile_phone_detected', { object: 'cell phone' });
              
              if (Date.now() - lastWarningTime.value > 4000) { // 4s warning throttle
                warningCallback('Mobile phone detected. Please put away all secondary devices.');
                lastWarningTime.value = Date.now();
              }
            }
          } else {
            cellPhoneCounter = 0;
          }
        } catch (e) {
          console.warn('Object estimation error', e);
        }
      }
    }, 800);
  };

  const stopDetection = () => {
    if (detectionInterval) {
      clearInterval(detectionInterval);
      detectionInterval = null;
    }
  };

  return {
    loadModel,
    startDetection,
    stopDetection,
    isModelLoading,
    objectDetectionError
  };
};
