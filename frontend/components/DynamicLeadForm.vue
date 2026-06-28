<template>
  <div class="dynamic-lead-form">
    <v-fade-transition mode="out-in">
      <div v-if="success" key="success" class="text-center py-8">
        <v-icon size="64" color="success" class="mb-4">mdi-check-circle</v-icon>
        <h3 class="text-h5 font-weight-bold mb-2">Thank You!</h3>
        <p class="text-body-1 text-medium-emphasis mb-6">
          We've received your inquiry. Our team will contact you shortly.
        </p>
        <v-btn
          :href="waLink"
          target="_blank"
          color="#25D366"
          class="text-white px-8"
          size="large"
          prepend-icon="mdi-whatsapp"
        >
          Chat with us on WhatsApp
        </v-btn>
      </div>

      <div v-else key="form">
        <div v-if="loading" class="d-flex justify-center py-8">
          <v-progress-circular indeterminate color="primary"></v-progress-circular>
        </div>

        <form v-else @submit.prevent="handleSubmit">
          <v-row>
            <!-- Render Dynamic Fields if available -->
            <template v-if="sortedFields.length > 0">
              <v-col
                v-for="field in sortedFields"
                :key="field.field_key"
                cols="12"
                class="py-3"
              >
                <!-- Phone Input -->
                <div v-if="field.type === 'phone'">
                  <label class="text-caption font-weight-bold mb-1 d-block text-secondary">
                    {{ field.label }} {{ field.required ? '*' : '' }}
                  </label>
                  <vue-tel-input
                    v-model="formData[field.field_key]"
                    v-bind="telOptions"
                    :class="{ 'is-invalid': v$[field.field_key]?.$error }"
                  ></vue-tel-input>
                  <div v-if="v$[field.field_key]?.$error" class="text-caption text-error mt-1">
                    Valid phone number is required
                  </div>
                </div>

                <v-text-field
                  v-else-if="['text', 'email', 'date'].includes(field.type)"
                  v-model="formData[field.field_key]"
                  :type="field.type"
                  :label="field.label + (field.required ? ' *' : '')"
                  :placeholder="field.placeholder"
                  :error-messages="getErrors(field.field_key)"
                  variant="outlined"
                  density="comfortable"
                  color="primary"
                  persistent-placeholder
                  hide-details="auto"
                  class="bg-white rounded-lg"
                ></v-text-field>

                <v-textarea
                  v-else-if="field.type === 'textarea'"
                  v-model="formData[field.field_key]"
                  :label="field.label + (field.required ? ' *' : '')"
                  :placeholder="field.placeholder"
                  :error-messages="getErrors(field.field_key)"
                  variant="outlined"
                  density="comfortable"
                  color="primary"
                  rows="3"
                  persistent-placeholder
                  hide-details="auto"
                  class="bg-white rounded-lg"
                ></v-textarea>

                <v-select
                  v-else-if="field.type === 'dropdown'"
                  v-model="formData[field.field_key]"
                  :items="field.options"
                  :label="field.label + (field.required ? ' *' : '')"
                  :placeholder="field.placeholder"
                  :error-messages="getErrors(field.field_key)"
                  variant="outlined"
                  density="comfortable"
                  color="primary"
                  hide-details="auto"
                  class="bg-white rounded-lg"
                ></v-select>

                <v-checkbox
                  v-else-if="field.type === 'checkbox'"
                  v-model="formData[field.field_key]"
                  :label="field.label"
                  :error-messages="getErrors(field.field_key)"
                  hide-details="auto"
                  color="primary"
                  density="compact"
                ></v-checkbox>
              </v-col>
            </template>

            <!-- Fallback Static Form if API is empty or fails -->
            <template v-else>
              <v-col cols="12" class="py-1">
                <v-text-field
                  v-model="formData.name"
                  label="Full Name *"
                  placeholder="Enter your name"
                  variant="outlined"
                  density="comfortable"
                  color="primary"
                  hide-details="auto"
                  class="bg-white rounded-lg mb-4"
                ></v-text-field>
                <v-text-field
                  v-model="formData.email"
                  label="Email Address *"
                  placeholder="example@mail.com"
                  variant="outlined"
                  density="comfortable"
                  color="primary"
                  hide-details="auto"
                  class="bg-white rounded-lg mb-4"
                ></v-text-field>
                <div class="mb-4">
                  <label class="text-caption font-weight-bold mb-1 d-block text-secondary">Phone Number *</label>
                  <vue-tel-input
                    v-model="formData.phone"
                    v-bind="telOptions"
                  ></vue-tel-input>
                </div>
                <v-select
                  v-model="formData.course_interest_ids"
                  :items="coursesList"
                  item-title="title"
                  item-value="id"
                  label="Interested Courses (Optional)"
                  placeholder="Select courses you are interested in"
                  multiple
                  chips
                  closable-chips
                  variant="outlined"
                  density="comfortable"
                  color="primary"
                  hide-details="auto"
                  class="bg-white rounded-lg mb-4"
                ></v-select>
                <v-textarea
                  v-model="formData.message"
                  label="How can we help? *"
                  placeholder="Describe your inquiry"
                  variant="outlined"
                  density="comfortable"
                  color="primary"
                  rows="3"
                  hide-details="auto"
                  class="bg-white rounded-lg mb-4"
                ></v-textarea>
              </v-col>
            </template>
          </v-row>

          <v-btn
            type="submit"
            color="accent"
            block
            size="large"
            rounded="lg"
            class="mt-6 font-weight-bold text-capitalize"
            :loading="submitting"
            :disabled="submitting || loading"
          >
            Submit Inquiry
          </v-btn>
          
          <p v-if="errorMsg" class="text-error text-center mt-4 text-caption">
            {{ errorMsg }}
          </p>
        </form>
      </div>
    </v-fade-transition>
  </div>
