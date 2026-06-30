<template>
  <v-container fluid class="pa-6">
    <div class="mb-8">
      <h1 class="text-h4 font-weight-bold mb-1">System Settings</h1>
      <p class="text-subtitle-1 text-medium-emphasis mb-6">Configure branding, integrations, and global parameters.</p>
    </div>

    <div class="settings-layout">
      <!-- Internal Sidebar -->
      <div class="settings-sidebar pa-2">
        <v-list v-model:selected="activeTab" color="primary" mandatory class="settings-list">
          <v-list-item 
            v-for="tab in tabs" 
            :key="tab.value" 
            :value="tab.value" 
            :prepend-icon="tab.icon" 
            :title="tab.label"
            rounded="lg"
            class="mb-1"
          ></v-list-item>
        </v-list>
      </div>

      <!-- Main Content -->
      <div class="settings-content pa-8">
        <v-form @submit.prevent="save">
          <!-- Branding Tab -->
          <div v-if="activeTab[0] === 'branding'" class="fade-in">
            <h2 class="text-h6 font-weight-bold mb-6">Branding & Identity</h2>
            
            <!-- Logo & Favicon Upload -->
            <v-row class="mb-8">
              <v-col cols="12" md="6">
                <v-card variant="outlined" class="pa-4 rounded-xl d-flex flex-column align-center justify-center text-center">
                  <div class="mb-3">
                    <img v-if="form.app_logo" :src="baseUrl + form.app_logo" alt="Logo Preview" style="max-height: 60px; max-width: 100%; object-fit: contain;" />
                    <v-icon v-else size="48" color="grey-lighten-1">mdi-image-outline</v-icon>
                  </div>
                  <div class="text-subtitle-2 font-weight-bold mb-1">Platform Logo</div>
                  <div class="text-caption text-secondary mb-3">Recommended: 400x100px PNG/SVG</div>
                  <v-file-input
                    v-model="logoFile"
                    accept="image/*"
                    label="Upload new logo"
                    variant="outlined"
                    density="compact"
                    prepend-icon=""
                    prepend-inner-icon="mdi-camera"
                    hide-details
                    class="w-100"
                    @change="uploadBranding"
                  ></v-file-input>
                </v-card>
              </v-col>
              
              <v-col cols="12" md="6">
                <v-card variant="outlined" class="pa-4 rounded-xl d-flex flex-column align-center justify-center text-center">
                  <div class="mb-3">
                    <img v-if="form.app_favicon" :src="baseUrl + form.app_favicon" alt="Favicon Preview" style="max-height: 48px; max-width: 48px; border-radius: 8px; object-fit: cover;" />
                    <v-icon v-else size="48" color="grey-lighten-1">mdi-web</v-icon>
                  </div>
                  <div class="text-subtitle-2 font-weight-bold mb-1">Favicon</div>
                  <div class="text-caption text-secondary mb-3">Recommended: 64x64px ICO/PNG</div>
                  <v-file-input
                    v-model="faviconFile"
                    accept="image/*,.ico"
                    label="Upload new favicon"
                    variant="outlined"
                    density="compact"
                    prepend-icon=""
                    prepend-inner-icon="mdi-camera"
                    hide-details
                    class="w-100"
                    @change="uploadBranding"
                  ></v-file-input>
                </v-card>
              </v-col>
            </v-row>

            <v-divider class="mb-8"></v-divider>

            <div class="fr2 mb-4">
              <AppInput v-model="form.institute_name" label="Institution Name" placeholder="AEMS Academy" large />
              <AppInput v-model="form.tagline" label="Tagline" placeholder="Learn the future" large />
            </div>
            <div class="fr2">
              <AppInput v-model="form.brand_primary_color" label="Primary Color" type="color" large />
              <AppInput v-model="form.brand_secondary_color" label="Secondary Color" type="color" large />
            </div>

          </div>

          <!-- LMS Tab -->
          <div v-if="activeTab[0] === 'lms'" class="fade-in">
            <h2 class="text-h6 font-weight-bold mb-6">LMS Configuration</h2>
            <div class="mb-2">
              <v-combobox
                v-model="form.course_languages"
                label="Course Languages"
                chips
                multiple
                clearable
                variant="outlined"
                hint="Type a language and press Enter to add it."
                persistent-hint
              ></v-combobox>
            </div>
            <div class="text-caption text-secondary mb-6">These languages will appear in the language dropdown when creating or editing a course.</div>
          </div>

          <!-- Email Tab -->
          <div v-if="activeTab[0] === 'email'" class="fade-in">
            <h2 class="text-h6 font-weight-bold mb-6">Email Settings (SMTP)</h2>
            <div class="fr2 mb-4" style="grid-template-columns: 2fr 1fr;">
              <AppInput v-model="form.smtp_host" label="SMTP Host" placeholder="smtp.gmail.com" large />
              <AppInput v-model="form.smtp_port" label="Port" placeholder="587" large />
            </div>
            <div class="fr2 mb-4">
              <AppInput v-model="form.smtp_user" label="Username" placeholder="user@example.com" large />
              <AppInput v-model="form.smtp_pass" label="Password" type="password" placeholder="••••••••" large />
            </div>
            <div class="fr2 mb-6">
              <AppInput v-model="form.smtp_from_name" label="From Name" placeholder="AEMS Team" large />
              <AppInput v-model="form.smtp_from_email" label="From Email" placeholder="noreply@aems.local" large />
            </div>
            <AppButton variant="g" icon="mdi-send-outline" @click="testEmail">Send Test Email</AppButton>
          </div>

          <!-- Contact Info Tab -->
          <div v-if="activeTab[0] === 'contact'" class="fade-in">
            <h2 class="text-h6 font-weight-bold mb-6">Contact Information</h2>
            <div class="fr2 mb-4">
              <AppInput v-model="form.contact_email" label="Contact Email" placeholder="contact@aems.local" large />
              <AppInput v-model="form.contact_phone" label="Contact Phone" placeholder="+1234567890" large />
            </div>
            <div class="mb-6">
              <AppInput v-model="form.contact_address" label="Institution Address" placeholder="123 AEMS Campus" large />
            </div>
          </div>


          <!-- Payments Tab -->
          <div v-if="activeTab[0] === 'payments'" class="fade-in">
            <h2 class="text-h6 font-weight-bold mb-6">Payment Gateway (Razorpay)</h2>
            <div class="mb-4">
              <AppInput v-model="form.razorpay_key_id" label="Key ID" placeholder="rzp_live_..." large />
            </div>
            <div class="mb-4">
              <AppInput v-model="form.razorpay_key_secret" label="Key Secret" type="password" placeholder="••••••••" large />
            </div>
            <div class="mb-6">
              <AppInput v-model="form.razorpay_webhook_secret" label="Webhook Secret" type="password" placeholder="••••••••" large />
            </div>

            <v-divider class="my-6"></v-divider>

            <h2 class="text-h6 font-weight-bold mb-6">Course Access Rules</h2>
            <div class="mb-4">
              <AppInput 
                v-model="form.payment_allow_partial_access" 
                label="Option A: Allow course access after partial payment" 
                type="select" 
                :options="[{label: 'Yes, allow access', value: 'true'}, {label: 'No, restrict until fully paid', value: 'false'}]" 
                large 
              />
            </div>
            <div class="mb-4">
              <AppInput 
                v-model="form.payment_restrict_certificate" 
                label="Option B: Restrict certificate generation until fully paid" 
                type="select" 
                :options="[{label: 'Yes, restrict certificate', value: 'true'}, {label: 'No, allow certificate', value: 'false'}]" 
                large 
              />
            </div>
            <div class="mb-6">
              <AppInput 
                v-model="form.payment_restrict_exam" 
                label="Option C: Restrict final exam until fully paid" 
                type="select" 
                :options="[{label: 'Yes, restrict exam', value: 'true'}, {label: 'No, allow exam', value: 'false'}]" 
                large 
              />
            </div>
          </div>

          <!-- WhatsApp Tab -->
          <div v-if="activeTab[0] === 'whatsapp'" class="fade-in">
            <h2 class="text-h6 font-weight-bold mb-6">WhatsApp Cloud API</h2>
            <div class="fr2 mb-4">
              <AppInput v-model="form.whatsapp_app_id" label="App ID" placeholder="123456789" large />
              <AppInput v-model="form.whatsapp_phone_number_id" label="Phone Number ID" placeholder="987654321" large />
            </div>
            <div class="mb-4">
              <AppInput v-model="form.whatsapp_access_token" label="System Access Token" type="password" placeholder="EAAB..." large />
            </div>
            <div class="mb-6">
              <AppInput v-model="form.whatsapp_verify_token" label="Webhook Verify Token" placeholder="my_token" large />
            </div>
          </div>

          <!-- Terms & Privacy Tab -->
          <div v-if="activeTab[0] === 'terms_privacy'" class="fade-in">
            <h2 class="text-h6 font-weight-bold mb-6">Terms &amp; Privacy Configuration</h2>
            
            <v-row>
              <v-col cols="12" md="6">
                <v-textarea v-model="form.terms_content" label="Terms &amp; Conditions Content" rows="8" variant="outlined" auto-grow class="mb-3" />
                <AppInput v-model="form.terms_version" label="Terms &amp; Conditions Version" placeholder="1.0" large />
              </v-col>
              <v-col cols="12" md="6">
                <v-textarea v-model="form.privacy_content" label="Privacy Policy Content" rows="8" variant="outlined" auto-grow class="mb-3" />
                <AppInput v-model="form.privacy_version" label="Privacy Policy Version" placeholder="1.0" large />
              </v-col>
            </v-row>

          </div>

          <!-- Social Platforms Tab -->
          <div v-if="activeTab[0] === 'social'" class="fade-in">
            <SocialPlatformsTab />
          </div>

          <!-- Homepage Tab -->
          <div v-if="activeTab[0] === 'homepage'" class="fade-in">
            <h2 class="text-h6 font-weight-bold mb-2">Homepage Content & Settings</h2>
            <p class="text-body-2 text-secondary mb-8">Manage the main text and images displayed on the public Talent Hunt homepage.</p>

            <v-card variant="outlined" class="rounded-xl pa-6 mb-6">
              <h3 class="text-subtitle-1 font-weight-bold mb-4">Text Content</h3>
              
              <div class="mb-4">
                <AppInput v-model="form.homepage_title" label="Main Title" placeholder="KEFTA National Food Tech Talent Hunt 2026" large />
              </div>
              <div class="mb-4">
                <v-textarea v-model="form.homepage_subtitle" label="Subtitle" placeholder="Discovering, motivating, and supporting emerging food science talents across the nation." variant="outlined" auto-grow rows="2" />
              </div>
              <div class="mb-4">
                <AppInput v-model="form.homepage_about_title" label="About Section Title" placeholder="About the Competition" large />
              </div>
              <div class="mb-4">
                <v-textarea v-model="form.homepage_about_description" label="About Section Description" placeholder="Enter paragraph text here..." variant="outlined" auto-grow rows="4" />
              </div>
              <div class="mb-4">
                <v-textarea v-model="form.homepage_bullets" label="About Section Bullets (One per line)" placeholder="Promote scientific temperament..." variant="outlined" auto-grow rows="4" />
              </div>
              <div class="mb-4">
                <AppInput v-model="form.homepage_footer_text" label="Footer Text" placeholder="All assessments will be conducted..." large />
              </div>
            </v-card>

            <!-- Hero Image -->
            <v-card variant="outlined" class="rounded-xl pa-6 mb-6">
              <div class="d-flex align-center mb-4">
                <v-avatar color="primary" size="40" class="mr-3">
                  <v-icon color="white" size="20">mdi-image-area</v-icon>
                </v-avatar>
                <div>
                  <div class="text-subtitle-1 font-weight-bold">Hero Section Image</div>
                  <div class="text-caption text-secondary">Shown on the right side of the main hero banner</div>
                </div>
              </div>

              <!-- Preview -->
              <div v-if="form.homepage_hero_image" class="mb-4">
                <img
                  :src="form.homepage_hero_image?.startsWith('/') ? (baseUrl + form.homepage_hero_image) : form.homepage_hero_image"
                  alt="Hero Image Preview"
                  style="width:100%; max-height:200px; object-fit:cover; border-radius:12px; border:1px solid rgba(0,0,0,0.08);"
                />
              </div>
              <div v-else class="mb-4 pa-6 rounded-xl d-flex align-center justify-center" style="background:#f8f9fc; border:1px dashed rgba(0,0,0,0.12); min-height:120px;">
                <div class="text-center text-secondary">
                  <v-icon size="40" color="grey-lighten-2" class="mb-2">mdi-image-outline</v-icon>
                  <div class="text-caption">No image set — using default</div>
                </div>
              </div>

              <v-row>
                <v-col cols="12" md="6">
                  <v-file-input
                    v-model="heroImageFile"
                    accept="image/*"
                    label="Upload new hero image"
                    variant="outlined"
                    density="compact"
                    prepend-icon=""
                    prepend-inner-icon="mdi-upload"
                    hide-details
                    class="mb-3"
                  />
                  <v-btn color="primary" variant="tonal" rounded="lg" size="small" :loading="saving" @click="uploadHomepageImages" class="text-none">
                    <v-icon start>mdi-cloud-upload</v-icon> Upload Hero Image
                  </v-btn>
                </v-col>
                <v-col cols="12" md="6">
                  <AppInput
                    v-model="form.homepage_hero_image_url"
                    label="Or paste image URL"
                    placeholder="https://images.unsplash.com/..."
                  />
                  <div class="text-caption text-secondary mt-1">If set, URL takes priority over uploaded file.</div>
                </v-col>
              </v-row>
            </v-card>



            <div class="d-flex justify-end gap-3 mt-8 pt-6 border-t">
              <AppButton variant="g" size="lg" icon="mdi-refresh" @click="fetchData">Reset</AppButton>
              <AppButton size="lg" icon="mdi-check" :loading="saving" @click="save">Save URL Settings</AppButton>
            </div>
          </div>

          <!-- Currencies Tab -->
          <div v-if="activeTab[0] === 'currencies'" class="fade-in">
            <CurrenciesTab />
          </div>

          <!-- Certifications Tab -->
          <div v-if="activeTab[0] === 'certifications'" class="fade-in">
            <CertificationsTab />
          </div>

          <!-- Email Templates Tab -->
          <div v-if="activeTab[0] === 'email_templates'" class="fade-in">
            <EmailTemplatesTab />
          </div>

          <div class="d-flex justify-end gap-3 mt-12 pt-6 border-t" v-if="activeTab[0] !== 'social' && activeTab[0] !== 'currencies' && activeTab[0] !== 'homepage' && activeTab[0] !== 'certifications' && activeTab[0] !== 'email_templates'">
            <AppButton variant="g" size="lg" icon="mdi-refresh" @click="fetchData">
              Reset Changes
            </AppButton>
            <AppButton type="submit" :loading="saving" size="lg" icon="mdi-check" @click.prevent="save">
              Save All Settings
            </AppButton>
          </div>
        </v-form>
      </div>
    </div>

    <!-- Snackbar for notifications -->
    <v-snackbar v-model="snackbar" :color="snackbarColor" rounded="lg" timeout="3000">
      {{ snackbarMessage }}
    </v-snackbar>
  </v-container>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, computed } from 'vue';
