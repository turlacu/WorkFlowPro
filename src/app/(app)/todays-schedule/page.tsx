
'use client';

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useLanguage } from '@/contexts/LanguageContext';
import { getTranslation } from '@/lib/translations';
import { CalendarClock, UploadCloud, FileText, Loader2, ClipboardList } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';

// Default current user role - will be replaced with actual auth context
const DEFAULT_CURRENT_USER_ROLE: 'ADMIN' | 'PRODUCER' | 'OPERATOR' = 'ADMIN';

export default function TodaysSchedulePage() {
  const { currentLang } = useLanguage();
  const { toast } = useToast();
  const router = useRouter();
  const [selectedFile, setSelectedFile] = React.useState<File | null>(null);
  const [scheduleHtmlContent, setScheduleHtmlContent] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const canUpload = DEFAULT_CURRENT_USER_ROLE === 'ADMIN' || DEFAULT_CURRENT_USER_ROLE === 'PRODUCER';

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setSelectedFile(event.target.files[0]);
    } else {
      setSelectedFile(null);
    }
  };

  const handleFileUpload = async () => {
    if (!selectedFile) {
      toast({
        title: getTranslation(currentLang, 'Error'),
        description: getTranslation(currentLang, 'NoDocFileSelected'),
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    toast({
      title: getTranslation(currentLang, 'ProcessingDocUpload'),
      description: getTranslation(currentLang, 'FileSelectedMessage', { fileName: selectedFile.name }),
    });

    // Simulate file processing
    await new Promise(resolve => setTimeout(resolve, 2000));

    // File processing would normally parse .doc/.docx content server-side
    // For now, just show a success message without content
    const emptyContent = `
      <h2 style="font-weight: bold; font-size: 1.2em; margin-bottom: 10px;">${getTranslation(currentLang, 'ScheduleContentTabTitle')} for ${selectedFile.name}</h2>
      <p><em>${getTranslation(currentLang, 'DocUploadSuccess', { fileName: selectedFile.name })}</em></p>
      <p style="margin-top: 15px;">No schedule content available. Upload processing needs backend implementation.</p>
    `;
    setScheduleHtmlContent(emptyContent);
    setIsLoading(false);
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = ''; // Attempt to clear the file input
    }

    toast({
      title: getTranslation(currentLang, 'DocUploadSuccess', { fileName: selectedFile.name }),
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">
          {getTranslation(currentLang, 'TodaysScheduleDashboardTitle')}
        </h1>
      </div>

      {canUpload && (
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center">
              <UploadCloud className="mr-2 h-5 w-5 text-primary" />
              {getTranslation(currentLang, 'UploadScheduleDocTitle')}
            </CardTitle>
            <CardDescription>
              {getTranslation(currentLang, 'UploadScheduleDocDescription')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid w-full max-w-sm items-center gap-1.5">
              <label htmlFor="doc-file-upload" className="text-sm font-medium">
                {getTranslation(currentLang, 'SelectDocFileLabel')}
              </label>
              <Input
                id="doc-file-upload"
                ref={fileInputRef}
                type="file"
                accept=".doc,.docx,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                onChange={handleFileChange}
                className="text-sm"
                disabled={isLoading}
              />
            </div>
            {selectedFile && (
              <p className="text-sm text-muted-foreground">
                {getTranslation(currentLang, 'DocFileSelected', { fileName: selectedFile.name })}
              </p>
            )}
            <Button onClick={handleFileUpload} disabled={!selectedFile || isLoading}>
              {isLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <UploadCloud className="mr-2 h-4 w-4" />
              )}
              {getTranslation(currentLang, 'UploadDocButton')}
            </Button>
          </CardContent>
        </Card>
      )}

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center">
            <FileText className="mr-2 h-5 w-5 text-primary" />
            {getTranslation(currentLang, 'ScheduleContentTabTitle')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {scheduleHtmlContent ? (
            <div
              className="prose dark:prose-invert max-w-none p-4 border rounded-md bg-muted/20 min-h-[200px]"
              dangerouslySetInnerHTML={{ __html: scheduleHtmlContent }}
            />
          ) : (
            <div className="text-center py-10 text-muted-foreground">
              <CalendarClock className="mx-auto h-12 w-12 opacity-50" />
              <p className="mt-4">
                {getTranslation(currentLang, 'NoScheduleUploadedYet')}
              </p>
              {!canUpload && (
                <p className="text-xs mt-1">
                  {getTranslation(currentLang, 'TodaysSchedulePlaceholder')}
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
