import { sqliteTable, integer, text, real } from 'drizzle-orm/sqlite-core';

// Note: Better-auth manages its own tables (user, session, account, verification)
// Do NOT define them in this schema file

export const users = sqliteTable('users', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  email: text('email').notNull().unique(),
  name: text('name'),
  passwordHash: text('password_hash'),
  avatarUrl: text('avatar_url'),
  isAdmin: integer('is_admin', { mode: 'boolean' }).default(false),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

export const courses = sqliteTable('courses', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  title: text('title').notNull(),
  description: text('description'),
  level: text('level'),
  language: text('language'),
  thumbnailUrl: text('thumbnail_url'),
  price: real('price'),
  isPublished: integer('is_published', { mode: 'boolean' }).default(false),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

export const modules = sqliteTable('modules', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  courseId: integer('course_id').references(() => courses.id),
  title: text('title').notNull(),
  description: text('description'),
  orderIndex: integer('order_index'),
  createdAt: text('created_at').notNull(),
});

export const lessons = sqliteTable('lessons', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  moduleId: integer('module_id').references(() => modules.id),
  title: text('title').notNull(),
  content: text('content'),
  videoUrl: text('video_url'),
  orderIndex: integer('order_index'),
  durationMinutes: integer('duration_minutes'),
  freePreview: integer('free_preview', { mode: 'boolean' }).default(false),
  createdAt: text('created_at').notNull(),
});

export const lessonMaterials = sqliteTable('lesson_materials', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  lessonId: integer('lesson_id').references(() => lessons.id),
  title: text('title'),
  type: text('type'),
  url: text('url'),
  createdAt: text('created_at').notNull(),
});

export const userEnrollments = sqliteTable('user_enrollments', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: text('user_id'),
  courseId: integer('course_id').references(() => courses.id),
  enrolledAt: text('enrolled_at').notNull(),
  completedAt: text('completed_at'),
});

export const userProgress = sqliteTable('user_progress', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: text('user_id'),
  lessonId: integer('lesson_id').references(() => lessons.id),
  completed: integer('completed', { mode: 'boolean' }).default(false),
  completedAt: text('completed_at'),
  lastPositionSeconds: integer('last_position_seconds').default(0),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

export const quizzes = sqliteTable('quizzes', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  lessonId: integer('lesson_id').references(() => lessons.id),
  title: text('title').notNull(),
  description: text('description'),
  passingScore: integer('passing_score').notNull(),
  createdAt: text('created_at').notNull(),
});

export const quizQuestions = sqliteTable('quiz_questions', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  quizId: integer('quiz_id').references(() => quizzes.id),
  questionText: text('question_text').notNull(),
  questionType: text('question_type').notNull(),
  correctAnswer: text('correct_answer').notNull(),
  options: text('options'),
  orderIndex: integer('order_index'),
  createdAt: text('created_at').notNull(),
});