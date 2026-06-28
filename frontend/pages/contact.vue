<template>
  <div class="contact-page-wrapper">
    <div class="contact-page bg-background min-h-screen">
      <div class="bg-white border-b py-12">
        <v-container>
          <div class="text-center">
            <h1 class="text-h3 font-weight-black tracking-tight mb-2">Contact Us</h1>
            <p class="text-grey-darken-1">Have a question? We're here to help.</p>
          </div>
        </v-container>
      </div>

      <v-container class="py-12">
        <v-row>
          <!-- Contact Details Sidebar -->
          <v-col cols="12" md="4" lg="4" class="pr-md-8 mb-8 mb-md-0">
            <h2 class="text-h4 font-weight-black mb-6">Get in Touch</h2>
            <p class="text-body-1 text-grey-darken-1 mb-10" style="line-height:1.7;">
              We'd love to hear from you. Please fill out the form or reach out directly using our contact details below.
            </p>

            <div class="d-flex mb-8">
              <v-avatar color="primary" class="mr-4" size="48" variant="tonal">
                <v-icon>mdi-map-marker</v-icon>
              </v-avatar>
              <div>
                <h3 class="text-subtitle-1 font-weight-bold mb-1 text-dark">Location</h3>
                <p class="text-body-1 text-grey-darken-1 mb-0">
                  Moozhikkal<br/>
                  Kozhikode
                </p>
              </div>
            </div>

            <div class="d-flex mb-8">
              <v-avatar color="success" class="mr-4" size="48" variant="tonal">
                <v-icon>mdi-email</v-icon>
              </v-avatar>
              <div>
                <h3 class="text-subtitle-1 font-weight-bold mb-1 text-dark">Mail Us</h3>
                <p class="text-body-1 mb-0">
                  <a href="mailto:brixcouncil@gmail.com" class="text-decoration-none text-grey-darken-1 font-weight-medium">brixcouncil@gmail.com</a>
                </p>
              </div>
            </div>

            <div class="d-flex">
              <v-avatar color="info" class="mr-4" size="48" variant="tonal">
                <v-icon>mdi-phone</v-icon>
              </v-avatar>
              <div>
                <h3 class="text-subtitle-1 font-weight-bold mb-1 text-dark">Call Us</h3>
                <p class="text-body-1 mb-0">
                  <a href="tel:+919746087916" class="text-decoration-none text-grey-darken-1 font-weight-medium d-block mb-1">+91 97460 87916</a>
                  <a href="tel:+919746118916" class="text-decoration-none text-grey-darken-1 font-weight-medium d-block">+91 9746 118916</a>
                </p>
              </div>
            </div>
          </v-col>

          <!-- Contact Form -->
          <v-col cols="12" md="8" lg="8">
            <v-card flat border class="rounded-xl pa-8 bg-white" style="box-shadow: 0 12px 32px rgba(0,0,0,0.03) !important;">
              <v-fade-transition mode="out-in">
                <div v-if="success" key="success" class="text-center py-12">
                  <v-icon size="80" color="success" class="mb-6">mdi-check-circle</v-icon>
                  <h3 class="text-h4 font-weight-bold mb-4">Message Sent!</h3>
                  <p class="text-body-1 text-grey-darken-1 mb-8 max-w-md mx-auto">
                    We've received your message and will get back to you shortly. Thank you for reaching out to Brixify.
                  </p>
                  <v-btn color="primary" size="large" @click="success = false" rounded="lg" class="text-none font-weight-bold px-8">Send Another Message</v-btn>
                </div>

                <form v-else key="form" @submit.prevent="handleSubmit">
                  <v-row>
                    <v-col cols="12" md="6">
                      <label class="text-caption font-weight-bold mb-2 d-block text-grey-darken-2">Name *</label>
                      <v-text-field
                        v-model="formData.name"
                        :error-messages="getErrors('name')"
                        placeholder="Your full name"
                        variant="outlined"
                        density="comfortable"
                        hide-details="auto"
                        class="mb-4 bg-grey-lighten-4 rounded-lg"
                      ></v-text-field>
                    </v-col>
                    <v-col cols="12" md="6">
                      <label class="text-caption font-weight-bold mb-2 d-block text-grey-darken-2">Email *</label>
                      <v-text-field
                        v-model="formData.email"
                        :error-messages="getErrors('email')"
                        type="email"
                        placeholder="your@email.com"
                        variant="outlined"
                        density="comfortable"
                        hide-details="auto"
                        class="mb-4 bg-grey-lighten-4 rounded-lg"
                      ></v-text-field>
                    </v-col>
                    <v-col cols="12" md="6">
                      <label class="text-caption font-weight-bold mb-2 d-block text-grey-darken-2">Phone</label>
                      <v-text-field
                        v-model="formData.phone"
                        placeholder="Your phone number"
                        variant="outlined"
                        density="comfortable"
                        hide-details="auto"
                        class="mb-4 bg-grey-lighten-4 rounded-lg"
                      ></v-text-field>
                    </v-col>
                    <v-col cols="12" md="6">
                      <label class="text-caption font-weight-bold mb-2 d-block text-grey-darken-2">Interested Courses (Optional)</label>
                      <v-select
                        v-model="formData.interested_courses"
                        :items="coursesList"
                        item-title="title"
                        item-value="title"
                        placeholder="Select courses you are interested in"
                        multiple
                        chips
                        closable-chips
                        variant="outlined"
                        density="comfortable"
                        hide-details="auto"
                        class="mb-4 bg-grey-lighten-4 rounded-lg"
                      ></v-select>
                    </v-col>
                    <v-col cols="12">
                      <label class="text-caption font-weight-bold mb-2 d-block text-grey-darken-2">Subject</label>
                      <v-text-field
                        v-model="formData.subject"
                        placeholder="What is this regarding?"
                        variant="outlined"
                        density="comfortable"
                        hide-details="auto"
                        class="mb-4 bg-grey-lighten-4 rounded-lg"
                      ></v-text-field>
                    </v-col>
                    <v-col cols="12">
                      <label class="text-caption font-weight-bold mb-2 d-block text-grey-darken-2">Message *</label>
                      <v-textarea
                        v-model="formData.message"
                        :error-messages="getErrors('message')"
                        placeholder="How can we help you?"
                        variant="outlined"
                        density="comfortable"
                        rows="5"
                        hide-details="auto"
                        class="mb-4 bg-grey-lighten-4 rounded-lg"
                      ></v-textarea>
                    </v-col>
                  </v-row>

                  <v-btn
                    type="submit"
                    color="primary"
                    block
                    size="x-large"
                    class="mt-6 font-weight-bold text-none"
                    rounded="lg"
                    :loading="submitting"
                    :disabled="submitting"
                  >
                    Send Message <v-icon end>mdi-send</v-icon>
                  </v-btn>
                  
                  <p v-if="errorMsg" class="text-error text-center mt-4 text-caption font-weight-bold">
                    {{ errorMsg }}
                  </p>
                </form>
              </v-fade-transition>
            </v-card>
          </v-col>
        </v-row>
      </v-container>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useVuelidate } from '@vuelidate/core';
