
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
import { Archive, Upload, Download, Trash2, History, Loader2 } from 'lucide-react';
import { format } from 'date-fns';

interface BackupFile {
  id: string;
  fileName: string;
  createdAt: Date;
  size: string; // e.g., "2.5 MB"
}

const mockBackupHistory: BackupFile[] = [
  { id: 'backup1', fileName: 'backup-2024-07-28_10-30-00.json', createdAt: new Date(2024, 6, 28, 10, 30, 0), size: '1.2 MB' },
  { id: 'backup2', fileName: 'backup-2024-07-27_15-45-10.json', createdAt: new Date(2024, 6, 27, 15, 45, 10), size: '1.1 MB' },
];

export function DataBackupRestoreDashboard() {
  const { currentLang } = useLanguage();
  const { toast } = useToast();
  const [selectedFile, setSelectedFile] = React.useState<File | null>(null);
  const [backupHistory, setBackupHistory] = React.useState<BackupFile[]>(mockBackupHistory);
  const [isCreatingBackup, setIsCreatingBackup] = React.useState(false);
  const [isRestoring, setIsRestoring] = React.useState(false);

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
       <CardDescription className="text-xs text-center text-muted-foreground pt-4">
        {getTranslation(currentLang, 'DataBackupRestoreTabDescription')}
      </CardDescription>
    </div>
  );
}

    