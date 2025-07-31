# Mobile Header Debugging Guide

## Quick Test Steps

1. **Open the test file**: Open `/home/turlacu/WorkFlowPro/test-mobile-header.html` in a browser
2. **Resize browser window**: Make it less than 768px wide
3. **Check visibility**: The mobile header (blue border) should be visible, desktop header (yellow border) should be hidden

## Browser Developer Tools Testing

1. Open your app in browser: `http://localhost:3000`
2. Open Developer Tools (F12)
3. Toggle device toolbar (Ctrl+Shift+M or Cmd+Shift+M)
4. Select a mobile device or set custom dimensions < 768px width
5. Inspect the mobile header elements

## Key Elements to Check

### Mobile Header Container
```css
.flex.md\:hidden.items-center.justify-between.w-full
```
Should be visible when viewport < 768px

### Hamburger Button
```css
button[aria-label="Toggle menu"]
```
Should have `variant="outline"` and `size="icon"`

### Theme Toggle
```css
button[aria-label*="theme" i]
```
Should have `variant="ghost"` and `size="icon"`

### Language Toggle  
```css
button[aria-label*="language" i]
```
Should have `variant="ghost"` and `size="icon"`

## Common Issues and Solutions

### Issue: Buttons have no background/border
**Solution**: Check if Button variants are properly set (not using default variant)

### Issue: Elements overlapping
**Solution**: Check for conflicting CSS classes or absolute positioning

### Issue: Container not showing
**Solution**: Check if `md:hidden` class is working - might be Tailwind CSS not loading

### Issue: JavaScript errors
**Solution**: Check browser console for React hydration errors or component crashes

## Debug with CSS

Add this temporary CSS to see element boundaries:

```css
.mobile-debug * {
  border: 1px solid red !important;
  background: rgba(255,0,0,0.1) !important;
}
```

Apply to mobile header:
```html
<div className="flex md:hidden mobile-debug items-center justify-between w-full">
```

## Tailwind CSS Debug

Check if Tailwind is working:
```javascript
// In browser console
console.log(getComputedStyle(document.documentElement).fontSize); // Should show base font size
console.log(window.innerWidth < 768 ? 'Mobile' : 'Desktop'); // Check breakpoint
```