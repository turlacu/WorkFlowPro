import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

// Helper function to save uploaded file to disk
async function saveUploadedFile(file: File, fileName: string): Promise<string> {
  try {
    // Create uploads directory if it doesn't exist
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'schedules');
    await mkdir(uploadsDir, { recursive: true });

    // Create unique filename with timestamp
    const timestamp = Date.now();
    const fileExtension = path.extname(fileName);
    const baseName = path.basename(fileName, fileExtension);
    const uniqueFileName = `${timestamp}-${baseName}${fileExtension}`;
    const filePath = path.join(uploadsDir, uniqueFileName);

    // Save file
    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(filePath, buffer);

    // Return public URL path
    return `/uploads/schedules/${uniqueFileName}`;
  } catch (error) {
    console.error('Error saving file:', error);
    throw new Error('Failed to save file');
  }
}

// Helper function to extract text from different file types
async function extractTextFromFile(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const uint8Array = new Uint8Array(arrayBuffer);

  // For text files, just decode as UTF-8
  if (file.type.includes('text/') || file.name.endsWith('.txt')) {
    return new TextDecoder('utf-8').decode(uint8Array);
  }

  // For .doc/.docx files and other binary formats, provide helpful instructions
  if (file.name.endsWith('.doc') || file.name.endsWith('.docx') || file.type.includes('msword')) {
    return `📄 Document File Uploaded: ${file.name}

📁 File Details:
• Type: ${file.type || 'Microsoft Word Document'}
• Size: ${Math.round(file.size / 1024)} KB

📝 Content Extraction Notice:
This is a Microsoft Word document (.doc/.docx file). The document has been uploaded successfully, but automatic text extraction is not available for this file format.

✏️ To display the schedule content:
1. Click the "Edit" button above
2. Copy the content from your original document
3. Paste it into the text area
4. Save your changes

The file has been stored and is ready for manual content entry.`;
  }

  // For PDF files
  if (file.name.endsWith('.pdf') || file.type.includes('pdf')) {
    return `📄 PDF File Uploaded: ${file.name}

📁 File Details:
• Type: PDF Document
• Size: ${Math.round(file.size / 1024)} KB

📝 Content Extraction Notice:
This is a PDF file. The document has been uploaded successfully, but automatic text extraction is not available for PDF files.

✏️ To display the schedule content:
1. Click the "Edit" button above
2. Copy the content from your PDF document
3. Paste it into the text area
4. Save your changes

The file has been stored and is ready for manual content entry.`;
  }

  // For other file types
  return `📄 File Uploaded: ${file.name}

📁 File Details:
• Type: ${file.type || 'Unknown'}
• Size: ${Math.round(file.size / 1024)} KB

📝 Content Extraction Notice:
The file has been uploaded successfully, but automatic content extraction is not available for this file format.

✏️ To display the schedule content:
1. Click the "Edit" button above
2. Copy the content from your original document
3. Paste it into the text area
4. Save your changes

The file has been stored and is ready for manual content entry.`;
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only ADMIN and PRODUCER can upload daily schedules
    if (!['ADMIN', 'PRODUCER'].includes(session.user.role)) {
      return NextResponse.json(
        { error: 'Forbidden - Only admins and producers can upload daily schedules' },
        { status: 403 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const date = formData.get('date') as string;
    const title = formData.get('title') as string;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    if (!date) {
      return NextResponse.json({ error: 'No date provided' }, { status: 400 });
    }

    if (!title) {
      return NextResponse.json({ error: 'No title provided' }, { status: 400 });
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'File too large. Maximum size is 10MB.' },
        { status: 400 }
      );
    }

    // Validate file type
    const allowedTypes = [
      'text/plain',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/pdf',
      'text/html',
      'application/rtf',
    ];

    if (!allowedTypes.includes(file.type) && !file.name.match(/\.(txt|doc|docx|pdf|html|rtf)$/i)) {
      return NextResponse.json(
        { error: 'Unsupported file type. Allowed: .txt, .doc, .docx, .pdf, .html, .rtf' },
        { status: 400 }
      );
    }

    const targetDate = new Date(date);
    targetDate.setHours(0, 0, 0, 0);

    // Save file to disk
    let filePath: string;
    try {
      filePath = await saveUploadedFile(file, file.name);
    } catch (error) {
      console.error('Error saving file:', error);
      return NextResponse.json(
        { error: 'Failed to save uploaded file' },
        { status: 500 }
      );
    }

    // Extract text content from file
    let content: string;
    try {
      content = await extractTextFromFile(file);
    } catch (error) {
      console.error('Error extracting text from file:', error);
      content = `Error reading file content. File: ${file.name} (${file.type})`;
    }

    // Check if schedule already exists for this date
    const existingSchedule = await prisma.dailySchedule.findUnique({
      where: { date: targetDate },
    });

    let schedule;

    if (existingSchedule) {
      // Update existing schedule
      schedule = await prisma.dailySchedule.update({
        where: { date: targetDate },
        data: {
          title,
          content,
          fileName: file.name,
          fileSize: file.size,
          mimeType: file.type,
          filePath,
          uploadedBy: session.user.id,
        },
        include: {
          uploader: {
            select: {
              id: true,
              name: true,
              role: true,
            },
          },
        },
      });
    } else {
      // Create new schedule
      schedule = await prisma.dailySchedule.create({
        data: {
          date: targetDate,
          title,
          content,
          fileName: file.name,
          fileSize: file.size,
          mimeType: file.type,
          filePath,
          uploadedBy: session.user.id,
        },
        include: {
          uploader: {
            select: {
              id: true,
              name: true,
              role: true,
            },
          },
        },
      });
    }

    return NextResponse.json({
      success: true,
      schedule,
      message: existingSchedule
        ? 'Schedule updated successfully'
        : 'Schedule uploaded successfully',
    });
  } catch (error) {
    console.error('Error uploading daily schedule:', error);
    return NextResponse.json(
      { error: 'Failed to upload daily schedule' },
      { status: 500 }
    );
  }
}