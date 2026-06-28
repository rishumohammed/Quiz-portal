import { ref, onMounted, onUnmounted } from 'vue';
import { useApi } from '@/composables/useApi';

export const useProctoring = () => {
  const api = useApi();
  const attemptId = ref<string | null>(null);
  
  const isFullscreen = ref(false);
  const isDevToolsOpen = ref(false);
  
  // Violations
  const tabSwitchCount = ref(0);
  const maxTabSwitches = 3;
  const violationWarning = ref<{ show: boolean, message: string }>({ show: false, message: '' });
  
  const proctoringConfig = ref<any>({});
  let captureScreenshotCallback: (() => Promise<string | null>) | null = null;
  let submitCallback: ((reason: string) => void) | null = null;
  let devToolsInterval: NodeJS.Timeout;

  const initProctoring = (id: string, onSubmit: (reason: string) => void, config: any = {}, captureScreenshotFn?: () => Promise<string | null>) => {
    attemptId.value = id;
    submitCallback = onSubmit;
    proctoringConfig.value = config;
    if (captureScreenshotFn) {
      captureScreenshotCallback = captureScreenshotFn;
    }

    // Listeners
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleWindowBlur);
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('contextmenu', preventDefaultAction);
    document.addEventListener('copy', preventDefaultAction);
    document.addEventListener('cut', preventDefaultAction);
    document.addEventListener('paste', preventDefaultAction);
    document.addEventListener('keydown', handleKeydown);

    // DevTools detection loop
    devToolsInterval = setInterval(detectDevTools, 1000);
    
    // Initial Fullscreen check
    checkFullscreen();
  };

  const cleanupProctoring = () => {
    document.removeEventListener('visibilitychange', handleVisibilityChange);
    window.removeEventListener('blur', handleWindowBlur);
    document.removeEventListener('fullscreenchange', handleFullscreenChange);
    document.removeEventListener('contextmenu', preventDefaultAction);
    document.removeEventListener('copy', preventDefaultAction);
    document.removeEventListener('cut', preventDefaultAction);
    document.removeEventListener('paste', preventDefaultAction);
    document.removeEventListener('keydown', handleKeydown);
    
    clearInterval(devToolsInterval);
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(e => console.warn('Could not exit fullscreen', e));
    }
  };

  const logEvent = async (type: string, metadata: any = {}) => {
    if (!attemptId.value) return;
    try {
      // Auto-capture screenshot on violation if option enabled
      if (proctoringConfig.value?.capture_on_violation && captureScreenshotCallback) {
        const screenshotUrl = await captureScreenshotCallback();
        if (screenshotUrl) {
          metadata.screenshot = screenshotUrl;
        }
      }

      await api.post('/proctoring/events', {
        attempt_id: attemptId.value,
        type,
        timestamp: new Date().toISOString(),
        ...metadata
      });
    } catch (e) {
      console.error('Failed to log proctoring event', e);
    }
  };

  const speakWarning = (text: string) => {
    if (proctoringConfig.value?.enable_voice_alert !== false && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      
      const voices = window.speechSynthesis.getVoices();
      if (voices.length > 0) {
        const enVoice = voices.find(v => v.lang.startsWith('en'));
        if (enVoice) utterance.voice = enVoice;
      }
      
      utterance.volume = 1;
      utterance.rate = 1;
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleVisibilityChange = () => {
    if (document.visibilityState === 'hidden') {
      handleViolation('tab_switch');
    }
  };

  const handleWindowBlur = () => {
    // Window blur is another strong indicator of leaving the exam
    if (document.visibilityState !== 'hidden') {
      handleViolation('window_blur');
    }
  };

  const handleViolation = (type: string) => {
    tabSwitchCount.value++;
    logEvent(type, { count: tabSwitchCount.value });

    if (tabSwitchCount.value >= maxTabSwitches) {
      const msg = 'You have exceeded the maximum allowed tab switches. Your exam is being automatically submitted.';
      violationWarning.value = { show: true, message: msg };
      speakWarning(msg);
      if (submitCallback) submitCallback('tab_switch_limit_exceeded');
    } else {
      const msg = `Warning ${tabSwitchCount.value} out of ${maxTabSwitches}: Please do not leave the exam window. Doing so again may result in auto-submission.`;
      violationWarning.value = { show: true, message: msg };
      speakWarning(msg);
    }
  };

  const handleFullscreenChange = () => {
    checkFullscreen();
    if (!isFullscreen.value) {
      logEvent('fullscreen_exit');
      const msg = 'You have exited fullscreen mode. You must return to fullscreen to continue the exam.';
      violationWarning.value = { show: true, message: msg };
      speakWarning(msg);
    }
  };

  const checkFullscreen = () => {
    isFullscreen.value = !!document.fullscreenElement;
  };

  const requestFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
      }
      violationWarning.value.show = false;
    } catch (e) {
      console.error('Failed to enter fullscreen', e);
    }
  };

  const preventDefaultAction = (e: Event) => {
    e.preventDefault();
  };

  const handleKeydown = (e: KeyboardEvent) => {
    // Block common DevTools / Save shortcuts
    if (
      e.key === 'F12' ||
      (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'i')) ||
      (e.ctrlKey && (e.key === 'U' || e.key === 'u')) ||
      (e.ctrlKey && (e.key === 'S' || e.key === 's')) ||
      (e.ctrlKey && (e.key === 'A' || e.key === 'a'))
    ) {
      e.preventDefault();
      logEvent('forbidden_shortcut', { key: e.key });
    }
  };

  const detectDevTools = () => {
    const widthThreshold = window.outerWidth - window.innerWidth > 160;
    const heightThreshold = window.outerHeight - window.innerHeight > 160;
    
    if ((widthThreshold || heightThreshold) && !isDevToolsOpen.value) {
      isDevToolsOpen.value = true;
      logEvent('devtools_open');
    } else if (!widthThreshold && !heightThreshold && isDevToolsOpen.value) {
      isDevToolsOpen.value = false;
    }
  };

  const dismissWarning = () => {
    violationWarning.value.show = false;
  };

  return {
    initProctoring,
    cleanupProctoring,
    requestFullscreen,
    logEvent,
    dismissWarning,
    speakWarning,
    isFullscreen,
    violationWarning,
    tabSwitchCount
  };
};
