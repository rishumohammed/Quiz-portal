<template>
  <div class="d-flex align-center justify-center h-screen">
    <v-progress-circular indeterminate color="primary"></v-progress-circular>
  </div>
</template>

<script setup>
const route = useRoute();
const router = useRouter();
const api = useApi();
const { courseSlug } = route.params;

onMounted(async () => {
  try {
    const res = await api.get('/lms/student/dashboard');
    const dashboardData = res.data || res;
    const enrollments = dashboardData.enrollments || [];
    const enrollment = enrollments.find(e => e.slug === courseSlug);
    
    if (!enrollment) return router.push('/dashboard/student');

    const resCurr = await api.get(`/lms/student/courses/${enrollment.course_id}/curriculum`);
    const curriculum = resCurr.data || resCurr || [];
    const allLessons = curriculum.flatMap(c => (c.modules || []).flatMap(m => m.lessons || []));
    
    // Find first incomplete lesson or just first lesson
    const nextLesson = allLessons.find(l => !l.completed) || allLessons[0];
    
    if (nextLesson) {
      router.push(`/learn/${courseSlug}/${nextLesson.id}`);
    } else {
      router.push('/dashboard/student');
    }
  } catch (error) {
    console.error('Redirect failed:', error);
    router.push('/dashboard/student');
  }
});

definePageMeta({
  layout: false,
  middleware: ['auth', 'role', 'enrollment'],
  role: ['student']
});
</script>
