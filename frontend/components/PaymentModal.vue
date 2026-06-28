<template>
  <!-- This is a headless component that manages the Razorpay flow -->
  <span></span>
</template>

<script setup>
const props = defineProps({
  order: { type: Object, required: true },
  student: { type: Object, required: true },
  courseId: { type: String, required: true }
});

const emit = defineEmits(['success', 'error', 'close']);

const config = useRuntimeConfig();

const loadRazorpay = () => {
  return new Promise((resolve) => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

const openCheckout = async () => {
  const loaded = await loadRazorpay();
  if (!loaded) {
    emit('error', 'Failed to load payment gateway');
    return;
  }

  const options = {
    key: props.order.key_id || config.public.razorpayKeyId || 'rzp_test_placeholder', // Should be in public config
    amount: props.order.amount,
    currency: props.order.currency,
    name: 'AEMS Academy',
    description: `Enrollment in ${props.order.course_title}`,
    order_id: props.order.order_id,
    handler: function (response) {
      // response: { razorpay_payment_id, razorpay_order_id, razorpay_signature }
      emit('success', response);
    },
    prefill: {
      name: props.student.name,
      email: props.student.email,
      contact: props.student.phone
    },
    theme: {
      color: '#1a73e8'
    },
    modal: {
      ondismiss: function() {
        emit('close');
      }
    }
  };

  const rzp = new window.Razorpay(options);
  rzp.open();
};

defineExpose({ openCheckout });
</script>
