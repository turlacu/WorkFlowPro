
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

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setSelectedFile(event.target.files[0]);
    } else {
      setSelectedFile(null);
    }
  };

  const handleCreateBackup = async () => {
    setIsCreatingBackup(true);
    // Simulate API call for backup creation
    await new Promise(resolve => setTimeout(resolve, 2000));
    const newBackup: BackupFile = {
        id: `backup-${Date.now()}`,
        fileName: `backup-${format(new Date(), 'yyyy-MM-dd_HH-mm-ss')}.json`,
        createdAt: new Date(),
        size: `${(Math.random() * 2 + 0.5).toFixed(1)} MB`
    };
    setBackupHistory(prev => [newBackup, ...prev]);
    toast({
      title: getTranslation(currentLang, 'BackupCreatedSuccess'),
    });
    setIsCreatingBackup(false);
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
    // Simulate API call for restore
    await new Promise(resolve => setTimeout(resolve, 3000));
    toast({
      title: getTranslation(currentLang, 'BackupRestoredSuccess', { fileName: selectedFile.name }),
    });
    setSelectedFile(null); // Reset file input
    // Potentially refresh app data or redirect
    setIsRestoring(false);
  };

  const handleDeleteBackup = (backupId: string) => {
    setBackupHistory(prev => prev.filter(backup => backup.id !== backupId));
    toast({
      title: getTranslation(currentLang, 'DeleteButton'), // Could be more specific like "Backup Deleted"
      description: `Backup file ${backupHistory.find(b=>b.id === backupId)?.fileName} deleted (simulated).`
    });
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
          {backupHistory.length > 0 ? (
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
                      <Button variant="outline" size="sm" onClick={() => alert('Download: ' + backup.fileName)} aria-label={getTranslation(currentLang, 'DownloadButton')}>
                        <Download className="mr-1 h-4 w-4" />
                        {getTranslation(currentLang, 'DownloadButton')}
                      </Button>
                       <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="destructive" size="sm" aria-label={getTranslation(currentLang, 'DeleteButton')}>
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
                  variant="destructive" 
                  disabled={clearConfirmationText !== 'CLEAR DATABASE' || isClearingDatabase}
                  className="w-full"
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

    