import { NextRequest, NextResponse } from 'next/server';
import { Readable } from 'node:stream';
import { prisma } from '@/lib/prisma';
import { getFile } from '@/lib/minio';
import { requireUser } from '@/lib/server-auth';
import { safeDownloadName } from '@/lib/safe-path';

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ path: string[] }> },
) {
  try {
    const auth = await requireUser();
    if (auth.response) return auth.response;

    const { path } = await context.params;
    if (path.length !== 3 || path[0] !== 'uploads' || path[1] !== 'schedules' || !path[2]) {
      return NextResponse.json({ error: 'Invalid file path' }, { status: 400 });
    }

    const publicPath = `/${path.join('/')}`;
    const schedule = await prisma.dailySchedule.findFirst({
      where: { filePath: publicPath },
      select: { fileName: true, mimeType: true },
    });
    if (!schedule?.fileName) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }

    const objectName = `schedules/${path[2]}`;
    const { stream, stat } = await getFile(objectName);
    return new Response(Readable.toWeb(stream) as ReadableStream, {
      headers: {
        'Content-Type': schedule.mimeType || 'application/octet-stream',
        'Content-Length': String(stat.size),
        'Content-Disposition': `inline; filename="${safeDownloadName(schedule.fileName)}"`,
        'Cache-Control': 'private, no-store',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch (error) {
    console.error('Error serving file:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
