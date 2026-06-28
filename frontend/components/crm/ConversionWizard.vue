<template>
  <v-dialog 
    :model-value="modelValue" 
    @update:model-value="val => emit('update:modelValue', val)"
    max-width="800px" 
    persistent
    scrollable
  >
    <v-card class="rounded-xl overflow-hidden">
      <v-toolbar color="primary" flat>
        <v-toolbar-title class="text-h6 font-weight-bold text-white">
          Convert Lead to Student
        </v-toolbar-title>
        <v-spacer></v-spacer>
        <v-btn icon="mdi-close" color="white" variant="text" @click="close"></v-btn>
      </v-toolbar>
      
      <v-card-text class="pa-0">
        <!-- Success Summary Screen -->
        <div v-if="isConverted && convertedCredentials" class="pa-6">
          <div class="text-center mb-6">
            <v-icon size="64" color="success" class="mb-2">mdi-check-circle-outline</v-icon>
            <h2 class="text-h5 font-weight-bold text-success">Student Created Successfully</h2>
            <p class="text-subtitle-2 text-grey">Lead has been converted to student and credentials generated.</p>
          </div>

          <v-card variant="flat" border class="pa-4 rounded-lg bg-grey-lighten-4 mb-6">
            <v-row dense>
              <v-col cols="12" class="d-flex align-center py-2 border-b">
                <span class="text-subtitle-2 font-weight-bold text-grey-darken-1 mr-4" style="width: 150px;">Student ID:</span>
                <span class="text-body-1 font-weight-bold text-primary">{{ convertedCredentials.readableStudentId }}</span>
              </v-col>
              <v-col cols="12" class="d-flex align-center py-2 border-b">
                <span class="text-subtitle-2 font-weight-bold text-grey-darken-1 mr-4" style="width: 150px;">Username:</span>
                <span class="text-body-1 font-weight-medium">{{ convertedCredentials.email }}</span>
              </v-col>
              <v-col cols="12" class="d-flex align-center py-2">
                <span class="text-subtitle-2 font-weight-bold text-grey-darken-1 mr-4" style="width: 150px;">Temporary Password:</span>
                <span class="text-body-1 font-weight-bold text-success font-mono d-flex align-center">
                  {{ convertedCredentials.tempPassword }}
                  <v-btn icon="mdi-content-copy" size="x-small" variant="text" class="ml-2" @click="copyTempPassword" title="Copy Temporary Password"></v-btn>
                </span>
              </v-col>
            </v-row>
          </v-card>

          <v-row class="ma-0 justify-center gap-2">
            <v-btn
              color="grey-darken-3"
              variant="flat"
              prepend-icon="mdi-content-copy"
              class="text-capitalize rounded-lg px-4"
              @click="copyCredentials"
            >
              Copy Credentials
            </v-btn>

            <v-btn
              color="primary"
              variant="flat"
              prepend-icon="mdi-email-outline"
              class="text-capitalize rounded-lg px-4"
              @click="sendWelcomeEmail"
              :loading="sendingEmail"
            >
              Send Email
            </v-btn>

            <v-btn
              color="success"
              variant="flat"
              prepend-icon="mdi-whatsapp"
              class="text-capitalize rounded-lg px-4"
              @click="sendWhatsApp"
            >
              Send WhatsApp
            </v-btn>

            <v-btn
              color="indigo"
              variant="flat"
              prepend-icon="mdi-account-eye"
              class="text-capitalize rounded-lg px-4"
              @click="viewProfile"
            >
              View Student Profile
            </v-btn>
          </v-row>
        </div>

        <v-stepper v-else v-model="step" :items="['Select Course', 'Pricing', 'Payment', 'Confirm']" hide-actions>
        <template v-slot:item.1>
          <div class="pa-6">
            <h3 class="text-h6 font-weight-bold mb-4">Select Course</h3>
            <v-autocomplete
              v-model="selectedCourseIds"
              :items="courses"
              item-title="title"
              item-value="id"
              label="Search published courses..."
              variant="outlined"
              prepend-inner-icon="mdi-magnify"
              :loading="loadingCourses"
              multiple
              chips
              closable-chips
              @update:model-value="onCourseSelect"
            >
              <template v-slot:item="{ props, item }">
                <v-list-item v-bind="props" :subtitle="'INR ' + item.raw.price">
                  <template v-slot:append>
                    <v-chip size="x-small" :color="item.raw.price_type === 'fixed' ? 'success' : 'warning'">
                      {{ item.raw.price_type }}
                    </v-chip>
                  </template>
                </v-list-item>
              </template>
            </v-autocomplete>

            <v-alert
              v-if="selectedCourses.length > 0"
              border="start"
              variant="tonal"
              color="info"
              class="mt-4"
            >
              <div v-for="course in selectedCourses" :key="course.id" class="d-flex align-center justify-space-between mb-2">
                <div>
                  <div class="text-subtitle-1 font-weight-bold">{{ course.title }}</div>
                  <div class="text-caption">Default Price: INR {{ course.price }}</div>
                </div>
                <v-chip color="primary" size="small">{{ course.price_type }}</v-chip>
              </div>
            </v-alert>
          </div>
        </template>

        <template v-slot:item.2>
          <div class="pa-6">
            <h3 class="text-h6 font-weight-bold mb-4">Pricing Details</h3>
            <div v-if="!hasCustomPricedCourse && selectedCourses.length > 0">
              <p class="text-body-1 mb-4">The selected course(s) have a total fixed price of <strong>INR {{ defaultBundlePrice }}</strong>.</p>
              <v-row>
                <v-col cols="12" md="6">
                  <v-text-field
                    label="Bundle Price"
                    :model-value="defaultBundlePrice"
                    readonly
                    variant="filled"
                    prefix="INR"
                  ></v-text-field>
                </v-col>
                <v-col cols="12" md="6">
                  <v-text-field
                    v-model="discountAmount"
                    label="Discount Amount"
                    variant="outlined"
                    type="number"
                    prefix="INR"
                    hint="Optional discount"
                    min="0"
                  ></v-text-field>
                </v-col>
              </v-row>
              <div v-if="discountAmount > 0" class="text-h6 text-success mt-2">
                Final Price: INR {{ finalPrice }}
              </div>
            </div>
            <div v-else-if="selectedCourses.length > 0">
              <p class="text-body-1 mb-4">One or more selected courses are custom-priced. Enter the total negotiated bundle price.</p>
              <v-row>
                <v-col cols="12" md="6">
                  <v-text-field
                    v-model="customPrice"
                    label="Negotiated Price"
                    variant="outlined"
                    type="number"
                    prefix="INR"
                    hint="Base price agreed with lead"
                    persistent-hint
                  ></v-text-field>
                </v-col>
                <v-col cols="12" md="6">
                  <v-text-field
                    v-model="discountAmount"
                    label="Discount Amount"
                    variant="outlined"
                    type="number"
                    prefix="INR"
                    hint="Optional extra discount"
                    min="0"
                  ></v-text-field>
                </v-col>
              </v-row>
              <div v-if="discountAmount > 0" class="text-h6 text-success mt-4">
                Final Price: INR {{ finalPrice }}
              </div>
            </div>
          </div>
        </template>

        <template v-slot:item.3>
          <div class="pa-6">
            <h3 class="text-h6 font-weight-bold mb-4">Payment Mode</h3>
            <v-radio-group v-model="paymentMode" class="mb-4">
              <v-radio label="Online (Razorpay Link)" value="online"></v-radio>
              <v-radio label="Offline (Manual Entry)" value="offline"></v-radio>
            </v-radio-group>

            <div v-if="paymentMode === 'offline'" class="bg-grey-lighten-4 pa-4 rounded-lg">
              <v-row dense>
                <v-col cols="12">
                  <v-btn-toggle v-model="offlineStatus" mandatory color="primary" class="w-100 d-flex" variant="outlined" style="height: 56px;">
                    <v-btn value="full" class="flex-grow-1">Fully Paid</v-btn>
                    <v-btn value="partial" class="flex-grow-1">Partial Payment</v-btn>
                  </v-btn-toggle>
                </v-col>
                <v-col cols="12" class="mt-4">
                  <v-text-field
                    v-model="amountPaid"
                    label="Amount Paid Now"
                    variant="outlined"
                    type="number"
                    prefix="INR"
                    :disabled="offlineStatus === 'full'"
                  ></v-text-field>
                </v-col>
                <v-col cols="12">
                  <v-select
                    v-model="offlineType"
                    :items="['cash', 'bank_transfer', 'cheque']"
                    label="Payment Type"
                    variant="outlined"
                  ></v-select>
                </v-col>
                <v-col cols="12">
                  <v-text-field
                    v-model="paymentReference"
                    label="Payment Reference (Optional)"
                    variant="outlined"
                    placeholder="Transaction ID, Cheque No, etc."
                  ></v-text-field>
                </v-col>
              </v-row>
            </div>
          </div>
        </template>

        <template v-slot:item.4>
          <div class="pa-6">
            <h3 class="text-h6 font-weight-bold mb-4">Review & Confirm</h3>
            <v-card variant="flat" border class="pa-4 rounded-lg bg-primary-lighten-5">
              <v-row>
                <v-col cols="6">
                  <div class="text-caption text-grey">Student Name</div>
                  <div class="text-body-1 font-weight-bold">{{ lead.name }}</div>
                </v-col>
                <v-col cols="6">
                  <div class="text-caption text-grey">Courses</div>
                  <div class="text-body-1 font-weight-bold">{{ selectedCourses.map(c => c.title).join(', ') }}</div>
                </v-col>
                <v-col cols="6">
                  <div class="text-caption text-grey">Total Price</div>
                  <div class="text-body-1 font-weight-bold text-primary">INR {{ finalPrice }}</div>
                </v-col>
                <v-col cols="6">
                  <div class="text-caption text-grey">Payment Mode</div>
                  <div class="text-body-1 font-weight-bold text-capitalize">{{ paymentMode }}</div>
                </v-col>
                <v-col cols="12" v-if="paymentMode === 'offline'">
                  <div class="text-caption text-grey">Initial Payment</div>
                  <div class="text-body-1 font-weight-bold text-success">INR {{ amountPaid }} ({{ offlineType }})</div>
                </v-col>
              </v-row>
            </v-card>
            
            <v-alert type="warning" variant="tonal" class="mt-6" density="compact">
              Submitting will create a user account for the student and send them their login credentials via email.
            </v-alert>

            <v-alert v-if="paymentMode === 'online'" type="info" variant="tonal" class="mt-4" density="compact">
              A pending invoice of <strong>INR {{ finalPrice }}</strong> will be created. The student can log in to their dashboard and pay online.
            </v-alert>

            <v-alert v-if="errorMsg" type="error" variant="tonal" class="mt-4" density="compact" closable @click:close="errorMsg = ''">
              {{ errorMsg }}
            </v-alert>
          </div>
        </template>
      </v-stepper>
      </v-card-text>

      <v-divider></v-divider>
      
      <v-card-actions class="pa-6" v-if="!isConverted">
        <v-btn v-if="step > 1" variant="text" @click="step--" :disabled="submitting">Back</v-btn>
        <v-spacer></v-spacer>
        <v-btn
          v-if="step < 4"
          color="primary"
          @click="step++"
          :disabled="isNextDisabled"
          elevation="0"
          rounded="lg"
        >Next</v-btn>
        <v-btn
          v-else
          color="success"
          @click="submit"
          :loading="submitting"
          elevation="0"
          
         class="px-6" variant="flat" rounded="lg">Confirm & Convert</v-btn>
      </v-card-actions>
      <v-card-actions class="pa-6" v-else>
        <v-spacer></v-spacer>
        <v-btn color="grey-darken-1" variant="outlined" class="px-6 rounded-lg" @click="close">Done</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue';
