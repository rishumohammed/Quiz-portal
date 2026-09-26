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
  let authHeaders: any = {};

  const initProctoring = (id: string, onSubmit: (reason: string) => void, config: any = {}, captureScreenshotFn?: () => Promise<string | null>, customHeaders?: any) => {
    attemptId.value = id;
    submitCallback = onSubmit;
    proctoringConfig.value = config;
    if (captureScreenshotFn) {
      captureScreenshotCallback = captureScreenshotFn;
    }
    if (customHeaders) {
      authHeaders = customHeaders;
    }

    // Listeners
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleWindowBlur);
    window.addEventListener('focus', handleWindowFocus);
    fullscreenEvents.forEach(evt => document.addEventListener(evt, handleFullscreenChange));
    document.addEventListener('contextmenu', preventDefaultAction);
    document.addEventListener('copy', preventDefaultAction);
    document.addEventListener('cut', preventDefaultAction);
    document.addEventListener('paste', preventDefaultAction);
    document.addEventListener('keydown', handleKeydown);

    // DevTools detection loop
    devToolsInterval = setInterval(detectDevTools, 1500);
    
    // Initial Fullscreen check
    checkFullscreen();
  };

  const cleanupProctoring = () => {
    document.removeEventListener('visibilitychange', handleVisibilityChange);
    window.removeEventListener('blur', handleWindowBlur);
    window.removeEventListener('focus', handleWindowFocus);
    fullscreenEvents.forEach(evt => document.removeEventListener(evt, handleFullscreenChange));
    document.removeEventListener('contextmenu', preventDefaultAction);
    document.removeEventListener('copy', preventDefaultAction);
    document.removeEventListener('cut', preventDefaultAction);
    document.removeEventListener('paste', preventDefaultAction);
    document.removeEventListener('keydown', handleKeydown);
    
    if (blurTimeout) clearTimeout(blurTimeout);
    clearInterval(devToolsInterval);
    if (isFullscreenActive()) {
      exitFullscreen().catch(e => console.warn('Could not exit fullscreen', e));
    }
  };

  const lastScreenshotTimeMap = new Map<string, number>();
  const SCREENSHOT_COOLDOWN_MS = 10000; // 10 seconds cooldown per violation type for quick timeline screenshots

  const logEvent = async (type: string, metadata: any = {}) => {
    if (!attemptId.value) return;
    try {
      const now = Date.now();
      const lastScreenshotTime = lastScreenshotTimeMap.get(type) || 0;

      // Auto-capture screenshot on violation if option enabled AND cooldown period has passed
      if (proctoringConfig.value?.capture_on_violation && captureScreenshotCallback && (now - lastScreenshotTime >= SCREENSHOT_COOLDOWN_MS)) {
        const screenshotUrl = await captureScreenshotCallback();
        if (screenshotUrl) {
          metadata.screenshot = screenshotUrl;
          lastScreenshotTimeMap.set(type, now);
        }
      }

      await api.post('/proctoring/events', {
        attempt_id: attemptId.value,
        type,
        timestamp: new Date().toISOString(),
        ...metadata
      }, { headers: authHeaders });
    } catch (e) {
      console.error('Failed to log proctoring event', e);
    }
  };

  let lastVoiceSpeakTime = 0;
  const speakWarning = (text: string) => {
    const now = Date.now();
    if (now - lastVoiceSpeakTime < 6000) return; // Prevent audio overlap
    lastVoiceSpeakTime = now;

    if (proctoringConfig.value?.enable_voice_alert !== false && typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        
        const voices = window.speechSynthesis.getVoices();
        if (voices.length > 0) {
          const enVoice = voices.find(v => v.lang.startsWith('en'));
          if (enVoice) utterance.voice = enVoice;
        }
        
        utterance.volume = 0.9;
        utterance.rate = 1.05;
        window.speechSynthesis.speak(utterance);
      } catch (_) {}
    }
  };

  const handleVisibilityChange = () => {
    if (document.visibilityState === 'hidden') {
      handleViolation('tab_switch');
    }
  };

  let blurTimeout: any = null;
  const handleWindowBlur = () => {
    if (blurTimeout) clearTimeout(blurTimeout);
    // 1500ms debounce ensures transient internal focus changes (e.g. speech synthesis, dropdowns) don't trigger false warnings
    blurTimeout = setTimeout(() => {
      if (typeof document !== 'undefined' && !document.hasFocus() && document.visibilityState !== 'hidden') {
        handleViolation('window_blur');
      }
    }, 1500);
  };

  const handleWindowFocus = () => {
    if (blurTimeout) {
      clearTimeout(blurTimeout);
      blurTimeout = null;
    }
  };

  const getMaxTabSwitches = () => {
    return proctoringConfig.value?.max_tab_switches || 5;
  };

  let wasEverFullscreen = false;
  const handleViolation = (type: string) => {
    tabSwitchCount.value++;
    logEvent(type, { count: tabSwitchCount.value });

    const max = getMaxTabSwitches();

    if (tabSwitchCount.value >= max) {
      const msg = 'You have exceeded the maximum allowed tab switches. Your exam is being automatically submitted.';
      violationWarning.value = { show: true, message: msg };
      speakWarning(msg);
      if (submitCallback) submitCallback('tab_switch_limit_exceeded');
    } else {
      const msg = `Warning ${tabSwitchCount.value} of ${max}: Please do not leave the exam window. Doing so again will auto-submit your exam.`;
      violationWarning.value = { show: true, message: msg };
      speakWarning(msg);
    }
  };

  const fullscreenEvents = ['fullscreenchange', 'webkitfullscreenchange', 'mozfullscreenchange', 'MSFullscreenChange'];

  const isFullscreenActive = (): boolean => {
    if (typeof document === 'undefined') return false;
    const doc = document as any;
    return !!(doc.fullscreenElement || doc.webkitFullscreenElement || doc.mozFullScreenElement || doc.msFullscreenElement);
  };

  const handleFullscreenChange = () => {
    checkFullscreen();
    if (isFullscreen.value) {
      wasEverFullscreen = true;
    } else if (wasEverFullscreen && proctoringConfig.value?.enforce_fullscreen) {
      logEvent('fullscreen_exit');
      const msg = 'You have exited fullscreen mode. Please return to fullscreen to continue.';
      violationWarning.value = { show: true, message: msg };
      speakWarning(msg);
    }
  };

  const checkFullscreen = () => {
    isFullscreen.value = isFullscreenActive();
  };

  const requestFullscreen = async () => {
    try {
      if (typeof document !== 'undefined' && !isFullscreenActive()) {
        const docEl = document.documentElement as any;
        const req = docEl.requestFullscreen || docEl.webkitRequestFullscreen || docEl.mozRequestFullScreen || docEl.msRequestFullscreen;
        if (req) {
          await req.call(docEl);
        }
      }
      checkFullscreen();
      violationWarning.value.show = false;
    } catch (e) {
      console.warn('Fullscreen request:', e);
    }
  };

  const exitFullscreen = async () => {
    try {
      if (typeof document !== 'undefined' && isFullscreenActive()) {
        const doc = document as any;
        const exitMethod = doc.exitFullscreen || doc.webkitExitFullscreen || doc.mozCancelFullScreen || doc.msExitFullscreen;
        if (exitMethod) {
          await exitMethod.call(doc);
        }
      }
      checkFullscreen();
    } catch (e) {
      console.warn('Fullscreen exit:', e);
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
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    violationWarning.value.show = false;
    if (!isFullscreen.value) {
      requestFullscreen().catch(e => console.warn('Could not re-enter fullscreen:', e));
    }
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
