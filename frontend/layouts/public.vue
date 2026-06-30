<template>
  <v-app>
    <!-- Navbar -->
    <v-app-bar flat class="navbar-frosted border-b" color="transparent" height="72">
      <v-container class="d-flex align-center pa-0">
        <!-- Logo -->
        <NuxtLink to="/" class="d-flex align-center cursor-pointer text-decoration-none color-inherit">
          <template v-if="appLogo">
            <img :src="fullLogoUrl" alt="Logo" style="max-height: 36px; object-fit: contain;" />
          </template>
          <template v-else>
            <v-icon color="primary" size="32" class="mr-2">mdi-rhombus-split</v-icon>
            <span class="text-h6 font-weight-bold tracking-tight">{{ instituteName }}</span>
          </template>
        </NuxtLink>

        <v-spacer></v-spacer>

        <!-- Desktop Navigation -->
        <div class="d-none d-md-flex align-center">
          <template v-if="authStore.isAuthenticated">
            <v-divider vertical inset class="mx-4"></v-divider>
            <v-btn color="primary" rounded="lg" class="text-capitalize px-6 ml-2 font-weight-bold" elevation="0" to="/dashboard">Go to Dashboard</v-btn>
          </template>
        </div>

        <!-- Mobile Menu Toggle -->
        <v-btn icon class="d-md-none" @click="drawer = !drawer">
          <v-icon>mdi-menu</v-icon>
        </v-btn>
      </v-container>
    </v-app-bar>

    <!-- Mobile Drawer -->
    <v-navigation-drawer v-model="drawer" temporary position="right" width="300">
      <v-list nav class="pa-4">
        <template v-if="authStore.isAuthenticated">
          <v-divider class="my-4"></v-divider>
          <v-btn block color="primary" class="text-capitalize mb-2" rounded="lg" to="/dashboard">Go to Dashboard</v-btn>
        </template>
      </v-list>
    </v-navigation-drawer>

    <!-- Main Content -->
    <v-main>
      <slot />
    </v-main>

    <!-- Footer -->
    <v-footer class="footer-frosted pt-16 pb-8">
      <v-container>
        <v-row>
          <v-col cols="12" md="4">
            <NuxtLink to="/" class="d-flex align-center mb-4 text-decoration-none color-inherit">
              <template v-if="appLogo">
                <img :src="fullLogoUrl" alt="Logo" style="max-height: 48px; object-fit: contain;" />
              </template>
              <template v-else>
                <v-icon color="primary" size="32" class="mr-2">mdi-rhombus-split</v-icon>
                <span class="text-h6 font-weight-bold text-dark">{{ instituteName }}</span>
              </template>
            </NuxtLink>
            <p class="text-body-1 font-weight-bold text-dark mb-2 pr-md-10">
              Education, Skills, Certification & Careers — All in One Platform.
            </p>
            <p class="text-body-2 text-secondary mb-6 pr-md-10">
              Learn. Certify. Get Placed. Join our learning community to shape your future with {{ instituteName }}.
            </p>
            <div class="d-flex gap-3">
              <v-btn icon variant="tonal" density="comfortable" color="primary" class="social-btn"><v-icon size="18">mdi-facebook</v-icon></v-btn>
              <v-btn icon variant="tonal" density="comfortable" color="primary" class="social-btn"><v-icon size="18">mdi-twitter</v-icon></v-btn>
              <v-btn icon variant="tonal" density="comfortable" color="primary" class="social-btn"><v-icon size="18">mdi-linkedin</v-icon></v-btn>
              <v-btn icon variant="tonal" density="comfortable" color="primary" class="social-btn"><v-icon size="18">mdi-instagram</v-icon></v-btn>
            </div>
          </v-col>
          
          <v-col cols="12" md="4">
            <h4 class="text-subtitle-1 font-weight-bold mb-4 tracking-tight">Important Links</h4>
            <v-list density="compact" class="bg-transparent pa-0 footer-list">
              <v-list-item to="/privacy-policy" class="footer-link">Privacy Policy</v-list-item>
              <v-list-item to="/terms-of-service" class="footer-link">Terms of Service</v-list-item>
            </v-list>
          </v-col>
          
          <v-col cols="12" md="4">
            <h4 class="text-subtitle-1 font-weight-bold mb-4 tracking-tight">Contact</h4>
            <div v-if="contactAddress" class="d-flex align-start mb-4">
              <v-icon color="primary" size="20" class="mr-3 mt-1">mdi-map-marker</v-icon>
              <div class="text-body-2 text-secondary" style="white-space: pre-line;">{{ contactAddress }}</div>
            </div>
            <div v-if="contactPhone" class="d-flex align-center mb-4">
              <v-icon color="primary" size="20" class="mr-3">mdi-phone</v-icon>
              <div class="text-body-2 text-secondary">{{ contactPhone }}</div>
            </div>
            <div v-if="contactWhatsapp && contactWhatsapp !== contactPhone" class="d-flex align-center mb-4">
              <v-icon color="success" size="20" class="mr-3">mdi-whatsapp</v-icon>
              <a :href="'https://wa.me/' + contactWhatsapp.replace(/\D/g, '')" target="_blank" class="text-body-2 text-secondary text-decoration-none">{{ contactWhatsapp }}</a>
            </div>
            <div v-if="contactEmail" class="d-flex align-center mb-4">
              <v-icon color="primary" size="20" class="mr-3">mdi-email</v-icon>
              <a :href="'mailto:' + contactEmail" class="text-body-2 text-secondary text-decoration-none">{{ contactEmail }}</a>
            </div>
          </v-col>
        </v-row>
        
        <v-divider class="my-8 opacity-10"></v-divider>
        
        <div class="d-flex flex-column flex-md-row align-center justify-space-between gap-4">
          <div class="text-caption text-secondary">
            &copy; {{ new Date().getFullYear() }} {{ instituteName }}. All rights reserved.
          </div>
          <div class="d-flex align-center gap-2 text-secondary opacity-60">
            <v-icon size="16">mdi-shield-check</v-icon>
            <span class="text-caption font-weight-medium">ISO 9001:2015 Certified</span>
          </div>
        </div>
      </v-container>
    </v-footer>
  </v-app>
