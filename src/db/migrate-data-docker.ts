#!/usr/bin/env tsx

import { drizzle } from 'drizzle-orm/libsql';
import { createClient } from '@libsql/client';
import * as sqliteSchema from './schema';
import * as sqliteAuthSchema from './auth-schema';
import { execSync } from 'child_process';
import fs from 'fs';

// Source SQLite connection (current)
const sqliteClient = createClient({
  url: process.env.TURSO_CONNECTION_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN!,
});

const sqliteDb = drizzle(sqliteClient, { schema: { ...sqliteSchema, ...sqliteAuthSchema } });

function executePostgreSQLCommand(sql: string) {
  const tempFile = '/tmp/migration.sql';
  fs.writeFileSync(tempFile, sql);
  
  try {
    const result = execSync(
      `docker exec -i lingala-postgres psql -U postgres -d lingala_db -f /dev/stdin < ${tempFile}`,
      { encoding: 'utf8', shell: true }
    );
    return result;
  } catch (error) {
    console.error('SQL execution failed:', error);
    throw error;
  } finally {
    if (fs.existsSync(tempFile)) {
      fs.unlinkSync(tempFile);
    }
  }
}

async function migrateData() {
  console.log('🚀 Starting data migration from SQLite to PostgreSQL...');
  
  try {
    console.log('📝 Migrating authentication data...');
    
    // Migrate users from auth table
    const authUsers = await sqliteDb.select().from(sqliteAuthSchema.user);
    if (authUsers.length > 0) {
      console.log(`Migrating ${authUsers.length} auth users...`);
      for (const user of authUsers) {
        const sql = `
          INSERT INTO "user" (id, name, email, email_verified, image, created_at, updated_at, is_admin)
          VALUES ('${user.id}', '${user.name?.replace(/'/g, "''")}', '${user.email}', ${user.emailVerified}, ${user.image ? `'${user.image}'` : 'NULL'}, '${new Date(user.createdAt).toISOString()}', '${new Date(user.updatedAt).toISOString()}', ${user.isAdmin || false})
          ON CONFLICT (email) DO NOTHING;
        `;
        executePostgreSQLCommand(sql);
      }
    }
    
    // Migrate sessions
    const sessions = await sqliteDb.select().from(sqliteAuthSchema.session);
    if (sessions.length > 0) {
      console.log(`Migrating ${sessions.length} sessions...`);
      for (const session of sessions) {
        const sql = `
          INSERT INTO session (id, expires_at, token, created_at, updated_at, ip_address, user_agent, user_id)
          VALUES ('${session.id}', '${new Date(session.expiresAt).toISOString()}', '${session.token}', '${new Date(session.createdAt).toISOString()}', '${new Date(session.updatedAt).toISOString()}', ${session.ipAddress ? `'${session.ipAddress}'` : 'NULL'}, ${session.userAgent ? `'${session.userAgent?.replace(/'/g, "''")}'` : 'NULL'}, '${session.userId}')
          ON CONFLICT (token) DO NOTHING;
        `;
        executePostgreSQLCommand(sql);
      }
    }
    
    console.log('📚 Migrating course data...');
    
    // Migrate courses
    const courses = await sqliteDb.select().from(sqliteSchema.courses);
    if (courses.length > 0) {
      console.log(`Migrating ${courses.length} courses...`);
      for (const course of courses) {
        const sql = `
          INSERT INTO courses (id, title, description, level, language, thumbnail_url, price, is_published, created_at, updated_at)
          VALUES (${course.id}, '${course.title.replace(/'/g, "''")}', ${course.description ? `'${course.description.replace(/'/g, "''")}'` : 'NULL'}, ${course.level ? `'${course.level}'` : 'NULL'}, ${course.language ? `'${course.language}'` : 'NULL'}, ${course.thumbnailUrl ? `'${course.thumbnailUrl}'` : 'NULL'}, ${course.price || 'NULL'}, ${course.isPublished || false}, '${new Date(course.createdAt).toISOString()}', '${new Date(course.updatedAt).toISOString()}')
          ON CONFLICT (id) DO NOTHING;
        `;
        executePostgreSQLCommand(sql);
      }
    }
    
    // Migrate modules
    const modules = await sqliteDb.select().from(sqliteSchema.modules);
    if (modules.length > 0) {
      console.log(`Migrating ${modules.length} modules...`);
      for (const module of modules) {
        const sql = `
          INSERT INTO modules (id, course_id, title, description, order_index, created_at)
          VALUES (${module.id}, ${module.courseId}, '${module.title.replace(/'/g, "''")}', ${module.description ? `'${module.description.replace(/'/g, "''")}'` : 'NULL'}, ${module.orderIndex || 'NULL'}, '${new Date(module.createdAt).toISOString()}')
          ON CONFLICT (id) DO NOTHING;
        `;
        executePostgreSQLCommand(sql);
      }
    }
    
    // Migrate lessons
    const lessons = await sqliteDb.select().from(sqliteSchema.lessons);
    if (lessons.length > 0) {
      console.log(`Migrating ${lessons.length} lessons...`);
      for (const lesson of lessons) {
        const sql = `
          INSERT INTO lessons (id, module_id, title, content, video_url, order_index, duration_minutes, free_preview, created_at)
          VALUES (${lesson.id}, ${lesson.moduleId}, '${lesson.title.replace(/'/g, "''")}', ${lesson.content ? `'${lesson.content.replace(/'/g, "''")}'` : 'NULL'}, ${lesson.videoUrl ? `'${lesson.videoUrl}'` : 'NULL'}, ${lesson.orderIndex || 'NULL'}, ${lesson.durationMinutes || 'NULL'}, ${lesson.freePreview || false}, '${new Date(lesson.createdAt).toISOString()}')
          ON CONFLICT (id) DO NOTHING;
        `;
        executePostgreSQLCommand(sql);
      }
    }
    
    console.log('✅ Data migration completed successfully!');
    
  } catch (error) {
    console.error('❌ Error during migration:', error);
    throw error;
  } finally {
    await sqliteClient.close();
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