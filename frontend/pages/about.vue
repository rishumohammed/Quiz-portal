<template>
  <div class="about-page">

    <!-- ── Page Hero ──────────────────────────────────────────── -->
    <section class="about-hero">
      <div class="about-hero-bg-overlay"></div>
      <div class="about-bg-shape shape-a"></div>
      <div class="about-bg-shape shape-b"></div>

      <!-- Minimal Vector Decorations -->
      <div class="vector-decor vector-decor-1">
        <svg width="240" height="240" viewBox="0 0 240 240" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="120" cy="120" r="119" stroke="currentColor" stroke-width="1.5" stroke-dasharray="6 8"/>
          <circle cx="120" cy="120" r="85" stroke="currentColor" stroke-width="1" opacity="0.5"/>
          <circle cx="120" cy="120" r="5" fill="currentColor" opacity="0.4"/>
        </svg>
      </div>
      <div class="vector-decor vector-decor-2">
        <svg width="180" height="180" viewBox="0 0 180 180" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="20" y="20" width="140" height="140" rx="30" stroke="currentColor" stroke-width="1.5" transform="rotate(15 90 90)"/>
          <path d="M 50 90 h 80" stroke="currentColor" stroke-width="1" stroke-dasharray="4 4" opacity="0.5"/>
          <path d="M 90 50 v 80" stroke="currentColor" stroke-width="1" stroke-dasharray="4 4" opacity="0.5"/>
          <circle cx="90" cy="90" r="4" fill="currentColor" opacity="0.6"/>
        </svg>
      </div>
      <div class="vector-decor vector-decor-3">
        <svg width="120" height="120" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
          <polygon points="60,10 110,110 10,110" stroke="currentColor" stroke-width="1.5" stroke-dasharray="5 5" fill="none" transform="rotate(25 60 60)"/>
          <circle cx="60" cy="60" r="3" fill="currentColor"/>
        </svg>
      </div>
      <div class="vector-decor vector-decor-4">
        <svg width="200" height="200" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="100" cy="100" r="90" stroke="currentColor" stroke-width="1.5" stroke-dasharray="2 15" stroke-linecap="round"/>
          <circle cx="100" cy="100" r="70" stroke="currentColor" stroke-width="1" opacity="0.3"/>
          <path d="M 30 100 A 70 70 0 0 1 170 100" stroke="currentColor" stroke-width="2" opacity="0.3" fill="none"/>
        </svg>
      </div>

      <v-container class="about-hero-inner">
        <div class="eyebrow-label mb-4">About Brixify</div>
        <h1 class="about-hero-title">Elevating Global Food<br class="d-none d-md-block" /> Industry Excellence</h1>
        <p class="about-hero-sub">
          At Brixify, we are committed to setting the benchmark for quality and safety in the global food industry through comprehensive certification, training, and consultancy services.
        </p>
        <div class="d-flex gap-3 flex-wrap">
          <v-btn color="primary" rounded="lg" size="large" class="text-none font-weight-bold" to="/courses">
            Explore Courses <v-icon end>mdi-arrow-right</v-icon>
          </v-btn>
          <v-btn variant="outlined" color="primary" rounded="lg" size="large" class="text-none font-weight-bold" to="/contact">
            Contact Us
          </v-btn>
        </div>
      </v-container>
    </section>

    <!-- ── Who We Are (Split) ─────────────────────────────────── -->
    <section class="section-default">
      <v-container>
        <v-row align="center">
          <v-col cols="12" md="6">
            <div class="who-img-wrap">
              <img
                v-if="aboutWhoImageUrl"
                :src="aboutWhoImageUrl"
                alt="Brixify food science lab"
                class="who-img"
              />
              <div class="who-badge">
                <v-icon color="success" size="20" class="mr-2">mdi-check-decagram</v-icon>
                <div>
                  <div class="who-badge-title">ISO Accredited</div>
                  <div class="who-badge-sub">Internationally Recognized</div>
                </div>
              </div>
            </div>
          </v-col>
          <v-col cols="12" md="6" class="pl-md-12">
            <div class="eyebrow-label mb-4">Who We Are</div>
            <h2 class="section-title mb-5">Passionate Experts in Food Technology</h2>
            <p class="text-body-1 text-grey-darken-1 mb-4" style="line-height:1.85">
              <strong>Welcome to Brixify</strong> — where we provide high-quality food technology training and consultancy services to help businesses and professionals meet the highest standards in food safety and quality.
            </p>
            <p class="text-body-1 text-grey-darken-1 mb-6" style="line-height:1.85">
              Brixify brings together experienced auditors, food scientists, and regulatory professionals passionate about ensuring the integrity of food products from farm to table.
            </p>
            <!-- 4 quick bullets -->
            <v-row dense>
              <v-col cols="12" sm="6" v-for="f in whoPoints" :key="f.title">
                <div class="who-point mb-3">
                  <v-avatar :color="f.color" size="36" class="mr-3">
                    <v-icon color="white" size="18">{{ f.icon }}</v-icon>
                  </v-avatar>
                  <div>
                    <div class="text-subtitle-2 font-weight-bold">{{ f.title }}</div>
                    <div class="text-caption text-grey-darken-1">{{ f.sub }}</div>
                  </div>
                </div>
              </v-col>
            </v-row>
          </v-col>
        </v-row>
      </v-container>
    </section>

    <!-- ── Mission & Vision ───────────────────────────────────── -->
    <section class="section-default" style="background:#f8f9fc;">
      <v-container>
        <div class="section-header section-header--center mb-12">
          <div class="eyebrow-label mb-3">Purpose</div>
          <h2 class="section-title">Our Mission &amp; Vision</h2>
          <p class="section-sub">The principles that drive everything we do at Brixify.</p>
        </div>
        <v-row>
          <v-col cols="12" md="6">
            <div class="mv-card mv-card--primary">
              <div class="mv-icon-wrap">
                <v-icon color="white" size="26">mdi-bullseye-arrow</v-icon>
              </div>
              <div class="mv-label">Our Mission</div>
              <p class="mv-text">
                To deliver world-class food safety and technology training, helping individuals and organizations adopt best practices, meet global standards, and foster a culture of safety and quality within the food industry.
              </p>
            </div>
          </v-col>
          <v-col cols="12" md="6">
            <div class="mv-card mv-card--teal">
              <div class="mv-icon-wrap mv-icon-wrap--teal">
                <v-icon color="white" size="26">mdi-lightbulb-on</v-icon>
              </div>
              <div class="mv-label">Our Vision</div>
              <p class="mv-text">
                To be a global leader in food technology education and consultancy, creating a well-equipped workforce that can tackle food safety challenges and innovate within the industry.
              </p>
            </div>
          </v-col>
        </v-row>
      </v-container>
    </section>

    <!-- ── What We Do ─────────────────────────────────────────── -->
    <section class="section-default">
      <v-container>
        <div class="section-header section-header--center mb-12">
          <div class="eyebrow-label mb-3">Our Services</div>
          <h2 class="section-title">What We Do</h2>
          <p class="section-sub">Comprehensive food technology solutions for professionals, businesses, and organisations worldwide.</p>
        </div>
        <v-row>
          <v-col cols="12" sm="6" md="4" v-for="(offer, i) in offerings" :key="i">
            <div class="service-card">
              <v-avatar :color="offer.color" size="52" class="mb-5">
                <v-icon color="white" size="24">{{ offer.icon }}</v-icon>
              </v-avatar>
              <h3 class="service-title mb-2">{{ offer.title }}</h3>
              <p class="service-desc">{{ offer.desc }}</p>
            </div>
          </v-col>
        </v-row>
      </v-container>
    </section>

    <!-- ── Trust Pillars ──────────────────────────────────────── -->
    <section class="section-default" style="background:#f8f9fc;">
      <v-container>
        <div class="section-header section-header--center mb-12">
          <div class="eyebrow-label mb-3">Why Choose Us</div>
          <h2 class="section-title">Our Trust Pillars</h2>
          <p class="section-sub">The foundations that make Brixify the most trusted name in food technology certification.</p>
        </div>
        <v-row>
          <v-col cols="12" sm="6" md="3" v-for="(p, i) in trustPillars" :key="i">
            <div class="pillar-card">
              <v-icon :color="p.color || 'primary'" size="32" class="mb-3">{{ p.icon }}</v-icon>
              <div class="pillar-title">{{ p.title }}</div>
              <p class="pillar-desc">{{ p.desc }}</p>
            </div>
          </v-col>
        </v-row>
      </v-container>
    </section>

    <!-- ── CTA Band ────────────────────────────────────────────── -->
    <section class="about-cta-band section-default">
      <v-container>
        <div class="trust-inner">
          <div class="trust-left">
            <div class="eyebrow-label mb-3" style="color:rgba(255,255,255,0.6)">Get Started</div>
            <h2 class="trust-headline">Join Our Learning Community</h2>
            <p class="trust-sub">Whether you're a student, professional, or organisation — Brixify has the expertise to help you succeed and stay globally compliant.</p>
            <div class="d-flex gap-3 flex-wrap mt-6">
              <v-btn color="white" rounded="lg" class="text-none font-weight-bold" style="color:var(--primary, #211d71)" size="large" to="/register">
                Get Started Today <v-icon end>mdi-arrow-right</v-icon>
              </v-btn>
              <v-btn variant="outlined" color="white" rounded="lg" class="text-none font-weight-bold" size="large" to="/courses">
                Browse Courses
              </v-btn>
            </div>
          </div>
          <div class="trust-right">
            <v-row>
              <v-col cols="6" v-for="stat in ctaStats" :key="stat.label" class="text-center mb-4">
                <div class="trust-stat-value">{{ stat.value }}</div>
                <div class="trust-stat-label">{{ stat.label }}</div>
              </v-col>
            </v-row>
          </div>
        </div>
      </v-container>
    </section>

  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

