<template>
  <div>
    <h2 class="text-h6 font-weight-bold mb-2">Talent Hunt Registration Dropdowns</h2>
    <p class="text-body-2 text-secondary mb-8">Manage the dynamic dropdown options displayed in the public registration form.</p>

    <v-card variant="outlined" class="rounded-xl pa-6 mb-6">
      <h3 class="text-subtitle-1 font-weight-bold mb-4">Participant Categories</h3>
      <v-combobox
        v-model="form.talent_hunt_categories"
        label="Categories"
        chips
        multiple
        clearable
        variant="outlined"
        hint="Type a category and press Enter to add it."
        persistent-hint
        class="mb-4"
      ></v-combobox>
      
      <v-divider class="my-6"></v-divider>

      <h3 class="text-subtitle-1 font-weight-bold mb-4">Level 1: Higher Secondary</h3>
      <v-combobox
        v-model="form.talent_hunt_levels_1"
        label="Levels of Study"
        chips
        multiple
        clearable
        variant="outlined"
        hint="Type a level of study and press Enter to add it."
        persistent-hint
        class="mb-4"
      ></v-combobox>

      <v-divider class="my-6"></v-divider>

      <h3 class="text-subtitle-1 font-weight-bold mb-4">Level 2: Degree Level</h3>
      <v-combobox
        v-model="form.talent_hunt_degrees"
        label="Degree Years"
        chips
        multiple
        clearable
        variant="outlined"
        hint="Type a degree year and press Enter to add it."
        persistent-hint
        class="mb-4"
      ></v-combobox>

      <v-divider class="my-6"></v-divider>

      <h3 class="text-subtitle-1 font-weight-bold mb-4">Level 3: Masters / PhD</h3>
      <v-combobox
        v-model="form.talent_hunt_levels_3"
        label="Levels of Study (Masters / PhD)"
        chips
        multiple
        clearable
        variant="outlined"
        hint="Type a level of study and press Enter to add it."
        persistent-hint
        class="mb-4"
      ></v-combobox>

      <v-divider class="my-6"></v-divider>

      <h3 class="text-subtitle-1 font-weight-bold mb-4">Global Courses / Streams</h3>
      <v-combobox
        v-model="form.talent_hunt_courses"
        label="Courses"
        chips
        multiple
        clearable
        variant="outlined"
        hint="Type a course and press Enter to add it."
        persistent-hint
        class="mb-4"
      ></v-combobox>
      

    </v-card>
  </div>
</template>

<script setup lang="ts">
import { inject } from 'vue';

// Inject the reactive form object from the parent index.vue
const form = inject('configForm') as any;

// Initialize if undefined
if (!form.value.talent_hunt_categories) form.value.talent_hunt_categories = [];
if (!form.value.talent_hunt_levels_1) form.value.talent_hunt_levels_1 = [];
if (!form.value.talent_hunt_degrees) form.value.talent_hunt_degrees = [];
if (!form.value.talent_hunt_levels_3) form.value.talent_hunt_levels_3 = [];
if (!form.value.talent_hunt_courses) form.value.talent_hunt_courses = [];
if (!form.value.talent_hunt_competitive) form.value.talent_hunt_competitive = [];
</script>
