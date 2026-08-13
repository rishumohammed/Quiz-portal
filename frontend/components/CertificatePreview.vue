<template>
  <div class="cert-preview-wrap">
    <div class="cert-card">
      <!-- Decorative Frame SVG -->
      <svg class="frame-svg" viewBox="0 0 480 680">
        <!-- Outer Frame -->
        <rect x="36" y="36" width="8" height="8" fill="none" stroke="#D4AF37" stroke-width="1.5" />
        <line x1="44" y1="40" x2="340" y2="40" stroke="#D4AF37" stroke-width="1.5" />
        <line x1="40" y1="44" x2="40" y2="550" stroke="#D4AF37" stroke-width="1.5" />
        
        <!-- Inner Frame -->
        <rect x="48" y="48" width="6" height="6" fill="none" stroke="#D4AF37" stroke-width="1" />
        <line x1="54" y1="51" x2="290" y2="51" stroke="#D4AF37" stroke-width="1" />
        <line x1="51" y1="54" x2="51" y2="600" stroke="#D4AF37" stroke-width="1" />
      </svg>

      <!-- Left Vertical Text -->
      <div class="left-motto">
        <span>Igniting Scientific Temper, Inspiring Future Innovators.</span>
      </div>

      <!-- Top Right Logo -->
      <div class="top-logo">
        <img v-if="config.certificate_logo" :src="getImageUrl(config.certificate_logo)" alt="Logo" class="logo-img" />
      </div>

      <!-- Header Titles -->
      <div class="cert-header">
        <h2 class="exam-title-1">KEFTA - NATIONAL LEVEL</h2>
        <h2 class="exam-title-2">TALENT HUNT</h2>
        
        <div class="divider-line">
          <span class="diamond">◆</span>
        </div>

        <h1 class="cert-main-title">CERTIFICATE</h1>
        <div class="cert-subtitle">— OF PARTICIPATION —</div>
      </div>

      <!-- Body Content -->
      <div class="cert-body">
        <p class="cert-certify">This is to certify that</p>
        <h2 class="candidate-name">{{ candidateName || 'John Doe' }}</h2>
        <div class="name-underline"></div>

        <p class="cert-desc">
          has participated in the National Level Talent Hunt organized by<br>
          <strong>Kerala Food Technologists Association - KEFTA.</strong>
        </p>
      </div>

      <!-- Seal & Signatures Area -->
      <div class="cert-bottom-section">
        <!-- Center Seal -->
        <div class="seal-box">
          <img v-if="config.certificate_seal" :src="getImageUrl(config.certificate_seal)" alt="Seal" class="seal-img" />
        </div>

        <!-- Dual Signatures -->
        <div class="signatures-row">
          <!-- Signatory 1 -->
          <div class="sig-col">
            <div class="sig-image-wrap">
              <img v-if="config.certificate_sig1_image" :src="getImageUrl(config.certificate_sig1_image)" alt="Sig 1" class="sig-img" />
              <span v-else class="sig-font">{{ config.certificate_sig1_name ? config.certificate_sig1_name.split(' ')[0] : '' }}</span>
            </div>
            <div class="sig-line"></div>
            <h4 class="sig-name">{{ config.certificate_sig1_name ?? '' }}</h4>
            <p class="sig-title">{{ config.certificate_sig1_title ?? '' }}</p>
          </div>

          <!-- Signatory 2 -->
          <div class="sig-col">
            <div class="sig-image-wrap">
              <img v-if="config.certificate_sig2_image" :src="getImageUrl(config.certificate_sig2_image)" alt="Sig 2" class="sig-img" />
              <span v-else class="sig-font">{{ config.certificate_sig2_name ? config.certificate_sig2_name.split(' ')[0] : '' }}</span>
            </div>
            <div class="sig-line"></div>
            <h4 class="sig-name">{{ config.certificate_sig2_name ?? '' }}</h4>
            <p class="sig-title">{{ config.certificate_sig2_title ?? '' }}</p>
          </div>
        </div>
      </div>

      <!-- Footer Band -->
      <div class="cert-footer">
        <div class="footer-title">Kerala Food Technologists Association - KEFTA</div>
        <div class="footer-sub">Kozhikode - Kerala, www.kefta.in, kefta.kerala@gmail.com</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRuntimeConfig } from '#imports';

const props = withDefaults(defineProps<{
  candidateName?: string;
  config?: any;
}>(), {
  candidateName: 'John Doe',
  config: () => ({})
});

const runtimeConfig = useRuntimeConfig();
const baseUrl = computed(() => (runtimeConfig.public?.apiBase || '/api').replace('/api', ''));

function getImageUrl(path: string) {
  if (!path) return '';
  if (path.startsWith('http')) return path;
  return baseUrl.value + (path.startsWith('/') ? path : '/' + path);
}
</script>

