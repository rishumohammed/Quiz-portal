<template>
  <div>
    <NuxtLayout>
      <NuxtPage :page-key="route => route.fullPath" />
    </NuxtLayout>
  </div>
</template>

<script setup lang="ts">
import { useTheme } from 'vuetify';

const theme = useTheme();
const config = useRuntimeConfig();
const instituteName = useState('instituteName', () => '');
const instituteTagline = useState('instituteTagline', () => '');
const contactAddress = useState('contactAddress', () => '');
const contactPhone = useState('contactPhone', () => '');
const contactEmail = useState('contactEmail', () => '');
const contactWhatsapp = useState('contactWhatsapp', () => '');


useHead({
  script: [
    { src: 'https://www.youtube.com/iframe_api', async: true }
  ]
});

onMounted(async () => {
  try {
    const data: any = await $fetch(`${config.public.apiBase}/public/config`);
    if (data) {
      if (data.brand_primary_color) {
        // Update Vuetify Theme
        if (theme.themes.value?.appleLight) {
          theme.themes.value.appleLight.colors.primary = data.brand_primary_color;
        }
        (theme.global.current.value.colors as any).primary = data.brand_primary_color;
        
        // Update Native CSS tokens
        document.documentElement.style.setProperty('--brand', data.brand_primary_color);
        document.documentElement.style.setProperty('--blue', data.brand_primary_color);
        document.documentElement.style.setProperty('--v-theme-primary', data.brand_primary_color);
      }
      if (data.brand_secondary_color) {
        if (theme.themes.value?.appleLight) {
          theme.themes.value.appleLight.colors.secondary = data.brand_secondary_color;
        }
        (theme.global.current.value.colors as any).secondary = data.brand_secondary_color;
        document.documentElement.style.setProperty('--v-theme-secondary', data.brand_secondary_color);
      }
      if (data.institute_name) {
        instituteName.value = data.institute_name;
        useHead({
          title: data.institute_name,
          titleTemplate: (titleChunk) => {
            return titleChunk && titleChunk !== data.institute_name ? `${titleChunk} | ${data.institute_name}` : data.institute_name;
          }
        });
      }
      if (data.tagline) {
        instituteTagline.value = data.tagline;
      }
      if (data.app_logo) {
        useState('appLogo').value = data.app_logo;
      }
      if (data.app_favicon) {
        useState('appFavicon').value = data.app_favicon;
        const baseUrl = config.public.apiBase.replace('/api', '');
        useHead({
          link: [
            { rel: 'icon', type: 'image/x-icon', href: `${baseUrl}${data.app_favicon}` }
          ]
        });
      }
      // Homepage image config
      if (data.homepage_hero_image) {
        useState('homepage_hero_image').value = data.homepage_hero_image;
      }
      if (data.homepage_hero_image_url) {
        useState('homepage_hero_image_url').value = data.homepage_hero_image_url;
      }
      if (data.homepage_about_image) {
        useState('homepage_about_image').value = data.homepage_about_image;
      }
      if (data.homepage_about_image_url) {
        useState('homepage_about_image_url').value = data.homepage_about_image_url;
      }
      if (data.aboutpage_who_image) {
        useState('aboutpage_who_image').value = data.aboutpage_who_image;
      }
      if (data.aboutpage_who_image_url) {
        useState('aboutpage_who_image_url').value = data.aboutpage_who_image_url;
      }
      // Contact details
      if (data.contact_address) contactAddress.value = data.contact_address;
      if (data.contact_phone)   contactPhone.value   = data.contact_phone;
      if (data.contact_email)   contactEmail.value   = data.contact_email;
      if (data.contact_whatsapp) contactWhatsapp.value = data.contact_whatsapp;
    }
  } catch (err) {
    console.error('Failed to fetch public config', err);
  }
});
</script>