</template>

<script setup>
import { useAuthStore } from '@/stores/auth';
import { useTheme } from 'vuetify';

const drawer = ref(false);
const authStore = useAuthStore();
const instituteName = useState('instituteName', () => '');
const appLogo = useState('appLogo', () => '');
const contactAddress  = useState('contactAddress', () => '');
const contactPhone    = useState('contactPhone', () => '');
const contactEmail    = useState('contactEmail', () => '');
const contactWhatsapp = useState('contactWhatsapp', () => '');
const config = useRuntimeConfig();
const theme = useTheme();

const fullLogoUrl = computed(() => {
  if (!appLogo.value) return '';
  const baseUrl = config.public.apiBase.replace('/api', '');
  return `${baseUrl}${appLogo.value}`;
});

// Categories removed

onMounted(async () => {
  theme.global.name.value = 'brand';
  if (!authStore.isAuthenticated && typeof window !== 'undefined' && localStorage.getItem('at')) {
    await authStore.initAuth();
  }
});
</script>

<style scoped>
.navbar-frosted {
  background: #ffffff !important;
  border-bottom: 1px solid rgba(0, 0, 0, 0.05) !important;
}
.tracking-tight {
  letter-spacing: -0.02em;
}
.footer-frosted {
  background: #ffffff !important;
  border-top: 1px solid rgba(0, 0, 0, 0.05) !important;
}

.footer-link {
  padding: 0 !important;
  min-height: 24px !important;
  font-size: 0.875rem !important;
  color: var(--color-text-secondary) !important;
  transition: color 0.2s ease, transform 0.2s ease !important;
  margin-bottom: 8px !important;
  background: transparent !important;
}
.footer-link:hover {
  color: var(--color-brand) !important;
  transform: translateX(4px);
}

.social-btn {
  transition: transform 0.2s ease, background 0.2s ease !important;
}
.social-btn:hover {
  transform: translateY(-3px);
  background: var(--color-brand) !important;
  color: white !important;
}

.text-dark { color: var(--color-text-primary) !important; }
.text-secondary { color: var(--color-text-secondary) !important; }
.color-inherit { color: inherit !important; }
</style>
