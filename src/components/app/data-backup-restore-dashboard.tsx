
'use client';

import * as React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { getTranslation } from '@/lib/translations';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableCaption } from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useToast } from '@/hooks/use-toast';
import { Archive, Upload, Download, Trash2, History, Loader2, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';

interface BackupFile {
  id: string;
  fileName: string;
  createdAt: Date;
  size: string; // e.g., "2.5 MB"
}

export function DataBackupRestoreDashboard() {
  const { currentLang } = useLanguage();
  const { toast } = useToast();
  const [selectedFile, setSelectedFile] = React.useState<File | null>(null);
  const [backupHistory, setBackupHistory] = React.useState<BackupFile[]>([]);
  const [isCreatingBackup, setIsCreatingBackup] = React.useState(false);
  const [isRestoring, setIsRestoring] = React.useState(false);
  const [isClearingDatabase, setIsClearingDatabase] = React.useState(false);
  const [clearConfirmationText, setClearConfirmationText] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(true);

  // Fetch backup history on component mount
  const fetchBackups = React.useCallback(async () => {
    try {
      const response = await fetch('/api/backup');
      if (response.ok) {
        const backups = await response.json();
        setBackupHistory(backups);
      } else {
        toast({
          title: getTranslation(currentLang, 'Error'),
          description: 'Failed to fetch backup history',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: getTranslation(currentLang, 'Error'),
        description: 'Network error while fetching backups',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [currentLang, toast]);

  React.useEffect(() => {
    fetchBackups();
  }, [fetchBackups]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setSelectedFile(event.target.files[0]);
    } else {
      setSelectedFile(null);
    }
  };

  const handleCreateBackup = async () => {
    setIsCreatingBackup(true);
    try {
      const response = await fetch('/api/backup', {
        method: 'POST',
      });

      if (response.ok) {
        const newBackup = await response.json();
        await fetchBackups(); // Refresh backup list
        toast({
          title: getTranslation(currentLang, 'BackupCreatedSuccess'),
          description: `Backup created: ${newBackup.fileName} (${newBackup.size})`,
        });
      } else {
        const errorData = await response.json();
        toast({
          title: getTranslation(currentLang, 'Error'),
          description: errorData.error || 'Failed to create backup',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: getTranslation(currentLang, 'Error'),
        description: 'Network error while creating backup',
        variant: 'destructive',
      });
    } finally {
      setIsCreatingBackup(false);
    }
  };

  const handleRestoreFromFile = async () => {
    if (!selectedFile) {
      toast({
        title: getTranslation(currentLang, 'Error'),
        description: getTranslation(currentLang, 'NoFileSelectedError'),
        variant: 'destructive',
      });
      return;
    }
    setIsRestoring(true);
    try {
      const formData = new FormData();
      formData.append('file', selectedFile);

      const response = await fetch('/api/backup/restore', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const result = await response.json();
        toast({
          title: getTranslation(currentLang, 'BackupRestoredSuccess', { fileName: selectedFile.name }),
          description: `Restored: ${result.restored.users} users, ${result.restored.assignments} assignments, ${result.restored.teamSchedules} schedules`,
        });
        setSelectedFile(null); // Reset file input
        // Refresh backup list and possibly redirect
        await fetchBackups();
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      } else {
        const errorData = await response.json();
        toast({
          title: getTranslation(currentLang, 'Error'),
          description: errorData.error || 'Failed to restore backup',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: getTranslation(currentLang, 'Error'),
        description: 'Network error while restoring backup',
        variant: 'destructive',
      });
    } finally {
      setIsRestoring(false);
    }
  };

  const handleDeleteBackup = async (backupId: string) => {
    try {
      const response = await fetch(`/api/backup/${backupId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await fetchBackups(); // Refresh backup list
        toast({
          title: getTranslation(currentLang, 'DeleteButton'),
          description: 'Backup file deleted successfully.',
        });
      } else {
        const errorData = await response.json();
        toast({
          title: getTranslation(currentLang, 'Error'),
          description: errorData.error || 'Failed to delete backup',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: getTranslation(currentLang, 'Error'),
        description: 'Network error while deleting backup',
        variant: 'destructive',
      });
    }
  };

  const handleClearDatabase = async () => {
    if (clearConfirmationText !== 'CLEAR DATABASE') {
      toast({
        title: getTranslation(currentLang, 'Error'),
        description: 'Please type "CLEAR DATABASE" exactly to confirm.',
        variant: 'destructive',
      });
      return;
    }

    setIsClearingDatabase(true);
    try {
      const response = await fetch('/api/admin/clear-database', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ confirmationText: clearConfirmationText }),
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: 'Database Cleared Successfully',
          description: 'All data has been cleared. Only admin user remains. You may need to refresh the page.',
        });
        setClearConfirmationText('');
        // Optionally refresh the page or redirect
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      } else {
        toast({
          title: getTranslation(currentLang, 'Error'),
          description: data.error || 'Failed to clear database',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: getTranslation(currentLang, 'Error'),
        description: 'Network error occurred while clearing database',
        variant: 'destructive',
      });
    } finally {
      setIsClearingDatabase(false);
    }
  };

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Archive className="mr-2 h-5 w-5" />
            {getTranslation(currentLang, 'CreateBackupCardTitle')}
          </CardTitle>
          <CardDescription>{getTranslation(currentLang, 'CreateBackupCardDescription')}</CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={handleCreateBackup} disabled={isCreatingBackup}>
            {isCreatingBackup && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {getTranslation(currentLang, 'CreateBackupButton')}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Upload className="mr-2 h-5 w-5" />
            {getTranslation(currentLang, 'RestoreFromBackupCardTitle')}
          </CardTitle>
          <CardDescription>{getTranslation(currentLang, 'RestoreFromBackupCardDescription')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid w-full max-w-sm items-center gap-1.5">
            <label htmlFor="backup-file" className="text-sm font-medium">
                {getTranslation(currentLang, 'SelectBackupFileLabel')}
            </label>
            <Input 
              id="backup-file" 
              type="file" 
              accept=".json" 
              onChange={handleFileChange} 
              disabled={isRestoring}
            />
          </div>
          {selectedFile && <p className="text-sm text-muted-foreground">Selected file: {selectedFile.name}</p>}
          <Button onClick={handleRestoreFromFile} disabled={!selectedFile || isRestoring}>
            {isRestoring && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {getTranslation(currentLang, 'RestoreButton')}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <History className="mr-2 h-5 w-5" />
            {getTranslation(currentLang, 'BackupHistoryCardTitle')}
          </CardTitle>
          <CardDescription>{getTranslation(currentLang, 'BackupHistoryCardDescription')}</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="h-6 w-6 animate-spin" />
              <span className="ml-2">Loading backup history...</span>
            </div>
          ) : backupHistory.length > 0 ? (
            <>
              {/* Desktop Table - Hidden on mobile, visible md and up */}
              <div className="hidden md:block">
                <Table>
                  <TableCaption>{getTranslation(currentLang, 'UserActivityTableCaption', { count: backupHistory.length.toString(), type: "backups"})}</TableCaption>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{getTranslation(currentLang, 'BackupHistoryTableDate')}</TableHead>
                      <TableHead>{getTranslation(currentLang, 'BackupHistoryTableFileName')}</TableHead>
                      <TableHead>{getTranslation(currentLang, 'BackupHistoryTableSize')}</TableHead>
                      <TableHead className="text-right">{getTranslation(currentLang, 'BackupHistoryTableActions')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {backupHistory.map((backup) => (
                      <TableRow key={backup.id}>
                        <TableCell>{format(backup.createdAt, 'PPP p')}</TableCell>
                        <TableCell className="font-medium">{backup.fileName}</TableCell>
                        <TableCell>{backup.size}</TableCell>
                        <TableCell className="text-right space-x-1">
                          <Button 
                            onClick={() => window.open(`/api/backup/${backup.id}`, '_blank')} 
                            aria-label={getTranslation(currentLang, 'DownloadButton')}
                          >
                            <Download className="mr-1 h-4 w-4" />
                            {getTranslation(currentLang, 'DownloadButton')}
                          </Button>
                           <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button className="bg-destructive text-destructive-foreground hover:bg-destructive/90" aria-label={getTranslation(currentLang, 'DeleteButton')}>
                                <Trash2 className="mr-1 h-4 w-4" />
                                 {getTranslation(currentLang, 'DeleteButton')}
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>{getTranslation(currentLang, 'ConfirmDeleteBackupTitle')}</AlertDialogTitle>
                                <AlertDialogDescription>
                                  {getTranslation(currentLang, 'ConfirmDeleteBackupDescription', {fileName: backup.fileName})}
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>{getTranslation(currentLang, 'CancelButton')}</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDeleteBackup(backup.id)}>
                                  {getTranslation(currentLang, 'DeleteButton')}
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Mobile Cards - Visible on mobile, hidden md and up */}
              <div className="block md:hidden space-y-4">
                {backupHistory.map((backup) => (
                  <Card key={backup.id} className="p-4">
                    <div className="mb-4">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-sm truncate">{backup.fileName}</h3>
                          <p className="text-xs text-muted-foreground">
                            {format(backup.createdAt, 'PPP p')}
                          </p>
                        </div>
                        <div className="ml-2 text-right flex-shrink-0">
                          <p className="text-sm font-medium">{backup.size}</p>
                          <p className="text-xs text-muted-foreground">Size</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <Button 
                        onClick={() => window.open(`/api/backup/${backup.id}`, '_blank')}
                        className="flex-1 min-h-[44px] touch-manipulation"
                      >
                        <Download className="mr-2 h-4 w-4" />
                        {getTranslation(currentLang, 'DownloadButton')}
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button 
                            className="flex-1 min-h-[44px] touch-manipulation bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            {getTranslation(currentLang, 'DeleteButton')}
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>{getTranslation(currentLang, 'ConfirmDeleteBackupTitle')}</AlertDialogTitle>
                            <AlertDialogDescription>
                              {getTranslation(currentLang, 'ConfirmDeleteBackupDescription', {fileName: backup.fileName})}
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>{getTranslation(currentLang, 'CancelButton')}</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDeleteBackup(backup.id)}>
                              {getTranslation(currentLang, 'DeleteButton')}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </Card>
                ))}
                <p className="text-xs text-center text-muted-foreground pt-2">
                  {getTranslation(currentLang, 'UserActivityTableCaption', { count: backupHistory.length.toString(), type: "backups"})}
                </p>
              </div>
            </>
          ) : (
            <p className="text-center text-muted-foreground py-4">
              {getTranslation(currentLang, 'NoBackupsAvailable')}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Clear Database - DANGER ZONE */}
      <Card className="border-destructive border-2">
        <CardHeader>
          <CardTitle className="flex items-center text-destructive">
            <AlertTriangle className="mr-2 h-5 w-5" />
            Clear Database - DANGER ZONE
          </CardTitle>
          <CardDescription className="text-destructive">
            <strong>⚠️ WARNING:</strong> This action will permanently delete ALL data from the database including:
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>All assignments and tasks</li>
              <li>All users except the admin account</li>
              <li>All team schedules</li>
              <li>All uploaded files and documents</li>
            </ul>
            <br />
            <strong>This action CANNOT be undone!</strong> Make sure you have created a backup before proceeding.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-destructive/10 p-4 rounded-lg border border-destructive/20">
            <p className="text-sm font-medium mb-2">
              To confirm this action, please type <strong>"CLEAR DATABASE"</strong> (without quotes) in the field below:
            </p>
            <Input
              type="text"
              placeholder="Type: CLEAR DATABASE"
              value={clearConfirmationText}
              onChange={(e) => setClearConfirmationText(e.target.value)}
              disabled={isClearingDatabase}
              className="mb-3"
            />
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button 
                  disabled={clearConfirmationText !== 'CLEAR DATABASE' || isClearingDatabase}
                  className="w-full bg-destructive text-destructive-foreground hover:bg-destructive/90 disabled:opacity-50"
                >
                  {isClearingDatabase && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {isClearingDatabase ? 'Clearing Database...' : 'Clear Database - PERMANENT ACTION'}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle className="text-destructive">
                    ⚠️ Final Confirmation - Clear Database
                  </AlertDialogTitle>
                  <AlertDialogDescription>
                    You are about to permanently delete ALL data from the database.
                    <br /><br />
                    <strong>This includes:</strong>
                    <ul className="list-disc list-inside mt-2 space-y-1">
                      <li>All assignments and tasks</li>
                      <li>All users except admin account</li>
                      <li>All schedules and uploaded content</li>
                    </ul>
                    <br />
                    <strong className="text-destructive">This action CANNOT be reversed!</strong>
                    <br /><br />
                    Are you absolutely sure you want to proceed?
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel - Keep Data Safe</AlertDialogCancel>
                  <AlertDialogAction 
                    onClick={handleClearDatabase}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Yes, Clear Database Forever
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </CardContent>
      </Card>

       <CardDescription className="text-xs text-center text-muted-foreground pt-4">
        {getTranslation(currentLang, 'DataBackupRestoreTabDescription')}
      </CardDescription>
    </div>
  );
}

    