import { useApi } from '@/composables/useApi';
import SocialPlatformsTab from '@/components/admin/settings/SocialPlatformsTab.vue';
import CurrenciesTab from '@/components/admin/settings/CurrenciesTab.vue';
import CertificationsTab from '@/components/admin/settings/CertificationsTab.vue';
import EmailTemplatesTab from '@/components/admin/settings/EmailTemplatesTab.vue';

definePageMeta({
  layout: 'dashboard',
  middleware: ['auth', 'role'],
  role: ['super_admin']
});

const api = useApi();
const config = useRuntimeConfig();
const baseUrl = computed(() => config.public.apiBase.replace('/api', ''));

const activeTab = ref(['branding']);
const saving = ref(false);
const regenerating = ref(false);
const form = ref<any>({});
const logoFile = ref(null);
const faviconFile = ref(null);
const heroImageFile = ref(null);
const aboutImageFile = ref(null);
const aboutpageWhoImageFile = ref(null);

const snackbar = ref(false);
const snackbarMessage = ref('');
const snackbarColor = ref('success');

const tabs = [
  { label: 'Branding', value: 'branding', icon: 'mdi-palette-outline' },
  { label: 'Homepage', value: 'homepage', icon: 'mdi-home-outline' },
  { label: 'Contact Info', value: 'contact', icon: 'mdi-map-marker-outline' },
  { label: 'Email (SMTP)', value: 'email', icon: 'mdi-email-outline' },
  { label: 'Email Templates', value: 'email_templates', icon: 'mdi-email-edit-outline' },
  { label: 'Terms & Privacy', value: 'terms_privacy', icon: 'mdi-shield-lock-outline' }
];


