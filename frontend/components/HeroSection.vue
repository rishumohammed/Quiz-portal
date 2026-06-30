<template>
  <section class="hero-section" aria-label="Hero">
    <!-- Minimal Light Background Designs -->
    <div class="hero-bg-overlay"></div>
    <div class="bg-shape shape-1"></div>
    <div class="bg-shape shape-2"></div>
    <div class="bg-shape shape-3"></div>
    
    <div class="hero-minimalist">
      <div class="hero-text-container" v-motion-fade-visible>
        <div class="hero-badge">
          <span class="badge-dot"></span>
          Official Platform
        </div>
        
        <h1 class="hero-headline">
          {{ config?.homepage_title || 'KEFTA National Food Tech Talent Hunt' }}
        </h1>
        
        <h2 class="hero-sub">
          {{ config?.homepage_subtitle || 'Discovering, motivating, and supporting emerging food science talents across the nation.' }}
        </h2>
        
        <div class="hero-ctas">
          <NuxtLink to="#exams-section" class="cta-primary">
            View Active Exams
            <svg class="cta-arrow" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M8 3v10M4 9l4 4 4-4" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </NuxtLink>
        </div>
      </div>

      <div class="hero-image-container" v-motion-slide-visible-bottom>
        <div class="floating-wrapper">
          <img
            v-if="heroImgSrc"
            :src="heroImgSrc"
            alt="Food Tech Talent Hunt Hero"
            class="hero-img-3d"
          />
          <div class="hero-shadow"></div>
        </div>
        
        <!-- Floating Stat Badges -->
        <div class="float-card float-left" v-motion-roll-visible-left>
          <div class="float-icon float-icon--blue">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" width="18" height="18">
              <path d="M12 2l3 6 7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1 3-6z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </div>
          <div class="float-content">
            <div class="float-label">National Level</div>
            <div class="float-value-sm">Recognition</div>
          </div>
        </div>

        <div class="float-card float-right" v-motion-roll-visible-right>
          <div class="float-icon float-icon--green">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" width="18" height="18">
              <path d="M22 11.08V12a10 10 0 11-5.93-9.14M22 4L12 14.01l-3-3" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </div>
          <div class="float-content">
            <div class="float-label">Global Standards</div>
            <div class="float-value-sm">100% Verified</div>
          </div>
        </div>
      </div>
    </div>


  </section>
</template>

<script setup lang="ts">
const props = defineProps({
  config: {
    type: Object,
    default: () => ({})
  }
});

const runtimeConfig = useRuntimeConfig();
const baseUrl = computed(() => runtimeConfig.public.apiBase.replace('/api', ''));

const heroImgSrc = computed(() => {
  const url = props.config?.homepage_hero_image_url || props.config?.homepage_hero_image;
  if (!url) return '/img/commercial-food-processing.png';
  if (url.startsWith('http')) return url;
  return baseUrl.value + (url.startsWith('/') ? url : `/${url}`);
});
</script>

<style scoped>
/* ── Base ─────────────────────────────────────────────── */
.hero-section {
  position: relative;
  overflow: hidden;
  background: #fdfdfd; /* Clean, light background */
  color: var(--g7);
  padding: 0 0 0 0;
}

/* ── Minimal Background Designs ───────────────────────── */
.hero-bg-overlay {
  position: absolute;
  top: 0; left: 0; width: 100%; height: 100%;
  background-image: 
    radial-gradient(circle at 80% 10%, rgba(33, 29, 113, 0.03) 0%, transparent 50%),
    radial-gradient(circle at 20% 90%, rgba(246, 130, 31, 0.03) 0%, transparent 50%);
  z-index: 0;
  pointer-events: none;
}

.bg-shape {
  position: absolute;
  border-radius: 50%;
  filter: blur(60px);
  z-index: 0;
  pointer-events: none;
  opacity: 0.6;
}

.shape-1 {
  width: 300px;
  height: 300px;
  background: rgba(33, 29, 113, 0.04);
  top: -50px;
  right: -50px;
}

.shape-2 {
  width: 400px;
  height: 400px;
  background: rgba(246, 130, 31, 0.03);
  bottom: -100px;
  left: -100px;
}

.shape-3 {
  width: 200px;
  height: 200px;
  background: rgba(33, 29, 113, 0.03);
  top: 40%;
  left: 30%;
}

/* ── Inner layout ─────────────────────────────────────── */
.hero-minimalist {
  position: relative;
  z-index: 1;
  max-width: 1000px;
  margin: 0 auto;
  padding: var(--sp-24) var(--sp-8) var(--sp-20);
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

@media (max-width: 900px) {
  .hero-minimalist {
    padding: var(--sp-16) var(--sp-4) var(--sp-12);
  }
}

.hero-text-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 60px;
}

/* ── Badge ────────────────────────────────────────────── */
.hero-badge {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 6px 14px;
  border-radius: 999px;
  border: 1px solid rgba(0, 0, 0, 0.08);
  background: var(--surface);
  font-size: 12px;
  font-weight: 600;
  color: var(--g6);
  letter-spacing: 0.2px;
  margin-bottom: 28px;
}
.badge-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--green);
  
  animation: pulse-dot 2s ease-in-out infinite;
  border: 1px solid var(--border);
}
@keyframes pulse-dot {
  0%, 100% {
  border: 1px solid var(--border);  }
  50%       {
  border: 1px solid var(--border);  }
}

