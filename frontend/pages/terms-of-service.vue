<template>
  <div class="terms-page-wrapper">
    <div class="section-default pt-16">
      <v-container>
        <div class="section-header">
          <h1 class="section-title">Terms of Service</h1>
          <p class="section-sub">Last updated: May 2026</p>
        </div>

        <div class="policy-content bg-white pa-8 pa-md-12 rounded-xl shadow-sm border mb-16">
          <section class="mb-8">
            <h2 class="text-h5 font-weight-bold mb-4">1. Acceptance of Terms</h2>
            <p class="text-body-1 text-secondary">
              By accessing or using the AEMS Academy platform, you agree to be bound by these Terms of Service and all applicable laws and regulations.
            </p>
          </section>

          <section class="mb-8">
            <h2 class="text-h5 font-weight-bold mb-4">2. Use of Services</h2>
            <p class="text-body-1 text-secondary">
              You are responsible for maintaining the confidentiality of your account information and for all activities that occur under your account. You agree to use the services for lawful purposes only.
            </p>
          </section>

          <section class="mb-8">
            <h2 class="text-h5 font-weight-bold mb-4">3. Course Content & Intellectual Property</h2>
            <p class="text-body-1 text-secondary">
              All course materials, including videos, documents, and assessments, are the intellectual property of AEMS Academy and are provided for your personal, non-commercial use only.
            </p>
          </section>

          <section class="mb-8">
            <h2 class="text-h5 font-weight-bold mb-4">4. Placement Portal Usage</h2>
            <p class="text-body-1 text-secondary">
              Usage of the AEMS Placement Portal is subject to the completion of relevant course requirements and adherence to professional conduct standards.
            </p>
          </section>

          <section>
            <h2 class="text-h5 font-weight-bold mb-4">5. Limitation of Liability</h2>
            <p class="text-body-1 text-secondary">
              AEMS Academy shall not be liable for any indirect, incidental, special, or consequential damages resulting from the use or inability to use our services.
            </p>
          </section>
        </div>
      </v-container>
    </div>
  </div>
</template>

<script setup>
definePageMeta({
  layout: 'public'
});

useSeoMeta({
  title: 'Terms of Service',
  description: 'Review the terms and conditions for using the AEMS Academy platform.'
});
</script>

<style scoped>
.policy-content {
  max-width: 800px;
  margin: 0 auto;
}
.text-secondary {
  color: var(--color-text-secondary) !important;
  line-height: 1.8;
}
</style>
