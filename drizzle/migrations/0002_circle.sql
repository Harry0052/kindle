ALTER TABLE users ADD COLUMN home_region TEXT NOT NULL DEFAULT '';

CREATE TABLE user_interests (
  user_id TEXT NOT NULL REFERENCES users(id),
  interest TEXT NOT NULL,
  PRIMARY KEY (user_id, interest)
);

CREATE TABLE friend_invites (
  id TEXT PRIMARY KEY,
  inviter_id TEXT NOT NULL REFERENCES users(id),
  token_hash TEXT NOT NULL UNIQUE,
  created_at TEXT NOT NULL,
  expires_at TEXT NOT NULL
);

CREATE TABLE friend_edges (
  id TEXT PRIMARY KEY,
  user_low TEXT NOT NULL REFERENCES users(id),
  user_high TEXT NOT NULL REFERENCES users(id),
  requester_id TEXT NOT NULL REFERENCES users(id),
  status TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE UNIQUE INDEX friend_edges_pair_idx ON friend_edges(user_low, user_high);
CREATE INDEX friend_edges_low_idx ON friend_edges(user_low, status);
CREATE INDEX friend_edges_high_idx ON friend_edges(user_high, status);

CREATE TABLE activities (
  id TEXT PRIMARY KEY,
  host_id TEXT NOT NULL REFERENCES users(id),
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  starts_at TEXT NOT NULL,
  capacity INTEGER NOT NULL,
  visibility TEXT NOT NULL,
  area_label TEXT NOT NULL,
  exact_location TEXT,
  status TEXT NOT NULL,
  demo INTEGER NOT NULL DEFAULT 0,
  idempotency_key TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX activities_host_idx ON activities(host_id, starts_at);
CREATE UNIQUE INDEX activities_idem_idx ON activities(host_id, idempotency_key);
