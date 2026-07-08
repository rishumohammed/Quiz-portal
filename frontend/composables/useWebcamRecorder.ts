import { ref, shallowRef } from 'vue';
import { useApi } from '@/composables/useApi';

export const useWebcamRecorder = () => {
  const api = useApi();
  const stream = shallowRef<MediaStream | null>(null);
  const mediaRecorder = shallowRef<MediaRecorder | null>(null);
  const isRecording = ref(false);
  const cameraError = ref('');
  
  let chunkIndex = 0;
  let attemptIdRef = '';
  let authHeadersRef: any = null;

  const requestCamera = async (): Promise<boolean> => {
    try {
      cameraError.value = '';
      stream.value = await navigator.mediaDevices.getUserMedia({ 
        video: { width: 640, height: 480, frameRate: 15 },
        audio: false // Depending on privacy policies, audio might not be allowed. Assuming video only.
      });
      return true;
    } catch (err: any) {
      console.error('Camera access denied or failed', err);
      cameraError.value = 'Camera access is required for proctored exams. Please allow permissions and try again.';
      return false;
    }
  };

  const startRecording = (attemptId: string, recordFullVideo: boolean = false, customHeaders?: any) => {
    if (!stream.value) return;
    
    attemptIdRef = attemptId;
    authHeadersRef = customHeaders;
    chunkIndex = 0;

    if (!recordFullVideo) {
      isRecording.value = false;
      return;
    }

    // Check supported mime types
    let options = { mimeType: 'video/webm' };
    if (MediaRecorder.isTypeSupported('video/webm; codecs=vp9')) {
      options.mimeType = 'video/webm; codecs=vp9';
    } else if (MediaRecorder.isTypeSupported('video/webm; codecs=vp8')) {
      options.mimeType = 'video/webm; codecs=vp8';
    }

    try {
      mediaRecorder.value = new MediaRecorder(stream.value, options);
    } catch (e) {
      console.warn('Fallback to default MediaRecorder options');
      mediaRecorder.value = new MediaRecorder(stream.value);
    }

    mediaRecorder.value.ondataavailable = handleDataAvailable;
    
    // Start recording, slicing every 60 seconds (60000ms)
    mediaRecorder.value.start(60000);
    isRecording.value = true;
  };

  const handleDataAvailable = async (event: BlobEvent) => {
    if (event.data && event.data.size > 0 && attemptIdRef) {
      const blob = event.data;
      const formData = new FormData();
      formData.append('attempt_id', attemptIdRef);
      formData.append('chunk_index', chunkIndex.toString());
      formData.append('video', blob, `chunk-${chunkIndex}.webm`);
      
      chunkIndex++;

      try {
        const requestHeaders = authHeadersRef ? { 'Content-Type': 'multipart/form-data', ...authHeadersRef } : { 'Content-Type': 'multipart/form-data' };
        await api.post('/proctoring/recording-chunk', formData, {
          headers: requestHeaders
        });
      } catch (err) {
        console.error('Failed to upload video chunk', err);
      }
    }
  };

  const captureScreenshot = async (attemptId: string, customHeaders?: any): Promise<string | null> => {
    if (!stream.value) return null;
    const videoEl = document.querySelector('video');
    if (!videoEl) return null;

    try {
      const canvas = document.createElement('canvas');
      canvas.width = videoEl.videoWidth || 640;
      canvas.height = videoEl.videoHeight || 480;
      const ctx = canvas.getContext('2d');
      if (!ctx) return null;
      ctx.drawImage(videoEl, 0, 0, canvas.width, canvas.height);

      return new Promise((resolve) => {
        canvas.toBlob(async (blob) => {
          if (!blob) {
            resolve(null);
            return;
          }
          const formData = new FormData();
          formData.append('attempt_id', attemptId);
          formData.append('image', blob, 'screenshot.jpg');

          try {
            const requestHeaders = customHeaders ? { 'Content-Type': 'multipart/form-data', ...customHeaders } : { 'Content-Type': 'multipart/form-data' };
            const res = await api.post('/proctoring/violation-screenshot', formData, {
              headers: requestHeaders
            });
            resolve(res.data?.url || null);
          } catch (err) {
            console.error('Failed to upload screenshot', err);
            resolve(null);
          }
        }, 'image/jpeg', 0.85);
      });
    } catch (e) {
      console.error('Error in captureScreenshot', e);
      return null;
    }
  };

  const stopRecording = () => {
    if (mediaRecorder.value && mediaRecorder.value.state !== 'inactive') {
      mediaRecorder.value.stop();
    }
    isRecording.value = false;
  };

  const releaseCamera = () => {
    if (stream.value) {
      stream.value.getTracks().forEach(track => track.stop());
      stream.value = null;
    }
  };

  return {
    stream,
    cameraError,
    isRecording,
    requestCamera,
    startRecording,
    captureScreenshot,
    stopRecording,
    releaseCamera
  };
};