definePageMeta({ layout: 'public' });

useSeoMeta({
  title: 'About',
  description: 'Brixify is a leading certification body specialising in the food industry. We provide high-quality food technology training and consultancy services.'
});

const config = useRuntimeConfig();
const aboutpageWhoImage = useState<string | null>('aboutpage_who_image');
const aboutpageWhoImageUrl = useState<string | null>('aboutpage_who_image_url');

const aboutWhoImageUrl = computed(() => {
  if (aboutpageWhoImage.value) return `${config.public.apiBase.replace('/api', '')}${aboutpageWhoImage.value}`;
  if (aboutpageWhoImageUrl.value) return aboutpageWhoImageUrl.value;
  return '';
});

const whoPoints = [
  { icon: 'mdi-shield-star', color: 'primary', title: 'Accredited Programs', sub: 'Internationally recognized' },
  { icon: 'mdi-earth', color: 'teal', title: 'Global Reach', sub: 'Trusted worldwide' },
  { icon: 'mdi-account-tie', color: 'orange', title: 'Industry Experts', sub: 'Real-world experience' },
  { icon: 'mdi-tune', color: 'deep-purple', title: 'Flexible Learning', sub: 'Online, hybrid, in-person' },
];

const offerings = [
  { icon: 'mdi-shield-check-outline', color: 'primary', title: 'Food Product Certification', desc: 'Rigorous certification programs verifying the quality, safety, and sustainability of food products, recognised globally.' },
  { icon: 'mdi-certificate-outline', color: 'orange', title: 'Professional Certification', desc: 'Programs ensuring food industry professionals meet the highest standards of knowledge and compliance.' },
  { icon: 'mdi-magnify-scan', color: 'success', title: 'Quality Assurance', desc: 'Thorough inspections and audits ensuring food production processes meet standards of hygiene, safety, and quality.' },
  { icon: 'mdi-school-outline', color: 'teal', title: 'Training & Education', desc: 'Specialised training from food safety management to sustainable production practices and international standards.' },
  { icon: 'mdi-lightbulb-on-outline', color: 'deep-purple', title: 'Consulting Services', desc: 'Expert consulting helping businesses navigate complex regulatory environments and achieve international compliance.' },
  { icon: 'mdi-handshake-outline', color: 'indigo', title: 'Advocacy & Policy', desc: 'Brixify advocates for policies supporting food safety, sustainability, and innovation across the industry.' },
];

