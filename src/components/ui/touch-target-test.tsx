"use client"

import * as React from "react"
import { Button } from "./button"
import { Input } from "./input" 
import { Checkbox, CheckboxWithLabel } from "./checkbox"
import { RadioGroup, RadioGroupItem } from "./radio-group"
import { Switch } from "./switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./select"
import { Badge } from "./badge"
import { TouchTarget, TouchableArea } from "./touch-target"
import { MobileFormField, FormFieldGroup } from "./mobile-form-field"
import { Card, CardContent, CardHeader, CardTitle } from "./card"
import { Label } from "./label"
import { touchTarget, touchButtonGroup, touchFormField } from "@/lib/accessibility"
import { Edit, Trash2, Eye, Plus } from "lucide-react"

/**
 * TouchTargetTest component for testing and demonstrating
 * proper touch target implementation across all UI components
 * 
 * This component should be removed in production - it's for development testing only
 */
export function TouchTargetTest() {
  const [checkboxValue, setCheckboxValue] = React.useState(false)
  const [radioValue, setRadioValue] = React.useState("option1")
  const [switchValue, setSwitchValue] = React.useState(false)
  const [selectValue, setSelectValue] = React.useState("")

  return (
    <div className="p-6 space-y-8 max-w-4xl mx-auto">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold">Touch Target Accessibility Test</h1>
        <p className="text-muted-foreground">
          All interactive elements should have minimum 44px touch targets on mobile.
          Test on mobile device or use browser dev tools mobile simulation.
        </p>
      </div>

      {/* Button Tests */}
      <Card>
        <CardHeader>
          <CardTitle>Buttons - Touch Target Test</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Default Buttons (should be 44px minimum on mobile)</Label>
            <div className={touchButtonGroup()}>
              <Button>Primary Button</Button>
              <Button className="bg-secondary text-secondary-foreground hover:bg-secondary/80">Secondary</Button>
              <Button className="border border-input bg-background hover:bg-accent hover:text-accent-foreground">Outline</Button>
              <Button className="hover:bg-accent hover:text-accent-foreground">Ghost</Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Icon Buttons (should be 44px minimum on mobile)</Label>
            <div className={touchButtonGroup()}>
              <Button className="border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 w-10 p-0">
                <Edit className="h-4 w-4" />
              </Button>
              <Button className="border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 w-10 p-0">
                <Trash2 className="h-4 w-4" />
              </Button>
              <Button className="border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 w-10 p-0">
                <Eye className="h-4 w-4" />
              </Button>
              <Button className="border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 w-10 p-0">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Small Buttons (should still meet 44px minimum)</Label>
            <div className={touchButtonGroup()}>
              <Button className="h-9 px-3 text-sm">Small Button</Button>
              <Button className="border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 px-3 text-sm">Small Outline</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Form Control Tests */}
      <Card>
        <CardHeader>
          <CardTitle>Form Controls - Touch Target Test</CardTitle>
        </CardHeader>
        <CardContent>
          <FormFieldGroup title="Touch-Friendly Form Fields">
            <MobileFormField 
              label="Text Input" 
              description="Should be 44px minimum height on mobile"
              required
            >
              <Input placeholder="Enter text here" />
            </MobileFormField>

            <MobileFormField 
              label="Select Dropdown" 
              description="Trigger should be 44px minimum height on mobile"
            >
              <Select value={selectValue} onValueChange={setSelectValue}>
                <SelectTrigger>
                  <SelectValue placeholder="Select an option" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="option1">Option 1</SelectItem>
                  <SelectItem value="option2">Option 2</SelectItem>
                  <SelectItem value="option3">Option 3</SelectItem>
                </SelectContent>
              </Select>
            </MobileFormField>

            <MobileFormField 
              label="Checkbox Options" 
              description="Each checkbox should have adequate touch area"
            >
              <div className="space-y-3">
                <CheckboxWithLabel
                  checked={checkboxValue}
                  onCheckedChange={(checked) => setCheckboxValue(checked === true)}
                  label="Standard checkbox with label"
                  description="This provides a larger touch target"
                />
                <div className="flex items-center space-x-3">
                  <Checkbox />
                  <Label>Checkbox without wrapper (smaller touch target)</Label>
                </div>
              </div>
            </MobileFormField>

            <MobileFormField 
              label="Radio Group" 
              description="Each radio button should have adequate spacing and touch area"
            >
              <RadioGroup value={radioValue} onValueChange={setRadioValue}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="option1" id="r1" />
                  <Label htmlFor="r1">Option 1</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="option2" id="r2" />
                  <Label htmlFor="r2">Option 2</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="option3" id="r3" />
                  <Label htmlFor="r3">Option 3</Label>
                </div>
              </RadioGroup>
            </MobileFormField>

            <MobileFormField 
              label="Switch Toggle" 
              description="Switch should be large enough for easy touch interaction"
            >
              <div className="flex items-center space-x-3">
                <Switch 
                  checked={switchValue} 
                  onCheckedChange={setSwitchValue}
                />
                <Label>Enable notifications</Label>
              </div>
            </MobileFormField>
          </FormFieldGroup>
        </CardContent>
      </Card>

      {/* Badge Tests */}
      <Card>
        <CardHeader>
          <CardTitle>Badges - Interactive vs Non-Interactive</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Non-Interactive Badges (standard size)</Label>
            <div className="flex flex-wrap gap-2">
              <Badge>Default</Badge>
              <Badge variant="secondary">Secondary</Badge>
              <Badge variant="outline">Outline</Badge>
              <Badge variant="destructive">Destructive</Badge>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Interactive Badges (44px minimum touch target)</Label>
            <div className="flex flex-wrap gap-2">
              <Badge interactive onClick={() => console.log('clicked')}>
                Clickable Default
              </Badge>
              <Badge interactive variant="secondary" onClick={() => console.log('clicked')}>
                Clickable Secondary
              </Badge>
              <Badge interactive variant="outline" onClick={() => console.log('clicked')}>
                Clickable Outline
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Custom Touch Target Tests */}
      <Card>
        <CardHeader>
          <CardTitle>Custom Touch Target Components</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>TouchTarget Wrapper</Label>
            <div className="flex gap-4">
              <TouchTarget className="border rounded-md cursor-pointer bg-muted hover:bg-muted/80">
                <span className="text-sm">Touch Target 1</span>
              </TouchTarget>
              <TouchTarget className="border rounded-md cursor-pointer bg-muted hover:bg-muted/80">
                <span className="text-sm">Touch Target 2</span>
              </TouchTarget>
            </div>
          </div>

          <div className="space-y-2">
            <Label>TouchableArea Wrapper</Label>
            <TouchableArea className="border rounded-md cursor-pointer bg-muted hover:bg-muted/80">
              <div>
                <p className="font-semibold">Touchable Area</p>
                <p className="text-sm text-muted-foreground">
                  This entire area is touch-friendly with proper padding
                </p>
              </div>
            </TouchableArea>
          </div>
        </CardContent>
      </Card>

      {/* Utility Class Tests */}
      <Card>
        <CardHeader>
          <CardTitle>Accessibility Utility Classes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Using touchTarget() utility</Label>
            <button 
              className={touchTarget("bg-primary text-primary-foreground rounded-md px-4")}
              onClick={() => console.log('clicked')}
            >
              Custom Touch Button
            </button>
          </div>

          <div className="space-y-2">
            <Label>Using touchFormField() utility</Label>
            <input 
              className={touchFormField("border rounded-md px-3 bg-background")}
              placeholder="Custom touch-friendly input"
            />
          </div>
        </CardContent>
      </Card>

      {/* Mobile Testing Instructions */}
      <Card className="bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
        <CardHeader>
          <CardTitle>Mobile Testing Instructions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <ul className="space-y-1 text-sm">
            <li>• Use browser dev tools to simulate mobile devices</li>
            <li>• Test with actual touch on mobile devices if possible</li>
            <li>• All interactive elements should be easily tappable with thumb</li>
            <li>• No accidental touches should occur between closely spaced elements</li>
            <li>• Focus indicators should be visible when navigating with keyboard</li>
            <li>• Active states should provide visual feedback on touch</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}

export default TouchTargetTest