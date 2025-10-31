import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { user } from '@/db/auth-schema';
import { courses, userEnrollments, userProgress } from '@/db/postgres-schema';
import { eq, desc, isNull, sql } from 'drizzle-orm';
import { requireAdmin } from '@/lib/admin-auth';

export async function GET(request: NextRequest) {
  try {
    const admin = await requireAdmin(request);

    // Calculate total users
    const totalUsersResult = await db.select({ count: sql<number>`count(*)` })
      .from(user);
    const totalUsers = totalUsersResult[0]?.count || 0;

    // Calculate total courses
    const totalCoursesResult = await db.select({ count: sql<number>`count(*)` })
      .from(courses);
    const totalCourses = totalCoursesResult[0]?.count || 0;

    // Calculate published courses
    const publishedCoursesResult = await db.select({ count: sql<number>`count(*)` })
      .from(courses)
      .where(eq(courses.isPublished, true));
    const publishedCourses = publishedCoursesResult[0]?.count || 0;

    // Calculate total enrollments
    const totalEnrollmentsResult = await db.select({ count: sql<number>`count(*)` })
      .from(userEnrollments);
    const totalEnrollments = totalEnrollmentsResult[0]?.count || 0;

    // Calculate active enrollments (where completed_at is null)
    const activeEnrollmentsResult = await db.select({ count: sql<number>`count(*)` })
      .from(userEnrollments)
      .where(isNull(userEnrollments.completedAt));
    const activeEnrollments = activeEnrollmentsResult[0]?.count || 0;

    // Calculate completed lessons
    const completedLessonsResult = await db.select({ count: sql<number>`count(*)` })
      .from(userProgress)
      .where(eq(userProgress.completed, true));
    const completedLessons = completedLessonsResult[0]?.count || 0;

    // Get recent users (last 5)
    const recentUsers = await db.select({
      id: user.id,
      email: user.email,
      name: user.name,
      createdAt: user.createdAt
    })
      .from(user)
      .orderBy(desc(user.createdAt))
      .limit(5);

    // Get recent enrollments (last 5) with user and course details
    const recentEnrollments = await db.select({
      id: userEnrollments.id,
      enrolledAt: userEnrollments.enrolledAt,
      completedAt: userEnrollments.completedAt,
      user: {
        id: user.id,
        email: user.email,
        name: user.name
      },
      course: {
        id: courses.id,
        title: courses.title,
        level: courses.level,
        isPublished: courses.isPublished
      }
    })
      .from(userEnrollments)
      .leftJoin(user, eq(userEnrollments.userId, user.id))
      .leftJoin(courses, eq(userEnrollments.courseId, courses.id))
      .orderBy(desc(userEnrollments.enrolledAt))
      .limit(5);

    const analytics = {
      totalUsers,
      totalCourses,
      publishedCourses,
      totalEnrollments,
      activeEnrollments,
      completedLessons,
      recentUsers,
      recentEnrollments
    };

    return NextResponse.json(analytics, { status: 200 });

  } catch (error) {
    if (error instanceof Error && error.message === 'Admin authentication required') {
      return NextResponse.json(
        { error: 'Admin authentication required' },
        { status: 401 }
      );
    }
    
    console.error('GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error') },
      { status: 500 }
    );
  }
}