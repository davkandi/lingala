import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import { join } from 'path';
import { requireAdmin } from '@/lib/admin-auth';

export async function POST(request: NextRequest) {
  try {
    // Check admin authentication
    const admin = await requireAdmin(request);

    const data = await request.formData();
    const file: File | null = data.get('file') as unknown as File;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    // Validate file type and extension
    const allowedTypes = [
      'image/jpeg',
      'image/jpg', 
      'image/png',
      'image/webp',
      'video/mp4',
      'video/webm',
      'application/pdf'
    ];

    const allowedExtensions = ['jpg', 'jpeg', 'png', 'webp', 'mp4', 'webm', 'pdf'];
    const fileExt = file.name.split('.').pop()?.toLowerCase();

    if (!allowedTypes.includes(file.type) || !fileExt || !allowedExtensions.includes(fileExt)) {
      return NextResponse.json({ 
        error: 'Invalid file type. Allowed: images (jpg, png, webp), videos (mp4, webm), PDF' 
      }, { status: 400 });
    }

    // Validate file size (50MB max)
    const maxSize = 50 * 1024 * 1024; // 50MB
    if (file.size > maxSize) {
      return NextResponse.json({ 
        error: 'File too large. Maximum size is 50MB' 
      }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Create upload directory if it doesn't exist
    const uploadDir = join(process.cwd(), 'public', 'uploads');
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true });
    }

    // Create subdirectory based on file type
    let subDir = 'misc';
    if (file.type.startsWith('image/')) {
      subDir = 'images';
    } else if (file.type.startsWith('video/')) {
      subDir = 'videos';
    } else if (file.type === 'application/pdf') {
      subDir = 'documents';
    }

    const typeDir = join(uploadDir, subDir);
    if (!existsSync(typeDir)) {
      await mkdir(typeDir, { recursive: true });
    }

    // Generate unique filename
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const fileExtension = file.name.split('.').pop();
    const filename = `${timestamp}_${randomString}.${fileExtension}`;
    
    const filePath = join(typeDir, filename);

    // Save file
    await writeFile(filePath, buffer);

    // Return the public URL
    const publicUrl = `/uploads/${subDir}/${filename}`;

    return NextResponse.json({
      success: true,
      filename,
      url: publicUrl,
      size: file.size,
      type: file.type,
      originalName: file.name
    });

  } catch (error) {
    if (error instanceof Error && error.message === 'Admin authentication required') {
      return NextResponse.json(
        { error: 'Admin authentication required' },
        { status: 401 }
      );
    }

    console.error('File upload error:', error);
    return NextResponse.json({ 
      error: 'Failed to upload file' 
    }, { status: 500 });
  }
}