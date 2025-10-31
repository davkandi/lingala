"use client";

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileUpload } from '@/components/admin/FileUpload';
import { Upload, Search, Filter, Grid, List, Image as ImageIcon, Video, FileText } from 'lucide-react';

interface UploadedFile {
  filename: string;
  url: string;
  size: number;
  type: string;
  originalName: string;
}

export default function MediaManagementPage() {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const handleUploadComplete = (fileInfo: UploadedFile) => {
    setUploadedFiles(prev => [fileInfo, ...prev]);
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5 },
    },
  };

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return <ImageIcon className="w-6 h-6 text-blue-500" />;
    if (type.startsWith('video/')) return <Video className="w-6 h-6 text-purple-500" />;
    if (type === 'application/pdf') return <FileText className="w-6 h-6 text-red-500" />;
    return <FileText className="w-6 h-6 text-gray-500" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const filteredFiles = uploadedFiles.filter(file =>
    file.originalName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="space-y-1"
      >
        <h1 className="text-3xl font-bold tracking-tight">Media Management</h1>
        <p className="text-muted-foreground">
          Upload and manage course thumbnails, videos, and documents
        </p>
      </motion.div>

      <Tabs defaultValue="upload" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 max-w-md">
          <TabsTrigger value="upload" className="flex items-center gap-2">
            <Upload className="w-4 h-4" />
            Upload Files
          </TabsTrigger>
          <TabsTrigger value="library" className="flex items-center gap-2">
            <Grid className="w-4 h-4" />
            Media Library
          </TabsTrigger>
        </TabsList>

        <TabsContent value="upload" className="space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="w-5 h-5" />
                  Upload New Files
                </CardTitle>
                <CardDescription>
                  Upload images, videos, and documents for your courses
                </CardDescription>
              </CardHeader>
              <CardContent>
                <FileUpload
                  onUploadComplete={handleUploadComplete}
                  maxSize={50}
                  accept="image/*,video/*,.pdf"
                />
              </CardContent>
            </Card>
          </motion.div>

          {/* Upload Guidelines */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Card>
              <CardHeader>
                <CardTitle>Upload Guidelines</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <ImageIcon className="w-5 h-5 text-blue-500" />
                      <h3 className="font-semibold">Images</h3>
                    </div>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• Formats: JPG, PNG, WebP</li>
                      <li>• Max size: 10MB</li>
                      <li>• Recommended: 1920x1080px</li>
                      <li>• Use for course thumbnails</li>
                    </ul>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Video className="w-5 h-5 text-purple-500" />
                      <h3 className="font-semibold">Videos</h3>
                    </div>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• Formats: MP4, WebM</li>
                      <li>• Max size: 50MB</li>
                      <li>• Recommended: 1080p</li>
                      <li>• Use for lesson content</li>
                    </ul>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <FileText className="w-5 h-5 text-red-500" />
                      <h3 className="font-semibold">Documents</h3>
                    </div>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• Formats: PDF</li>
                      <li>• Max size: 25MB</li>
                      <li>• Use for course materials</li>
                      <li>• Worksheets and guides</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>

        <TabsContent value="library" className="space-y-6">
          {/* Search and Filter */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Grid className="w-5 h-5" />
                  Media Library
                </CardTitle>
                <CardDescription>
                  Browse and manage your uploaded files
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4 mb-6">
                  <div className="flex-1">
                    <Label htmlFor="search">Search Files</Label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="search"
                        placeholder="Search by filename..."
                        className="pl-10"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant={viewMode === 'grid' ? 'default' : 'outline'}
                      size="icon"
                      onClick={() => setViewMode('grid')}
                    >
                      <Grid className="w-4 h-4" />
                    </Button>
                    <Button
                      variant={viewMode === 'list' ? 'default' : 'outline'}
                      size="icon"
                      onClick={() => setViewMode('list')}
                    >
                      <List className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {/* File Grid/List */}
                {filteredFiles.length === 0 ? (
                  <div className="text-center py-12">
                    <Upload className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No files uploaded yet</h3>
                    <p className="text-muted-foreground mb-4">
                      Upload your first file to get started
                    </p>
                    <Button onClick={() => document.querySelector('[value="upload"]')?.click()}>
                      Upload Files
                    </Button>
                  </div>
                ) : (
                  <motion.div
                    className={viewMode === 'grid' 
                      ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
                      : "space-y-2"
                    }
                    initial="hidden"
                    animate="visible"
                    variants={containerVariants}
                  >
                    {filteredFiles.map((file, index) => (
                      <motion.div key={index} variants={itemVariants}>
                        {viewMode === 'grid' ? (
                          <Card className="overflow-hidden hover:shadow-lg transition-shadow">
                            <CardContent className="p-4">
                              <div className="aspect-square bg-muted rounded-lg mb-3 flex items-center justify-center">
                                {file.type.startsWith('image/') ? (
                                  <img 
                                    src={file.url} 
                                    alt={file.originalName}
                                    className="w-full h-full object-cover rounded-lg"
                                  />
                                ) : (
                                  getFileIcon(file.type)
                                )}
                              </div>
                              <h3 className="font-medium text-sm truncate" title={file.originalName}>
                                {file.originalName}
                              </h3>
                              <p className="text-xs text-muted-foreground">
                                {formatFileSize(file.size)}
                              </p>
                              <div className="flex gap-2 mt-3">
                                <Button size="sm" variant="outline" className="flex-1"
                                  onClick={() => window.open(file.url, '_blank')}>
                                  View
                                </Button>
                                <Button size="sm" variant="outline" className="flex-1"
                                  onClick={() => navigator.clipboard.writeText(file.url)}>
                                  Copy URL
                                </Button>
                              </div>
                            </CardContent>
                          </Card>
                        ) : (
                          <Card>
                            <CardContent className="p-3">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  {getFileIcon(file.type)}
                                  <div>
                                    <p className="font-medium text-sm">{file.originalName}</p>
                                    <p className="text-xs text-muted-foreground">
                                      {formatFileSize(file.size)}
                                    </p>
                                  </div>
                                </div>
                                <div className="flex gap-2">
                                  <Button size="sm" variant="outline"
                                    onClick={() => window.open(file.url, '_blank')}>
                                    View
                                  </Button>
                                  <Button size="sm" variant="outline"
                                    onClick={() => navigator.clipboard.writeText(file.url)}>
                                    Copy URL
                                  </Button>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        )}
                      </motion.div>
                    ))}
                  </motion.div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
