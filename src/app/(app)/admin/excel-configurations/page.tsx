'use client';

import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Plus, Settings, Trash2, Edit, TestTube, Eye, Activity } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { ConfigurationWizard } from '@/components/app/configuration-wizard';

interface ExcelConfiguration {
  id: string;
  name: string;
  role: string;
  description?: string;
  active: boolean;
  dateRow: number;
  dayLabelRow?: number;
  nameColumn: number;
  firstNameRow: number;
  lastNameRow: number;
  firstDateColumn: number;
  lastDateColumn: number;
  dynamicColumns: boolean;
  skipValues: string[];
  validPatterns: string[];
  colorDetection: boolean;
  defaultShift?: string;
  createdBy: {
    id: string;
    name?: string;
    email: string;
  };
  createdAt: string;
  updatedAt: string;
  _count?: {
    UploadConfigurationLog: number;
  };
}

export default function ExcelConfigurationsPage() {
  const [configurations, setConfigurations] = React.useState<ExcelConfiguration[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [selectedConfig, setSelectedConfig] = React.useState<ExcelConfiguration | null>(null);
  const [showWizard, setShowWizard] = React.useState(false);
  const [editingConfig, setEditingConfig] = React.useState<ExcelConfiguration | null>(null);

  const { toast } = useToast();

  React.useEffect(() => {
    fetchConfigurations();
  }, []);

  const fetchConfigurations = async () => {
    try {
      const response = await fetch('/api/excel-configurations');
      if (!response.ok) {
        throw new Error('Failed to fetch configurations');
      }
      const data = await response.json();
      setConfigurations(data);
    } catch (error) {
      console.error('Error fetching configurations:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch configurations',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteConfiguration = async (id: string) => {
    try {
      const response = await fetch(`/api/excel-configurations/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete configuration');
      }

      toast({
        title: 'Success',
        description: 'Configuration deleted successfully',
      });

      fetchConfigurations();
    } catch (error) {
      console.error('Error deleting configuration:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete configuration',
        variant: 'destructive',
      });
    }
  };

  const handleToggleActive = async (config: ExcelConfiguration) => {
    try {
      const response = await fetch('/api/excel-configurations', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...config,
          active: !config.active,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update configuration');
      }

      toast({
        title: 'Success',
        description: `Configuration ${config.active ? 'deactivated' : 'activated'} successfully`,
      });

      fetchConfigurations();
    } catch (error) {
      console.error('Error updating configuration:', error);
      toast({
        title: 'Error',
        description: 'Failed to update configuration',
        variant: 'destructive',
      });
    }
  };

  const formatCoordinates = (config: ExcelConfiguration) => {
    return `Names: ${String.fromCharCode(65 + config.nameColumn)}${config.firstNameRow + 1}:${String.fromCharCode(65 + config.nameColumn)}${config.lastNameRow + 1}, Dates: ${String.fromCharCode(65 + config.firstDateColumn)}${config.dateRow + 1}:${String.fromCharCode(65 + config.lastDateColumn)}${config.dateRow + 1}`;
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Excel Upload Configurations</h1>
        </div>
        <div className="text-center py-8">Loading configurations...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Excel Upload Configurations</h1>
          <p className="text-muted-foreground">
            Manage Excel file parsing configurations for different schedule formats
          </p>
        </div>
        <Dialog open={showWizard} onOpenChange={setShowWizard}>
          <DialogTrigger asChild>
            <Button onClick={() => setEditingConfig(null)}>
              <Plus className="h-4 w-4 mr-2" />
              New Configuration
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingConfig ? 'Edit Configuration' : 'Create New Configuration'}
              </DialogTitle>
              <DialogDescription>
                Configure how Excel files should be parsed for schedule imports
              </DialogDescription>
            </DialogHeader>
            <ConfigurationWizard
              existingConfig={editingConfig}
              onSave={() => {
                setShowWizard(false);
                setEditingConfig(null);
                fetchConfigurations();
              }}
              onCancel={() => {
                setShowWizard(false);
                setEditingConfig(null);
              }}
            />
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Configurations ({configurations.length})
          </CardTitle>
          <CardDescription>
            Excel upload configurations define how different file formats are parsed
          </CardDescription>
        </CardHeader>
        <CardContent>
          {configurations.length === 0 ? (
            <div className="text-center py-8">
              <Settings className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">No Configurations Found</h3>
              <p className="text-muted-foreground mb-4">
                Create your first Excel upload configuration to get started
              </p>
              <Button onClick={() => setShowWizard(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Configuration
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Coordinates</TableHead>
                  <TableHead>Usage</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {configurations.map((config) => (
                  <TableRow key={config.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{config.name}</div>
                        {config.description && (
                          <div className="text-sm text-muted-foreground">
                            {config.description}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={config.role === 'ADMIN' ? 'destructive' : config.role === 'PRODUCER' ? 'default' : 'secondary'}>
                        {config.role}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant={config.active ? 'default' : 'secondary'}
                        size="sm"
                        onClick={() => handleToggleActive(config)}
                      >
                        {config.active ? 'Active' : 'Inactive'}
                      </Button>
                    </TableCell>
                    <TableCell className="text-sm">
                      {formatCoordinates(config)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Activity className="h-3 w-3" />
                        <span className="text-sm">
                          {config._count?.UploadConfigurationLog || 0} uploads
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">
                      <div>{new Date(config.createdAt).toLocaleDateString()}</div>
                      <div className="text-muted-foreground">
                        by {config.createdBy.name || config.createdBy.email}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedConfig(config)}
                        >
                          <Eye className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setEditingConfig(config);
                            setShowWizard(true);
                          }}
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="outline" size="sm">
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Configuration</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete the configuration "{config.name}"?
                                This action cannot be undone.
                                {config._count?.UploadConfigurationLog && config._count.UploadConfigurationLog > 0 && (
                                  <span className="block mt-2 text-amber-600">
                                    This configuration has been used {config._count.UploadConfigurationLog} times.
                                  </span>
                                )}
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDeleteConfiguration(config.id)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Configuration Details Dialog */}
      <Dialog open={!!selectedConfig} onOpenChange={() => setSelectedConfig(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Configuration Details</DialogTitle>
          </DialogHeader>
          {selectedConfig && (
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold">Basic Information</h4>
                <div className="grid grid-cols-2 gap-4 mt-2">
                  <div>
                    <label className="text-sm text-muted-foreground">Name</label>
                    <div>{selectedConfig.name}</div>
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground">Role</label>
                    <div>{selectedConfig.role}</div>
                  </div>
                </div>
                {selectedConfig.description && (
                  <div className="mt-2">
                    <label className="text-sm text-muted-foreground">Description</label>
                    <div>{selectedConfig.description}</div>
                  </div>
                )}
              </div>

              <div>
                <h4 className="font-semibold">Coordinates</h4>
                <div className="grid grid-cols-2 gap-4 mt-2 text-sm">
                  <div>Date Row: {selectedConfig.dateRow + 1}</div>
                  <div>Name Column: {String.fromCharCode(65 + selectedConfig.nameColumn)}</div>
                  <div>First Name Row: {selectedConfig.firstNameRow + 1}</div>
                  <div>Last Name Row: {selectedConfig.lastNameRow + 1}</div>
                  <div>First Date Column: {String.fromCharCode(65 + selectedConfig.firstDateColumn)}</div>
                  <div>Last Date Column: {String.fromCharCode(65 + selectedConfig.lastDateColumn)}</div>
                </div>
              </div>

              <div>
                <h4 className="font-semibold">Processing Rules</h4>
                <div className="mt-2 space-y-2">
                  <div>
                    <label className="text-sm text-muted-foreground">Skip Values</label>
                    <div>{selectedConfig.skipValues.length > 0 ? selectedConfig.skipValues.join(', ') : 'None'}</div>
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground">Color Detection</label>
                    <div>{selectedConfig.colorDetection ? 'Enabled' : 'Disabled'}</div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}