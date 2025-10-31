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
  FileText,
  Plus,
  Edit,
  Trash2,
  Loader2,
  HelpCircle,
  Upload,
  Link as LinkIcon,
} from "lucide-react";
import { toast } from "sonner";

interface LessonMaterial {
  id: number;
  lessonId: number;
  title: string | null;
  type: string | null;
  url: string | null;
  createdAt: string;
}

interface Lesson {
  id: number;
  moduleId: number;
  title: string;
  videoUrl: string | null;
}

interface Quiz {
  id: number;
  lessonId: number;
  title: string;
  description: string | null;
  passingScore: number;
  createdAt: string;
  questions?: QuizQuestion[];
}

interface QuizQuestion {
  id: number;
  quizId: number;
  questionText: string;
  questionType: string;
  correctAnswer: string;
  options: string | null;
  orderIndex: number | null;
  createdAt: string;
}

export default function ContentManagement() {
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [materials, setMaterials] = useState<LessonMaterial[]>([]);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isMaterialDialogOpen, setIsMaterialDialogOpen] = useState(false);
  const [isQuizDialogOpen, setIsQuizDialogOpen] = useState(false);
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const [deletingItem, setDeletingItem] = useState<{ type: "material" | "quiz"; item: any } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [materialFormData, setMaterialFormData] = useState({
    title: "",
    type: "",
    url: "",
  });

  const [quizFormData, setQuizFormData] = useState({
    title: "",
    description: "",
    passingScore: "",
  });

  const fetchData = async () => {
    try {
      const token = localStorage.getItem("bearer_token");
      
      // Fetch all courses to get lessons
      const coursesRes = await fetch("/api/admin/courses", {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (coursesRes.ok) {
        const coursesData = await coursesRes.json();
        const allLessons: Lesson[] = [];
        
        for (const course of coursesData) {
          const courseDetailRes = await fetch(`/api/admin/courses/${course.id}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          
          if (courseDetailRes.ok) {
            const courseDetail = await courseDetailRes.json();
            courseDetail.modules.forEach((module: any) => {
              allLessons.push(...module.lessons);
            });
          }
        }
        
        setLessons(allLessons);
      }
    } catch (error) {
      toast.error("Error loading lessons");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenMaterialDialog = (lesson: Lesson) => {
    setSelectedLesson(lesson);
    setMaterialFormData({ title: "", type: "", url: "" });
    setIsMaterialDialogOpen(true);
  };

  const handleOpenQuizDialog = (lesson: Lesson) => {
    setSelectedLesson(lesson);
    setQuizFormData({ title: "", description: "", passingScore: "70" });
    setIsQuizDialogOpen(true);
  };

  const handleSubmitMaterial = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLesson) return;

    setIsSubmitting(true);

    try {
      const token = localStorage.getItem("bearer_token");
      const response = await fetch("/api/admin/lesson-materials", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          lessonId: selectedLesson.id,
          ...materialFormData,
        }),
      });

      if (response.ok) {
        toast.success("Material added successfully");
        setIsMaterialDialogOpen(false);
        fetchData();
      } else {
        toast.error("Failed to add material");
      }
    } catch (error) {
      toast.error("Error adding material");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitQuiz = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLesson) return;

    setIsSubmitting(true);

    try {
      const token = localStorage.getItem("bearer_token");
      const response = await fetch("/api/admin/quizzes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          lessonId: selectedLesson.id,
          title: quizFormData.title,
          description: quizFormData.description || null,
          passingScore: parseInt(quizFormData.passingScore),
        }),
      });

      if (response.ok) {
        toast.success("Quiz created successfully");
        setIsQuizDialogOpen(false);
        fetchData();
      } else {
        toast.error("Failed to create quiz");
      }
    } catch (error) {
      toast.error("Error creating quiz");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingItem) return;

    try {
      const token = localStorage.getItem("bearer_token");
      const url =
        deletingItem.type === "material"
          ? `/api/admin/lesson-materials/${deletingItem.item.id}`
          : `/api/admin/quizzes/${deletingItem.item.id}`;

      const response = await fetch(url, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        toast.success(`${deletingItem.type === "material" ? "Material" : "Quiz"} deleted`);
        setDeletingItem(null);
        fetchData();
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
        <div>
          <h1 className="text-4xl font-bold">Content Management</h1>
          <p className="text-muted-foreground mt-2">Loading content...</p>
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
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-4xl font-bold">Content Management</h1>
        <p className="text-muted-foreground mt-2">
          Manage lesson materials and quizzes
        </p>
      </motion.div>

      {/* Lessons with Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Lessons & Content
            </CardTitle>
            <CardDescription>
              Add materials and quizzes to your lessons
            </CardDescription>
          </CardHeader>
          <CardContent>
            {lessons.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No lessons yet</h3>
                <p className="text-muted-foreground">
                  Create courses and modules first to add lessons
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Lesson Title</TableHead>
                    <TableHead>Video</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {lessons.map((lesson) => (
                    <TableRow key={lesson.id}>
                      <TableCell className="font-medium">{lesson.title}</TableCell>
                      <TableCell>
                        {lesson.videoUrl ? (
                          <Badge variant="outline">
                            <LinkIcon className="w-3 h-3 mr-1" />
                            Video Added
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground text-sm">No video</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenMaterialDialog(lesson)}
                          >
                            <Upload className="w-4 h-4 mr-2" />
                            Add Material
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenQuizDialog(lesson)}
                          >
                            <HelpCircle className="w-4 h-4 mr-2" />
                            Create Quiz
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

      {/* Add Material Dialog */}
      <Dialog open={isMaterialDialogOpen} onOpenChange={setIsMaterialDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Lesson Material</DialogTitle>
            <DialogDescription>
              Upload PDF, audio, or other materials for {selectedLesson?.title}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmitMaterial} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="materialTitle">Material Title</Label>
              <Input
                id="materialTitle"
                placeholder="e.g., Course Notes PDF"
                value={materialFormData.title}
                onChange={(e) =>
                  setMaterialFormData({ ...materialFormData, title: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="materialType">Type</Label>
              <Select
                value={materialFormData.type}
                onValueChange={(value) =>
                  setMaterialFormData({ ...materialFormData, type: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pdf">PDF Document</SelectItem>
                  <SelectItem value="audio">Audio File</SelectItem>
                  <SelectItem value="document">Document</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="materialUrl">File URL</Label>
              <Input
                id="materialUrl"
                placeholder="https://example.com/file.pdf"
                value={materialFormData.url}
                onChange={(e) =>
                  setMaterialFormData({ ...materialFormData, url: e.target.value })
                }
              />
              <p className="text-xs text-muted-foreground">
                Upload your file to AWS S3 or another hosting service and paste the URL here
              </p>
            </div>
            <div className="flex gap-3 justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsMaterialDialogOpen(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Adding...
                  </>
                ) : (
                  "Add Material"
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Create Quiz Dialog */}
      <Dialog open={isQuizDialogOpen} onOpenChange={setIsQuizDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Quiz</DialogTitle>
            <DialogDescription>
              Create a quiz for {selectedLesson?.title}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmitQuiz} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="quizTitle">Quiz Title *</Label>
              <Input
                id="quizTitle"
                placeholder="e.g., Lesson 1 Quiz"
                value={quizFormData.title}
                onChange={(e) =>
                  setQuizFormData({ ...quizFormData, title: e.target.value })
                }
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="quizDescription">Description</Label>
              <Textarea
                id="quizDescription"
                placeholder="Quiz description..."
                value={quizFormData.description}
                onChange={(e) =>
                  setQuizFormData({ ...quizFormData, description: e.target.value })
                }
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="passingScore">Passing Score (%) *</Label>
              <Input
                id="passingScore"
                type="number"
                min="0"
                max="100"
                placeholder="70"
                value={quizFormData.passingScore}
                onChange={(e) =>
                  setQuizFormData({ ...quizFormData, passingScore: e.target.value })
                }
                required
              />
            </div>
            <div className="p-4 bg-muted/50 rounded-lg">
              <p className="text-sm text-muted-foreground">
                After creating the quiz, you can add questions by editing the quiz from the quiz
                management interface.
              </p>
            </div>
            <div className="flex gap-3 justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsQuizDialogOpen(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Create Quiz"
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
              Delete {deletingItem?.type === "material" ? "Material" : "Quiz"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this {deletingItem?.type}? This action cannot be
              undone.
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
