const fs = require('fs');
const files = [
  'd:/Apps/aems/frontend/components/ui/KpiCard.vue',
  'd:/Apps/aems/frontend/components/DynamicLeadForm.vue',
  'd:/Apps/aems/frontend/components/crm/LeadCard.vue',
  'd:/Apps/aems/frontend/pages/dashboard/student/my-courses.vue',
  'd:/Apps/aems/frontend/pages/about.vue',
  'd:/Apps/aems/frontend/pages/dashboard/sessions/index.vue',
  'd:/Apps/aems/frontend/pages/dashboard/placements/index.vue'
];

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let originalContent = content;
  content = content.replace(/(transition:.*?)box-shadow/g, '$1border-color');
  if (content !== originalContent) {
    fs.writeFileSync(file, content, 'utf8');
    console.log(`Fixed transition in: ${file}`);
  }
});
