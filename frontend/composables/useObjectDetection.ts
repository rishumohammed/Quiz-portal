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

  const startDetection = (videoElement: HTMLVideoElement, logEventCallback: (type: string, meta?: any) => void, warningCallback: (msg: string) => void) => {
    if (!model.value) return;

    // Run every 1 second
    detectionInterval = setInterval(async () => {
      if (videoElement.readyState === 4 && model.value) {
        try {
          const predictions = await model.value.detect(videoElement);
          
          const hasCellPhone = predictions.some(p => p.class === 'cell phone' && p.score > 0.6);
          
          if (hasCellPhone) {
            cellPhoneCounter++;
            if (cellPhoneCounter >= 2) { // Need 2 consecutive hits to avoid false positives
              cellPhoneCounter = 0;
              logEventCallback('mobile_phone_detected', { object: 'cell phone' });
              
              if (Date.now() - lastWarningTime.value > 15000) {
                warningCallback('Mobile phone detected. Please put away all devices.');
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
    }, 1000);
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
