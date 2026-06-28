<template>
  <v-dialog v-model="isOpen" max-width="600px" persistent>
    <v-card class="rounded-xl">
      <v-toolbar color="primary" flat>
        <v-toolbar-title class="text-h6 font-weight-bold text-white">
          Manual Enrollment
        </v-toolbar-title>
        <v-spacer></v-spacer>
        <v-btn icon="mdi-close" color="white" variant="text" @click="close"></v-btn>
      </v-toolbar>

      <v-card-text class="pa-6">
        <v-form ref="form" v-model="isValid">
          <!-- Student Search -->
          <v-autocomplete
            v-model="selectedStudentId"
            :items="students"
            item-title="name"
            item-value="id"
            label="Search Student"
            placeholder="Type name or email..."
            variant="outlined"
            prepend-inner-icon="mdi-account-search"
            :loading="loadingStudents"
            class="mb-4"
            required
            :rules="[v => !!v || 'Student is required']"
          >
            <template v-slot:item="{ props, item }">
              <v-list-item v-bind="props" :subtitle="item.raw.email"></v-list-item>
            </template>
          </v-autocomplete>

          <!-- Course Select -->
          <v-autocomplete
            v-model="selectedCourseIds"
            :items="availableCourses"
            item-title="title"
            item-value="id"
            label="Search and Select Courses"
            variant="outlined"
            prepend-inner-icon="mdi-book-open-variant"
            :loading="loadingCourses || loadingStudentCourses"
            class="mb-4"
            required
            multiple
            chips
            closable-chips
            :rules="[v => v.length > 0 || 'At least one course is required']"
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

          <!-- Pricing -->
          <v-row>
            <v-col cols="12" md="6">
              <v-text-field
                v-model="price"
                label="Base Price"
                variant="outlined"
                prefix="INR"
                type="number"
                class="mb-4"
                hint="Base price for selected courses"
                persistent-hint
              ></v-text-field>
            </v-col>
            <v-col cols="12" md="6">
              <v-text-field
                v-model="discountAmount"
                label="Discount Amount"
                variant="outlined"
                prefix="INR"
                type="number"
                class="mb-4"
                hint="Optional discount"
                min="0"
              ></v-text-field>
            </v-col>
          </v-row>

          <div v-if="discountAmount > 0" class="text-h6 text-success mb-4 text-right">
            Final Price: INR {{ finalPrice }}
          </div>

          <v-divider class="my-6"></v-divider>

          <!-- Payment Details -->
          <h3 class="text-subtitle-1 font-weight-bold mb-4">Payment Recording</h3>
          <v-row dense>
            <v-col cols="12" md="6">
              <v-select
                v-model="paymentMode"
                :items="paymentModes"
                label="Payment Mode"
                variant="outlined"
                required
              ></v-select>
            </v-col>
            <v-col cols="12" md="6">
              <v-btn-toggle v-model="offlineStatus" mandatory color="primary" class="w-100 d-flex" variant="outlined" style="height: 56px;">
                <v-btn value="full" class="flex-grow-1">Fully Paid</v-btn>
                <v-btn value="partial" class="flex-grow-1">Partial Payment</v-btn>
              </v-btn-toggle>
            </v-col>
            <v-col cols="12" md="6">
              <v-text-field
                v-model="amountPaid"
                label="Amount Paid"
                variant="outlined"
                type="number"
                prefix="INR"
                required
                :disabled="offlineStatus === 'full'"
              ></v-text-field>
            </v-col>
            <v-col cols="12">
              <v-text-field
                v-model="reference"
                label="Payment Reference"
                placeholder="Transaction ID, Receipt No, etc."
                variant="outlined"
              ></v-text-field>
            </v-col>
            <v-col cols="12">
              <v-textarea
                v-model="notes"
                label="Internal Notes (Optional)"
                variant="outlined"
                rows="2"
              ></v-textarea>
            </v-col>
          </v-row>
        </v-form>
      </v-card-text>

      <v-divider></v-divider>
      <v-card-actions class="pa-6">
        <v-btn  @click="close" variant="text">Cancel</v-btn>
        <v-spacer></v-spacer>
        <v-btn
          color="primary"
          @click="submit"
          :loading="submitting"
          :disabled="!isValid"
          elevation="0"
          rounded="lg"
          size="large"
        >Enroll Student</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
const props = defineProps({
  modelValue: Boolean,
  initialStudentId: String,
  initialCourseId: String
});

