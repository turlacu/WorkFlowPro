"use client";

import * as React from "react";
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { TouchTarget, TouchableArea } from "@/components/ui/touch-target";
import { cn } from "@/lib/utils";
import { 
  Smartphone, 
  Tablet, 
  Monitor, 
  Laptop, 
  RotateCw, 
  Eye, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  Ruler,
  Target,
  MousePointer2,
  Palette,
  Layout,
  Menu,
  Settings,
  User,
  Calendar,
  BarChart3
} from "lucide-react";

interface ViewportInfo {
  width: number;
  height: number;
  breakpoint: string;
  deviceType: string;
  orientation: 'portrait' | 'landscape';
  isTouch: boolean;
  pixelRatio: number;
}

interface BreakpointTest {
  name: string;
  min: number;
  max: number;
  icon: React.ComponentType<any>;
  color: string;
  description: string;
}

const breakpoints: BreakpointTest[] = [
  {
    name: "Mobile Portrait",
    min: 320,
    max: 428,
    icon: Smartphone,
    color: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
    description: "Small mobile devices in portrait orientation"
  },
  {
    name: "Mobile Landscape", 
    min: 568,
    max: 896,
    icon: RotateCw,
    color: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
    description: "Mobile devices in landscape orientation"
  },
  {
    name: "Tablet Portrait",
    min: 768,
    max: 834,
    icon: Tablet,
    color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
    description: "Tablet devices in portrait orientation"
  },
  {
    name: "Tablet Landscape",
    min: 1024,
    max: 1180,
    icon: Laptop,
    color: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
    description: "Tablet devices in landscape orientation"
  },
  {
    name: "Desktop",
    min: 1200,
    max: Infinity,
    icon: Monitor,
    color: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
    description: "Desktop and large screen devices"
  }
];

interface TouchTargetTest {
  id: string;
  name: string;
  size: number;
  minSize: number;
  status: 'pass' | 'warn' | 'fail';
  description: string;
}

