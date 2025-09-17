'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { FileText, Download, Maximize, Minimize, AlertCircle } from 'lucide-react';

interface PDFScheduleViewerProps {
  fileName?: string;
  filePath?: string;
  fileSize?: number;
}

export function PDFScheduleViewer({ fileName, filePath, fileSize }: PDFScheduleViewerProps) {
  const [isFullscreen, setIsFullscreen] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const handleKeyDown = React.useCallback((event: KeyboardEvent) => {
    if (event.key === 'Escape' && isFullscreen) {
      setIsFullscreen(false);
    }
  }, [isFullscreen]);

  React.useEffect(() => {
    if (isFullscreen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    } else {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'auto';
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'auto';
    };
  }, [isFullscreen, handleKeyDown]);

  if (!filePath || !fileName) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <FileText className="mx-auto h-12 w-12 opacity-50 mb-4" />
        <p>No PDF file available for viewing</p>
      </div>
    );
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleDownload = () => {
    const fileUrl = `/api/files${filePath}`;
    const link = document.createElement('a');
    link.href = fileUrl;
    link.download = fileName;
    link.click();
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  const pdfContent = (
    <div className={`${isFullscreen ? 'fixed inset-0 z-50 bg-white dark:bg-gray-900' : 'border rounded-lg'} overflow-hidden`}>
      {/* Header Controls */}
      <div className={`flex items-center justify-between p-3 border-b bg-muted/50 ${isFullscreen ? 'absolute top-0 left-0 right-0 z-10' : ''}`}>
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium truncate">{fileName}</span>
          {fileSize && (
            <span className="text-xs text-muted-foreground">
              ({formatFileSize(fileSize)})
            </span>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleDownload}>
            <Download className="h-4 w-4 mr-1" />
            Download
          </Button>
          <Button variant="outline" size="sm" onClick={toggleFullscreen}>
            {isFullscreen ? (
              <Minimize className="h-4 w-4 mr-1" />
            ) : (
              <Maximize className="h-4 w-4 mr-1" />
            )}
            {isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
          </Button>
          {isFullscreen && (
            <Button variant="outline" size="sm" onClick={() => setIsFullscreen(false)}>
              ✕
            </Button>
          )}
        </div>
      </div>

      {/* PDF Viewer */}
      <div className={`${isFullscreen ? 'absolute inset-0 pt-[60px]' : 'h-[600px]'}`}>
        <iframe
          src={`/api/files${filePath}#toolbar=1&navpanes=1&scrollbar=1&zoom=page-fit`}
          width="100%"
          height="100%"
          title={`PDF Viewer - ${fileName}`}
          className="border-0"
          onError={() => setError('Failed to load PDF. Please try downloading the file.')}
        />
      </div>

      {/* Instructions for fullscreen */}
      {isFullscreen && (
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-10">
          <div className="bg-black/75 text-white text-xs px-3 py-1 rounded">
            Press ESC to exit fullscreen
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-4">
      {pdfContent}

      {error && !isFullscreen && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-red-800 dark:text-red-200">PDF Viewer Error</p>
              <p className="text-xs text-red-700 dark:text-red-300 mt-1">{error}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}