const emit = defineEmits(['update:modelValue', 'success']);

const isOpen = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
});

const api = useApi();
const isValid = ref(false);
const submitting = ref(false);
const loadingStudents = ref(false);
const loadingCourses = ref(false);

const students = ref([]);
const courses = ref([]);
const selectedStudentId = ref(props.initialStudentId);
const selectedCourseIds = ref(props.initialCourseId ? [props.initialCourseId] : []);
const selectedCourses = ref([]);

const studentEnrolledCourseIds = ref([]);
const loadingStudentCourses = ref(false);

const availableCourses = computed(() => {
  return courses.value.filter(c => !studentEnrolledCourseIds.value.includes(c.id));
});

const price = ref(0);
const discountAmount = ref(0);
const paymentMode = ref('cash');
const offlineStatus = ref('full');
const amountPaid = ref(0);
const reference = ref('');
const notes = ref('');

const finalPrice = computed(() => {
  return Math.max(0, (parseFloat(price.value) || 0) - (parseFloat(discountAmount.value) || 0));
});

watch(offlineStatus, (val) => {
  if (val === 'full') {
    amountPaid.value = finalPrice.value;
  }
});

watch(finalPrice, (newVal, oldVal) => {
  if (offlineStatus.value === 'full' || parseFloat(amountPaid.value) === oldVal || isNaN(oldVal) || amountPaid.value === 0) {
    amountPaid.value = newVal;
  }
});

const paymentModes = [
  { title: 'Offline Cash', value: 'cash' },
  { title: 'Offline Bank Transfer', value: 'bank_transfer' },
  { title: 'Offline Cheque', value: 'cheque' },
  { title: 'Online (Already Paid)', value: 'online' }
];

const fetchData = async () => {
  loadingStudents.value = true;
  loadingCourses.value = true;
  try {
    const [studentsResponse, coursesResponse] = await Promise.all([
      api.get('/admin/users?role=student'),
      api.get('/public/courses')
    ]);
    students.value = studentsResponse.data || [];
    courses.value = (coursesResponse.data?.courses || []).filter(c => c.status === 'published');
    
    if (selectedCourseIds.value.length > 0) {
      onCourseSelect(selectedCourseIds.value);
    }
  } catch (error) {
    console.error('Failed to fetch data for manual enrollment:', error);
  } finally {
    loadingStudents.value = false;
    loadingCourses.value = false;
  }
};

const onCourseSelect = (ids) => {
  selectedCourses.value = courses.value.filter(c => ids.includes(c.id));
  const totalPrice = selectedCourses.value.reduce((sum, c) => sum + (parseFloat(c.price) || 0), 0);
  price.value = totalPrice;
  discountAmount.value = 0;
  amountPaid.value = totalPrice;
};

const close = () => {
  emit('update:modelValue', false);
};

const submit = async () => {
  submitting.value = true;
  try {
    const payload = {
      student_id: selectedStudentId.value,
      course_ids: selectedCourseIds.value,
      price: parseFloat(finalPrice.value),
      payment_mode: paymentMode.value,
      amount_paid: parseFloat(amountPaid.value),
      reference: reference.value,
      notes: notes.value
    };

    const result = await api.post('/enrollments/manual', payload);
    emit('success', result);
    close();
  } catch (error) {
    console.error('Manual enrollment failed:', error);
  } finally {
    submitting.value = false;
  }
};

watch(() => props.initialStudentId, (newId) => {
  selectedStudentId.value = newId;
});

watch(selectedStudentId, async (newId) => {
  if (newId) {
    loadingStudentCourses.value = true;
    try {
      const { data } = await api.get(`/admin/students/${newId}/courses`);
      studentEnrolledCourseIds.value = data.map(c => c.id);
      
      // Remove any selected courses that the student is already enrolled in
      selectedCourseIds.value = selectedCourseIds.value.filter(id => !studentEnrolledCourseIds.value.includes(id));
      if (selectedCourseIds.value.length !== selectedCourses.value.length) {
        onCourseSelect(selectedCourseIds.value);
      }
    } catch (e) {
      console.error(e);
      studentEnrolledCourseIds.value = [];
    } finally {
      loadingStudentCourses.value = false;
    }
  } else {
    studentEnrolledCourseIds.value = [];
  }
}, { immediate: true });

watch(() => props.initialCourseId, (newId) => {
  selectedCourseIds.value = newId ? [newId] : [];
  if (newId) onCourseSelect([newId]);
});

onMounted(fetchData);
</script>
