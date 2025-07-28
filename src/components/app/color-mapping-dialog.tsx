'use client';

import * as React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Save, Palette, Clock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface DetectedColor {
  color: string;
  count: number;
  entries: string[];
}

interface ShiftMapping {
  colorCode: string;
  colorName: string;
  shiftName: string;
  startTime: string;
  endTime: string;
  description?: string;
}

interface ColorMappingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  detectedColors: DetectedColor[];
  existingMappings: ShiftMapping[];
  onSaveMappings: (mappings: ShiftMapping[]) => Promise<void>;
}

const DEFAULT_SHIFT_TEMPLATES = [
  { name: 'Morning Shift', startTime: '06:00', endTime: '14:00' },
  { name: 'Day Shift', startTime: '08:00', endTime: '16:00' },
  { name: 'Evening Shift', startTime: '14:00', endTime: '22:00' },
  { name: 'Night Shift', startTime: '22:00', endTime: '06:00' },
  { name: 'Weekend Morning', startTime: '07:00', endTime: '15:00' },
  { name: 'Weekend Evening', startTime: '15:00', endTime: '23:00' },
];

export function ColorMappingDialog({
  open,
  onOpenChange,
  detectedColors,
  existingMappings,
  onSaveMappings,
}: ColorMappingDialogProps) {
  const [mappings, setMappings] = React.useState<ShiftMapping[]>([]);
  const [saving, setSaving] = React.useState(false);
  const { toast } = useToast();

  // Initialize mappings when dialog opens
  React.useEffect(() => {
    if (open) {
      const initialMappings = detectedColors.map(({ color }) => {
        // Check if we already have a mapping for this color
        const existing = existingMappings.find(m => m.colorCode.toLowerCase() === color.toLowerCase());
        if (existing) {
          return existing;
        }

        // Create new mapping with suggested values
        return {
          colorCode: color,
          colorName: `Color ${color}`,
          shiftName: 'Unnamed Shift',
          startTime: '00:00',
          endTime: '00:00',
          description: 'Auto-detected from Excel import',
        };
      });
      setMappings(initialMappings);
    }
  }, [open, detectedColors, existingMappings]);

  const handleMappingChange = (index: number, field: keyof ShiftMapping, value: string) => {
    setMappings(prev => prev.map((mapping, i) => 
      i === index ? { ...mapping, [field]: value } : mapping
    ));
  };

  const applyTemplate = (index: number, template: typeof DEFAULT_SHIFT_TEMPLATES[0]) => {
    handleMappingChange(index, 'shiftName', template.name);
    handleMappingChange(index, 'startTime', template.startTime);
    handleMappingChange(index, 'endTime', template.endTime);
    handleMappingChange(index, 'colorName', `${template.name} Color`);
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await onSaveMappings(mappings);
      toast({
        title: 'Mappings Saved',
        description: `Successfully saved ${mappings.length} color mappings.`,
      });
      onOpenChange(false);
    } catch (error) {
      console.error('Error saving mappings:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to save mappings.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const getColorPreview = (color: string) => {
    if (color.startsWith('#INDEX') || color.startsWith('#PATTERN')) {
      return <Badge variant="outline" className="text-xs">Indexed Color</Badge>;
    }
    return (
      <div 
        className="w-6 h-6 rounded border border-gray-300 inline-block"
        style={{ backgroundColor: color }}
        title={color}
      />
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full max-w-[95vw] sm:max-w-4xl max-h-[85vh] sm:max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5" />
            Configure Color Mappings
          </DialogTitle>
          <DialogDescription>
            Define what each detected color represents in your Excel schedule. 
            This mapping will be saved and reused for future imports.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {detectedColors.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Detected Colors Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                  {detectedColors.map(({ color, count }) => (
                    <div key={color} className="flex items-center gap-2 p-2 border rounded">
                      {getColorPreview(color)}
                      <div className="flex-1">
                        <p className="text-sm font-medium">{color}</p>
                        <p className="text-xs text-muted-foreground">{count} entries</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Color to Shift Mappings</h3>
            
            {mappings.map((mapping, index) => {
              const detectedColor = detectedColors.find(dc => dc.color === mapping.colorCode);
              
              return (
                <Card key={mapping.colorCode} className="p-3 sm:p-4">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
                    <div className="space-y-4">
                      <div className="flex items-center gap-2">
                        {getColorPreview(mapping.colorCode)}
                        <div>
                          <p className="font-medium">{mapping.colorCode}</p>
                          {detectedColor && (
                            <p className="text-xs text-muted-foreground">
                              Found in {detectedColor.count} cells
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor={`color-name-${index}`}>Color Name</Label>
                        <Input
                          id={`color-name-${index}`}
                          value={mapping.colorName}
                          onChange={(e) => handleMappingChange(index, 'colorName', e.target.value)}
                          placeholder="e.g., Light Green"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor={`shift-name-${index}`}>Shift Name</Label>
                        <Input
                          id={`shift-name-${index}`}
                          value={mapping.shiftName}
                          onChange={(e) => handleMappingChange(index, 'shiftName', e.target.value)}
                          placeholder="e.g., Morning Shift"
                        />
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label>Quick Templates</Label>
                        <Select onValueChange={(value) => {
                          const template = DEFAULT_SHIFT_TEMPLATES.find(t => t.name === value);
                          if (template) applyTemplate(index, template);
                        }}>
                          <SelectTrigger>
                            <SelectValue placeholder="Choose a shift template" />
                          </SelectTrigger>
                          <SelectContent>
                            {DEFAULT_SHIFT_TEMPLATES.map((template) => (
                              <SelectItem key={template.name} value={template.name}>
                                <div className="flex items-center gap-2">
                                  <Clock className="h-4 w-4" />
                                  {template.name} ({template.startTime} - {template.endTime})
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <div className="space-y-2">
                          <Label htmlFor={`start-time-${index}`}>Start Time</Label>
                          <Input
                            id={`start-time-${index}`}
                            type="time"
                            value={mapping.startTime}
                            onChange={(e) => handleMappingChange(index, 'startTime', e.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor={`end-time-${index}`}>End Time</Label>
                          <Input
                            id={`end-time-${index}`}
                            type="time"
                            value={mapping.endTime}
                            onChange={(e) => handleMappingChange(index, 'endTime', e.target.value)}
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor={`description-${index}`}>Description (Optional)</Label>
                        <Input
                          id={`description-${index}`}
                          value={mapping.description || ''}
                          onChange={(e) => handleMappingChange(index, 'description', e.target.value)}
                          placeholder="Additional notes about this shift"
                        />
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>

        <DialogFooter className="flex-col-reverse sm:flex-row gap-2 sm:gap-0 pt-4 sm:pt-0">
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
            className="w-full sm:w-auto h-11 sm:h-10"
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSave} 
            disabled={saving}
            className="w-full sm:w-auto h-11 sm:h-10"
          >
            <Save className="h-4 w-4 mr-2" />
            {saving ? 'Saving...' : 'Save Mappings'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}