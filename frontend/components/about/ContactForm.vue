<template>
  <v-card flat class="pa-6 pa-md-10 rounded-xl bg-white shadow-sm border" style="background: #fff !important;">
    <h3 class="text-h5 font-weight-bold mb-6 tracking-tight">Send us a Message</h3>
    
    <v-form @submit.prevent="submitForm">
      <v-row>
        <v-col cols="12" sm="6" class="py-2">
          <v-text-field
            v-model="form.name"
            label="Full Name"
            variant="outlined"
            placeholder="John Doe"
            color="primary"
            density="comfortable"
            hide-details="auto"
            :rules="[v => !!v || 'Name is required']"
          ></v-text-field>
        </v-col>
        <v-col cols="12" sm="6" class="py-2">
          <v-text-field
            v-model="form.email"
            label="Email Address"
            variant="outlined"
            placeholder="john@example.com"
            color="primary"
            density="comfortable"
            hide-details="auto"
            :rules="[v => !!v || 'Email is required']"
          ></v-text-field>
        </v-col>
        <v-col cols="12" sm="6" class="py-2">
          <v-text-field
            v-model="form.phone"
            label="Phone Number"
            variant="outlined"
            placeholder="+91 XXXXX XXXXX"
            color="primary"
            density="comfortable"
            hide-details="auto"
          ></v-text-field>
        </v-col>
        <v-col cols="12" sm="6" class="py-2">
          <div class="native-select-wrap">
            <label class="native-select-label">Subject</label>
            <select v-model="form.subject" class="native-select">
              <option v-for="s in subjects" :key="s" :value="s">{{ s }}</option>
            </select>
            <span class="native-select-arrow">▾</span>
          </div>
        </v-col>
        <v-col cols="12" class="py-2">
          <v-textarea
            v-model="form.message"
            label="Your Message"
            variant="outlined"
            rows="4"
            color="primary"
            density="comfortable"
            placeholder="How can we help you?"
            hide-details="auto"
            :rules="[v => !!v || 'Message is required']"
          ></v-textarea>
        </v-col>
      </v-row>
      
      <v-btn
        color="primary"
        size="x-large"
        rounded="lg"
        block
        elevation="2"
        class="mt-6 text-capitalize font-weight-bold"
        :loading="loading"
        type="submit"
      >
        Send Message
        <v-icon right class="ml-2">mdi-send</v-icon>
      </v-btn>
    </v-form>
    
    <v-alert
      v-if="success"
      type="success"
      variant="tonal"
      class="mt-6 rounded-lg"
      closable
    >
        Thank you for contacting us! We'll get back to you shortly.
    </v-alert>
  </v-card>
</template>

<script setup>
const config = useRuntimeConfig();
const apiBase = config.public.apiBase;

const subjects = [
    'General Inquiry',
    'Course Admissions',
    'Partnership',
    'Corporate Training',
    'Support',
    'Feedback'
];

const form = reactive({
    name: '',
    email: '',
    phone: '',
    subject: 'General Inquiry',
    message: ''
});

const loading = ref(false);
const success = ref(false);

const submitForm = async () => {
    loading.value = true;
    try {
        await $fetch(`${apiBase}/public/contact`, {
            method: 'POST',
            body: form
        });
        success.value = true;
        // Reset form
        Object.keys(form).forEach(key => {
            if (key === 'subject') form[key] = 'General Inquiry';
            else form[key] = '';
        });
        setTimeout(() => success.value = false, 5000);
    } catch (err) {
        alert(err.data?.message || 'Failed to send message');
    } finally {
        loading.value = false;
    }
};
</script>

<style scoped>
.native-select-wrap {
  position: relative;
  width: 100%;
}

.native-select-label {
  position: absolute;
  top: -9px;
  left: 12px;
  font-size: 12px;
  font-weight: 500;
  color: rgba(0, 0, 0, 0.6);
  background: #fff;
  padding: 0 4px;
  z-index: 1;
  pointer-events: none;
}

.native-select {
  width: 100%;
  height: 44px;
  padding: 0 36px 0 14px;
  border: 1px solid rgba(0, 0, 0, 0.38);
  border-radius: 4px;
  background: #fff;
  color: #1D1D1F;
  font-size: 16px;
  font-family: inherit;
  appearance: none;
  -webkit-appearance: none;
  cursor: pointer;
  outline: none;
  transition: border-color 0.2s ease;
}

.native-select:focus {
  border-color: #5624D0;
  border-width: 2px;
}

.native-select:hover {
  border-color: rgba(0, 0, 0, 0.87);
}

.native-select-arrow {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  pointer-events: none;
  color: rgba(0, 0, 0, 0.54);
  font-size: 14px;
}
</style>
