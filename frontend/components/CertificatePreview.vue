<template>
  <div class="cert-preview-wrap">
    <div class="cert-card" :style="{ borderColor: config.brand_color }">
      
      <!-- Top -->
      <div class="cert-top">
        <h2 class="institution-name" :style="{ color: config.brand_color }">
          {{ config.institution_name || 'Institution Name' }}
        </h2>
      </div>

      <!-- Main Body -->
      <div class="cert-body">
        <h1 class="cert-title">CERTIFICATE OF COMPLETION</h1>
        <div class="cert-line" :style="{ backgroundColor: config.brand_color }"></div>
        
        <p class="cert-text">This certifies that</p>
        <h2 class="student-name">John Doe (Preview)</h2>
        
        <p class="cert-text">has successfully completed the course</p>
        <h3 class="course-name">Advanced Full-Stack Development</h3>
        
        <p class="cert-date">Awarded on {{ new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric'}) }}</p>
      </div>

      <!-- Bottom -->
      <div class="cert-bottom">
        <div class="cert-id">
          <p>Cert ID: AEMS-2026-X7Y8Z9</p>
        </div>
        <div class="signatory">
          <div class="sig-line"></div>
          <h4 class="sig-name">{{ config.signatory_name || 'Signatory Name' }}</h4>
          <p class="sig-title">{{ config.signatory_title || 'Signatory Title' }}</p>
        </div>
        <div class="qr-code">
          <v-icon size="60" color="black">mdi-qrcode</v-icon>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  config: {
    institution_name: string;
    brand_color: string;
    signatory_name: string;
    signatory_title: string;
  }
}>();
</script>

<style scoped>
.cert-preview-wrap {
  width: 100%;
  aspect-ratio: 1.414 / 1; /* A4 Landscape aspect ratio approx */
  max-width: 841px;
  background: white;
  padding: 24px;
  box-sizing: border-box;
  
  font-family: 'Helvetica', 'Arial', sans-serif;
  border: 1px solid var(--border);
}

.cert-card {
  width: 100%;
  height: 100%;
  border: 4px solid #3b82f6; /* dynamic */
  padding: 40px;
  display: flex;
  flex-direction: column;
  position: relative;
}

.cert-top {
  text-align: center;
  margin-bottom: 20px;
}
.institution-name {
  font-size: 24px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 2px;
}

.cert-body {
  text-align: center;
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.cert-title {
  font-size: 36px;
  font-weight: 800;
  color: #1a1a2e;
  margin-bottom: 20px;
  letter-spacing: 4px;
}

.cert-line {
  width: 60%;
  height: 2px;
  margin: 0 auto 30px;
}

.cert-text {
  font-size: 16px;
  color: #666;
  margin-bottom: 10px;
  font-style: italic;
}

.student-name {
  font-size: 42px;
  font-weight: 800;
  color: #1a1a2e;
  margin-bottom: 20px;
}

.course-name {
  font-size: 24px;
  font-weight: 700;
  color: #1a1a2e;
  margin-bottom: 20px;
}

.cert-date {
  font-size: 16px;
  color: #666;
}

.cert-bottom {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  margin-top: auto;
}

.cert-id {
  font-size: 12px;
  color: #999;
}

.signatory {
  text-align: center;
  margin-bottom: 10px;
}

.sig-line {
  width: 200px;
  height: 1px;
  background: #1a1a2e;
  margin: 0 auto 10px;
}

.sig-name {
  font-size: 18px;
  font-weight: 700;
  color: #1a1a2e;
  margin: 0;
}

.sig-title {
  font-size: 14px;
  color: #666;
  margin: 0;
}

.qr-code {
  width: 70px;
  height: 70px;
  border: 1px solid #eee;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