const trustPillars = [
  { icon: 'mdi-domain', color: 'primary', title: 'Professional Organisation', desc: 'Delivering high-quality, independent food science and technology services.' },
  { icon: 'mdi-brain', color: 'teal', title: 'Expertise', desc: 'Excelling in food science administration and project management skills.' },
  { icon: 'mdi-check-circle-outline', color: 'success', title: 'Accreditation', desc: 'Accredited by national and international certification and regulatory authorities.' },
  { icon: 'mdi-account-group', color: 'orange', title: 'Professional Network', desc: 'Dynamic team with academic excellence and project dedication nationwide.' },
  { icon: 'mdi-tune', color: 'deep-purple', title: 'Flexible Approach', desc: 'Customized solutions for specific needs, processes, and environments.' },
  { icon: 'mdi-leaf', color: 'green', title: 'Sustainability Focus', desc: 'Promoting sustainable practices for environmental responsibility and viability.' },
  { icon: 'mdi-earth', color: 'indigo', title: 'Global Reach', desc: 'International collaborations bringing global perspectives to local challenges.' },
  { icon: 'mdi-flask-outline', color: 'red', title: 'Cutting-Edge Research', desc: 'Innovating through ongoing research in food technology advancements.' },
];

const ctaStats = [
  { value: '500+', label: 'Clients Served' },
  { value: '98%', label: 'Satisfaction Rate' },
  { value: '20+', label: 'Countries' },
  { value: '15+', label: 'Years of Expertise' },
];
</script>