<style scoped>
.cert-preview-wrap {
  width: 100%;
  max-width: 520px;
  aspect-ratio: 480 / 680;
  background: #F4EFE6;
  position: relative;
  box-shadow: 0 10px 30px rgba(0,0,0,0.15);
  border-radius: 8px;
  overflow: hidden;
  font-family: 'Helvetica', sans-serif;
  color: #003366;
}

.cert-card {
  width: 100%;
  height: 100%;
  position: relative;
  box-sizing: border-box;
  padding: 30px 40px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

/* Borders (SVG) */
.frame-svg {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 0;
}

/* Left Motto */
.left-motto {
  position: absolute;
  left: 26px;
  top: 0;
  bottom: 0;
  width: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.left-motto span {
  transform: rotate(-90deg);
  white-space: nowrap;
  font-size: 11px;
  color: #B8860B;
  letter-spacing: 0.5px;
}

/* Top Right Logo */
.top-logo {
  position: absolute;
  top: 35px;
  right: 35px;
  height: 50px;
}
.logo-img {
  max-height: 50px;
  max-width: 110px;
  object-fit: contain;
}
.fallback-logo {
  font-family: Georgia, serif;
  font-style: italic;
  font-weight: bold;
  font-size: 22px;
  color: #D4AF37;
}
.gold-dot {
  font-size: 14px;
  margin-left: 4px;
}

/* Header */
.cert-header {
  text-align: center;
  margin-top: 25px;
}
.exam-title-1, .exam-title-2 {
  font-size: 15px;
  font-weight: 800;
  color: #003366;
  letter-spacing: 1px;
  margin: 0;
}
.divider-line {
  margin: 10px auto;
  width: 180px;
  height: 1px;
  background: #B8860B;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}
.diamond {
  font-size: 8px;
  color: #B8860B;
  background: #F4EFE6;
  padding: 0 4px;
}
.cert-main-title {
  font-family: Georgia, serif;
  font-size: 26px;
  color: #D4AF37;
  letter-spacing: 2px;
  margin: 10px 0 2px;
}
.cert-subtitle {
  font-family: Georgia, serif;
  font-size: 11px;
  color: #D4AF37;
  letter-spacing: 1.5px;
}

/* Body */
.cert-body {
  text-align: center;
  margin: 15px 0;
}
.cert-certify {
  font-size: 11px;
  color: #1B3A68;
  margin-bottom: 6px;
}
.candidate-name {
  font-family: Georgia, serif;
  font-style: italic;
  font-size: 22px;
  color: #B8860B;
  margin: 4px 0;
}
.name-underline {
  width: 160px;
  height: 1px;
  background: #aaa;
  margin: 0 auto 12px;
}
.cert-desc {
  font-size: 9.5px;
  color: #1B3A68;
  line-height: 1.4;
}

/* Bottom Section */
.cert-bottom-section {
  position: relative;
  margin-top: 10px;
}
.seal-box {
  display: flex;
  justify-content: center;
  margin-bottom: 15px;
}
.seal-img {
  width: 60px;
  height: 60px;
  object-fit: contain;
  border-radius: 50%;
}
.fallback-seal {
  width: 56px;
  height: 56px;
  border: 1px solid #003366;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2px;
}
.seal-inner {
  width: 48px;
  height: 48px;
  border: 1px dashed #D4AF37;
  border-radius: 50%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
}
.seal-top, .seal-bot {
  font-size: 4px;
  font-weight: bold;
  color: #003366;
}
.seal-mid {
  font-size: 8px;
  font-weight: bold;
  color: #D4AF37;
}

.signatures-row {
  display: flex;
  justify-content: space-between;
  padding: 0 10px;
}
.sig-col {
  text-align: center;
  width: 140px;
}
.sig-image-wrap {
  height: 30px;
  display: flex;
  align-items: flex-end;
  justify-content: center;
}
.sig-img {
  max-height: 30px;
  max-width: 100px;
  object-fit: contain;
}
.sig-font {
  font-family: Georgia, serif;
  font-style: italic;
  font-size: 16px;
  color: #1B3A68;
}
.sig-line {
  width: 110px;
  height: 1px;
  background: #888;
  margin: 3px auto 4px;
}
.sig-name {
  font-family: Georgia, serif;
  font-size: 10px;
  font-weight: bold;
  color: #B8860B;
  margin: 0;
}
.sig-title {
  font-size: 7.5px;
  color: #1B3A68;
  margin: 2px 0 0;
}

/* Footer */
.cert-footer {
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 40px;
  background: #EAE6DC;
  border-top: 1px dashed #ccc;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
}
.footer-title {
  font-size: 9.5px;
  font-weight: bold;
  color: #333;
}
.footer-sub {
  font-size: 7.5px;
  color: #666;
}
</style>
