INSERT INTO system_config (`key`, `value`) VALUES
('talent_hunt_categories', '["Level 1 – Higher Secondary","Level 2 – Degree Level","Level 3 – Masters / PhD","Level 4 – Industry Level"]'),
('talent_hunt_levels_1', '["Higher Secondary 1st Year","Higher Secondary 2nd Year"]'),
('talent_hunt_degrees', '["Degree 1st Year","Degree 2nd Year","Degree 3rd Year","Degree 4th Year"]'),
('talent_hunt_levels_3', '["Masters 1st Year","Masters 2nd Year","PhD"]'),
('talent_hunt_courses', '["Food Technology","Biotechnology","Biochemistry","Microbiology","Chemistry","Fisheries Science","Dairy Science","Home Science","Nutrition and Related Programs"]')
ON DUPLICATE KEY UPDATE `value` = VALUES(`value`);
