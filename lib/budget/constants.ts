export const TEMPLATE_BUCKET = "budget-template";
export const SUBMISSION_BUCKET = "budget-submission";

export const MAX_BUDGET_FILE_BYTES = 10 * 1024 * 1024;

/** Sinkron dengan allowed_mime_types di migration 20260810000009. */
export const ALLOWED_BUDGET_MIME = new Map([
  ["application/pdf", "pdf"],
  ["application/vnd.ms-excel", "xls"],
  ["application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "xlsx"],
  ["application/msword", "doc"],
  ["application/vnd.openxmlformats-officedocument.wordprocessingml.document", "docx"],
]);