import { useApi } from '@/composables/useApi';

const props = defineProps({
  modelValue: Boolean,
  lead: { type: Object, required: true }
});

const emit = defineEmits(['update:modelValue', 'success']);

const api = useApi();
const step = ref(1);
const loadingCourses = ref(false);
const submitting = ref(false);
const courses = ref([]);
const errorMsg = ref('');

const selectedCourseIds = ref([]);
const selectedCourses = ref([]);
const customPrice = ref(0);
const defaultBundlePrice = ref(0);
const discountAmount = ref(0);
const paymentMode = ref('online');
const offlineStatus = ref('full');
const amountPaid = ref(0);
const offlineType = ref('cash');
const paymentReference = ref('');

// Success credentials tracking
const isConverted = ref(false);
const convertedCredentials = ref(null);
const sendingEmail = ref(false);

const fetchCourses = async () => {
  loadingCourses.value = true;
  try {
    const { data } = await api.get('/public/courses');
    courses.value = data.courses.filter(c => c.status === 'published');
  } finally {
    loadingCourses.value = false;
  }
};

const onCourseSelect = (ids) => {
  selectedCourses.value = courses.value.filter(c => ids.includes(c.id));
  const totalPrice = selectedCourses.value.reduce((sum, c) => sum + (parseFloat(c.price) || 0), 0);
  defaultBundlePrice.value = totalPrice;
  discountAmount.value = 0;
  if (selectedCourses.value.length > 0) {
    customPrice.value = totalPrice;
    amountPaid.value = totalPrice;
  }
};

