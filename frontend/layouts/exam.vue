<template>
  <v-app class="exam-layout">
    <slot />
  </v-app>
</template>

<style scoped>
.exam-layout {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: #0a0a1a;
  color: #e8eaf6;
  font-family: 'Inter', sans-serif;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  z-index: 2000;
}
</style>
