export const USER_ROLES = {
  SUPER_ADMIN: 'super_admin',
  SUB_ADMIN: 'sub_admin',
  LMS_USER: 'lms_user',
  PLACEMENT_COORDINATOR: 'placement_coordinator',
  FINANCE_STAFF: 'finance_staff',
  CRM_AGENT: 'crm_agent',
  TUTOR: 'tutor',
  STUDENT: 'student',
  EMPLOYER: 'employer',
  VISITOR: 'visitor'
};

export const LEAD_SOURCES = {
  WEBSITE: 'website',
  WHATSAPP: 'whatsapp',
  MANUAL: 'manual'
};

export const LEAD_STATUS = {
  OPEN: 'open',
  CALLED: 'called',
  INTERESTED: 'interested',
  NOT_INTERESTED: 'not_interested',
  REJECTED: 'rejected',
  CONVERTED: 'converted'
};

export const COURSE_STATUS = {
  DRAFT: 'draft',
  PENDING_REVIEW: 'pending_review',
  PUBLISHED: 'published',
  REJECTED: 'rejected',
  ARCHIVED: 'archived'
};

export const ENROLLMENT_STATUS = {
  ACTIVE: 'active',
  COMPLETED: 'completed',
  SUSPENDED: 'suspended'
};

export const JOB_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected'
};

export const EXPENSE_CATEGORIES = {
  OPERATIONS: 'operations',
  MARKETING: 'marketing',
  INFRASTRUCTURE: 'infrastructure',
  SALARIES: 'salaries',
  TUTOR_PAYOUTS: 'tutor_payouts',
  MISCELLANEOUS: 'miscellaneous'
};

export const EXPENSE_TYPES = {
  DEBIT: 'debit',
  CREDIT: 'credit'
};

export const PAYMENT_MODES = {
  ONLINE: 'online',
  OFFLINE: 'offline',
  BANK_TRANSFER: 'bank_transfer',
  CASH: 'cash',
  CARD: 'card',
  CHEQUE: 'cheque'
};

export const PAYMENT_STATUS = {
  PAID: 'paid',
  PARTIAL: 'partial',
  PENDING: 'pending'
};

export const JOB_APPLICATION_STATUS = {
  APPLIED: 'applied',
  VIEWED: 'viewed',
  SHORTLISTED: 'shortlisted',
  REJECTED: 'rejected'
};

export const CONTACT_STATUS = {
  NEW: 'new',
  READ: 'read',
  REPLIED: 'replied'
};

export const STUDENT_EMPLOYMENT_STATUS = {
  EMPLOYED: 'employed',
  UNEMPLOYED: 'unemployed',
  FREELANCER: 'freelancer',
  FRESHER: 'fresher'
};
