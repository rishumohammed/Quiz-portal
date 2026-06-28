<template>
  <div class="privacy-page-wrapper">
    <div class="section-default pt-16">
      <v-container>
        <div class="section-header">
          <h1 class="section-title">Privacy Policy</h1>
          <p class="section-sub">Last updated: May 2026</p>
        </div>

        <div class="policy-content bg-white pa-8 pa-md-12 rounded-xl shadow-sm border mb-16">
          <section class="mb-8">
            <h2 class="text-h5 font-weight-bold mb-4">1. Information We Collect</h2>
            <p class="text-body-1 text-secondary">
              We collect information you provide directly to us when you create an account, enroll in a course, or communicate with us. This may include your name, email address, phone number, and payment information.
            </p>
          </section>

          <section class="mb-8">
            <h2 class="text-h5 font-weight-bold mb-4">2. How We Use Your Information</h2>
            <p class="text-body-1 text-secondary">
              We use the information we collect to provide, maintain, and improve our services, including to process enrollments, send course updates, and respond to your comments and questions.
            </p>
          </section>

          <section class="mb-8">
            <h2 class="text-h5 font-weight-bold mb-4">3. Job Placement Services</h2>
            <p class="text-body-1 text-secondary">
              If you utilize our Job Placement Portal, we may share relevant professional information with potential employers with your explicit consent to facilitate your career opportunities.
            </p>
          </section>

          <section>
            <h2 class="text-h5 font-weight-bold mb-4">4. Contact Us</h2>
            <p class="text-body-1 text-secondary">
              If you have any questions about this Privacy Policy, please contact us at info@aems.local.
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
  title: 'Privacy Policy',
  description: 'Understand how AEMS Academy protects and manages your personal data.'
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
