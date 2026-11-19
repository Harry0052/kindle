ALTER TABLE activities ADD COLUMN going_count INTEGER NOT NULL DEFAULT 0;

CREATE TABLE rsvps (
  id TEXT PRIMARY KEY,
  activity_id TEXT NOT NULL REFERENCES activities(id),
  user_id TEXT NOT NULL REFERENCES users(id),
  status TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE UNIQUE INDEX rsvps_once_idx ON rsvps(activity_id, user_id);
CREATE INDEX rsvps_activity_idx ON rsvps(activity_id, status);
CREATE INDEX rsvps_user_idx ON rsvps(user_id, status);
