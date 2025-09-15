'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Upload, TestTube, Save, X, Grid, Settings, FileSpreadsheet } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ConfigurationData {
  name: string;
  role: string;
  description: string;
  active: boolean;
  dateRow: number;
  dayLabelRow: number | null;
  nameColumn: number;
  firstNameRow: number;
  lastNameRow: number;
  firstDateColumn: number;
  lastDateColumn: number;
  dynamicColumns: boolean;
  skipValues: string[];
  validPatterns: string[];
  colorDetection: boolean;
  defaultShift: string;
}

interface ConfigurationWizardProps {
  existingConfig?: any;
  onSave: () => void;
  onCancel: () => void;
}

interface TestResult {
  filename?: string;
  validation: {
    dateRowData: Array<{ column: number; value: any; type: string }>;
    nameColumnData: Array<{ row: number; value: any; type: string }>;
    sampleScheduleData: Array<{ row: number; col: string; value: any; hasStyle: boolean }>;
    errors: string[];
    warnings: string[];
  };
}

export function ConfigurationWizard({ existingConfig, onSave, onCancel }: ConfigurationWizardProps) {
  const [currentStep, setCurrentStep] = React.useState(0);
  const [formData, setFormData] = React.useState<ConfigurationData>({
    name: existingConfig?.name || '',
    role: existingConfig?.role || 'OPERATOR',
    description: existingConfig?.description || '',
    active: existingConfig?.active ?? true,
    dateRow: existingConfig?.dateRow ?? 8,
    dayLabelRow: existingConfig?.dayLabelRow ?? null,
    nameColumn: existingConfig?.nameColumn ?? 1,
    firstNameRow: existingConfig?.firstNameRow ?? 9,
    lastNameRow: existingConfig?.lastNameRow ?? 11,
    firstDateColumn: existingConfig?.firstDateColumn ?? 2,
    lastDateColumn: existingConfig?.lastDateColumn ?? 31,
    dynamicColumns: existingConfig?.dynamicColumns ?? true,
    skipValues: existingConfig?.skipValues || ['co'],
    validPatterns: existingConfig?.validPatterns || [],
    colorDetection: existingConfig?.colorDetection ?? true,
    defaultShift: existingConfig?.defaultShift || '',
  });

  const [testFile, setTestFile] = React.useState<File | null>(null);
  const [testResult, setTestResult] = React.useState<TestResult | null>(null);
  const [testing, setTesting] = React.useState(false);
  const [saving, setSaving] = React.useState(false);

  const { toast } = useToast();

  const handleInputChange = (field: keyof ConfigurationData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSkipValuesChange = (value: string) => {
    const values = value.split(',').map(v => v.trim()).filter(v => v.length > 0);
    handleInputChange('skipValues', values);
  };

  const handleTestConfiguration = async () => {
    if (!testFile) {
      toast({
        title: 'Error',
        description: 'Please select a file to test',
        variant: 'destructive',
      });
      return;
    }

    setTesting(true);
    try {
      const formDataToSend = new FormData();
      formDataToSend.append('file', testFile);
      formDataToSend.append('config', JSON.stringify(formData));

      const response = await fetch('/api/excel-configurations/test', {
        method: 'POST',
        body: formDataToSend,
      });

      if (!response.ok) {
        throw new Error('Failed to test configuration');
      }

      const result = await response.json();
      setTestResult(result);

      if (result.validation.errors.length === 0) {
        toast({
          title: 'Test Successful',
          description: 'Configuration works with the uploaded file',
        });
      } else {
        toast({
          title: 'Test Issues Found',
          description: `Found ${result.validation.errors.length} errors and ${result.validation.warnings.length} warnings`,
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error testing configuration:', error);
      toast({
        title: 'Test Failed',
        description: 'Failed to test configuration',
        variant: 'destructive',
      });
    } finally {
      setTesting(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const method = existingConfig ? 'PUT' : 'POST';
      const body = existingConfig 
        ? { ...formData, id: existingConfig.id }
        : formData;

      const response = await fetch('/api/excel-configurations', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.details || error.error || 'Failed to save configuration');
      }

      toast({
        title: 'Success',
        description: `Configuration ${existingConfig ? 'updated' : 'created'} successfully`,
      });

      onSave();
    } catch (error) {
      console.error('Error saving configuration:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to save configuration',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const columnToLetter = (col: number) => {
    let result = '';
    while (col >= 0) {
      result = String.fromCharCode(65 + (col % 26)) + result;
      col = Math.floor(col / 26) - 1;
    }
    return result;
  };
  
  const letterToColumn = (letters: string) => {
    let result = 0;
    for (let i = 0; i < letters.length; i++) {
      result = result * 26 + (letters.charCodeAt(i) - 64);
    }
    return result - 1;
  };

  const steps = [
    'Basic Information',
    'Coordinates Setup',
    'Processing Rules',
    'Test & Validate'
  ];

  return (
    <div className="space-y-6">
      {/* Progress Indicator */}
      <div className="flex items-center justify-between">
        {steps.map((step, index) => (
          <div key={step} className="flex items-center">
            <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium ${
              index <= currentStep 
                ? 'bg-primary text-primary-foreground' 
                : 'bg-muted text-muted-foreground'
            }`}>
              {index + 1}
            </div>
            <span className={`ml-2 text-sm ${
              index <= currentStep ? 'text-foreground' : 'text-muted-foreground'
            }`}>
              {step}
            </span>
            {index < steps.length - 1 && (
              <div className={`h-px w-12 mx-4 ${
                index < currentStep ? 'bg-primary' : 'bg-muted'
              }`} />
            )}
          </div>
        ))}
      </div>

      <Tabs value={currentStep.toString()} className="w-full">
        {/* Step 1: Basic Information */}
        <TabsContent value="0" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileSpreadsheet className="h-5 w-5" />
                Basic Information
              </CardTitle>
              <CardDescription>
                Define the basic properties of your Excel configuration
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Configuration Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    placeholder="e.g. PRODUCER Schedule"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="role">Target Role *</Label>
                  <Select
                    value={formData.role}
                    onValueChange={(value) => handleInputChange('role', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="OPERATOR">OPERATOR</SelectItem>
                      <SelectItem value="PRODUCER">PRODUCER</SelectItem>
                      <SelectItem value="ADMIN">ADMIN</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Describe when to use this configuration..."
                />
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="active"
                  checked={formData.active}
                  onCheckedChange={(checked) => handleInputChange('active', checked)}
                />
                <Label htmlFor="active">Active Configuration</Label>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Step 2: Coordinates Setup */}
        <TabsContent value="1" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Grid className="h-5 w-5" />
                Excel Coordinates Setup
              </CardTitle>
              <CardDescription>
                Define where to find names, dates, and schedule data in the Excel file
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h4 className="font-semibold mb-3">Date Location</h4>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Date Row (Excel row number)</Label>
                    <Input
                      type="number"
                      value={formData.dateRow + 1}
                      onChange={(e) => handleInputChange('dateRow', parseInt(e.target.value) - 1)}
                      min="1"
                    />
                    <div className="text-sm text-muted-foreground">
                      The row containing date numbers (1, 2, 3, ...)
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>First Date Column</Label>
                    <Input
                      value={columnToLetter(formData.firstDateColumn)}
                      onChange={(e) => {
                        const value = e.target.value.toUpperCase().replace(/[^A-Z]/g, '');
                        if (value.length > 0) {
                          const col = letterToColumn(value);
                          if (!isNaN(col) && col >= 0) handleInputChange('firstDateColumn', col);
                        }
                      }}
                      placeholder="C"
                      maxLength={3}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Last Date Column</Label>
                    <Input
                      value={columnToLetter(formData.lastDateColumn)}
                      onChange={(e) => {
                        const value = e.target.value.toUpperCase().replace(/[^A-Z]/g, '');
                        if (value.length > 0) {
                          const col = letterToColumn(value);
                          if (!isNaN(col) && col >= 0) handleInputChange('lastDateColumn', col);
                        }
                      }}
                      placeholder="AG"
                      maxLength={3}
                    />
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-3">Name Location</h4>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Name Column</Label>
                    <Input
                      value={columnToLetter(formData.nameColumn)}
                      onChange={(e) => {
                        const value = e.target.value.toUpperCase().replace(/[^A-Z]/g, '');
                        if (value.length > 0) {
                          const col = letterToColumn(value);
                          if (!isNaN(col) && col >= 0) handleInputChange('nameColumn', col);
                        }
                      }}
                      placeholder="B"
                      maxLength={3}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>First Name Row (Excel row number)</Label>
                    <Input
                      type="number"
                      value={formData.firstNameRow + 1}
                      onChange={(e) => handleInputChange('firstNameRow', parseInt(e.target.value) - 1)}
                      min="1"
                    />
                    <div className="text-sm text-muted-foreground">
                      First row containing employee names
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Last Name Row (Excel row number)</Label>
                    <Input
                      type="number"
                      value={formData.lastNameRow + 1}
                      onChange={(e) => handleInputChange('lastNameRow', parseInt(e.target.value) - 1)}
                      min="1"
                    />
                    <div className="text-sm text-muted-foreground">
                      Last row containing employee names
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-muted/50 p-4 rounded-lg">
                <h5 className="font-medium mb-2">Configuration Summary</h5>
                <div className="text-sm space-y-1">
                  <div>
                    <strong>Names:</strong> Column {columnToLetter(formData.nameColumn)}, 
                    Rows {formData.firstNameRow + 1}-{formData.lastNameRow + 1}
                  </div>
                  <div>
                    <strong>Dates:</strong> Row {formData.dateRow + 1}, 
                    Columns {columnToLetter(formData.firstDateColumn)}-{columnToLetter(formData.lastDateColumn)}
                  </div>
                  <div>
                    <strong>Schedule Data:</strong> Intersection of name rows and date columns
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Step 3: Processing Rules */}
        <TabsContent value="2" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Processing Rules
              </CardTitle>
              <CardDescription>
                Configure how the data should be processed and what values to skip
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>Skip Values (comma-separated)</Label>
                <Input
                  value={formData.skipValues.join(', ')}
                  onChange={(e) => handleSkipValuesChange(e.target.value)}
                  placeholder="co, holiday, off"
                />
                <div className="text-sm text-muted-foreground">
                  Values that should be ignored during parsing (e.g., holidays, time off)
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="colorDetection"
                  checked={formData.colorDetection}
                  onCheckedChange={(checked) => handleInputChange('colorDetection', checked)}
                />
                <Label htmlFor="colorDetection">Enable Color Detection</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="dynamicColumns"
                  checked={formData.dynamicColumns}
                  onCheckedChange={(checked) => handleInputChange('dynamicColumns', checked)}
                />
                <Label htmlFor="dynamicColumns">Dynamic Column Range (adjust based on month)</Label>
              </div>

              <div className="space-y-2">
                <Label>Default Shift (optional)</Label>
                <Input
                  value={formData.defaultShift}
                  onChange={(e) => handleInputChange('defaultShift', e.target.value)}
                  placeholder="Regular shift"
                />
                <div className="text-sm text-muted-foreground">
                  Default shift name for cells without specific data
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Step 4: Test & Validate */}
        <TabsContent value="3" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TestTube className="h-5 w-5" />
                Test & Validate Configuration
              </CardTitle>
              <CardDescription>
                Upload a sample Excel file to test your configuration
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Sample Excel File</Label>
                <Input
                  type="file"
                  accept=".xls,.xlsx"
                  onChange={(e) => setTestFile(e.target.files?.[0] || null)}
                />
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={handleTestConfiguration}
                  disabled={!testFile || testing}
                  variant="outline"
                >
                  <TestTube className="h-4 w-4 mr-2" />
                  {testing ? 'Testing...' : 'Test Configuration'}
                </Button>
              </div>

              {testResult && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base">Validation Results</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <Badge variant={testResult.validation.errors.length === 0 ? 'default' : 'destructive'}>
                              {testResult.validation.errors.length === 0 ? 'Valid' : 'Errors'}
                            </Badge>
                            <span className="text-sm">
                              {testResult.validation.errors.length} errors, {testResult.validation.warnings.length} warnings
                            </span>
                          </div>
                          
                          {testResult.validation.errors.map((error, index) => (
                            <div key={index} className="text-sm text-red-600">
                              • {error}
                            </div>
                          ))}
                          
                          {testResult.validation.warnings.map((warning, index) => (
                            <div key={index} className="text-sm text-amber-600">
                              • {warning}
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base">Detected Data</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2 text-sm">
                          <div>
                            <strong>Dates found:</strong> {testResult.validation.dateRowData.length}
                          </div>
                          <div>
                            <strong>Names found:</strong> {testResult.validation.nameColumnData.length}
                          </div>
                          <div>
                            <strong>Sample data:</strong> {testResult.validation.sampleScheduleData.length} cells
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {testResult.validation.sampleScheduleData.length > 0 && (
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base">Sample Schedule Data</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Cell</TableHead>
                              <TableHead>Value</TableHead>
                              <TableHead>Has Style</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {testResult.validation.sampleScheduleData.slice(0, 10).map((cell, index) => (
                              <TableRow key={index}>
                                <TableCell>{cell.col}{cell.row}</TableCell>
                                <TableCell>{cell.value}</TableCell>
                                <TableCell>{cell.hasStyle ? '✓' : '✗'}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </CardContent>
                    </Card>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Navigation */}
      <div className="flex justify-between">
        <div className="flex gap-2">
          <Button variant="outline" onClick={onCancel}>
            <X className="h-4 w-4 mr-2" />
            Cancel
          </Button>
          {currentStep > 0 && (
            <Button
              variant="outline"
              onClick={() => setCurrentStep(currentStep - 1)}
            >
              Previous
            </Button>
          )}
        </div>

        <div className="flex gap-2">
          {currentStep < steps.length - 1 ? (
            <Button onClick={() => setCurrentStep(currentStep + 1)}>
              Next
            </Button>
          ) : (
            <Button onClick={handleSave} disabled={saving}>
              <Save className="h-4 w-4 mr-2" />
              {saving ? 'Saving...' : existingConfig ? 'Update' : 'Create'} Configuration
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}