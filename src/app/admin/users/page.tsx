"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  Search,
  Edit,
  Trash2,
  Users as UsersIcon,
  Loader2,
  ShieldCheck,
  BookOpen,
  Key,
  Filter,
} from "lucide-react";
import { toast } from "sonner";

interface User {
  id: string;
  email: string;
  name: string | null;
  image: string | null;
  isAdmin: boolean;
  createdAt: string;
  updatedAt: string;
}

interface Course {
  id: number;
  title: string;
  level: string | null;
}

export default function UserManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isEnrollDialogOpen, setIsEnrollDialogOpen] = useState(false);
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [deletingUser, setDeletingUser] = useState<User | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [editFormData, setEditFormData] = useState({
    name: "",
    email: "",
    is_admin: false,
  });

  const [enrollFormData, setEnrollFormData] = useState({
    courseId: "",
  });

  const [passwordFormData, setPasswordFormData] = useState({
    newPassword: "",
    confirmPassword: "",
  });

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem("admin_token");
      const params = new URLSearchParams();
      if (searchTerm) params.append("search", searchTerm);
      if (roleFilter !== "all") params.append("role", roleFilter);

      const response = await fetch(`/api/admin/users?${params.toString()}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setUsers(data);
      } else {
        toast.error("Failed to load users");
      }
    } catch (error) {
      toast.error("Error loading users");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCourses = async () => {
    try {
      const token = localStorage.getItem("admin_token");
      const response = await fetch("/api/admin/courses", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setCourses(data.courses || data);
      }
    } catch (error) {
      console.error("Error loading courses");
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchCourses();
  }, []);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchUsers();
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm, roleFilter]);

  const handleOpenEditDialog = (user: User) => {
    setEditingUser(user);
    setEditFormData({
      name: user.name || "",
      email: user.email,
      is_admin: user.isAdmin,
    });
    setIsEditDialogOpen(true);
  };

  const handleOpenEnrollDialog = (user: User) => {
    setEditingUser(user);
    setEnrollFormData({ courseId: "" });
    setIsEnrollDialogOpen(true);
  };

  const handleOpenPasswordDialog = (user: User) => {
    setEditingUser(user);
    setPasswordFormData({ newPassword: "", confirmPassword: "" });
    setIsPasswordDialogOpen(true);
  };

  const handleSubmitEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    setIsSubmitting(true);

    try {
      const token = localStorage.getItem("admin_token");
      const response = await fetch(`/api/admin/users/${editingUser.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(editFormData),
      });

      if (response.ok) {
        toast.success("User updated successfully");
        setIsEditDialogOpen(false);
        fetchUsers();
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to update user");
      }
    } catch (error) {
      toast.error("Error updating user");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitEnroll = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser || !enrollFormData.courseId) return;

    setIsSubmitting(true);

    try {
      const token = localStorage.getItem("admin_token");
      const response = await fetch(`/api/admin/users/${editingUser.id}/enroll`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ courseId: parseInt(enrollFormData.courseId) }),
      });

      if (response.ok) {
        toast.success("User enrolled successfully");
        setIsEnrollDialogOpen(false);
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to enroll user");
      }
    } catch (error) {
      toast.error("Error enrolling user");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    if (passwordFormData.newPassword !== passwordFormData.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    if (passwordFormData.newPassword.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }

    setIsSubmitting(true);

    try {
      const token = localStorage.getItem("admin_token");
      const response = await fetch(`/api/admin/users/${editingUser.id}/reset-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ newPassword: passwordFormData.newPassword }),
      });

      if (response.ok) {
        toast.success("Password reset successfully");
        setIsPasswordDialogOpen(false);
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to reset password");
      }
    } catch (error) {
      toast.error("Error resetting password");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingUser) return;

    try {
      const token = localStorage.getItem("admin_token");
      const response = await fetch(`/api/admin/users/${deletingUser.id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        toast.success("User deleted successfully");
        setDeletingUser(null);
        fetchUsers();
      } else {
        toast.error("Failed to delete user");
      }
    } catch (error) {
      toast.error("Error deleting user");
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-4xl font-bold">User Management</h1>
          <p className="text-muted-foreground mt-2">Loading users...</p>
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
        className="space-y-1"
      >
        <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
        <p className="text-muted-foreground">Manage users and their permissions</p>
      </motion.div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="w-5 h-5" />
              Filters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="search">Search Users</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="search"
                    placeholder="Search by name or email..."
                    className="pl-10"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="roleFilter">Filter by Role</Label>
                <Select value={roleFilter} onValueChange={setRoleFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Users</SelectItem>
                    <SelectItem value="admin">Admins Only</SelectItem>
                    <SelectItem value="user">Regular Users</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Users Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UsersIcon className="w-5 h-5" />
              All Users
            </CardTitle>
            <CardDescription>
              {users.length} {users.length === 1 ? "user" : "users"} found
            </CardDescription>
          </CardHeader>
          <CardContent>
            {users.length === 0 ? (
              <div className="text-center py-12">
                <UsersIcon className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No users found</h3>
                <p className="text-muted-foreground">Try adjusting your search filters</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">
                        {user.name || "Unnamed User"}
                      </TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        {user.isAdmin ? (
                          <Badge className="bg-primary">
                            <ShieldCheck className="w-3 h-3 mr-1" />
                            Admin
                          </Badge>
                        ) : (
                          <Badge variant="secondary">User</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {new Date(user.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleOpenEnrollDialog(user)}
                            title="Enroll in course"
                          >
                            <BookOpen className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleOpenPasswordDialog(user)}
                            title="Reset password"
                          >
                            <Key className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleOpenEditDialog(user)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setDeletingUser(user)}
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

      {/* Edit User Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>Update user information and permissions</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmitEdit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={editFormData.name}
                onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={editFormData.email}
                onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                required
              />
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="is_admin"
                checked={editFormData.is_admin}
                onChange={(e) =>
                  setEditFormData({ ...editFormData, is_admin: e.target.checked })
                }
                className="w-4 h-4"
              />
              <Label htmlFor="is_admin" className="cursor-pointer">
                Grant admin privileges
              </Label>
            </div>
            <div className="flex gap-3 justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsEditDialogOpen(false)}
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
                  "Update User"
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Enroll User Dialog */}
      <Dialog open={isEnrollDialogOpen} onOpenChange={setIsEnrollDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Enroll User in Course</DialogTitle>
            <DialogDescription>
              Manually enroll {editingUser?.name || editingUser?.email} in a course
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmitEnroll} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="courseId">Select Course</Label>
              <Select
                value={enrollFormData.courseId}
                onValueChange={(value) => setEnrollFormData({ courseId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choose a course" />
                </SelectTrigger>
                <SelectContent>
                  {Array.isArray(courses) && courses.map((course) => (
                    <SelectItem key={course.id} value={course.id.toString()}>
                      {course.title}
                      {course.level && ` - ${course.level}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-3 justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsEnrollDialogOpen(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting || !enrollFormData.courseId}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Enrolling...
                  </>
                ) : (
                  "Enroll User"
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Reset Password Dialog */}
      <Dialog open={isPasswordDialogOpen} onOpenChange={setIsPasswordDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reset User Password</DialogTitle>
            <DialogDescription>
              Set a new password for {editingUser?.name || editingUser?.email}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmitPassword} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="newPassword">New Password</Label>
              <Input
                id="newPassword"
                type="password"
                placeholder="••••••••"
                value={passwordFormData.newPassword}
                onChange={(e) =>
                  setPasswordFormData({ ...passwordFormData, newPassword: e.target.value })
                }
                required
                minLength={8}
                autoComplete="off"
              />
              <p className="text-xs text-muted-foreground">Minimum 8 characters</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="••••••••"
                value={passwordFormData.confirmPassword}
                onChange={(e) =>
                  setPasswordFormData({ ...passwordFormData, confirmPassword: e.target.value })
                }
                required
                autoComplete="off"
              />
            </div>
            <div className="flex gap-3 justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsPasswordDialogOpen(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Resetting...
                  </>
                ) : (
                  "Reset Password"
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deletingUser} onOpenChange={() => setDeletingUser(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete User</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {deletingUser?.name || deletingUser?.email}? This
              will also delete all their enrollments and progress. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive">
              Delete User
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