const hasCustomPricedCourse = computed(() => {
  return selectedCourses.value.some(c => c.price_type !== 'fixed');
});

const finalPrice = computed(() => {
  if (selectedCourses.value.length === 0) return 0;
  const base = !hasCustomPricedCourse.value ? defaultBundlePrice.value : customPrice.value;
  return Math.max(0, base - (parseFloat(discountAmount.value) || 0));
});

watch(offlineStatus, (val) => {
  if (val === 'full') {
    amountPaid.value = finalPrice.value;
  }
});

watch(finalPrice, (newVal) => {
  if (offlineStatus.value === 'full') {
    amountPaid.value = newVal;
  }
});

watch(step, () => {
  errorMsg.value = '';
});

watch(() => props.modelValue, (isOpen) => {
  if (isOpen && props.lead?.course_interest_ids) {
    let ids = props.lead.course_interest_ids;
    if (typeof ids === 'string') {
      try {
        ids = JSON.parse(ids);
      } catch (e) {
        ids = [];
      }
    }
    if (Array.isArray(ids) && ids.length > 0) {
      selectedCourseIds.value = [...ids];
      onCourseSelect(selectedCourseIds.value);
    } else {
      selectedCourseIds.value = [];
    }
  }
});

const isNextDisabled = computed(() => {
  if (step.value === 1) return selectedCourseIds.value.length === 0;
  if (step.value === 2) return finalPrice.value <= 0 && selectedCourses.value.length > 0;
  if (step.value === 3) {
    if (paymentMode.value === 'offline') {
      return !(amountPaid.value >= 0 && !!offlineType.value);
    }
    return false;
  }
  return false;
});

