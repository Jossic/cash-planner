CREATE TABLE IF NOT EXISTS months (
  year INTEGER NOT NULL,
  month INTEGER NOT NULL,
  closed_at TEXT NULL,
  PRIMARY KEY (year, month)
);
