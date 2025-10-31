"use client";

import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, TrendingUp, Users, BookOpen, Activity } from "lucide-react";

export default function Analytics() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-4xl font-bold">Analytics & Reports</h1>
        <p className="text-muted-foreground mt-2">
          Track performance and generate reports
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
                <BarChart3 className="w-10 h-10 text-primary" />
              </div>
              <h3 className="text-2xl font-bold mb-2">Analytics Dashboard</h3>
              <p className="text-muted-foreground mb-8">
                Detailed analytics and reporting features are coming soon. This section will
                include:
              </p>
              <div className="space-y-4 text-left">
                <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                  <TrendingUp className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium">Course Performance Metrics</p>
                    <p className="text-sm text-muted-foreground">
                      Track completion rates, engagement, and student progress
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                  <Users className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium">User Activity Reports</p>
                    <p className="text-sm text-muted-foreground">
                      Monitor user engagement and learning patterns
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                  <BookOpen className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium">Content Analytics</p>
                    <p className="text-sm text-muted-foreground">
                      Analyze which lessons and materials are most effective
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                  <Activity className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium">Revenue & Growth Tracking</p>
                    <p className="text-sm text-muted-foreground">
                      Monitor enrollments, revenue, and platform growth
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
