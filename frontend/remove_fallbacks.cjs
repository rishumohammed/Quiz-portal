const fs = require('fs');
const files = [
  'pages/dashboard/tutor/index.vue',
  'pages/dashboard/tutor/courses/index.vue',
  'pages/dashboard/student/my-courses.vue',
  'pages/dashboard/student/index.vue',
  'pages/courses/[slug].vue',
  'components/CourseCard.vue',
  'components/lms/CourseListRow.vue',
  'components/lms/CourseGrid.vue'
];

files.forEach(file => {
  if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf-8');
    content = content.replace(/ : 'https:\/\/images\.unsplash\.com[^']*'/g, " : ''");
    content = content.replace(/ \|\| 'https:\/\/images\.unsplash\.com[^']*'/g, "");
    fs.writeFileSync(file, content, 'utf-8');
    console.log('Processed', file);
  } else {
    console.log('Missing', file);
  }
});