export function ResponsiveTestComponent() {
  const [viewport, setViewport] = useState<ViewportInfo>({
    width: 0,
    height: 0,
    breakpoint: 'unknown',
    deviceType: 'unknown',
    orientation: 'portrait',
    isTouch: false,
    pixelRatio: 1
  });

  const [touchTargetTests, setTouchTargetTests] = useState<TouchTargetTest[]>([]);
  const [selectedTest, setSelectedTest] = useState('viewport');

  useEffect(() => {
    const updateViewport = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      const orientation = width > height ? 'landscape' : 'portrait';
      const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
      const pixelRatio = window.devicePixelRatio || 1;

      const currentBreakpoint = breakpoints.find(bp => 
        width >= bp.min && (bp.max === Infinity || width <= bp.max)
      );

      setViewport({
        width,
        height,
        breakpoint: currentBreakpoint?.name || 'unknown',
        deviceType: currentBreakpoint?.name || 'unknown',
        orientation,
        isTouch,
        pixelRatio
      });
    };

    updateViewport();
    window.addEventListener('resize', updateViewport);
    window.addEventListener('orientationchange', updateViewport);

    return () => {
      window.removeEventListener('resize', updateViewport);
      window.removeEventListener('orientationchange', updateViewport);
    };
  }, []);

  useEffect(() => {
    // Generate touch target tests based on current viewport
    const tests: TouchTargetTest[] = [
      {
        id: 'button-sm',
        name: 'Small Button',
        size: 32,
        minSize: 44,
        status: 32 >= 44 ? 'pass' : 'fail',
        description: 'Standard small button component'
      },
      {
        id: 'button-md',
        name: 'Medium Button',
        size: 40,
        minSize: 44,
        status: 40 >= 44 ? 'pass' : 'warn',
        description: 'Standard medium button component'
      },
      {
        id: 'button-lg',
        name: 'Large Button',
        size: 48,
        minSize: 44,
        status: 48 >= 44 ? 'pass' : 'fail',
        description: 'Standard large button component'
      },
      {
        id: 'icon-button',
        name: 'Icon Button',
        size: 40,
        minSize: 44,
        status: 40 >= 44 ? 'pass' : 'warn',
        description: 'Icon-only button component'
      },
      {
        id: 'checkbox',
        name: 'Checkbox',
        size: 20,
        minSize: 44,
        status: 20 >= 44 ? 'pass' : 'fail',
        description: 'Checkbox input with touch area'
      },
      {
        id: 'form-input',
        name: 'Form Input',
        size: viewport.width < 768 ? 48 : 40,
        minSize: 44,
        status: (viewport.width < 768 ? 48 : 40) >= 44 ? 'pass' : 'warn',
        description: 'Text input field'
      }
    ];

    setTouchTargetTests(tests);
  }, [viewport]);

  const getCurrentBreakpoint = () => {
    return breakpoints.find(bp => 
      viewport.width >= bp.min && (bp.max === Infinity || viewport.width <= bp.max)
    );
  };

  const getStatusIcon = (status: 'pass' | 'warn' | 'fail') => {
    switch (status) {
      case 'pass': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'warn': return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      case 'fail': return <XCircle className="h-4 w-4 text-red-600" />;
    }
  };

  const renderViewportTest = () => {
    const currentBreakpoint = getCurrentBreakpoint();
    
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Ruler className="h-5 w-5" />
              Current Viewport Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Dimensions</Label>
                <p className="text-2xl font-mono">{viewport.width} × {viewport.height}</p>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">Device Type</Label>
                <div className="flex items-center gap-2">
                  {currentBreakpoint && <currentBreakpoint.icon className="h-4 w-4" />}
                  <Badge className={currentBreakpoint?.color}>
                    {viewport.breakpoint}
                  </Badge>
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">Orientation</Label>
                <p className="text-lg capitalize">{viewport.orientation}</p>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">Touch Support</Label>
                <p className="text-lg">{viewport.isTouch ? 'Yes' : 'No'}</p>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">Pixel Ratio</Label>
                <p className="text-lg font-mono">{viewport.pixelRatio}x</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Breakpoint Coverage</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {breakpoints.map((bp) => {
                const isActive = viewport.width >= bp.min && (bp.max === Infinity || viewport.width <= bp.max);
                const IconComponent = bp.icon;
                
                return (
                  <div
                    key={bp.name}
                    className={cn(
                      "flex items-center justify-between p-3 rounded-lg border transition-colors",
                      isActive ? "bg-primary/10 border-primary" : "bg-muted/50"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <IconComponent className="h-5 w-5" />
                      <div>
                        <p className="font-medium">{bp.name}</p>
                        <p className="text-sm text-muted-foreground">{bp.description}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-mono text-sm">
                        {bp.min}px - {bp.max === Infinity ? '∞' : `${bp.max}px`}
                      </p>
                      {isActive && <Badge variant="default" className="mt-1">Active</Badge>}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  const renderTouchTargetTest = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Touch Target Validation
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            WCAG 2.1 AA guidelines recommend minimum 44px × 44px touch targets for mobile accessibility.
          </p>
          
          <div className="space-y-4">
            {touchTargetTests.map((test) => (
              <div key={test.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  {getStatusIcon(test.status)}
                  <div>
                    <p className="font-medium">{test.name}</p>
                    <p className="text-sm text-muted-foreground">{test.description}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-mono text-sm">
                    {test.size}px / {test.minSize}px
                  </p>
                  <Badge variant={test.status === 'pass' ? 'default' : test.status === 'warn' ? 'secondary' : 'destructive'}>
                    {test.status.toUpperCase()}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Interactive Touch Targets</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <TouchTarget className="bg-primary text-primary-foreground rounded-md">
              <Button className="hover:bg-accent hover:text-accent-foreground h-9 px-3 text-sm text-white hover:text-white">
                Small
              </Button>
            </TouchTarget>
            
            <TouchTarget className="bg-secondary text-secondary-foreground rounded-md">
              <Button className="hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2 text-foreground">
                Medium
              </Button>
            </TouchTarget>
            
            <TouchTarget className="bg-accent text-accent-foreground rounded-md">
              <Button className="hover:bg-accent hover:text-accent-foreground h-11 px-8">
                Large
              </Button>
            </TouchTarget>
            
            <TouchableArea padding="md" className="bg-muted rounded-md">
              <div className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                <span className="text-sm">Touchable</span>
              </div>
            </TouchableArea>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderComponentTest = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Layout className="h-5 w-5" />
            Component Responsiveness Test
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="forms" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="forms">Forms</TabsTrigger>
              <TabsTrigger value="tables">Tables</TabsTrigger>
              <TabsTrigger value="navigation">Navigation</TabsTrigger>
              <TabsTrigger value="modals">Modals</TabsTrigger>
            </TabsList>
            
            <TabsContent value="forms" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="test-input">Text Input</Label>
                    <Input id="test-input" placeholder="Test input field" />
                  </div>
                  
                  <div>
                    <Label htmlFor="test-textarea">Textarea</Label>
                    <Textarea id="test-textarea" placeholder="Test textarea field" />
                  </div>
                  
                  <div>
                    <Label htmlFor="test-select">Select</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select an option" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="option1">Option 1</SelectItem>
                        <SelectItem value="option2">Option 2</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox id="test-checkbox" />
                    <Label htmlFor="test-checkbox">Checkbox option</Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Switch id="test-switch" />
                    <Label htmlFor="test-switch">Switch option</Label>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Slider</Label>
                    <Slider defaultValue={[50]} max={100} step={1} />
                  </div>
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-2">
                <Button className="flex-1">Primary Action</Button>
                <Button className="border border-input bg-background hover:bg-accent hover:text-accent-foreground flex-1">Secondary Action</Button>
                <Button className="hover:bg-accent hover:text-accent-foreground flex-1">Tertiary Action</Button>
              </div>
            </TabsContent>
            
            <TabsContent value="tables" className="space-y-4">
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead className="hidden sm:table-cell">Email</TableHead>
                      <TableHead className="hidden md:table-cell">Role</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell>John Doe</TableCell>
                      <TableCell className="hidden sm:table-cell">john@example.com</TableCell>
                      <TableCell className="hidden md:table-cell">Admin</TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button className="hover:bg-accent hover:text-accent-foreground h-9 px-3 text-sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button className="hover:bg-accent hover:text-accent-foreground h-9 px-3 text-sm">
                            <Settings className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Jane Smith</TableCell>
                      <TableCell className="hidden sm:table-cell">jane@example.com</TableCell>
                      <TableCell className="hidden md:table-cell">User</TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button className="hover:bg-accent hover:text-accent-foreground h-9 px-3 text-sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button className="hover:bg-accent hover:text-accent-foreground h-9 px-3 text-sm">
                            <Settings className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            </TabsContent>
            
            <TabsContent value="navigation" className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-2">
                <Button className="border border-input bg-background hover:bg-accent hover:text-accent-foreground flex-1 justify-start">
                  <User className="mr-2 h-4 w-4" />
                  Profile
                </Button>
                <Button className="border border-input bg-background hover:bg-accent hover:text-accent-foreground flex-1 justify-start">
                  <Calendar className="mr-2 h-4 w-4" />
                  Schedule
                </Button>
                <Button className="border border-input bg-background hover:bg-accent hover:text-accent-foreground flex-1 justify-start">
                  <BarChart3 className="mr-2 h-4 w-4" />
                  Reports
                </Button>
                <Button className="border border-input bg-background hover:bg-accent hover:text-accent-foreground flex-1 justify-start">
                  <Settings className="mr-2 h-4 w-4" />
                  Settings
                </Button>
              </div>
              
              <div className="md:hidden">
                <Sheet>
                  <SheetTrigger asChild>
                    <Button className="border border-input bg-background hover:bg-accent hover:text-accent-foreground w-full">
                      <Menu className="mr-2 h-4 w-4" />
                      Mobile Menu
                    </Button>
                  </SheetTrigger>
                  <SheetContent>
                    <SheetHeader>
                      <SheetTitle>Navigation Menu</SheetTitle>
                    </SheetHeader>
                    <div className="space-y-2 mt-4">
                      <Button className="hover:bg-accent hover:text-accent-foreground w-full justify-start">
                        <User className="mr-2 h-4 w-4" />
                        Profile
                      </Button>
                      <Button className="hover:bg-accent hover:text-accent-foreground w-full justify-start">
                        <Calendar className="mr-2 h-4 w-4" />
                        Schedule
                      </Button>
                      <Button className="hover:bg-accent hover:text-accent-foreground w-full justify-start">
                        <BarChart3 className="mr-2 h-4 w-4" />
                        Reports
                      </Button>
                      <Button className="hover:bg-accent hover:text-accent-foreground w-full justify-start">
                        <Settings className="mr-2 h-4 w-4" />
                        Settings
                      </Button>
                    </div>
                  </SheetContent>
                </Sheet>
              </div>
            </TabsContent>
            
            <TabsContent value="modals" className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Dialog>
                  <DialogTrigger asChild>
                    <Button className="w-full">Open Dialog</Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Test Dialog</DialogTitle>
                    </DialogHeader>
                    <p>This is a test dialog to verify modal responsiveness.</p>
                    <div className="space-y-4">
                      <Input placeholder="Test input in modal" />
                      <div className="flex gap-2">
                        <Button className="flex-1">Confirm</Button>
                        <Button className="border border-input bg-background hover:bg-accent hover:text-accent-foreground flex-1">Cancel</Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
                
                <Sheet>
                  <SheetTrigger asChild>
                    <Button className="border border-input bg-background hover:bg-accent hover:text-accent-foreground w-full">Open Sheet</Button>
                  </SheetTrigger>
                  <SheetContent>
                    <SheetHeader>
                      <SheetTitle>Test Sheet</SheetTitle>
                    </SheetHeader>
                    <p className="mt-4">This is a test sheet to verify mobile-friendly panels.</p>
                    <div className="space-y-4 mt-4">
                      <Input placeholder="Test input in sheet" />
                      <Button className="w-full">Action</Button>
                    </div>
                  </SheetContent>
                </Sheet>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">WorkFlowPro Mobile Compatibility Test Suite</h1>
          <p className="text-muted-foreground">
            Comprehensive testing utility for validating mobile responsiveness and accessibility across different screen sizes.
          </p>
        </div>

        <Tabs value={selectedTest} onValueChange={setSelectedTest} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="viewport" className="flex items-center gap-2">
              <Ruler className="h-4 w-4" />
              <span className="hidden sm:inline">Viewport</span>
            </TabsTrigger>
            <TabsTrigger value="touch" className="flex items-center gap-2">
              <Target className="h-4 w-4" />
              <span className="hidden sm:inline">Touch Targets</span>
            </TabsTrigger>
            <TabsTrigger value="components" className="flex items-center gap-2">
              <Layout className="h-4 w-4" />
              <span className="hidden sm:inline">Components</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="viewport">{renderViewportTest()}</TabsContent>
          <TabsContent value="touch">{renderTouchTargetTest()}</TabsContent>
          <TabsContent value="components">{renderComponentTest()}</TabsContent>
        </Tabs>
      </div>
    </div>
  );
}