import { required, email } from '@vuelidate/validators';

definePageMeta({
  layout: 'public'
});

useSeoMeta({
  title: 'Contact Us',
  description: 'Get in touch with AEMS Academy.'
});

const config = useRuntimeConfig();

const submitting = ref(false);
const success = ref(false);
const errorMsg = ref('');
const coursesList = ref([]);

// Fetch available courses for the dropdown
onMounted(async () => {
  try {
    const res = await $fetch(`${config.public.apiBase}/public/courses?limit=100`);
    if (res && res.courses) {
      coursesList.value = res.courses;
    }
  } catch (err) {
    console.error('Failed to fetch courses:', err);
  }
});

const formData = reactive({
  name: '',
  email: '',
  phone: '',
  subject: '',
  interested_courses: [],
  message: ''
});

const rules = {
  name: { required },
  email: { required, email },
  message: { required }
};

const v$ = useVuelidate(rules, formData);

const getErrors = (key: string): string[] => {
  return v$.value[key as keyof typeof rules]?.$errors.map(e => unref(e.$message) as string) || [];
};

const handleSubmit = async () => {
  const isValid = await v$.value.$validate();
  if (!isValid) return;

  submitting.value = true;
  errorMsg.value = '';

  try {
    let finalMessage = formData.message;
    if (formData.interested_courses && formData.interested_courses.length > 0) {
      finalMessage = `Interested Courses: ${formData.interested_courses.join(', ')}\n\n${finalMessage}`;
    }

    const payload = {
      ...formData,
      message: finalMessage
    };

    const response = await $fetch(`${config.public.apiBase}/public/contact`, {
      method: 'POST',
      body: payload
    });

    success.value = true;
    formData.name = '';
    formData.email = '';
    formData.phone = '';
    formData.subject = '';
    formData.interested_courses = [];
    formData.message = '';
    v$.value.$reset();
  } catch (err: any) {
    errorMsg.value = err.data?.message || 'Failed to send message. Please try again later.';
  } finally {
    submitting.value = false;
  }
};
</script>

<style scoped>
.tracking-tight { letter-spacing: -0.04em; }
</style>
