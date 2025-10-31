import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { courses, modules, lessons } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const courseId = parseInt(id);

    const course = await db.select().from(courses).where(eq(courses.id, courseId)).limit(1);
    
    if (!course || course.length === 0) {
      return NextResponse.json(
        { error: "Course not found" },
        { status: 404 }
      );
    }

    const courseModules = await db.select().from(modules).where(eq(modules.courseId, courseId));
    
    const modulesWithLessons = await Promise.all(
      courseModules.map(async (module) => {
        const moduleLessons = await db.select().from(lessons).where(eq(lessons.moduleId, module.id));
        return {
          ...module,
          lessons: moduleLessons,
        };
      })
    );

    return NextResponse.json({
      ...course[0],
      modules: modulesWithLessons,
    });
  } catch (error) {
    console.error("Error fetching course:", error);
    return NextResponse.json(
      { error: "Failed to fetch course" },
      { status: 500 }
    );
  }
}
