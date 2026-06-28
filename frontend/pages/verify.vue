<template>
  <div class="verify-page">
    <!-- ── Page Hero ──────────────────────────────────────────── -->
    <section class="about-hero" style="min-height: 100vh; display: flex; align-items: center; padding: 120px 0;">
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

      <v-container class="position-relative z-1">
        <div class="text-center mx-auto" style="max-width: 700px; margin-bottom: 48px;">
          <div class="eyebrow-label mb-4">Official Credentials</div>
          <h1 class="about-hero-title">Verify Certificate</h1>
          <p class="about-hero-sub mx-auto" style="margin-bottom: 0;">
            Ensure the authenticity of any Brixify certificate by entering its unique identification number below.
          </p>
        </div>

        <v-card class="mx-auto pa-2 rounded-pill border bg-white search-card" elevation="0" max-width="650">
          <v-form @submit.prevent="verifyCert" class="d-flex align-center gap-2 flex-column flex-sm-row">
            <v-text-field
              v-model="certId"
              variant="solo"
              flat
              hide-details
              rounded="pill"
              class="flex-grow-1 search-input w-100"
              placeholder="Enter Certificate ID (e.g. BRX-2026-XXXX)"
              prepend-inner-icon="mdi-magnify"
              bg-color="transparent"
            ></v-text-field>
            <v-btn
              color="primary"
              size="x-large"
              rounded="pill"
              class="px-8 font-weight-bold w-100 w-sm-auto"
              :loading="loading"
              type="submit"
              elevation="0"
              height="56"
            >
              Verify
            </v-btn>
          </v-form>
        </v-card>

        <!-- Result Area -->
        <div v-if="verifiedCert" class="mt-16 animate-fade-in">
          <div class="d-flex justify-center mb-8 gap-4">
            <v-btn
              prepend-icon="mdi-printer"
              variant="outlined"
              color="primary"
              rounded="pill"
              class="font-weight-bold px-6 bg-white"
              @click="printCert"
            >
              Print Certificate
            </v-btn>
            <v-btn
              prepend-icon="mdi-share-variant"
              variant="outlined"
              color="primary"
              rounded="pill"
              class="font-weight-bold px-6 bg-white"
              @click="copyLink"
            >
              Copy Link
            </v-btn>
          </div>
          
          <CertificateCard :cert="verifiedCert" />
        </div>

        <!-- Error State -->
        <v-alert
          v-if="error"
          type="error"
          variant="tonal"
          class="mx-auto rounded-xl mt-8"
          icon="mdi-alert-circle-outline"
          style="max-width: 650px; background: white;"
        >
          {{ error }}
        </v-alert>

        <!-- Placeholder -->
        <div v-if="!verifiedCert && !error && !loading" class="text-center mt-16 opacity-80">
          <div class="empty-state-icon mx-auto mb-6 d-flex align-center justify-center rounded-circle" style="width: 80px; height: 80px; background: rgba(33, 29, 113, 0.05);">
            <v-icon size="36" color="primary">mdi-shield-check-outline</v-icon>
          </div>
          <div class="text-subtitle-1 font-weight-bold" style="color: #0f172a;">Ready to Verify</div>
          <p class="text-body-2" style="color: #64748b;">Enter a certificate ID above to view the credentials.</p>
        </div>

      </v-container>
    </section>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: 'public'
});

const config = useRuntimeConfig();
const apiBase = config.public.apiBase;
const route = useRoute();

const certId = ref(route.query.id as string || '');
const loading = ref(false);
const verifiedCert = ref<any>(null);
const error = ref('');

const verifyCert = async () => {
  if (!certId.value) return;
  
  loading.value = true;
  error.value = '';
  verifiedCert.value = null;
  
  try {
    const data = await $fetch<any>(`${apiBase}/public/verify-certificate/${certId.value}`);
    verifiedCert.value = data;
  } catch (err: any) {
    if (err.statusCode === 404 || err.status === 404 || err.response?.status === 404) {
      error.value = 'Invalid Certificate ID. We could not find any record matching this ID.';
    } else {
      error.value = 'An error occurred during verification. Please try again later.';
    }
  } finally {
    loading.value = false;
  }
};

const printCert = () => {
  window.print();
};

const copyLink = () => {
  const url = `${window.location.origin}/verify-certificate?id=${certId.value}`;
  navigator.clipboard.writeText(url);
  alert('Verification link copied to clipboard!');
};

// Auto-verify if ID is in query
onMounted(() => {
  if (certId.value) {
    verifyCert();
  }
});

useSeoMeta({
  title: 'Verify Certificate',
  description: 'Public verification portal for Brixify certificates and credentials.'
});
</script>

<style scoped>
/* ── Hero & Backgrounds ──────────────────────────────────────────────────── */
.about-hero {
  position: relative;
  overflow: hidden;
  background: #fdfdfd;
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
  top: 10%;
  right: 15%;
  animation: slowSpin 60s linear infinite;
}
.vector-decor-2 {
  bottom: 20%;
  left: 10%;
  animation: slowSpin 80s linear infinite reverse;
}

@keyframes slowSpin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* ── Typography & Layout ────────────────────────────────────── */
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
}

.eyebrow-label {
  display: inline-block;
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 1.5px;
  color: var(--primary, #211d71);
  opacity: 0.75;
}

/* ── Search Form ────────────────────────────────────────────── */
.search-card {
  box-shadow: 0 16px 40px rgba(0,0,0,0.06) !important;
  border-color: rgba(0,0,0,0.05) !important;
}

:deep(.search-input .v-field) {
  box-shadow: none !important;
  background: transparent !important;
  font-size: 1.1rem;
}

:deep(.search-input input::placeholder) {
  color: #94a3b8 !important;
  opacity: 1 !important;
}

.animate-fade-in {
  animation: fadeIn 0.5s ease-out;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>