</template>

<script setup>
import { useVuelidate } from '@vuelidate/core';
import { required, email as emailValidator, helpers } from '@vuelidate/validators';
import { VueTelInput } from 'vue-tel-input';
import 'vue-tel-input/vue-tel-input.css';

const props = defineProps({
  formId: {
    type: String,
    required: true
  },
  source: {
    type: String,
    default: 'website'
  },
  initialData: {
    type: Object,
    default: () => ({})
  }
});

const { generateWALink } = useWhatsApp();
const config = useRuntimeConfig();

const telOptions = {
  mode: 'international',
  defaultCountry: 'IN',
  autoDefaultCountry: true,
  inputOptions: {
    showDialCode: true,
    placeholder: 'Enter phone number'
  }
};

// Fetch form config - top level for correct SSR/Hydration
const { data: formConfig, pending: loading, error: fetchError } = useFetch(`${config.public.apiBase}/public/forms/${props.formId}`);

const submitting = ref(false);
const success = ref(false);
const errorMsg = ref('');
const formData = ref({ course_interest_ids: [] });
const waLink = ref('');
const coursesList = ref([]);

// Fetch available courses for the dropdown
useFetch(`${config.public.apiBase}/public/courses?limit=100`).then((res) => {
  if (res.data.value && res.data.value.courses) {
    coursesList.value = res.data.value.courses;
  }
});

// Watch formConfig to initialize formData
watchEffect(() => {
  if (formConfig.value) {
    try {
      const fields = JSON.parse(formConfig.value.fields_json);
      fields.forEach(f => {
        if (formData.value[f.field_key] === undefined) {
          formData.value[f.field_key] = props.initialData[f.field_key] || '';
        }
      });
    } catch (e) {
      console.error('Failed to parse form fields:', e);
    }
  }
});

// No need to show errorMsg if we have a fallback form
// if (fetchError.value) {
//   errorMsg.value = 'Failed to load form. Please try again later.';
// }

const sortedFields = computed(() => {
  if (!formConfig.value) return [];
  const fields = JSON.parse(formConfig.value.fields_json);
  return fields.sort((a, b) => (a.order || 0) - (b.order || 0));
});

// Dynamic Validations
const rules = computed(() => {
  const r = {};
  if (!formConfig.value) return r;
  
  const fields = JSON.parse(formConfig.value.fields_json);
  fields.forEach(f => {
    const fieldRules = {};
    if (f.required) {
      fieldRules.required = helpers.withMessage(`${f.label} is required`, required);
    }
    if (f.type === 'email') {
      fieldRules.email = helpers.withMessage('Invalid email address', emailValidator);
    }
    r[f.field_key] = fieldRules;
  });
  return r;
});

const v$ = useVuelidate(rules, formData);

const getErrors = (key) => {
  return v$.value[key]?.$errors.map(e => e.$message) || [];
};

