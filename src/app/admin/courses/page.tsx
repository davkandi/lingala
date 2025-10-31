"use client";

import { useEffect, useState } from "react";
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
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, Trash2, Eye, BookOpen, Loader2, Upload, X } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
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

interface Course {
  id: number;
  title: string;
  description: string | null;
  level: string | null;
  language: string | null;
  thumbnailUrl: string | null;
  price: string | null;
  isPublished: boolean;
  moduleCount: number;
  lessonCount: number;
  createdAt: string;
  updatedAt: string;
}

export default function CourseManagement() {
  const router = useRouter();
  const [courses, setCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [deletingCourse, setDeletingCourse] = useState<Course | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadingThumbnail, setUploadingThumbnail] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    level: "",
    language: "",
    thumbnailUrl: "",
    price: "",
    isPublished: false,
  });

  const fetchCourses = async () => {
    try {
      const token = localStorage.getItem("admin_token");
      if (!token) {
        toast.error("Admin authentication required");
        return;
      }

      const response = await fetch("/api/admin/courses", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setCourses(data.courses || data);
      } else {
        toast.error("Failed to load courses");
      }
    } catch (error) {
      toast.error("Error loading courses");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  const handleOpenDialog = (course?: Course) => {
    if (course) {
      setEditingCourse(course);
      setFormData({
        title: course.title,
        description: course.description || "",
        level: course.level || "",
        language: course.language || "",
        thumbnailUrl: course.thumbnailUrl || "",
        price: course.price?.toString() || "",
        isPublished: course.isPublished,
      });
    } else {
      setEditingCourse(null);
      setFormData({
        title: "",
        description: "",
        level: "",
        language: "",
        thumbnailUrl: "",
        price: "",
        isPublished: false,
      });
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingCourse(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const token = localStorage.getItem("admin_token");
      const url = editingCourse
        ? `/api/admin/courses/${editingCourse.id}`
        : "/api/admin/courses";
      const method = editingCourse ? "PATCH" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: formData.title,
          description: formData.description || null,
          level: formData.level || null,
          language: formData.language || null,
          thumbnailUrl: formData.thumbnailUrl || null,
          price: formData.price ? parseFloat(formData.price) : null,
          isPublished: formData.isPublished,
        }),
      });

      if (response.ok) {
        toast.success(editingCourse ? "Course updated successfully" : "Course created successfully");
        handleCloseDialog();
        fetchCourses();
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to save course");
      }
    } catch (error) {
      toast.error("Error saving course");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingCourse) return;

    try {
      const token = localStorage.getItem("admin_token");
      const response = await fetch(`/api/admin/courses/${deletingCourse.id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        toast.success("Course deleted successfully");
        setDeletingCourse(null);
        fetchCourses();
      } else {
        toast.error("Failed to delete course");
      }
    } catch (error) {
      toast.error("Error deleting course");
    }
  };

  const handleTogglePublish = async (course: Course) => {
    try {
      const token = localStorage.getItem("admin_token");
      const response = await fetch(`/api/admin/courses/${course.id}/publish`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        toast.success(course.isPublished ? "Course unpublished" : "Course published");
        fetchCourses();
      } else {
        toast.error("Failed to update course status");
      }
    } catch (error) {
      toast.error("Error updating course status");
    }
  };

  const handleThumbnailUpload = async (file: File) => {
    setUploadingThumbnail(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const token = localStorage.getItem("admin_token");
      const response = await fetch('/api/admin/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Upload failed');
      }

      const result = await response.json();
      setFormData(prev => ({ ...prev, thumbnailUrl: result.url }));
      toast.success('Thumbnail uploaded successfully');
    } catch (error) {
      console.error('Upload error:', error);
      toast.error(error instanceof Error ? error.message : 'Upload failed');
    } finally {
      setUploadingThumbnail(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-4xl font-bold">Course Management</h1>
          <p className="text-muted-foreground mt-2">Loading courses...</p>
        </div>
        <Card>
          <CardContent className="p-8">
            <div className="flex items-center justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0"
      >
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">Course Management</h1>
          <p className="text-muted-foreground">
            Create and manage your Lingala learning courses
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button size="lg" onClick={() => handleOpenDialog()} className="shadow-sm">
                <Plus className="w-4 h-4 mr-2" />
                Create Course
              </Button>
            </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingCourse ? "Edit Course" : "Create New Course"}</DialogTitle>
              <DialogDescription>
                {editingCourse
                  ? "Update the course details below"
                  : "Fill in the details to create a new course"}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="title">Course Title *</Label>
                <Input
                  id="title"
                  placeholder="e.g., Beginner Lingala Course"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Describe the course..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={4}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="level">Level</Label>
                  <Select value={formData.level} onValueChange={(value) => setFormData({ ...formData, level: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select level" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Beginner">Beginner</SelectItem>
                      <SelectItem value="Intermediate">Intermediate</SelectItem>
                      <SelectItem value="Advanced">Advanced</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="language">Language</Label>
                  <Select value={formData.language} onValueChange={(value) => setFormData({ ...formData, language: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select language" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="English">English</SelectItem>
                      <SelectItem value="French">French</SelectItem>
                      <SelectItem value="Lingala">Lingala</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="price">Price ($)</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                />
              </div>

              <div className="space-y-3">
                <Label>Course Thumbnail</Label>
                {formData.thumbnailUrl ? (
                  <div className="space-y-3">
                    <div className="relative w-full h-48 border rounded-lg overflow-hidden">
                      <img 
                        src={formData.thumbnailUrl} 
                        alt="Course thumbnail"
                        className="w-full h-full object-cover"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="absolute top-2 right-2"
                        onClick={() => setFormData({ ...formData, thumbnailUrl: "" })}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                    <Input
                      placeholder="Or enter thumbnail URL manually"
                      value={formData.thumbnailUrl}
                      onChange={(e) => setFormData({ ...formData, thumbnailUrl: e.target.value })}
                    />
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleThumbnailUpload(file);
                        }}
                        className="hidden"
                        id="thumbnail-upload"
                      />
                      <label htmlFor="thumbnail-upload" className="cursor-pointer">
                        <div className="flex flex-col items-center">
                          {uploadingThumbnail ? (
                            <Loader2 className="w-8 h-8 animate-spin text-primary mb-2" />
                          ) : (
                            <Upload className="w-8 h-8 text-muted-foreground mb-2" />
                          )}
                          <p className="text-sm font-medium">
                            {uploadingThumbnail ? "Uploading..." : "Click to upload thumbnail"}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            PNG, JPG, WebP up to 10MB
                          </p>
                        </div>
                      </label>
                    </div>
                    <Input
                      placeholder="Or enter thumbnail URL"
                      value={formData.thumbnailUrl}
                      onChange={(e) => setFormData({ ...formData, thumbnailUrl: e.target.value })}
                    />
                  </div>
                )}
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="isPublished"
                  checked={formData.isPublished}
                  onChange={(e) => setFormData({ ...formData, isPublished: e.target.checked })}
                  className="w-4 h-4"
                />
                <Label htmlFor="isPublished" className="cursor-pointer">
                  Publish course immediately
                </Label>
              </div>

              <div className="flex gap-3 justify-end">
                <Button type="button" variant="outline" onClick={handleCloseDialog} disabled={isSubmitting}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>{editingCourse ? "Update Course" : "Create Course"}</>
                  )}
                </Button>
              </div>
            </form>
          </DialogContent>
          </Dialog>
        </div>
      </motion.div>

      {/* Courses Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="w-5 h-5" />
              All Courses
            </CardTitle>
            <CardDescription>
              {courses.length} {courses.length === 1 ? "course" : "courses"} total
            </CardDescription>
          </CardHeader>
          <CardContent>
            {courses.length === 0 ? (
              <div className="text-center py-12">
                <BookOpen className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No courses yet</h3>
                <p className="text-muted-foreground mb-4">Get started by creating your first course</p>
                <Button onClick={() => handleOpenDialog()}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Course
                </Button>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Level</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Modules</TableHead>
                    <TableHead>Lessons</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {courses.map((course) => (
                    <TableRow key={course.id}>
                      <TableCell className="font-medium">{course.title}</TableCell>
                      <TableCell>
                        {course.level ? (
                          <Badge variant="outline">{course.level}</Badge>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {course.price ? `$${parseFloat(course.price).toFixed(2)}` : <span className="text-muted-foreground">Free</span>}
                      </TableCell>
                      <TableCell>{course.moduleCount}</TableCell>
                      <TableCell>{course.lessonCount}</TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleTogglePublish(course)}
                        >
                          {course.isPublished ? (
                            <Badge className="bg-green-500">Published</Badge>
                          ) : (
                            <Badge variant="secondary">Draft</Badge>
                          )}
                        </Button>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => router.push(`/admin/courses/${course.id}`)}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleOpenDialog(course)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setDeletingCourse(course)}
                          >
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deletingCourse} onOpenChange={() => setDeletingCourse(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Course</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deletingCourse?.title}"? This will also delete all modules, lessons, and materials associated with this course. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Delete Course
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
