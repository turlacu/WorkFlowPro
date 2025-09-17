'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, Download, ExternalLink, Eye, AlertCircle } from 'lucide-react';

interface DocumentViewerProps {
  fileName?: string;
  filePath?: string;
  mimeType?: string;
  fileSize?: number;
}

export function DocumentViewer({ fileName, filePath, mimeType, fileSize }: DocumentViewerProps) {
  const [viewMode, setViewMode] = React.useState<'info' | 'pdf' | 'office' | 'iframe'>('info');
  const [error, setError] = React.useState<string | null>(null);

  if (!filePath || !fileName) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <FileText className="mx-auto h-12 w-12 opacity-50 mb-4" />
        <p>No file available for viewing</p>
      </div>
    );
  }

  const isPDF = mimeType?.includes('pdf') || fileName.toLowerCase().endsWith('.pdf');
  const isWord = mimeType?.includes('msword') || mimeType?.includes('wordprocessingml') || 
                 fileName.toLowerCase().match(/\.(doc|docx)$/);
  const isViewable = isPDF || isWord;

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = filePath;
    link.download = fileName;
    link.click();
  };

  const handleOfficeView = () => {
    if (isWord) {
      // Use Microsoft Office Online viewer
      const officeUrl = `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(window.location.origin + filePath)}`;
      window.open(officeUrl, '_blank');
    }
  };

  const renderPDFViewer = () => {
    if (!isPDF) return null;

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="font-medium">PDF Viewer</h4>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setViewMode('info')}>
              Back to Info
            </Button>
            <Button variant="outline" size="sm" onClick={handleDownload}>
              <Download className="h-4 w-4 mr-1" />
              Download
            </Button>
          </div>
        </div>
        
        {/* PDF Embed */}
        <div className="border rounded-lg overflow-hidden">
          <iframe
            src={`${filePath}#toolbar=1&navpanes=1&scrollbar=1`}
            width="100%"
            height="600px"
            title={`PDF Viewer - ${fileName}`}
            className="border-0"
            onError={() => setError('Failed to load PDF. Please try downloading the file.')}
          />
        </div>
        
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-red-800 dark:text-red-200">Viewer Error</p>
                <p className="text-xs text-red-700 dark:text-red-300 mt-1">{error}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderWordViewer = () => {
    if (!isWord) return null;

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="font-medium">Word Document Options</h4>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setViewMode('info')}>
              Back to Info
            </Button>
            <Button variant="outline" size="sm" onClick={handleDownload}>
              <Download className="h-4 w-4 mr-1" />
              Download
            </Button>
          </div>
        </div>

        <div className="grid gap-4">
          {/* Option 1: Microsoft Office Online Viewer */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <ExternalLink className="h-4 w-4" />
                View in Microsoft Office Online
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <p className="text-xs text-muted-foreground mb-3">
                Open the document in Microsoft's online viewer (opens in new tab)
              </p>
              <Button size="sm" onClick={handleOfficeView}>
                <Eye className="h-4 w-4 mr-1" />
                Open in Office Online
              </Button>
            </CardContent>
          </Card>

          {/* Option 2: Embedded Viewer (may not work for all Word docs) */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Embedded Viewer (Beta)
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <p className="text-xs text-muted-foreground mb-3">
                Try to view the document directly in this page (may not work for all documents)
              </p>
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => setViewMode('iframe')}
              >
                <Eye className="h-4 w-4 mr-1" />
                Try Embedded View
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  };

  const renderIframeViewer = () => {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="font-medium">Document Viewer (Beta)</h4>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setViewMode('office')}>
              Back to Options
            </Button>
            <Button variant="outline" size="sm" onClick={handleDownload}>
              <Download className="h-4 w-4 mr-1" />
              Download
            </Button>
          </div>
        </div>
        
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3 mb-4">
          <p className="text-xs text-yellow-700 dark:text-yellow-300">
            This embedded viewer may not work for all document types. If the document doesn't display properly, 
            please use the "Open in Office Online" option or download the file.
          </p>
        </div>

        <div className="border rounded-lg overflow-hidden">
          <iframe
            src={`https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(window.location.origin + filePath)}`}
            width="100%"
            height="600px"
            title={`Document Viewer - ${fileName}`}
            className="border-0"
            onError={() => setError('Failed to load document in embedded viewer. Please try the Office Online option.')}
          />
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-red-800 dark:text-red-200">Viewer Error</p>
                <p className="text-xs text-red-700 dark:text-red-300 mt-1">{error}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderFileInfo = () => {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="font-medium">Document Information</h4>
          <Button variant="outline" size="sm" onClick={handleDownload}>
            <Download className="h-4 w-4 mr-1" />
            Download
          </Button>
        </div>

        <div className="bg-muted/50 rounded-lg p-4 space-y-3">
          <div className="flex items-center gap-3">
            <FileText className="h-8 w-8 text-primary" />
            <div>
              <p className="font-medium text-sm">{fileName}</p>
              <p className="text-xs text-muted-foreground">
                {mimeType || 'Unknown type'} • {fileSize ? formatFileSize(fileSize) : 'Unknown size'}
              </p>
            </div>
          </div>

          {isViewable && (
            <div className="pt-3 border-t space-y-2">
              <p className="text-sm font-medium">Viewing Options:</p>
              <div className="flex gap-2">
                {isPDF && (
                  <Button size="sm" onClick={() => setViewMode('pdf')}>
                    <Eye className="h-4 w-4 mr-1" />
                    View PDF
                  </Button>
                )}
                {isWord && (
                  <Button size="sm" onClick={() => setViewMode('office')}>
                    <Eye className="h-4 w-4 mr-1" />
                    View Document
                  </Button>
                )}
              </div>
            </div>
          )}

          {!isViewable && (
            <div className="pt-3 border-t">
              <p className="text-xs text-muted-foreground">
                This file type cannot be previewed online. Please download to view.
              </p>
            </div>
          )}
        </div>
      </div>
    );
  };

  // Render based on current view mode
  switch (viewMode) {
    case 'pdf':
      return renderPDFViewer();
    case 'office':
      return renderWordViewer();
    case 'iframe':
      return renderIframeViewer();
    default:
      return renderFileInfo();
  }
}