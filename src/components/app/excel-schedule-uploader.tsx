'use client';

import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Upload, FileSpreadsheet, CheckCircle, AlertCircle, Users, Calendar } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getTranslation } from '@/lib/translations';
import { useLanguage } from '@/contexts/LanguageContext';

interface ScheduleEntry {
  name: string;
  date: string;
  shiftHours?: string;
  shiftColor?: string;
  shiftName?: string;
  matchedUserId?: string;
  matchedUserName?: string;
  colorLegendMatch?: unknown;
}

interface MatchingReport {
  totalEntries: number;
  matchedUsers: number;
  unmatchedUsers: number;
  unmatchedNames: string[];
  duplicates: string[];
}

interface ExcelScheduleUploaderProps {
  selectedDate?: Date;
  onUploadComplete?: () => void;
}

export function ExcelScheduleUploader({ selectedDate, onUploadComplete }: ExcelScheduleUploaderProps) {
  const [file, setFile] = React.useState<File | null>(null);
  const [uploading, setUploading] = React.useState(false);
  const [previewData, setPreviewData] = React.useState<ScheduleEntry[]>([]);
  const [matchingReport, setMatchingReport] = React.useState<MatchingReport | null>(null);
  const [showPreview, setShowPreview] = React.useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = React.useState(false);

  const { currentLang } = useLanguage();
  const { toast } = useToast();

  const currentMonth = selectedDate ? selectedDate.getMonth() + 1 : new Date().getMonth() + 1;
  const currentYear = selectedDate ? selectedDate.getFullYear() : new Date().getFullYear();

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      if (!selectedFile.name.match(/\.(xls|xlsx)$/i)) {
        toast({
          title: 'Invalid File',
          description: 'Please select an Excel file (.xls or .xlsx)',
          variant: 'destructive',
        });
        return;
      }
      setFile(selectedFile);
      setPreviewData([]);
      setMatchingReport(null);
      setShowPreview(false);
    }
  };

  const handlePreview = async () => {
    if (!file) return;

    try {
      setUploading(true);
      const formData = new FormData();
      formData.append('file', file);
      formData.append('month', currentMonth.toString());
      formData.append('year', currentYear.toString());
      formData.append('preview', 'true');

      const response = await fetch('/api/team-schedule/upload-excel', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to process file');
      }

      const result = await response.json();
      setPreviewData(result.data || []);
      setMatchingReport(result.matchingReport);
      setShowPreview(true);

      toast({
        title: 'Preview Generated',
        description: `Found ${result.data?.length || 0} schedule entries.`,
      });
    } catch (error) {
      console.error('Error generating preview:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to process Excel file.',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
    }
  };

  const handleImport = async () => {
    if (!file) return;

    try {
      setUploading(true);
      const formData = new FormData();
      formData.append('file', file);
      formData.append('month', currentMonth.toString());
      formData.append('year', currentYear.toString());
      formData.append('preview', 'false');

      const response = await fetch('/api/team-schedule/upload-excel', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to import schedule');
      }

      const result = await response.json();
      
      toast({
        title: 'Import Successful',
        description: `Successfully imported ${result.imported} schedule entries for ${getMonthName(currentMonth)} ${currentYear}.`,
      });

      // Reset form
      setFile(null);
      setPreviewData([]);
      setMatchingReport(null);
      setShowPreview(false);
      setShowConfirmDialog(false);

      // Clear file input
      const fileInput = document.getElementById('excel-file') as HTMLInputElement;
      if (fileInput) fileInput.value = '';

      // Notify parent component
      onUploadComplete?.();

    } catch (error) {
      console.error('Error importing schedule:', error);
      toast({
        title: 'Import Failed',
        description: error instanceof Error ? error.message : 'Failed to import schedule.',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
      setShowConfirmDialog(false);
    }
  };

  const getMonthName = (month: number): string => {
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    return months[month - 1];
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" />
            Excel Schedule Upload
          </CardTitle>
          <CardDescription>
            Upload an Excel file to automatically populate the schedule for {getMonthName(currentMonth)} {currentYear}.
            Only operators from the Excel file that match existing users will be imported.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="excel-file">Select Excel File (.xls, .xlsx)</Label>
            <Input
              id="excel-file"
              type="file"
              accept=".xls,.xlsx"
              onChange={handleFileSelect}
              className="mt-1"
            />
          </div>

          {file && (
            <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
              <FileSpreadsheet className="h-4 w-4" />
              <span className="text-sm">{file.name}</span>
              <span className="text-xs text-muted-foreground">
                ({Math.round(file.size / 1024)} KB)
              </span>
            </div>
          )}

          <div className="flex gap-2">
            <Button
              onClick={handlePreview}
              disabled={!file || uploading}
              variant="outline"
            >
              {uploading ? 'Processing...' : 'Preview Import'}
            </Button>
            
            {previewData.length > 0 && (
              <Button
                onClick={() => setShowConfirmDialog(true)}
                disabled={uploading}
              >
                <Upload className="h-4 w-4 mr-2" />
                Import Schedule
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Preview Modal */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Import Preview</DialogTitle>
            <DialogDescription>
              Review the schedule data before importing. Only entries with matched users will be imported.
            </DialogDescription>
          </DialogHeader>

          {matchingReport && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold">{matchingReport.totalEntries}</div>
                  <div className="text-sm text-muted-foreground">Total Entries</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-green-600">{matchingReport.matchedUsers}</div>
                  <div className="text-sm text-muted-foreground">Matched Users</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-red-600">{matchingReport.unmatchedUsers}</div>
                  <div className="text-sm text-muted-foreground">Unmatched Users</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-yellow-600">{matchingReport.duplicates.length}</div>
                  <div className="text-sm text-muted-foreground">Duplicates</div>
                </CardContent>
              </Card>
            </div>
          )}

          <div className="max-h-96 overflow-y-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Status</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Shift Hours</TableHead>
                  <TableHead>Shift & Color</TableHead>
                  <TableHead>Matched User</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {previewData.map((entry, index) => (
                  <TableRow key={index}>
                    <TableCell>
                      {entry.matchedUserId ? (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      ) : (
                        <AlertCircle className="h-4 w-4 text-red-600" />
                      )}
                    </TableCell>
                    <TableCell>{entry.name}</TableCell>
                    <TableCell>{formatDate(entry.date)}</TableCell>
                    <TableCell>{entry.shiftHours}</TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        {entry.shiftName && (
                          <Badge variant="outline" className="text-xs">
                            {entry.shiftName}
                          </Badge>
                        )}
                        {entry.shiftColor && (
                          <div className="flex items-center gap-2">
                            <div
                              className="w-4 h-4 rounded border"
                              style={{ backgroundColor: entry.shiftColor }}
                            />
                            <span className="text-xs">{entry.shiftColor}</span>
                          </div>
                        )}
                        {!entry.shiftColor && (
                          <span className="text-xs text-muted-foreground">No color detected</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {entry.matchedUserName ? (
                        <Badge variant="outline">{entry.matchedUserName}</Badge>
                      ) : (
                        <Badge variant="destructive">Not Found</Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {matchingReport && matchingReport.unmatchedNames.length > 0 && (
            <div className="mt-4">
              <h4 className="font-semibold mb-2">Unmatched Names (will be ignored):</h4>
              <div className="flex flex-wrap gap-2">
                {matchingReport.unmatchedNames.map((name, index) => (
                  <Badge key={index} variant="secondary">{name}</Badge>
                ))}
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPreview(false)}>
              Close Preview
            </Button>
            <Button
              onClick={() => setShowConfirmDialog(true)}
              disabled={previewData.filter(e => e.matchedUserId).length === 0}
            >
              Import {previewData.filter(e => e.matchedUserId).length} Entries
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirm Import Dialog */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Schedule Import</AlertDialogTitle>
            <AlertDialogDescription>
              This will replace all existing operator schedules for {getMonthName(currentMonth)} {currentYear} with the data from the Excel file.
              Are you sure you want to continue?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={uploading}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleImport} disabled={uploading}>
              {uploading ? 'Importing...' : 'Import Schedule'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}