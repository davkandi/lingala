#!/usr/bin/env tsx

import { drizzle } from 'drizzle-orm/libsql';
import { createClient } from '@libsql/client';
import { drizzle as pgDrizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as sqliteSchema from './schema';
import * as pgSchema from './postgres-schema';
import * as sqliteAuthSchema from './auth-schema';
import * as pgAuthSchema from './auth-postgres-schema';

// Source SQLite connection (current)
const sqliteClient = createClient({
  url: process.env.TURSO_CONNECTION_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN!,
});

const sqliteDb = drizzle(sqliteClient, { schema: { ...sqliteSchema, ...sqliteAuthSchema } });

// Target PostgreSQL connection (new)
const pgClient = postgres(process.env.DATABASE_URL!, { prepare: false });
const pgDb = pgDrizzle(pgClient, { schema: { ...pgSchema, ...pgAuthSchema } });

async function migrateData() {
  console.log('🚀 Starting data migration from SQLite to PostgreSQL...');
  
  try {
    // Migrate auth data first
    console.log('📝 Migrating authentication data...');
    
    // Migrate users
    const users = await sqliteDb.select().from(sqliteAuthSchema.user);
    if (users.length > 0) {
      console.log(`Migrating ${users.length} users...`);
      await pgDb.insert(pgAuthSchema.user).values(users);
    }
    
    // Migrate sessions
    const sessions = await sqliteDb.select().from(sqliteAuthSchema.session);
    if (sessions.length > 0) {
      console.log(`Migrating ${sessions.length} sessions...`);
      await pgDb.insert(pgAuthSchema.session).values(sessions);
    }
    
    // Migrate accounts
    const accounts = await sqliteDb.select().from(sqliteAuthSchema.account);
    if (accounts.length > 0) {
      console.log(`Migrating ${accounts.length} accounts...`);
      await pgDb.insert(pgAuthSchema.account).values(accounts);
    }
    
    // Migrate verifications
    const verifications = await sqliteDb.select().from(sqliteAuthSchema.verification);
    if (verifications.length > 0) {
      console.log(`Migrating ${verifications.length} verifications...`);
      await pgDb.insert(pgAuthSchema.verification).values(verifications);
    }
    
    console.log('📚 Migrating course data...');
    
    // Migrate courses
    const courses = await sqliteDb.select().from(sqliteSchema.courses);
    if (courses.length > 0) {
      console.log(`Migrating ${courses.length} courses...`);
      // Convert SQLite data to PostgreSQL format
      const coursesData = courses.map(course => ({
        ...course,
        price: course.price ? course.price.toString() : null,
        createdAt: new Date(course.createdAt),
        updatedAt: new Date(course.updatedAt),
      }));
      await pgDb.insert(pgSchema.courses).values(coursesData);
    }
    
    // Migrate modules
    const modules = await sqliteDb.select().from(sqliteSchema.modules);
    if (modules.length > 0) {
      console.log(`Migrating ${modules.length} modules...`);
      const modulesData = modules.map(module => ({
        ...module,
        createdAt: new Date(module.createdAt),
      }));
      await pgDb.insert(pgSchema.modules).values(modulesData);
    }
    
    // Migrate lessons
    const lessons = await sqliteDb.select().from(sqliteSchema.lessons);
    if (lessons.length > 0) {
      console.log(`Migrating ${lessons.length} lessons...`);
      const lessonsData = lessons.map(lesson => ({
        ...lesson,
        createdAt: new Date(lesson.createdAt),
      }));
      await pgDb.insert(pgSchema.lessons).values(lessonsData);
    }
    
    // Migrate lesson materials
    const materials = await sqliteDb.select().from(sqliteSchema.lessonMaterials);
    if (materials.length > 0) {
      console.log(`Migrating ${materials.length} lesson materials...`);
      const materialsData = materials.map(material => ({
        ...material,
        createdAt: new Date(material.createdAt),
      }));
      await pgDb.insert(pgSchema.lessonMaterials).values(materialsData);
    }
    
    // Migrate user enrollments
    const enrollments = await sqliteDb.select().from(sqliteSchema.userEnrollments);
    if (enrollments.length > 0) {
      console.log(`Migrating ${enrollments.length} user enrollments...`);
      const enrollmentsData = enrollments.map(enrollment => ({
        ...enrollment,
        enrolledAt: new Date(enrollment.enrolledAt),
        completedAt: enrollment.completedAt ? new Date(enrollment.completedAt) : null,
      }));
      await pgDb.insert(pgSchema.userEnrollments).values(enrollmentsData);
    }
    
    // Migrate user progress
    const progress = await sqliteDb.select().from(sqliteSchema.userProgress);
    if (progress.length > 0) {
      console.log(`Migrating ${progress.length} user progress records...`);
      const progressData = progress.map(prog => ({
        ...prog,
        createdAt: new Date(prog.createdAt),
        updatedAt: new Date(prog.updatedAt),
        completedAt: prog.completedAt ? new Date(prog.completedAt) : null,
      }));
      await pgDb.insert(pgSchema.userProgress).values(progressData);
    }
    
    // Migrate quizzes
    const quizzes = await sqliteDb.select().from(sqliteSchema.quizzes);
    if (quizzes.length > 0) {
      console.log(`Migrating ${quizzes.length} quizzes...`);
      const quizzesData = quizzes.map(quiz => ({
        ...quiz,
        createdAt: new Date(quiz.createdAt),
      }));
      await pgDb.insert(pgSchema.quizzes).values(quizzesData);
    }
    
    // Migrate quiz questions
    const questions = await sqliteDb.select().from(sqliteSchema.quizQuestions);
    if (questions.length > 0) {
      console.log(`Migrating ${questions.length} quiz questions...`);
      const questionsData = questions.map(question => ({
        ...question,
        createdAt: new Date(question.createdAt),
      }));
      await pgDb.insert(pgSchema.quizQuestions).values(questionsData);
    }
    
    console.log('✅ Data migration completed successfully!');
    
  } catch (error) {
    console.error('❌ Error during migration:', error);
    throw error;
  } finally {
    await sqliteClient.close();
    await pgClient.end();
  }
}

// Run migration if called directly
if (require.main === module) {
  migrateData()
    .then(() => {
      console.log('🎉 Migration finished');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Migration failed:', error);
      process.exit(1);
    });
}

export { migrateData };