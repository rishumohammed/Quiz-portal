<template>
  <div class="feature-stats-section">
    <!-- Blue Strip -->
    <div class="blue-strip py-6 text-white" style="background-color: var(--primary, #211d71);">
      <v-container>
        <v-row justify="center" align="center" class="text-center text-md-left">
          <!-- Item 1 -->
          <v-col cols="12" md="4" class="d-flex align-center justify-center justify-md-start mb-4 mb-md-0">
            <v-icon size="48" class="mr-4">mdi-bullseye</v-icon>
            <div>
              <div class="text-h6 font-weight-bold mb-1" style="line-height: 1.2;">Online courses</div>
              <div class="text-body-2" style="opacity: 0.9;">Explore a variety of fresh topics</div>
            </div>
          </v-col>
          
          <!-- Item 2 -->
          <v-col cols="12" md="4" class="d-flex align-center justify-center justify-md-start mb-4 mb-md-0">
            <v-icon size="48" class="mr-4">mdi-check-bold</v-icon>
            <div>
              <div class="text-h6 font-weight-bold mb-1" style="line-height: 1.2;">Expert instruction</div>
              <div class="text-body-2" style="opacity: 0.9;">Find the right course for you</div>
            </div>
          </v-col>
          
          <!-- Item 3 -->
          <v-col cols="12" md="4" class="d-flex align-center justify-center justify-md-start">
            <v-icon size="48" class="mr-4">mdi-infinity</v-icon>
            <div>
              <div class="text-h6 font-weight-bold mb-1" style="line-height: 1.2;">Lifetime access</div>
              <div class="text-body-2" style="opacity: 0.9;">Learn on your schedule</div>
            </div>
          </v-col>
        </v-row>
      </v-container>
    </div>

  </div>
</template>

<style scoped>
.tracking-wide {
  letter-spacing: 0.5px;
}
.stat-col {
  position: relative;
}
@media (min-width: 960px) {
  .stat-col:not(:last-child)::after {
    content: '';
    position: absolute;
    right: 0;
    top: 20%;
    height: 60%;
    width: 1px;
    background-color: rgba(0,0,0,0.08);
  }
}
</style>
