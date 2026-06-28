import Badge from '@/components/ui/Badge.vue';
import AppButton from '@/components/ui/AppButton.vue';
import KpiCard from '@/components/ui/KpiCard.vue';
import AppTable from '@/components/ui/AppTable.vue';
import AppInput from '@/components/ui/AppInput.vue';
import AppModal from '@/components/ui/AppModal.vue';
import TabsPill from '@/components/ui/TabsPill.vue';
import TabsLine from '@/components/ui/TabsLine.vue';
import SegmentControl from '@/components/ui/SegmentControl.vue';
import ProgressBar from '@/components/ui/ProgressBar.vue';

export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.vueApp.component('Badge', Badge);
  nuxtApp.vueApp.component('AppButton', AppButton);
  nuxtApp.vueApp.component('KpiCard', KpiCard);
  nuxtApp.vueApp.component('AppTable', AppTable);
  nuxtApp.vueApp.component('AppInput', AppInput);
  nuxtApp.vueApp.component('AppModal', AppModal);
  nuxtApp.vueApp.component('TabsPill', TabsPill);
  nuxtApp.vueApp.component('TabsLine', TabsLine);
  nuxtApp.vueApp.component('SegmentControl', SegmentControl);
  nuxtApp.vueApp.component('ProgressBar', ProgressBar);
});