<style scoped>
/* ── Hero ──────────────────────────────────────────────────── */
.about-hero {
  position: relative;
  overflow: hidden;
  background: #fdfdfd;
  padding: 100px 0 80px;
}
.about-hero-bg-overlay {
  position: absolute; inset: 0;
  background-image:
    radial-gradient(circle at 85% 15%, rgba(33,29,113,0.04) 0%, transparent 55%),
    radial-gradient(circle at 15% 85%, rgba(246,130,31,0.03) 0%, transparent 55%),
    url("data:image/svg+xml,%3Csvg width='32' height='32' viewBox='0 0 32 32' xmlns='http://www.w3.org/2000/svg'%3E%3Ccircle cx='2' cy='2' r='1.5' fill='%23211d71' fill-opacity='0.08'/%3E%3C/svg%3E");
  pointer-events: none;
}
.about-bg-shape {
  position: absolute;
  border-radius: 50%;
  filter: blur(70px);
  pointer-events: none;
  opacity: 0.5;
}
.shape-a { width: 350px; height: 350px; background: rgba(33,29,113,0.05); top: -80px; right: -60px; }
.shape-b { width: 280px; height: 280px; background: rgba(246,130,31,0.04); bottom: -80px; left: -60px; }

/* ── Vector Decorations ────────────────────────────────────── */
.vector-decor {
  position: absolute;
  color: var(--primary, #211d71);
  opacity: 0.12;
  pointer-events: none;
  z-index: 0;
}
.vector-decor-1 {
  top: -40px;
  right: 8%;
  animation: slowSpin 60s linear infinite;
}
.vector-decor-2 {
  bottom: 10px;
  left: 3%;
  animation: slowSpin 80s linear infinite reverse;
}
.vector-decor-3 {
  top: 15%;
  left: 10%;
  animation: slowSpin 50s linear infinite;
}
.vector-decor-4 {
  bottom: 15%;
  right: 5%;
  animation: slowSpin 90s linear infinite reverse;
}

@keyframes slowSpin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.about-hero-inner {
  position: relative;
  z-index: 1;
  max-width: 700px;
}
.about-hero-title {
  font-size: clamp(2.4rem, 5vw, 3.8rem);
  font-weight: 900;
  letter-spacing: -0.04em;
  line-height: 1.08;
  color: #0f172a;
  margin-bottom: 24px;
}
.about-hero-sub {
  font-size: 1.1rem;
  line-height: 1.8;
  color: #475569;
  max-width: 580px;
  margin-bottom: 36px;
}

/* ── Eyebrow ───────────────────────────────────────────────── */
.eyebrow-label {
  display: inline-block;
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 1.5px;
  color: var(--primary, #211d71);
  opacity: 0.75;
}

/* ── Who We Are Image ──────────────────────────────────────── */
.who-img-wrap {
  position: relative;
  border-radius: 20px;
  overflow: hidden;
}
.who-img {
  width: 100%;
  height: 420px;
  object-fit: cover;
  border-radius: 20px;
  display: block;
}
.who-badge {
  position: absolute;
  bottom: 24px; left: 24px;
  background: white;
  border-radius: 12px;
  padding: 12px 16px;
  display: flex;
  align-items: center;
  box-shadow: 0 8px 32px rgba(0,0,0,0.12);
  border: 1px solid rgba(0,0,0,0.06);
}
.who-badge-title { font-size: 13px; font-weight: 700; color: #0f172a; line-height: 1.2; }
.who-badge-sub   { font-size: 11px; color: #64748b; }
.who-point { display: flex; align-items: center; }

/* ── Mission / Vision Cards ────────────────────────────────── */
.mv-card {
  border-radius: 20px;
  padding: 40px 36px;
  height: 100%;
  border: 1px solid rgba(0,0,0,0.06);
  background: white;
  transition: transform 0.2s ease;
}
.mv-card:hover { transform: translateY(-4px); }
.mv-card--primary { border-top: 4px solid var(--primary, #211d71); }
.mv-card--teal    { border-top: 4px solid #0d9488; }

.mv-icon-wrap {
  width: 52px; height: 52px;
  border-radius: 14px;
  background: var(--primary, #211d71);
  display: flex; align-items: center; justify-content: center;
  margin-bottom: 20px;
}
.mv-icon-wrap--teal { background: #0d9488; }
.mv-label {
  font-size: 12px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 1.2px;
  color: var(--primary, #211d71);
  margin-bottom: 12px;
}
.mv-card--teal .mv-label { color: #0d9488; }
.mv-text {
  font-size: 1rem;
  line-height: 1.85;
  color: #475569;
  margin: 0;
}

/* ── Service Cards ─────────────────────────────────────────── */
.service-card {
  padding: 32px 28px;
  border-radius: 16px;
  border: 1px solid rgba(0,0,0,0.06);
  background: white;
  height: 100%;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  margin-bottom: 4px;
}
.service-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 16px 40px rgba(0,0,0,0.08);
}
.service-title {
  font-size: 1rem;
  font-weight: 700;
  color: #0f172a;
  letter-spacing: -0.01em;
}
.service-desc {
  font-size: 0.875rem;
  line-height: 1.75;
  color: #64748b;
  margin: 0;
}

/* ── Trust Pillar Cards ────────────────────────────────────── */
.pillar-card {
  padding: 28px 24px;
  border-radius: 16px;
  border: 1px solid rgba(0,0,0,0.06);
  background: white;
  height: 100%;
  margin-bottom: 4px;
  transition: transform 0.2s ease;
}
.pillar-card:hover { transform: translateY(-4px); }
.pillar-title {
  font-size: 0.95rem;
  font-weight: 700;
  color: #0f172a;
  margin-bottom: 8px;
}
.pillar-desc {
  font-size: 0.825rem;
  line-height: 1.7;
  color: #64748b;
  margin: 0;
}

/* ── CTA Band ──────────────────────────────────────────────── */
.about-cta-band {
  background: var(--primary, #211d71) !important;
  color: white;
}
.trust-inner {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 64px;
  align-items: center;
}
@media (max-width: 900px) {
  .trust-inner { grid-template-columns: 1fr; gap: 40px; }
}
.trust-headline {
  font-size: clamp(1.8rem, 3.5vw, 2.8rem);
  font-weight: 900;
  line-height: 1.1;
  letter-spacing: -0.03em;
  color: white;
  margin-bottom: 16px;
}
.trust-sub {
  font-size: 1rem;
  line-height: 1.7;
  color: rgba(255,255,255,0.70);
  max-width: 420px;
}
.trust-stat-value {
  font-size: clamp(2.2rem, 4vw, 3rem);
  font-weight: 900;
  color: white;
  letter-spacing: -0.04em;
  line-height: 1;
  margin-bottom: 6px;
}
.trust-stat-label {
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 1px;
  color: rgba(255,255,255,0.55);
}
</style>
