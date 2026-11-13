CREATE TABLE IF NOT EXISTS pmf_feedback (
  id TEXT PRIMARY KEY,
  selected_capabilities TEXT NOT NULL,
  other_detail TEXT,
  name TEXT,
  email TEXT,
  company_name TEXT,
  mobile TEXT,
  submitted_at TEXT NOT NULL,
  email_notification_status TEXT NOT NULL DEFAULT 'pending',
  email_notification_error TEXT
);

CREATE TABLE IF NOT EXISTS visitor_thoughts (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL,
  thoughts TEXT NOT NULL,
  submitted_at TEXT NOT NULL,
  email_notification_status TEXT NOT NULL DEFAULT 'pending',
  email_notification_error TEXT
);
