import { index, integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  displayName: text("display_name").notNull(),
  timezone: text("timezone").notNull(),
  ageAttested: integer("age_attested").notNull(),
  homeRegion: text("home_region").notNull().default(""),
  kind: text("kind").notNull(),
  createdAt: text("created_at").notNull(),
});

export const userInterests = sqliteTable(
  "user_interests",
  {
    userId: text("user_id")
      .notNull()
      .references(() => users.id),
    interest: text("interest").notNull(),
  },
  (table) => [uniqueIndex("user_interests_pk").on(table.userId, table.interest)],
);

export const friendInvites = sqliteTable("friend_invites", {
  id: text("id").primaryKey(),
  inviterId: text("inviter_id")
    .notNull()
    .references(() => users.id),
  tokenHash: text("token_hash").notNull().unique(),
  createdAt: text("created_at").notNull(),
  expiresAt: text("expires_at").notNull(),
});

export const friendEdges = sqliteTable(
  "friend_edges",
  {
    id: text("id").primaryKey(),
    userLow: text("user_low")
      .notNull()
      .references(() => users.id),
    userHigh: text("user_high")
      .notNull()
      .references(() => users.id),
    requesterId: text("requester_id")
      .notNull()
      .references(() => users.id),
    status: text("status").notNull(),
    createdAt: text("created_at").notNull(),
    updatedAt: text("updated_at").notNull(),
  },
  (table) => [
    uniqueIndex("friend_edges_pair_idx").on(table.userLow, table.userHigh),
    index("friend_edges_low_idx").on(table.userLow, table.status),
    index("friend_edges_high_idx").on(table.userHigh, table.status),
  ],
);

export const activities = sqliteTable(
  "activities",
  {
    id: text("id").primaryKey(),
    hostId: text("host_id")
      .notNull()
      .references(() => users.id),
    title: text("title").notNull(),
    category: text("category").notNull(),
    startsAt: text("starts_at").notNull(),
    capacity: integer("capacity").notNull(),
    visibility: text("visibility").notNull(),
    areaLabel: text("area_label").notNull(),
    exactLocation: text("exact_location"),
    status: text("status").notNull(),
    demo: integer("demo").notNull().default(0),
    sourceActivityId: text("source_activity_id"),
    idempotencyKey: text("idempotency_key"),
    goingCount: integer("going_count").notNull().default(0),
    createdAt: text("created_at").notNull(),
    updatedAt: text("updated_at").notNull(),
  },
  (table) => [
    index("activities_host_idx").on(table.hostId, table.startsAt),
    uniqueIndex("activities_idem_idx").on(table.hostId, table.idempotencyKey),
  ],
);

export const rsvps = sqliteTable(
  "rsvps",
  {
    id: text("id").primaryKey(),
    activityId: text("activity_id")
      .notNull()
      .references(() => activities.id),
    userId: text("user_id")
      .notNull()
      .references(() => users.id),
    status: text("status").notNull(),
    createdAt: text("created_at").notNull(),
    updatedAt: text("updated_at").notNull(),
  },
  (table) => [
    uniqueIndex("rsvps_once_idx").on(table.activityId, table.userId),
    index("rsvps_activity_idx").on(table.activityId, table.status),
    index("rsvps_user_idx").on(table.userId, table.status),
  ],
);

export const activityMessages = sqliteTable(
  "activity_messages",
  {
    id: text("id").primaryKey(),
    activityId: text("activity_id")
      .notNull()
      .references(() => activities.id),
    userId: text("user_id")
      .notNull()
      .references(() => users.id),
    body: text("body").notNull(),
    kind: text("kind").notNull(),
    createdAt: text("created_at").notNull(),
  },
  (table) => [index("activity_messages_idx").on(table.activityId, table.createdAt)],
);

export const notifications = sqliteTable(
  "notifications",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id),
    activityId: text("activity_id"),
    kind: text("kind").notNull(),
    body: text("body").notNull(),
    createdAt: text("created_at").notNull(),
    readAt: text("read_at"),
  },
  (table) => [index("notifications_user_idx").on(table.userId, table.createdAt)],
);

export const blocks = sqliteTable(
  "blocks",
  {
    id: text("id").primaryKey(),
    blockerId: text("blocker_id")
      .notNull()
      .references(() => users.id),
    blockedId: text("blocked_id")
      .notNull()
      .references(() => users.id),
    createdAt: text("created_at").notNull(),
  },
  (table) => [uniqueIndex("blocks_pair_idx").on(table.blockerId, table.blockedId)],
);

export const reports = sqliteTable(
  "reports",
  {
    id: text("id").primaryKey(),
    reporterId: text("reporter_id")
      .notNull()
      .references(() => users.id),
    subjectType: text("subject_type").notNull(),
    subjectId: text("subject_id").notNull(),
    reason: text("reason").notNull(),
    createdAt: text("created_at").notNull(),
  },
  (table) => [index("reports_reporter_idx").on(table.reporterId, table.createdAt)],
);

export const sessions = sqliteTable(
  "sessions",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id),
    tokenHash: text("token_hash").notNull().unique(),
    createdAt: text("created_at").notNull(),
    expiresAt: text("expires_at").notNull(),
  },
  (table) => [index("sessions_user_idx").on(table.userId)],
);

export const securityEvents = sqliteTable(
  "security_events",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").references(() => users.id),
    kind: text("kind").notNull(),
    metadataJson: text("metadata_json").notNull(),
    createdAt: text("created_at").notNull(),
  },
  (table) => [index("security_events_user_idx").on(table.userId, table.createdAt)],
);

export const rateBuckets = sqliteTable("rate_buckets", {
  bucketKey: text("bucket_key").primaryKey(),
  windowStart: text("window_start").notNull(),
  count: integer("count").notNull(),
});
