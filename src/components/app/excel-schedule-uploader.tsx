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
import { Upload, FileSpreadsheet, CheckCircle, AlertCircle, Users, Calendar, Palette } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getTranslation } from '@/lib/translations';
import { useLanguage } from '@/contexts/LanguageContext';
import { ColorMappingDialog } from './color-mapping-dialog';

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
  const [detectedColors, setDetectedColors] = React.useState<string[]>([]);
  const [showColorMapping, setShowColorMapping] = React.useState(false);
  const [existingColorMappings, setExistingColorMappings] = React.useState<any[]>([]);

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
      
      // Extract unique colors from preview data
      const colors = [...new Set(
        (result.data || [])
          .filter((entry: ScheduleEntry) => entry.shiftColor)
          .map((entry: ScheduleEntry) => entry.shiftColor!)
      )] as string[];
      setDetectedColors(colors);
      
      setShowPreview(true);

      toast({
        title: 'Preview Generated',
        description: `Found ${result.data?.length || 0} schedule entries${colors.length > 0 ? ` with ${colors.length} different colors` : ''}.`,
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
      
      let description = `Successfully imported ${result.imported} schedule entries for ${getMonthName(currentMonth)} ${currentYear}.`;
      
      if (result.newColorsDetected && result.newColorsDetected > 0) {
        description += ` ${result.newColorsDetected} new colors were detected and added to the color legend. Please configure them in the Color Legend tab.`;
      }
      
      toast({
        title: 'Import Successful',
        description: description,
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

  // Fetch existing color mappings
  React.useEffect(() => {
    const fetchColorMappings = async () => {
      try {
        const response = await fetch('/api/shift-color-legend');
        if (response.ok) {
          const mappings = await response.json();
          setExistingColorMappings(mappings);
        }
      } catch (error) {
        console.error('Error fetching color mappings:', error);
      }
    };
    fetchColorMappings();
  }, []);

  const handleColorMappingSave = async (mappings: any[]) => {
    try {
      const errors: string[] = [];
      
      // Save each mapping with proper error handling
      for (const mapping of mappings) {
        try {
          // Check if mapping already exists
          const existingMapping = existingColorMappings.find(
            existing => existing.colorCode.toLowerCase() === mapping.colorCode.toLowerCase()
          );
          
          const method = existingMapping ? 'PUT' : 'POST';
          const body = existingMapping ? { ...mapping, id: existingMapping.id } : mapping;
          
          console.log(`${method} request for color mapping:`, body);
          
          const response = await fetch('/api/shift-color-legend', {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
          });
          
          if (!response.ok) {
            const errorData = await response.json();
            console.error(`Failed to save mapping for ${mapping.colorCode}:`, errorData);
            
            if (response.status === 400 && errorData.error === 'Color code already exists') {
              // Try to update instead
              if (method === 'POST') {
                console.log('Attempting to update existing color instead...');
                const updateResponse = await fetch('/api/shift-color-legend', {
                  method: 'PUT',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ ...mapping, id: existingMapping?.id }),
                });
                
                if (!updateResponse.ok) {
                  const updateError = await updateResponse.json();
                  errors.push(`${mapping.colorCode}: ${updateError.details || updateError.error}`);
                }
              } else {
                errors.push(`${mapping.colorCode}: ${errorData.details || errorData.error}`);
              }
            } else {
              errors.push(`${mapping.colorCode}: ${errorData.details || errorData.error}`);
            }
          }
        } catch (mappingError) {
          console.error(`Error processing mapping for ${mapping.colorCode}:`, mappingError);
          errors.push(`${mapping.colorCode}: ${mappingError instanceof Error ? mappingError.message : 'Unknown error'}`);
        }
      }
      
      // Refresh existing mappings
      const response = await fetch('/api/shift-color-legend');
      if (response.ok) {
        const updated = await response.json();
        setExistingColorMappings(updated);
      }
      
      // If there were errors, throw them
      if (errors.length > 0) {
        throw new Error(`Some mappings failed to save:\n${errors.join('\n')}`);
      }
    } catch (error) {
      console.error('Error in handleColorMappingSave:', error);
      throw error;
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
            <div className="space-y-4 mb-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold">{[...new Set(previewData.map(entry => entry.matchedUserId).filter(Boolean))].length}</div>
                    <div className="text-sm text-muted-foreground">Unique Users</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold">{matchingReport.totalEntries}</div>
                    <div className="text-sm text-muted-foreground">Total Entries</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-green-600">{matchingReport.matchedUsers}</div>
                    <div className="text-sm text-muted-foreground">Matched Entries</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-red-600">{matchingReport.unmatchedUsers}</div>
                    <div className="text-sm text-muted-foreground">Unmatched Entries</div>
                  </CardContent>
                </Card>
              </div>
              
              {detectedColors.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Palette className="h-4 w-4" />
                      Detected Colors & Shift Mappings
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {detectedColors.map(color => {
                        const colorEntries = previewData.filter(entry => entry.shiftColor === color);
                        const mappedShift = colorEntries.find(entry => entry.colorLegendMatch);
                        const shiftName = mappedShift 
                          ? String((mappedShift.colorLegendMatch as any)?.shiftName || '') 
                          : null;
                        
                        return (
                          <div key={color} className="flex items-center gap-3 p-3 border rounded-lg">
                            <div
                              className="w-6 h-6 rounded border"
                              style={{ 
                                backgroundColor: color.startsWith('#INDEX') || color.startsWith('#PATTERN') 
                                  ? '#f3f4f6' 
                                  : color 
                              }}
                              title={color}
                            />
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-medium truncate">{color}</div>
                              <div className="text-xs text-muted-foreground">
                                {colorEntries.length} entries
                              </div>
                              {shiftName && shiftName.trim() ? (
                                <div className="text-xs text-green-600 font-medium">
                                  → {shiftName}
                                </div>
                              ) : null}
                              {(!shiftName || !shiftName.trim()) && !color.startsWith('#INDEX') && !color.startsWith('#PATTERN') ? (
                                <div className="text-xs text-amber-600">
                                  → Not mapped
                                </div>
                              ) : null}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              )}
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
                          <Badge variant="default" className="text-xs">
                            {entry.shiftName}
                          </Badge>
                        )}
                        {entry.shiftColor ? (
                          <div className="flex items-center gap-2">
                            <div
                              className="w-4 h-4 rounded border"
                              style={{ 
                                backgroundColor: entry.shiftColor.startsWith('#INDEX') || entry.shiftColor.startsWith('#PATTERN') 
                                  ? '#f3f4f6' 
                                  : entry.shiftColor 
                              }}
                              title={entry.shiftColor}
                            />
                            <div className="flex flex-col">
                              <span className="text-xs font-medium">{entry.shiftColor}</span>
                              {entry.colorLegendMatch ? (
                                <span className="text-xs text-green-600">
                                  → {String((entry.colorLegendMatch as any)?.shiftName || 'Unknown Shift')}
                                </span>
                              ) : null}
                              {entry.shiftColor && !entry.colorLegendMatch && !entry.shiftColor.startsWith('#INDEX') && !entry.shiftColor.startsWith('#PATTERN') ? (
                                <span className="text-xs text-amber-600">
                                  → Unmapped color
                                </span>
                              ) : null}
                            </div>
                          </div>
                        ) : null}
                        {!entry.shiftColor ? (
                          <span className="text-xs text-muted-foreground">No color detected</span>
                        ) : null}
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

          <DialogFooter className="flex-col sm:flex-row gap-2">
            {detectedColors.length > 0 && (
              <Button 
                variant="secondary" 
                onClick={() => setShowColorMapping(true)}
                className="mr-auto"
              >
                <Palette className="h-4 w-4 mr-2" />
                Configure Colors ({detectedColors.length})
              </Button>
            )}
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

      {/* Color Mapping Dialog */}
      <ColorMappingDialog
        open={showColorMapping}
        onOpenChange={setShowColorMapping}
        detectedColors={detectedColors.map(color => ({
          color,
          count: previewData.filter(entry => entry.shiftColor === color).length,
          entries: previewData.filter(entry => entry.shiftColor === color).map(entry => `${entry.name} - ${entry.date}`)
        }))}
        existingMappings={existingColorMappings}
        onSaveMappings={handleColorMappingSave}
      />
    </div>
  );
}