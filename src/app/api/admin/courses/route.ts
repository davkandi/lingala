import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import { db } from '@/db';
import { courses, modules, lessons, courseMeta, courseCategories } from '@/db/postgres-schema';
import { eq, sql, desc } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const admin = await requireAdmin(request);

    const allCourses = await db.select({
      id: courses.id,
      title: courses.title,
      description: courses.description,
      level: courses.level,
      language: courses.language,
      thumbnailUrl: courses.thumbnailUrl,
      price: courses.price,
      isPublished: courses.isPublished,
      createdAt: courses.createdAt,
      updatedAt: courses.updatedAt,
    }).from(courses).orderBy(desc(courses.createdAt));

    const coursesWithCounts = await Promise.all(
      allCourses.map(async (course) => {
        const moduleCount = await db
          .select({ count: sql<number>`count(*)` })
          .from(modules)
          .where(eq(modules.courseId, course.id));

        const lessonCount = await db
          .select({ count: sql<number>`count(*)` })
          .from(lessons)
          .innerJoin(modules, eq(lessons.moduleId, modules.id))
          .where(eq(modules.courseId, course.id));

        return {
          ...course,
          moduleCount: Number(moduleCount[0]?.count || 0),
          lessonCount: Number(lessonCount[0]?.count || 0),
        };
      })
    );

    return NextResponse.json({
      courses: coursesWithCounts,
      total: coursesWithCounts.length,
    });

  } catch (error) {
    if (error instanceof Error && error.message === 'Admin authentication required') {
      return NextResponse.json(
        { error: 'Admin authentication required' },
        { status: 401 }
      );
    }
    
    console.error('GET admin courses error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch courses' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const admin = await requireAdmin(request);
    const data = await request.json();

    const {
      title,
      description,
      level,
      language,
      price,
      thumbnailUrl,
      isPublished = false,
      // Meta fields
      categoryId,
      difficulty,
      estimatedHours,
      tags,
      prerequisites,
      learningObjectives,
    } = data;

    if (!title || !description) {
      return NextResponse.json(
        { error: 'Title and description are required' },
        { status: 400 }
      );
    }

    // Create course
    const newCourse = await db.insert(courses).values({
      title: title.trim(),
      description: description.trim(),
      level: level || 'Beginner',
      language: language || 'Lingala',
      price: price || '29.99',
      thumbnailUrl,
      isPublished,
    }).returning();

    const courseId = newCourse[0].id;

    // Create course meta if provided
    if (categoryId || difficulty || estimatedHours || tags || prerequisites || learningObjectives) {
      await db.insert(courseMeta).values({
        courseId,
        categoryId: categoryId || null,
        difficulty: difficulty || 'beginner',
        estimatedHours: estimatedHours || null,
        tags: tags ? JSON.stringify(tags) : null,
        prerequisites,
        learningObjectives: learningObjectives ? JSON.stringify(learningObjectives) : null,
        createdByAdmin: admin.id,
      });
    }

    return NextResponse.json({
      course: newCourse[0],
      message: 'Course created successfully',
    });

  } catch (error) {
    if (error instanceof Error && error.message === 'Admin authentication required') {
      return NextResponse.json(
        { error: 'Admin authentication required' },
        { status: 401 }
      );
    }
    
    console.error('POST admin courses error:', error);
    return NextResponse.json(
      { error: 'Failed to create course' },
      { status: 500 }
    );
  }
}