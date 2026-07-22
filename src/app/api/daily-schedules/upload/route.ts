import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { uploadFile, deleteFile } from '@/lib/minio';
import { requireUser } from '@/lib/server-auth';
import { checkRateLimit } from '@/lib/rate-limit';
import { parseDateOnly } from '@/lib/date-only';

// Helper function for PDF files
async function getPDFInfo(file: File): Promise<string> {
  return `📄 PDF Schedule Uploaded: ${file.name}

📁 File Details:
• Type: PDF Document
• Size: ${Math.round(file.size / 1024)} KB
• Uploaded: ${new Date().toLocaleString()}

✅ The PDF document has been uploaded successfully and is ready for viewing.
You can view the schedule content in the Document Viewer below.`;
}

export async function POST(request: NextRequest) {
  let uploadedObjectName: string | null = null;
  try {
    const auth = await requireUser(['ADMIN', 'PRODUCER']);
    if (auth.response) return auth.response;
    const rateLimit = checkRateLimit(`daily-upload:${auth.user.id}`, { limit: 20, windowMs: 60 * 60_000 });
    if (!rateLimit.allowed) {
      return NextResponse.json({ error: 'Too many uploads' }, { status: 429 });
    }

    const formData = await request.formData();
    const file = formData.get('file');
    const date = formData.get('date') as string;
    const titleResult = z.string().trim().min(1).max(200).safeParse(formData.get('title'));

    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    if (!date) {
      return NextResponse.json({ error: 'No date provided' }, { status: 400 });
    }

    if (!titleResult.success) {
      return NextResponse.json({ error: 'A title of at most 200 characters is required' }, { status: 400 });
    }
    const title = titleResult.data;

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'File too large. Maximum size is 10MB.' },
        { status: 400 }
      );
    }

    // Validate file type - only PDF files allowed
    const allowedTypes = ['application/pdf'];

    if (!allowedTypes.includes(file.type) || !file.name.match(/\.pdf$/i)) {
      return NextResponse.json(
        { error: 'Only PDF files are supported for daily schedules.' },
        { status: 400 }
      );
    }

    const targetDate = parseDateOnly(date);
    if (!targetDate) return NextResponse.json({ error: 'Invalid date' }, { status: 400 });

    const buffer = Buffer.from(await file.arrayBuffer());
    if (buffer.length < 5 || buffer.subarray(0, 5).toString('ascii') !== '%PDF-') {
      return NextResponse.json({ error: 'The uploaded file is not a valid PDF' }, { status: 400 });
    }
    const objectName = await uploadFile(file.name, buffer, 'application/pdf');
    uploadedObjectName = objectName;
    const filePath = `/uploads/${objectName}`;

    // Generate PDF info content
    let content: string;
    try {
      content = await getPDFInfo(file);
    } catch (error) {
      console.error('Error generating PDF info:', error);
      content = `PDF uploaded: ${file.name} (${Math.round(file.size / 1024)} KB)`;
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
          uploadedBy: auth.user.id,
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
          uploadedBy: auth.user.id,
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

    if (existingSchedule?.filePath && existingSchedule.filePath !== filePath) {
      const oldObjectName = existingSchedule.filePath.replace(/^\/uploads\//, '');
      await deleteFile(oldObjectName).catch((error) => console.error('Failed to delete replaced file:', error));
    }

    uploadedObjectName = null;
    return NextResponse.json({
      success: true,
      schedule,
      message: existingSchedule
        ? 'Schedule updated successfully'
        : 'Schedule uploaded successfully',
    });
  } catch (error) {
    if (uploadedObjectName) {
      await deleteFile(uploadedObjectName).catch(() => undefined);
    }
    console.error('Error uploading daily schedule:', error);
    return NextResponse.json(
      { error: 'Failed to upload daily schedule' },
      { status: 500 }
    );
  }
}