const handleSubmit = async () => {
  // If we have dynamic rules, validate them
  if (Object.keys(rules.value).length > 0) {
    const isValid = await v$.value.$validate();
    if (!isValid) return;
  } else {
    // Simple validation for fallback form
    if (!formData.value.name || !formData.value.email || !formData.value.phone) {
      errorMsg.value = 'Please fill in all required fields.';
      return;
    }
  }

  submitting.value = true;
  errorMsg.value = '';

  try {
    const isFallback = !formConfig.value;
    const endpoint = isFallback ? `${config.public.apiBase}/public/contact` : `${config.public.apiBase}/public/leads`;
    
    let finalMessage = formData.value.message || 'Interested in learning more.';
    
    // Construct payload based on endpoint
    const payload = isFallback ? {
      name: formData.value.name,
      email: formData.value.email,
      phone: formData.value.phone,
      subject: 'Homepage Enquiry',
      message: finalMessage,
      course_interest_ids: formData.value.course_interest_ids || []
    } : {
      name: formData.value.name || formData.value.full_name || 'Visitor',
      email: formData.value.email,
      phone: formData.value.phone,
      source: props.source,
      form_id: props.formId,
      custom_fields: { ...formData.value }
    };

    const response = await $fetch(endpoint, {
      method: 'POST',
      body: payload
    });

    if (response.success || response.id || response.message) {
      success.value = true;
      waLink.value = generateWALink(
        formData.value.phone, 
        `Hi, I just submitted an enquiry on AEMS Academy and would like to know more.`
      );
    }
  } catch (err) {
    console.error('Submission error:', err);
    errorMsg.value = err.data?.message || 'Failed to submit inquiry. Please try again.';
  } finally {
    submitting.value = false;
  }
};
</script>

<style scoped>
.dynamic-lead-form :deep(.vue-tel-input) {
  border: 1px solid rgba(0, 0, 0, 0.38) !important;
  border-radius: 8px !important;
  height: 48px !important;
  background-color: #ffffff !important;
  transition: border-color 0.15s cubic-bezier(0.4, 0, 0.2, 1), border-color 0.15s cubic-bezier(0.4, 0, 0.2, 1) !important;
  font-family: inherit !important;
  display: flex !important;
  align-items: center !important;
  
}

.dynamic-lead-form :deep(.vue-tel-input:hover) {
  border-color: rgba(0, 0, 0, 0.87) !important;
}

.dynamic-lead-form :deep(.vue-tel-input:focus-within) {
  border-color: rgb(var(--v-theme-primary)) !important;
  border: 1px solid var(--border);
  
}

/* Error state */
.dynamic-lead-form :deep(.vue-tel-input.is-invalid) {
  border-color: rgb(var(--v-theme-error)) !important;
}
.dynamic-lead-form :deep(.vue-tel-input.is-invalid:focus-within) {
  border-color: rgb(var(--v-theme-error)) !important;
  border: 1px solid var(--border);
  
}

/* Dropdown / Flag Selector styling */
.dynamic-lead-form :deep(.vti__dropdown) {
  border-radius: 8px 0 0 8px !important;
  background: transparent !important;
  padding: 0 12px !important;
  transition: background-color 0.2s !important;
  height: 100% !important;
  display: flex !important;
  align-items: center !important;
  border-right: 1px solid rgba(0, 0, 0, 0.12) !important;
}

.dynamic-lead-form :deep(.vti__dropdown:hover),
.dynamic-lead-form :deep(.vti__dropdown.open) {
  background-color: rgba(0, 0, 0, 0.04) !important;
}

/* Dropdown list of countries */
.dynamic-lead-form :deep(.vti__dropdown-list) {
  border-radius: 8px !important;
  
  border: 1px solid rgba(0,0,0,0.08) !important;
  padding: 8px 0 !important;
  background-color: #ffffff !important;
  z-index: 2000 !important;
  margin-top: 4px !important;
  max-width: 300px !important;
}

.dynamic-lead-form :deep(.vti__dropdown-item) {
  padding: 10px 16px !important;
  font-size: 14px !important;
  color: rgba(0, 0, 0, 0.87) !important;
}

.dynamic-lead-form :deep(.vti__dropdown-item.highlighted) {
  background-color: rgba(0, 0, 0, 0.08) !important;
}

/* Input text area styling */
.dynamic-lead-form :deep(.vti__input) {
  font-size: 16px !important;
  font-weight: 400 !important;
  color: rgba(0, 0, 0, 0.87) !important;
  padding-left: 14px !important;
  font-family: inherit !important;
  background: transparent !important;
  border: none !important;
  outline: none !important;
  height: 100% !important;
}

.dynamic-lead-form :deep(.vti__input::placeholder) {
  color: rgba(0, 0, 0, 0.38) !important;
}

.dynamic-lead-form :deep(.v-field--variant-outlined) {
  border-radius: 8px;
}
</style>
