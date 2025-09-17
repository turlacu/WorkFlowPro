import { NextRequest, NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import path from 'path';
import { existsSync } from 'fs';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> }
) {
  try {
    // Await the params (Next.js 15 requirement)
    const params = await context.params;
    
    // Reconstruct the file path
    const filePath = params.path.join('/');
    
    // Security: Only allow access to files in the uploads directory
    if (!filePath.startsWith('uploads/schedules/')) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Construct full file path
    const fullPath = path.join(process.cwd(), 'public', filePath);
    
    // Check if file exists
    if (!existsSync(fullPath)) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }

    // Read the file
    const fileBuffer = await readFile(fullPath);
    
    // Determine content type based on file extension
    const ext = path.extname(fullPath).toLowerCase();
    let contentType = 'application/octet-stream';
    
    switch (ext) {
      case '.pdf':
        contentType = 'application/pdf';
        break;
      case '.doc':
        contentType = 'application/msword';
        break;
      case '.docx':
        contentType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
        break;
      case '.txt':
        contentType = 'text/plain';
        break;
      case '.html':
        contentType = 'text/html';
        break;
      case '.rtf':
        contentType = 'application/rtf';
        break;
    }

    // Return the file with appropriate headers
    return new Response(fileBuffer, {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `inline; filename="${path.basename(fullPath)}"`,
        'Cache-Control': 'public, max-age=3600',
      },
    });
  } catch (error) {
    console.error('Error serving file:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}