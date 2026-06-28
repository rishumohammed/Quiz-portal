<template>
  <v-card flat border class="team-card pa-6 rounded-xl text-center h-100" v-motion-fade-visible>
    <v-avatar
      :style="`background: linear-gradient(135deg, ${member.avatar_gradient_start || '#007AFF'}, ${member.avatar_gradient_end || '#AF52DE'})`"
      size="100"
      class="mb-6 mx-auto"
    >
      <span class="text-h4 font-weight-black text-white">{{ member.avatar_initials || member.name[0] }}</span>
    </v-avatar>
    
    <h3 class="text-h6 font-weight-bold mb-1">{{ member.name }}</h3>
    <div class="text-caption text-primary font-weight-bold text-uppercase tracking-wider mb-4">
        {{ member.role_title }}
    </div>
    
    <p class="text-body-2 text-grey-darken-1 mb-6 line-clamp-3">
        {{ member.bio }}
    </p>
    
    <div class="d-flex justify-center flex-wrap gap-2">
        <v-chip size="x-small" variant="tonal" color="grey-darken-2" class="font-weight-bold">
            {{ member.qualification_badge }}
        </v-chip>
        <v-chip size="x-small" variant="tonal" color="grey-darken-2" class="font-weight-bold">
            {{ member.experience_years }}+ Years Exp
        </v-chip>
    </div>
  </v-card>
</template>

<script setup>
defineProps({
  member: {
    type: Object,
    required: true
  }
})
</script>

<style scoped>
.team-card {
  transition: all 0.3s ease;
}
.team-card:hover {
  border-color: var(--color-brand) !important;
  transform: translateY(-4px);
}
.tracking-wider { letter-spacing: 0.1em; }
.line-clamp-3 {
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.gap-2 { gap: 8px; }
</style>
