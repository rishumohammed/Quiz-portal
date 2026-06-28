<template>
  <section class="hero-section" aria-label="Hero">
    <!-- Minimal Light Background Designs -->
    <div class="hero-bg-overlay"></div>
    <div class="bg-shape shape-1"></div>
    <div class="bg-shape shape-2"></div>
    <div class="bg-shape shape-3"></div>
    
    <div class="hero-inner">
      <!-- Left: Copy -->
      <div class="hero-copy" v-motion-fade-visible>
        <!-- Badge -->
        <div class="hero-badge">
          <span class="badge-dot"></span>
          Global Food Safety & Certification
        </div>

        <!-- Headline -->
        <h1 class="hero-headline" style="font-size: clamp(3rem, 6vw, 4.5rem); letter-spacing: -0.03em;">
          <span style="color: var(--primary);">brix</span> <span style="color: var(--secondary);">Certifications</span>
        </h1>

        <!-- Sub-copy -->
        <div style="margin-bottom: 40px; display: flex; flex-direction: column; gap: 12px;">
          <h2 style="font-size: 1.4rem; font-weight: 800; color: var(--g7); letter-spacing: -0.01em; margin: 0;">
            Elevating Global Food Industry Excellence
          </h2>
          <h3 style="font-size: 1.25rem; font-weight: 600; color: var(--primary); letter-spacing: 0.02em; margin: 0;">
            ISO | FSSC | BRCGS | OHSMS | QMS | HACCP
          </h3>
        </div>

        <!-- CTAs -->
        <div class="hero-ctas">
          <NuxtLink to="/courses" class="cta-primary">
            Browse Courses
            <svg class="cta-arrow" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </NuxtLink>
          <NuxtLink to="/about" class="cta-ghost">Learn More</NuxtLink>
        </div>

        <!-- Social proof -->
        <div class="hero-proof">
          <div class="proof-avatars">
            <v-avatar
              v-for="(color, i) in ['primary', 'success', 'warning', 'info']"
              :key="i"
              :color="color"
              class="proof-avatar"
              size="32"
            >
              <span class="text-caption text-white font-weight-bold">{{ ['J', 'S', 'M', 'A'][i] }}</span>
            </v-avatar>
          </div>
          <div class="proof-text">
            <strong>Trusted globally</strong> by industry leaders
            <div class="proof-stars">
              <span v-for="s in 5" :key="s" class="star">★</span>
              <span class="proof-rating">4.9 / 5</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Right: Visual panel -->
      <div class="hero-visual" v-motion-slide-right>
        <!-- Main image -->
        <div class="image-frame">
          <img
            v-if="heroImgSrc"
            :src="heroImgSrc"
            alt="Food technology quality control"
            class="hero-img"
            width="600"
            height="450"
          />
          <!-- Scrim at bottom -->
          <div class="image-scrim"></div>
        </div>

        <!-- Floating stat: Placement rate -->
        <div class="float-card float-top" v-motion-roll-visible-top>
          <div class="float-icon float-icon--green">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" width="18" height="18">
              <path d="M3 17l5-5 4 4 9-9" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </div>
          <div class="float-content">
            <div class="float-label">Global Compliance</div>
            <div class="float-value">100%</div>
            <div class="float-bar">
              <div class="float-bar-fill" style="width: 94%"></div>
            </div>
          </div>
        </div>

        <!-- Floating stat: Certified -->
        <div class="float-card float-bottom" v-motion-roll-visible-bottom>
          <div class="float-icon float-icon--blue">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" width="18" height="18">
              <path d="M9 12l2 2 4-4M12 2a10 10 0 100 20A10 10 0 0012 2z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </div>
          <div class="float-content">
            <div class="float-label">Certified Experts</div>
            <div class="float-value-sm">Industry Recognized</div>
          </div>
        </div>
      </div>
    </div>


  </section>
</template>

<script setup lang="ts">
const config = useRuntimeConfig();
const baseUrl = computed(() => config.public.apiBase.replace('/api', ''));

const heroImageConfig = useState('homepage_hero_image', () => '');
const heroImageUrlConfig = useState('homepage_hero_image_url', () => '');

const heroImgSrc = computed(() => {
  if (heroImageUrlConfig.value) return heroImageUrlConfig.value;
  if (heroImageConfig.value) return baseUrl.value + heroImageConfig.value;
  return '';
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
.hero-inner {
  position: relative;
  z-index: 1;
  max-width: 1200px;
  margin: 0 auto;
  padding: var(--sp-24) var(--sp-8) var(--sp-20); /* 96px 32px 80px */
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--sp-20);  /* 80px */
  align-items: center;
}

@media (max-width: 900px) {
  .hero-inner {
    grid-template-columns: 1fr;
    padding: var(--sp-20) var(--sp-6) var(--sp-16); /* 80px 24px 64px */
    gap: var(--sp-12); /* 48px */
  }
  .hero-visual {
    order: -1;
  }
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
  gap: 16px;
  flex-wrap: wrap;
  margin-bottom: 40px;
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

/* ── Social Proof ─────────────────────────────────────── */
.hero-proof {
  display: flex;
  align-items: center;
  gap: 14px;
}
.proof-avatars {
  display: flex;
}
.proof-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: 2px solid #f0f6ff;
  margin-left: -8px;
  object-fit: cover;
}
.proof-avatar:first-child { margin-left: 0; }

.proof-text {
  font-size: 13px;
  color: #636366;
  line-height: 1.4;
}
.proof-text strong {
  color: #1D1D1F;
  font-weight: 700;
}
.proof-stars {
  display: flex;
  align-items: center;
  gap: 2px;
  margin-top: 2px;
}
.star {
  color: var(--accent);
  font-size: 11px;
}
.proof-rating {
  color: #636366;
  font-size: 12px;
  font-weight: 600;
  margin-left: 4px;
}

/* ── Visual / Image ───────────────────────────────────── */
.hero-visual {
  position: relative;
}
.image-frame {
  position: relative;
  border-radius: var(--radius-lg);
  overflow: hidden;
  border: 1px solid var(--border);
}
.hero-img {
  width: 100%;
  height: auto;
  display: block;
  object-fit: cover;
  aspect-ratio: 4/3;
}
.image-scrim {
  position: absolute;
  inset: 0;
  background: linear-gradient(to top, rgba(0,0,0,0.35) 0%, transparent 60%);
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
}
.float-top {
  top: -20px;
  right: -20px;
}
.float-bottom {
  bottom: -18px;
  left: -20px;
}

@media (max-width: 900px) {
  .float-top  { top: 12px; right: 12px; }
  .float-bottom { bottom: 12px; left: 12px; }
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