/* ── Headline ─────────────────────────────────────────── */
.hero-headline {
  font-size: clamp(2.6rem, 5.5vw, 4.25rem);
  font-weight: 900;
  line-height: 1.05;
  letter-spacing: -0.04em;
  color: var(--g7);
  margin-bottom: 24px;
}
.headline-accent {
  color: var(--blue);
}

/* ── Sub-copy ─────────────────────────────────────────── */
.hero-sub {
  font-size: 1.1rem;
  font-weight: 400;
  line-height: 1.7;
  color: var(--g5);
  max-width: 460px;
  margin-bottom: 40px;
}

/* ── CTAs ─────────────────────────────────────────────── */
.hero-ctas {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  flex-wrap: wrap;
  margin-bottom: 20px;
}

.cta-primary {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 14px 28px;
  border-radius: var(--radius-md);
  background: var(--accent);
  color: #ffffff;
  font-size: 15px;
  font-weight: 700;
  letter-spacing: -0.01em;
  text-decoration: none;
  transition: all 0.2s ease;
}
.cta-primary:hover {
  opacity: 0.9;
  transform: translateY(-2px);
}
.cta-arrow {
  width: 16px;
  height: 16px;
  transition: transform 0.18s ease;
}
.cta-primary:hover .cta-arrow {
  transform: translateX(3px);
}

.cta-ghost {
  display: inline-flex;
  align-items: center;
  padding: 14px 24px;
  border-radius: var(--radius-md);
  border: 1px solid var(--g2);
  color: var(--g7);
  font-size: 15px;
  font-weight: 600;
  text-decoration: none;
  transition: all 0.2s ease;
}
.cta-ghost:hover {
  border-color: var(--g4);
  background: var(--g1);
}

/* ── Visual / Image ───────────────────────────────────── */
.hero-image-container {
  position: relative;
  width: 100%;
  max-width: 800px;
  margin: 0 auto;
}

.floating-wrapper {
  position: relative;
  animation: float 6s ease-in-out infinite;
}

@keyframes float {
  0% { transform: translateY(0px); }
  50% { transform: translateY(-20px); }
  100% { transform: translateY(0px); }
}

.hero-img-3d {
  width: 100%;
  height: auto;
  display: block;
  object-fit: cover;
  border-radius: 24px;
  box-shadow: 0 30px 60px rgba(0, 0, 0, 0.15), 0 10px 20px rgba(0, 0, 0, 0.05);
  border: 4px solid #ffffff;
  background-color: #ffffff;
}

.hero-shadow {
  position: absolute;
  bottom: -40px;
  left: 10%;
  width: 80%;
  height: 20px;
  background: radial-gradient(ellipse at center, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0) 70%);
  animation: shadowScale 6s ease-in-out infinite;
  opacity: 0.7;
}

@keyframes shadowScale {
  0% { transform: scale(1); opacity: 0.7; }
  50% { transform: scale(0.8); opacity: 0.3; }
  100% { transform: scale(1); opacity: 0.7; }
}

/* ── Floating cards ───────────────────────────────────── */
.float-card {
  position: absolute;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  border-radius: var(--radius-lg);
  background: var(--surface);
  border: 1px solid var(--border);
  min-width: 190px;
  box-shadow: 0 10px 30px rgba(0,0,0,0.08);
}
.float-left {
  top: 20%;
  left: -40px;
}
.float-right {
  bottom: 20%;
  right: -40px;
}

@media (max-width: 900px) {
  .float-left  { top: 12px; left: 12px; }
  .float-right { bottom: 12px; right: 12px; }
}

.float-icon {
  width: 36px;
  height: 36px;
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.float-icon--green {
  background: var(--green-l);
  color: var(--green);
}
.float-icon--blue {
  background: var(--blue-l);
  color: var(--blue);
}

.float-label {
  font-size: 11px;
  color: var(--g4);
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.4px;
  margin-bottom: 2px;
}
.float-value {
  font-size: 22px;
  font-weight: 900;
  color: var(--g7);
  letter-spacing: -0.04em;
  line-height: 1;
  margin-bottom: 6px;
}
.float-value-sm {
  font-size: 13px;
  font-weight: 600;
  color: var(--g6);
}
.float-bar {
  height: 4px;
  background: var(--g2);
  border-radius: 99px;
  overflow: hidden;
}
.float-bar-fill {
  height: 100%;
  background: var(--green);
  border-radius: 99px;
}

/* ── Metrics strip ────────────────────────────────────── */
.hero-metrics {
  position: relative;
  z-index: 1;
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  border-top: 1px solid var(--g2);
  background: var(--bg);
}

@media (max-width: 640px) {
  .hero-metrics {
    grid-template-columns: repeat(2, 1fr);
  }
}

.metric {
  padding: var(--sp-6) var(--sp-8); /* 24px 32px */
  border-right: 1px solid var(--g2);
  text-align: center;
}
.metric:last-child { border-right: none; }

.metric-value {
  font-size: 1.85rem;
  font-weight: 900;
  letter-spacing: -0.04em;
  color: var(--blue);
  line-height: 1;
  margin-bottom: var(--sp-2); /* 8px */
}
.metric-label {
  font-size: 12px;
  font-weight: 600;
  color: var(--g5);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}
</style>
