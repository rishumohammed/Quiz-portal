<template>
  <v-card class="certificate-card pa-12 rounded-xl border position-relative overflow-hidden" elevation="2" id="certificate-print-area">
    <!-- Subtle Background Vectors -->
    <svg class="cert-vector top-right" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="150" cy="50" r="100" stroke="rgba(33, 29, 113, 0.05)" stroke-width="40"/>
      <circle cx="150" cy="50" r="160" stroke="rgba(33, 29, 113, 0.03)" stroke-width="20"/>
    </svg>
    <svg class="cert-vector bottom-left" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="50" cy="150" r="100" stroke="rgba(246, 130, 31, 0.05)" stroke-width="40"/>
    </svg>
    
    <div class="text-center position-relative z-1 px-8">
      <div class="d-flex align-center justify-center mb-8">
        <v-avatar color="primary" size="40" class="mr-3 rounded-lg" variant="tonal">
          <v-icon color="primary" size="24">mdi-seal</v-icon>
        </v-avatar>
        <span class="text-h5 font-weight-black tracking-tight" style="color: var(--primary);">BRIXIFY</span>
      </div>
      
      <div class="text-h6 font-weight-bold text-grey-darken-1 mb-2 tracking-widest uppercase" style="letter-spacing: 0.15em !important;">Certificate of Completion</div>
      <v-divider class="mx-auto mb-8" width="60" thickness="3" color="primary"></v-divider>
      
      <div class="text-body-1 text-grey-darken-1 mb-2">This is to certify that</div>
      <div class="text-h3 font-weight-black mb-6 text-g7">{{ cert.student_name }}</div>
      
      <div class="text-body-1 text-grey-darken-1 mb-2">has successfully completed the program</div>
      <div class="text-h4 font-weight-bold mb-10 text-primary">{{ cert.course_name }}</div>
      
      <v-row class="mt-8 align-end">
        <v-col cols="4" class="text-left">
          <div class="text-caption text-grey font-weight-bold uppercase mb-1">Issued On</div>
          <div class="text-body-1 font-weight-bold text-g6">{{ new Date(cert.issued_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) }}</div>
        </v-col>
        
        <v-col cols="4" class="text-center">
            <div class="qr-container d-inline-block pa-3 bg-white rounded-xl border shadow-sm">
                <qrcode-vue :value="verificationUrl" :size="70" level="M" render-as="svg" />
            </div>
            <div class="text-caption text-grey mt-2 font-weight-medium">Scan to verify</div>
        </v-col>
        
        <v-col cols="4" class="text-right">
          <div class="text-caption text-grey font-weight-bold uppercase mb-1">Certificate ID</div>
          <div class="text-body-1 font-weight-bold font-mono text-g6">{{ cert.cert_number }}</div>
        </v-col>
      </v-row>
    </div>
    
    <!-- Status Watermark -->
    <div v-if="cert.status === 'revoked'" class="revoked-watermark">
        REVOKED
    </div>
  </v-card>
</template>

<script setup>
import QrcodeVue from 'qrcode.vue'

const props = defineProps({
  cert: {
    type: Object,
    required: true
  }
})

const verificationUrl = computed(() => {
    if (process.client) {
        return `${window.location.origin}/verify?id=${props.cert.cert_number}`
    }
    return ''
})
</script>

<style scoped>
.certificate-card {
  background: #fff;
  border-color: rgba(0,0,0,0.05) !important;
  min-height: 560px;
  max-width: 850px;
  margin: 0 auto;
}

.cert-vector {
  position: absolute;
  width: 200px;
  height: 200px;
  pointer-events: none;
  z-index: 0;
}

.top-right {
  top: -50px;
  right: -50px;
}

.bottom-left {
  bottom: -50px;
  left: -50px;
}

.shadow-sm { box-shadow: 0 4px 12px rgba(0,0,0,0.05); }

.tracking-widest { letter-spacing: 0.2em; }
.uppercase { text-transform: uppercase; }
.font-mono { font-family: monospace; }
.text-xxs { font-size: 10px; }

.revoked-watermark {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%) rotate(-30deg);
    font-size: 120px;
    font-weight: 900;
    color: rgba(255, 59, 48, 0.1);
    border: 15px solid rgba(255, 59, 48, 0.1);
    padding: 20px 60px;
    pointer-events: none;
    z-index: 0;
}

@media print {
  body * {
    visibility: hidden;
  }
  #certificate-print-area, #certificate-print-area * {
    visibility: visible;
  }
  #certificate-print-area {
    position: absolute;
    left: 0;
    top: 0;
    width: 100%;
    border: none !important;
  }
  .v-btn { display: none !important; }
}
</style>
