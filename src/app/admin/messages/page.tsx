"use client";

import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { MessageSquare, Mail, Users, Bell } from "lucide-react";

export default function Messages() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-4xl font-bold">Student Messages</h1>
        <p className="text-muted-foreground mt-2">
          Communicate with students and manage support requests
        </p>
      </motion.div>

      {/* Coming Soon Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <Card className="border-2 border-dashed">
          <CardContent className="py-16">
            <div className="text-center max-w-md mx-auto">
              <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-primary/10 flex items-center justify-center">
                <MessageSquare className="w-10 h-10 text-primary" />
              </div>
              <h3 className="text-2xl font-bold mb-2">Messaging System</h3>
              <p className="text-muted-foreground mb-8">
                Student messaging and support features are coming soon. This section will include:
              </p>
              <div className="space-y-4 text-left">
                <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                  <Mail className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium">Direct Messaging</p>
                    <p className="text-sm text-muted-foreground">
                      Send and receive messages from students
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                  <Users className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium">Support Tickets</p>
                    <p className="text-sm text-muted-foreground">
                      Manage and respond to student support requests
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                  <Bell className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium">Announcements</p>
                    <p className="text-sm text-muted-foreground">
                      Broadcast important updates to all students
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                  <MessageSquare className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium">Chat History</p>
                    <p className="text-sm text-muted-foreground">
                      Access and search previous conversations
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
