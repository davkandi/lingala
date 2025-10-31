"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  Edit,
  Trash2,
  ArrowLeft,
  Loader2,
  GripVertical,
  BookOpen,
  FileText,
  Video,
  File,
} from "lucide-react";
import { toast } from "sonner";
import type { DragEndEvent } from "@dnd-kit/core";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface Lesson {
  id: number;
  moduleId: number;
  title: string;
  content: string | null;
  videoUrl: string | null;
  orderIndex: number | null;
  durationMinutes: number | null;
  freePreview: boolean;
  createdAt: string;
  sourceLanguage: string;
}

interface Module {
  id: number;
  courseId: number;
  title: string;
  description: string | null;
  orderIndex: number | null;
  createdAt: string;
  sourceLanguage: string;
  lessons: Lesson[];
}

interface Course {
  id: number;
  title: string;
  description: string | null;
  level: string | null;
  language: string | null;
  sourceLanguage: string;
  thumbnailUrl: string | null;
  price: number | null;
  isPublished: boolean;
  modules: Module[];
}

function SortableModule({ module, onEdit, onDelete, onAddLesson, onEditLesson, onDeleteLesson }: any) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: `module-${module.id}`,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className="mb-4">
      <Card className={isDragging ? "shadow-lg" : ""}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 flex-1">
              <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing">
                <GripVertical className="w-5 h-5 text-muted-foreground" />
              </div>
              <div>
                <CardTitle className="text-lg">{module.title}</CardTitle>
                {module.description && (
                  <CardDescription className="mt-1">{module.description}</CardDescription>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary">{module.lessons.length} lessons</Badge>
              <Button variant="ghost" size="icon" onClick={() => onAddLesson(module)}>
                <Plus className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="icon" onClick={() => onEdit(module)}>
                <Edit className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="icon" onClick={() => onDelete(module)}>
                <Trash2 className="w-4 h-4 text-destructive" />
              </Button>
            </div>
          </div>
        </CardHeader>
        {module.lessons.length > 0 && (
          <CardContent>
            <div className="space-y-2">
              {module.lessons
                .sort((a: Lesson, b: Lesson) => (a.orderIndex || 0) - (b.orderIndex || 0))
                .map((lesson: Lesson) => (
                  <div
                    key={lesson.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <FileText className="w-4 h-4 text-muted-foreground" />
                      <div>
                        <p className="font-medium">{lesson.title}</p>
                        <div className="flex items-center gap-3 mt-1">
                          {lesson.videoUrl && (
                            <Badge variant="outline" className="text-xs">
                              <Video className="w-3 h-3 mr-1" />
                              Video
                            </Badge>
                          )}
                          {lesson.durationMinutes && (
                            <span className="text-xs text-muted-foreground">
                              {lesson.durationMinutes} min
                            </span>
                          )}
                          {lesson.freePreview && (
                            <Badge variant="outline" className="text-xs">
                              Free Preview
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onEditLesson(lesson)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onDeleteLesson(lesson)}
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        )}
      </Card>
    </div>
  );
}

export default function CourseEditor() {
  const router = useRouter();
  const params = useParams();
  const courseId = params.id as string;

  const [course, setCourse] = useState<Course | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isModuleDialogOpen, setIsModuleDialogOpen] = useState(false);
  const [isLessonDialogOpen, setIsLessonDialogOpen] = useState(false);
  const [editingModule, setEditingModule] = useState<Module | null>(null);
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);
  const [selectedModule, setSelectedModule] = useState<Module | null>(null);
  const [deletingItem, setDeletingItem] = useState<{ type: "module" | "lesson"; item: any } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [moduleFormData, setModuleFormData] = useState({
    title: "",
    description: "",
  });

  const [lessonFormData, setLessonFormData] = useState({
    title: "",
    content: "",
    videoUrl: "",
    durationMinutes: "",
    freePreview: false,
  });

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const fetchCourse = async () => {
    try {
      const token = localStorage.getItem("admin_token");
      const response = await fetch(`/api/admin/courses/${courseId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setCourse(data);
      } else {
        toast.error("Failed to load course");
        router.push("/admin/courses");
      }
    } catch (error) {
      toast.error("Error loading course");
      router.push("/admin/courses");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCourse();
  }, [courseId]);

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id || !course) return;

    const oldIndex = course.modules.findIndex((m) => `module-${m.id}` === active.id);
    const newIndex = course.modules.findIndex((m) => `module-${m.id}` === over.id);

    const newModules = arrayMove(course.modules, oldIndex, newIndex);
    setCourse({ ...course, modules: newModules });

    // Update order in backend
    try {
      const token = localStorage.getItem("admin_token");
      const updates = newModules.map((module, index) => ({
        id: module.id,
        orderIndex: index + 1,
      }));

      await fetch("/api/admin/modules/reorder", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ updates }),
      });

      toast.success("Modules reordered");
    } catch (error) {
      toast.error("Failed to reorder modules");
      fetchCourse();
    }
  };

  const handleOpenModuleDialog = (module?: Module) => {
    if (module) {
      setEditingModule(module);
      setModuleFormData({
        title: module.title,
        description: module.description || "",
      });
    } else {
      setEditingModule(null);
      setModuleFormData({
        title: "",
        description: "",
      });
    }
    setIsModuleDialogOpen(true);
  };

  const handleOpenLessonDialog = (module: Module, lesson?: Lesson) => {
    setSelectedModule(module);
    if (lesson) {
      setEditingLesson(lesson);
      setLessonFormData({
        title: lesson.title,
        content: lesson.content || "",
        videoUrl: lesson.videoUrl || "",
        durationMinutes: lesson.durationMinutes?.toString() || "",
        freePreview: lesson.freePreview,
      });
    } else {
      setEditingLesson(null);
      setLessonFormData({
        title: "",
        content: "",
        videoUrl: "",
        durationMinutes: "",
        freePreview: false,
      });
    }
    setIsLessonDialogOpen(true);
  };

  const handleSubmitModule = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const token = localStorage.getItem("admin_token");
      const url = editingModule
        ? `/api/admin/modules/${editingModule.id}`
        : "/api/admin/modules";
      const method = editingModule ? "PATCH" : "POST";

      const body = editingModule
        ? moduleFormData
        : { ...moduleFormData, courseId: parseInt(courseId) };

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      if (response.ok) {
        toast.success(editingModule ? "Module updated" : "Module created");
        setIsModuleDialogOpen(false);
        fetchCourse();
      } else {
        toast.error("Failed to save module");
      }
    } catch (error) {
      toast.error("Error saving module");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitLesson = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedModule) return;

    setIsSubmitting(true);

    try {
      const token = localStorage.getItem("admin_token");
      const url = editingLesson
        ? `/api/admin/lessons/${editingLesson.id}`
        : "/api/admin/lessons";
      const method = editingLesson ? "PATCH" : "POST";

      const body = {
        ...lessonFormData,
        moduleId: selectedModule.id,
        durationMinutes: lessonFormData.durationMinutes
          ? parseInt(lessonFormData.durationMinutes)
          : null,
        freePreview: lessonFormData.freePreview,
      };

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      if (response.ok) {
        toast.success(editingLesson ? "Lesson updated" : "Lesson created");
        setIsLessonDialogOpen(false);
        fetchCourse();
      } else {
        toast.error("Failed to save lesson");
      }
    } catch (error) {
      toast.error("Error saving lesson");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingItem) return;

    try {
      const token = localStorage.getItem("admin_token");
      const url =
        deletingItem.type === "module"
          ? `/api/admin/modules/${deletingItem.item.id}`
          : `/api/admin/lessons/${deletingItem.item.id}`;

      const response = await fetch(url, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        toast.success(`${deletingItem.type === "module" ? "Module" : "Lesson"} deleted`);
        setDeletingItem(null);
        fetchCourse();
      } else {
        toast.error("Failed to delete");
      }
    } catch (error) {
      toast.error("Error deleting");
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (!course) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="space-y-4"
      >
        <Button
          variant="ghost"
          onClick={() => router.push("/admin/courses")}
          className="h-auto p-2 -ml-2"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Courses
        </Button>
        <div className="flex flex-col space-y-4 md:flex-row md:items-start md:justify-between md:space-y-0">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold tracking-tight">{course.title}</h1>
            <p className="text-muted-foreground">
              Manage modules and lessons for this course
            </p>
          </div>
          <Button size="lg" onClick={() => handleOpenModuleDialog()}>
            <Plus className="w-5 h-5 mr-2" />
            Add Module
          </Button>
        </div>
      </motion.div>

      {/* Modules */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        {course.modules.length === 0 ? (
          <Card>
            <CardContent className="py-12">
              <div className="text-center">
                <BookOpen className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No modules yet</h3>
                <p className="text-muted-foreground mb-4">
                  Start building your course by adding modules
                </p>
                <Button onClick={() => handleOpenModuleDialog()}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add First Module
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={course.modules.map((m) => `module-${m.id}`)}
              strategy={verticalListSortingStrategy}
            >
              {course.modules
                .sort((a, b) => (a.orderIndex || 0) - (b.orderIndex || 0))
                .map((module) => (
                  <SortableModule
                    key={module.id}
                    module={module}
                    onEdit={handleOpenModuleDialog}
                    onDelete={(m: Module) => setDeletingItem({ type: "module", item: m })}
                    onAddLesson={(m: Module) => handleOpenLessonDialog(m)}
                    onEditLesson={(l: Lesson) => {
                      const mod = course.modules.find((m) => m.id === l.moduleId);
                      if (mod) handleOpenLessonDialog(mod, l);
                    }}
                    onDeleteLesson={(l: Lesson) => setDeletingItem({ type: "lesson", item: l })}
                  />
                ))}
            </SortableContext>
          </DndContext>
        )}
      </motion.div>

      {/* Module Dialog */}
      <Dialog open={isModuleDialogOpen} onOpenChange={setIsModuleDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingModule ? "Edit Module" : "Create Module"}</DialogTitle>
            <DialogDescription>
              {editingModule ? "Update module details" : "Add a new module to the course"}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmitModule} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="moduleTitle">Module Title *</Label>
              <Input
                id="moduleTitle"
                placeholder="e.g., Introduction to Lingala"
                value={moduleFormData.title}
                onChange={(e) =>
                  setModuleFormData({ ...moduleFormData, title: e.target.value })
                }
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="moduleDescription">Description</Label>
              <Textarea
                id="moduleDescription"
                placeholder="Describe this module..."
                value={moduleFormData.description}
                onChange={(e) =>
                  setModuleFormData({ ...moduleFormData, description: e.target.value })
                }
                rows={3}
              />
            </div>
            <div className="flex gap-3 justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsModuleDialogOpen(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>{editingModule ? "Update" : "Create"}</>
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Lesson Dialog */}
      <Dialog open={isLessonDialogOpen} onOpenChange={setIsLessonDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingLesson ? "Edit Lesson" : "Create Lesson"}</DialogTitle>
            <DialogDescription>
              {editingLesson ? "Update lesson details" : "Add a new lesson to the module"}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmitLesson} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="lessonTitle">Lesson Title *</Label>
              <Input
                id="lessonTitle"
                placeholder="e.g., Basic Greetings"
                value={lessonFormData.title}
                onChange={(e) =>
                  setLessonFormData({ ...lessonFormData, title: e.target.value })
                }
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lessonContent">Content</Label>
              <Textarea
                id="lessonContent"
                placeholder="Lesson content and notes..."
                value={lessonFormData.content}
                onChange={(e) =>
                  setLessonFormData({ ...lessonFormData, content: e.target.value })
                }
                rows={4}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="videoUrl">Video URL (AWS S3)</Label>
              <Input
                id="videoUrl"
                placeholder="https://s3.amazonaws.com/..."
                value={lessonFormData.videoUrl}
                onChange={(e) =>
                  setLessonFormData({ ...lessonFormData, videoUrl: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="durationMinutes">Duration (minutes)</Label>
              <Input
                id="durationMinutes"
                type="number"
                placeholder="30"
                value={lessonFormData.durationMinutes}
                onChange={(e) =>
                  setLessonFormData({ ...lessonFormData, durationMinutes: e.target.value })
                }
              />
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="lesson-preview"
                checked={lessonFormData.freePreview}
                onChange={(e) => setLessonFormData({ ...lessonFormData, freePreview: e.target.checked })}
                className="w-4 h-4"
              />
              <Label htmlFor="lesson-preview" className="cursor-pointer">
                Allow free preview (non-subscribers can view this lesson)
              </Label>
            </div>
            <div className="flex gap-3 justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsLessonDialogOpen(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>{editingLesson ? "Update" : "Create"}</>
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deletingItem} onOpenChange={() => setDeletingItem(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Delete {deletingItem?.type === "module" ? "Module" : "Lesson"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deletingItem?.item.title}"?
              {deletingItem?.type === "module" &&
                " This will also delete all lessons in this module."}
              {" This action cannot be undone."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
