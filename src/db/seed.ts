#!/usr/bin/env tsx

import { db } from './postgres-index';
import * as schema from './postgres-schema';

async function seed() {
  console.log('🌱 Seeding database...');

  try {
    // Create sample courses
    const [sampleCourse] = await db.insert(schema.courses).values([
      {
        title: "Beginner Lingala - Essential Phrases",
        description: "Learn the most important Lingala phrases for daily conversation. Perfect for beginners who want to start speaking Lingala right away.",
        level: "Beginner",
        language: "Lingala",
        price: "29.99",
        isPublished: true,
      }
    ]).returning();

    console.log('📚 Created sample course:', sampleCourse.title);

    // Create sample modules
    const [module1] = await db.insert(schema.modules).values([
      {
        courseId: sampleCourse.id,
        title: "Greetings and Basic Conversations",
        description: "Learn how to greet people and have basic conversations in Lingala",
        orderIndex: 1,
      }
    ]).returning();

    console.log('📖 Created sample module:', module1.title);

    // Create sample lessons
    await db.insert(schema.lessons).values([
      {
        moduleId: module1.id,
        title: "Introduction to Lingala",
        content: "Welcome to your first Lingala lesson! In this lesson, we'll introduce you to the beautiful Lingala language.",
        orderIndex: 1,
        durationMinutes: 10,
        freePreview: true,
      },
      {
        moduleId: module1.id,
        title: "Basic Greetings",
        content: "Learn essential greetings: Mbote (Hello), Sango nini? (How are you?), and more.",
        orderIndex: 2,
        durationMinutes: 15,
        freePreview: false,
      },
      {
        moduleId: module1.id,
        title: "Introducing Yourself",
        content: "Learn how to introduce yourself and ask for someone's name in Lingala.",
        orderIndex: 3,
        durationMinutes: 12,
        freePreview: false,
      }
    ]);

    console.log('📝 Created sample lessons');

    console.log('✅ Database seeded successfully!');

  } catch (error) {
    console.error('❌ Error seeding database:', error);
    throw error;
  }
}

// Run seed if called directly
if (require.main === module) {
  seed()
    .then(() => {
      console.log('🎉 Seeding completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Seeding failed:', error);
      process.exit(1);
    });
}

export { seed };