const close = () => {
  emit('update:modelValue', false);
  step.value = 1;
  errorMsg.value = '';
  isConverted.value = false;
  convertedCredentials.value = null;
};

const submit = async () => {
  submitting.value = true;
  errorMsg.value = '';
  try {
    const payload = {
      courseIds: selectedCourseIds.value,
      pricing: {
        amount: finalPrice.value
      },
      payment: {
        mode: paymentMode.value,
        amountPaid: paymentMode.value === 'online' ? 0 : parseFloat(amountPaid.value),
        offlineType: paymentMode.value === 'offline' ? offlineType.value : null,
        reference: paymentReference.value
      }
    };

    const result = await api.post(`/crm/leads/${props.lead.id}/convert`, payload);
    convertedCredentials.value = result.data;
    isConverted.value = true;
    emit('success', result.data);
  } catch (error) {
    console.error('Conversion failed:', error);
    const backendMsg = error.response?.data?.message || error.data?.message;
    if (backendMsg === 'ALREADY_ENROLLED') {
      errorMsg.value = 'This student is already enrolled in the selected course.';
    } else {
      errorMsg.value = backendMsg || 'Failed to convert lead. Please try again.';
    }
  } finally {
    submitting.value = false;
  }
};

const copyTempPassword = () => {
  if (!convertedCredentials.value) return;
  navigator.clipboard.writeText(convertedCredentials.value.tempPassword);
  alert('Temporary password copied to clipboard!');
};

const copyCredentials = () => {
  if (!convertedCredentials.value) return;
  const text = `Welcome to the platform.\n\nYour login credentials:\nUsername: ${convertedCredentials.value.email}\nPassword: ${convertedCredentials.value.tempPassword}\nLogin URL: ${window.location.origin}/login\n\nPlease change your password after first login.`;
  navigator.clipboard.writeText(text);
  alert('Credentials copied to clipboard!');
};

const sendWelcomeEmail = async () => {
  if (!convertedCredentials.value) return;
  sendingEmail.value = true;
  try {
    await api.post(`/students/${convertedCredentials.value.studentId}/send-welcome`, {
      tempPassword: convertedCredentials.value.tempPassword
    });
    alert('Welcome email sent successfully!');
  } catch (error) {
    console.error('Failed to send welcome email:', error);
    alert('Failed to send welcome email. Please try again.');
  } finally {
    sendingEmail.value = false;
  }
};

const sendWhatsApp = () => {
  if (!convertedCredentials.value) return;
  const loginLink = `${window.location.origin}/login`;
  const message = `Welcome to the LMS.\n\nUsername: ${convertedCredentials.value.email}\nPassword: ${convertedCredentials.value.tempPassword}\n\nLogin Link: ${loginLink}`;
  const phone = props.lead.phone.replace(/\D/g, '');
  window.open(`https://api.whatsapp.com/send?phone=${phone}&text=${encodeURIComponent(message)}`, '_blank');
};

const viewProfile = () => {
  if (!convertedCredentials.value) return;
  navigateTo(`/dashboard/students/${convertedCredentials.value.studentId}`);
  close();
};

onMounted(fetchCourses);
</script>
