import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// Helper function to extract text from different file types
async function extractTextFromFile(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const uint8Array = new Uint8Array(arrayBuffer);

  // For text files, just decode as UTF-8
  if (file.type.includes('text/') || file.name.endsWith('.txt')) {
    return new TextDecoder('utf-8').decode(uint8Array);
  }

  // For other file types, we'll store basic info and let the user manually add content
  // In a production environment, you'd want to integrate with libraries like:
  // - mammoth for .docx files
  // - pdf-parse for PDF files
  // - xlsx for Excel files
  return `File uploaded: ${file.name} (${file.type})
Size: ${file.size} bytes
Please edit this schedule to add the actual content.`;
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