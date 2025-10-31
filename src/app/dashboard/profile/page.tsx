"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/lib/auth-client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { Loader2, User, Mail, Calendar } from "lucide-react";

export default function ProfilePage() {
  const { data: session, isPending, refetch } = useSession();
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
  });

  useEffect(() => {
    if (!isPending && !session?.user) {
      router.push("/login");
    }
  }, [session, isPending, router]);

  useEffect(() => {
    if (session?.user) {
      setFormData({
        name: session.user.name || "",
        email: session.user.email || "",
      });
    }
  }, [session]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      // TODO: Implement profile update API endpoint
      // For now, just simulate a successful update
      await new Promise((resolve) => setTimeout(resolve, 1000));
      
      toast.success("Profile updated successfully!");
      setIsEditing(false);
      refetch();
    } catch (error) {
      toast.error("Failed to update profile");
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  if (isPending) {
    return (
      <div className="container py-12">
        <div className="max-w-2xl mx-auto space-y-8">
          <Skeleton className="h-12 w-48" />
          <Card>
            <CardHeader>
              <Skeleton className="h-24 w-24 rounded-full mx-auto" />
            </CardHeader>
            <CardContent className="space-y-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!session?.user) return null;

  return (
    <div className="container py-12">
      <div className="max-w-2xl mx-auto space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl md:text-4xl font-bold mb-2">Profile Settings</h1>
          <p className="text-muted-foreground">
            Manage your account information and preferences
          </p>
        </div>

        {/* Profile Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-6">
              <Avatar className="w-24 h-24">
                <AvatarImage src={session.user.image || ""} alt={session.user.name || ""} />
                <AvatarFallback className="bg-primary text-primary-foreground text-2xl">
                  {session.user.name?.charAt(0).toUpperCase() || "U"}
                </AvatarFallback>
              </Avatar>
              <div>
                <CardTitle className="text-2xl">{session.user.name}</CardTitle>
                <CardDescription>{session.user.email}</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSave} className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="name"
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      disabled={!isEditing || isSaving}
                      className="pl-10"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      disabled={!isEditing || isSaving}
                      className="pl-10"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Member Since</Label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="text"
                      value={
                        session.user.createdAt
                          ? new Date(session.user.createdAt).toLocaleDateString("en-US", {
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                            })
                          : "N/A"
                      }
                      disabled
                      className="pl-10 bg-muted"
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-4">
                {isEditing ? (
                  <>
                    <Button type="submit" disabled={isSaving}>
                      {isSaving ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        "Save Changes"
                      )}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setIsEditing(false);
                        setFormData({
                          name: session.user.name || "",
                          email: session.user.email || "",
                        });
                      }}
                      disabled={isSaving}
                    >
                      Cancel
                    </Button>
                  </>
                ) : (
                  <Button type="button" onClick={() => setIsEditing(true)}>
                    Edit Profile
                  </Button>
                )}
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Statistics Card */}
        <Card>
          <CardHeader>
            <CardTitle>Learning Statistics</CardTitle>
            <CardDescription>Your progress and achievements</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-muted rounded-lg">
                <div className="text-2xl font-bold text-primary">0</div>
                <div className="text-sm text-muted-foreground">Courses Completed</div>
              </div>
              <div className="text-center p-4 bg-muted rounded-lg">
                <div className="text-2xl font-bold text-primary">0</div>
                <div className="text-sm text-muted-foreground">Hours Learned</div>
              </div>
              <div className="text-center p-4 bg-muted rounded-lg">
                <div className="text-2xl font-bold text-primary">0</div>
                <div className="text-sm text-muted-foreground">Certificates</div>
              </div>
              <div className="text-center p-4 bg-muted rounded-lg">
                <div className="text-2xl font-bold text-primary">0</div>
                <div className="text-sm text-muted-foreground">Day Streak</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Account Actions */}
        <Card className="border-destructive/50">
          <CardHeader>
            <CardTitle className="text-destructive">Danger Zone</CardTitle>
            <CardDescription>Irreversible account actions</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium">Delete Account</h4>
                <p className="text-sm text-muted-foreground">
                  Permanently delete your account and all data
                </p>
              </div>
              <Button variant="destructive" size="sm">
                Delete Account
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