const fetchData = async () => {
  try {
    const { data } = await api.get('/admin/config');
    const configMap: any = {};
    data.forEach((item: any) => {
      configMap[item.key] = item.value;
    });
    if (configMap.course_languages && typeof configMap.course_languages === 'string') {
      configMap.course_languages = configMap.course_languages.split(',').map((s: string) => s.trim()).filter(Boolean);
    } else {
      configMap.course_languages = [];
    }
    form.value = configMap;
  } catch (err) {
    console.error('Failed to fetch config');
  }
};

const uploadBranding = async () => {
  if (!logoFile.value && !faviconFile.value) return;
  
  saving.value = true;
  const formData = new FormData();
  
  const logo = Array.isArray(logoFile.value) ? logoFile.value[0] : logoFile.value;
  const favicon = Array.isArray(faviconFile.value) ? faviconFile.value[0] : faviconFile.value;

  if (logo) formData.append('logo', logo);
  if (favicon) formData.append('favicon', favicon);

  try {
    const { data } = await api.post('/admin/config/branding/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    if (data.updates.app_logo) form.value.app_logo = data.updates.app_logo;
    if (data.updates.app_favicon) form.value.app_favicon = data.updates.app_favicon;
    snackbarMessage.value = 'Branding assets uploaded successfully';
    snackbarColor.value = 'success';
    snackbar.value = true;
    logoFile.value = null;
    faviconFile.value = null;
  } catch (err) {
    snackbarMessage.value = 'Failed to upload images';
    snackbarColor.value = 'error';
    snackbar.value = true;
  } finally {
    saving.value = false;
  }
};

const uploadHomepageImages = async () => {
  if (!heroImageFile.value && !aboutImageFile.value && !aboutpageWhoImageFile.value) return;

  saving.value = true;
  const formData = new FormData();

  const hero = Array.isArray(heroImageFile.value) ? heroImageFile.value[0] : heroImageFile.value;
  const about = Array.isArray(aboutImageFile.value) ? aboutImageFile.value[0] : aboutImageFile.value;
  const aboutWho = Array.isArray(aboutpageWhoImageFile.value) ? aboutpageWhoImageFile.value[0] : aboutpageWhoImageFile.value;

  if (hero) formData.append('hero_image', hero);
  if (about) formData.append('about_image', about);
  if (aboutWho) formData.append('aboutpage_who_image', aboutWho);

  try {
    const { data } = await api.post('/admin/config/branding/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    if (data.updates.homepage_hero_image) form.value.homepage_hero_image = data.updates.homepage_hero_image;
    if (data.updates.homepage_about_image) form.value.homepage_about_image = data.updates.homepage_about_image;
    if (data.updates.aboutpage_who_image) form.value.aboutpage_who_image = data.updates.aboutpage_who_image;
    snackbarMessage.value = 'Images uploaded successfully';
    snackbarColor.value = 'success';
    snackbar.value = true;
    heroImageFile.value = null;
    aboutImageFile.value = null;
    aboutpageWhoImageFile.value = null;
  } catch (err) {
    snackbarMessage.value = 'Failed to upload homepage images';
    snackbarColor.value = 'error';
    snackbar.value = true;
  } finally {
    saving.value = false;
  }
};

const save = async () => {
  saving.value = true;
  try {
    const payload = { ...form.value };
    if (Array.isArray(payload.course_languages)) {
      payload.course_languages = payload.course_languages.join(',');
    }
    await api.put('/admin/config', payload);
    snackbarMessage.value = 'Settings saved successfully. Reloading to apply changes...';
    snackbarColor.value = 'success';
    snackbar.value = true;
    setTimeout(() => {
      window.location.reload();
    }, 1500);
  } catch (err) {
    console.error('Failed to save config');
    snackbarMessage.value = 'Failed to save settings';
    snackbarColor.value = 'error';
    snackbar.value = true;
  } finally {
    saving.value = false;
  }
};

const testEmail = async () => {
  try {
    await api.post('/admin/config/test-email');
    snackbarMessage.value = 'Test email sent successfully';
    snackbarColor.value = 'success';
    snackbar.value = true;
  } catch (err) {
    snackbarMessage.value = 'Failed to send test email';
    snackbarColor.value = 'error';
    snackbar.value = true;
  }
};

const regenerateInvoicePDFs = async () => {
  regenerating.value = true;
  try {
    await api.post('/admin/config/invoices/regenerate-pdfs');
    snackbarMessage.value = 'Invoice PDFs are being regenerated in the background.';
    snackbarColor.value = 'success';
    snackbar.value = true;
  } catch (err) {
    snackbarMessage.value = 'Failed to trigger PDF regeneration';
    snackbarColor.value = 'error';
    snackbar.value = true;
  } finally {
    regenerating.value = false;
  }
};

onMounted(() => {
  fetchData();
});
</script>

<style scoped>


.settings-layout {
  display: flex;
  background: white;
  border-radius: var(--radius-lg);
  
  min-height: 600px;
  overflow: hidden;
  border: 1px solid var(--border);
}

.settings-sidebar {
  width: 260px;
  background: var(--g1);
  border-right: 1px solid rgba(0, 0, 0, 0.05);
}

.settings-content {
  flex: 1;
}

.settings-list {
  background: transparent !important;
}

:deep(.v-list-item--selected) {
  background-color: white !important;
  border: 1px solid var(--border);
  
}

.fr2 { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
.fade-in {
  animation: fadeIn 0.3s ease-in-out;
}
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

.border-t { border-top: 1px solid rgba(0, 0, 0, 0.05); }
</style>
