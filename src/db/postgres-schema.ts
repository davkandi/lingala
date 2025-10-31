import { pgTable, integer, text, timestamp, boolean, decimal, varchar, uuid, bigint } from 'drizzle-orm/pg-core';
import { user } from './auth-postgres-schema';

// Note: Better-auth manages its own tables (user, session, account, verification)
// These are handled separately in auth-postgres-schema.ts

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  name: varchar('name', { length: 255 }),
  passwordHash: text('password_hash'),
  avatarUrl: text('avatar_url'),
  isAdmin: boolean('is_admin').default(false),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const courses = pgTable('courses', {
  id: integer('id').primaryKey().generatedByDefaultAsIdentity(),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  level: varchar('level', { length: 50 }),
  language: varchar('language', { length: 50 }),
  sourceLanguage: varchar('source_language', { length: 10 }).notNull().default('en'),
  thumbnailUrl: text('thumbnail_url'),
  price: decimal('price', { precision: 10, scale: 2 }),
  isPublished: boolean('is_published').default(false),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const modules = pgTable('modules', {
  id: integer('id').primaryKey().generatedByDefaultAsIdentity(),
  courseId: integer('course_id').references(() => courses.id, { onDelete: 'cascade' }),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  orderIndex: integer('order_index'),
  sourceLanguage: varchar('source_language', { length: 10 }).notNull().default('en'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const lessons = pgTable('lessons', {
  id: integer('id').primaryKey().generatedByDefaultAsIdentity(),
  moduleId: integer('module_id').references(() => modules.id, { onDelete: 'cascade' }),
  title: varchar('title', { length: 255 }).notNull(),
  content: text('content'),
  videoUrl: text('video_url'),
  orderIndex: integer('order_index'),
  durationMinutes: integer('duration_minutes'),
  freePreview: boolean('free_preview').default(false),
  sourceLanguage: varchar('source_language', { length: 10 }).notNull().default('en'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const lessonMaterials = pgTable('lesson_materials', {
  id: integer('id').primaryKey().generatedByDefaultAsIdentity(),
  lessonId: integer('lesson_id').references(() => lessons.id, { onDelete: 'cascade' }),
  title: varchar('title', { length: 255 }),
  type: varchar('type', { length: 50 }),
  url: text('url'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const userEnrollments = pgTable('user_enrollments', {
  id: integer('id').primaryKey().generatedByDefaultAsIdentity(),
  userId: uuid('user_id').references(() => user.id, { onDelete: 'cascade' }),
  courseId: integer('course_id').references(() => courses.id, { onDelete: 'cascade' }),
  enrolledAt: timestamp('enrolled_at').notNull().defaultNow(),
  completedAt: timestamp('completed_at'),
});

export const userProgress = pgTable('user_progress', {
  id: integer('id').primaryKey().generatedByDefaultAsIdentity(),
  userId: uuid('user_id').references(() => user.id, { onDelete: 'cascade' }),
  lessonId: integer('lesson_id').references(() => lessons.id, { onDelete: 'cascade' }),
  currentTime: integer('current_time').default(0), // current video position in seconds
  duration: integer('duration').default(0), // total video duration in seconds
  progressPercentage: integer('progress_percentage').default(0), // 0-100
  isCompleted: boolean('is_completed').default(false),
  watchTimeSeconds: integer('watch_time_seconds').default(0), // total time watched
  completedAt: timestamp('completed_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const quizzes = pgTable('quizzes', {
  id: integer('id').primaryKey().generatedByDefaultAsIdentity(),
  lessonId: integer('lesson_id').references(() => lessons.id, { onDelete: 'cascade' }),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  passingScore: integer('passing_score').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const quizQuestions = pgTable('quiz_questions', {
  id: integer('id').primaryKey().generatedByDefaultAsIdentity(),
  quizId: integer('quiz_id').references(() => quizzes.id, { onDelete: 'cascade' }),
  questionText: text('question_text').notNull(),
  questionType: varchar('question_type', { length: 50 }).notNull(),
  correctAnswer: text('correct_answer').notNull(),
  options: text('options'), // JSON string for multiple choice options
  orderIndex: integer('order_index'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// New tables for subscription and payment tracking
export const subscriptions = pgTable('subscriptions', {
  id: integer('id').primaryKey().generatedByDefaultAsIdentity(),
  userId: uuid('user_id').references(() => user.id, { onDelete: 'cascade' }),
  stripeCustomerId: text('stripe_customer_id'),
  stripeSubscriptionId: text('stripe_subscription_id'),
  stripePriceId: text('stripe_price_id'),
  status: varchar('status', { length: 50 }), // active, canceled, past_due, etc.
  planType: varchar('plan_type', { length: 50 }).default('monthly_premium'),
  currentPeriodStart: timestamp('current_period_start'),
  currentPeriodEnd: timestamp('current_period_end'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const payments = pgTable('payments', {
  id: integer('id').primaryKey().generatedByDefaultAsIdentity(),
  userId: uuid('user_id').references(() => user.id, { onDelete: 'cascade' }),
  stripePaymentIntentId: text('stripe_payment_intent_id'),
  stripeSessionId: text('stripe_session_id'),
  stripeSubscriptionId: text('stripe_subscription_id'),
  amount: decimal('amount', { precision: 10, scale: 2 }),
  currency: varchar('currency', { length: 3 }).default('USD'),
  status: varchar('status', { length: 50 }), // succeeded, failed, pending
  description: text('description'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// Admin-specific tables
export const admins = pgTable('admins', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  name: varchar('name', { length: 255 }).notNull(),
  passwordHash: text('password_hash').notNull(),
  role: varchar('role', { length: 50 }).default('admin'), // admin, super_admin
  avatarUrl: text('avatar_url'),
  isActive: boolean('is_active').default(true),
  lastLoginAt: timestamp('last_login_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const adminSessions = pgTable('admin_sessions', {
  id: uuid('id').primaryKey().defaultRandom(),
  adminId: uuid('admin_id').notNull().references(() => admins.id, { onDelete: 'cascade' }),
  token: text('token').notNull().unique(),
  expiresAt: timestamp('expires_at').notNull(),
  ipAddress: varchar('ip_address', { length: 45 }),
  userAgent: text('user_agent'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const courseCategories = pgTable('course_categories', {
  id: integer('id').primaryKey().generatedByDefaultAsIdentity(),
  name: varchar('name', { length: 100 }).notNull().unique(),
  description: text('description'),
  slug: varchar('slug', { length: 100 }).notNull().unique(),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const courseMeta = pgTable('course_meta', {
  id: integer('id').primaryKey().generatedByDefaultAsIdentity(),
  courseId: integer('course_id').references(() => courses.id, { onDelete: 'cascade' }),
  categoryId: integer('category_id').references(() => courseCategories.id),
  tags: text('tags'), // JSON array of tags
  difficulty: varchar('difficulty', { length: 20 }), // beginner, intermediate, advanced
  estimatedHours: decimal('estimated_hours', { precision: 4, scale: 1 }),
  prerequisites: text('prerequisites'),
  learningObjectives: text('learning_objectives'), // JSON array
  createdByAdmin: uuid('created_by_admin').references(() => admins.id),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// Video Processing Tables
export const videoAssets = pgTable('video_assets', {
  id: uuid('id').primaryKey().defaultRandom(),
  lessonId: integer('lesson_id').references(() => lessons.id, { onDelete: 'cascade' }),
  originalFilename: varchar('original_filename', { length: 255 }).notNull(),
  s3Key: varchar('s3_key', { length: 500 }).notNull(),
  fileSize: bigint('file_size', { mode: 'number' }),
  duration: integer('duration'), // in seconds
  status: varchar('status', { length: 20 }).notNull().default('pending'), // pending, processing, completed, failed
  processingJobId: varchar('processing_job_id', { length: 100 }),
  hlsPlaylistUrl: varchar('hls_playlist_url', { length: 500 }),
  thumbnailUrl: varchar('thumbnail_url', { length: 500 }),
  uploadedBy: uuid('uploaded_by').references(() => admins.id),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const videoOutputs = pgTable('video_outputs', {
  id: uuid('id').primaryKey().defaultRandom(),
  videoAssetId: uuid('video_asset_id').references(() => videoAssets.id, { onDelete: 'cascade' }),
  quality: varchar('quality', { length: 10 }).notNull(), // 480p, 720p, 1080p
  format: varchar('format', { length: 10 }).notNull(), // mp4, hls
  s3Key: varchar('s3_key', { length: 500 }).notNull(),
  url: varchar('url', { length: 500 }).notNull(),
  fileSize: bigint('file_size', { mode: 'number' }),
  bitrate: integer('bitrate'),
  width: integer('width'),
  height: integer('height'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const videoProcessingJobs = pgTable('video_processing_jobs', {
  id: uuid('id').primaryKey().defaultRandom(),
  videoAssetId: uuid('video_asset_id').references(() => videoAssets.id, { onDelete: 'cascade' }),
  mediaConvertJobId: varchar('mediaconvert_job_id', { length: 100 }).notNull(),
  status: varchar('status', { length: 20 }).notNull().default('submitted'),
  progress: integer('progress').default(0), // 0-100
  inputS3Key: varchar('input_s3_key', { length: 500 }).notNull(),
  outputS3Prefix: varchar('output_s3_prefix', { length: 500 }).notNull(),
  errorMessage: text('error_message'),
  startedAt: timestamp('started_at'),
  completedAt: timestamp('completed_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});
