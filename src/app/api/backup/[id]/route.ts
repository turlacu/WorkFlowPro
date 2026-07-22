import { NextRequest, NextResponse } from 'next/server';
import { Readable } from 'node:stream';
import { getFile, deleteFile } from '@/lib/minio';
import { requireUser } from '@/lib/server-auth';

const BACKUP_ID = /^backup-[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

async function resolveId(params: Promise<{ id: string }>) {
  const { id } = await params;
  return BACKUP_ID.test(id) ? id : null;
}

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireUser(['ADMIN']);
    if (auth.response) return auth.response;
    const id = await resolveId(params);
    if (!id) return NextResponse.json({ error: 'Invalid backup ID' }, { status: 400 });
    const { stream, stat } = await getFile(`backups/${id}.json`);
    return new Response(Readable.toWeb(stream) as ReadableStream, {
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': String(stat.size),
        'Content-Disposition': `attachment; filename="${id}.json"`,
        'Cache-Control': 'private, no-store',
      },
    });
  } catch {
    return NextResponse.json({ error: 'Backup file not found' }, { status: 404 });
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireUser(['ADMIN']);
    if (auth.response) return auth.response;
    const id = await resolveId(params);
    if (!id) return NextResponse.json({ error: 'Invalid backup ID' }, { status: 400 });
    await deleteFile(`backups/${id}.json`);
    return NextResponse.json({ message: 'Backup deleted successfully' });
  } catch {
    return NextResponse.json({ error: 'Backup file not found' }, { status: 404 });
  }
}
