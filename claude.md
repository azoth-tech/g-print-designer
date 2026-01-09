# G-Print Designer - Project Documentation

## Overview

**G-Print Designer** is a web-based print design editor built with Next.js and Fabric.js. It enables users to create custom designs for t-shirts, mugs, and other printable products. The component is designed to be easily integrated into any website as a standalone design tool.

**Live Demo**: `https://your-project-name.pages.dev` (after deployment)

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Canvas Engine**: Fabric.js 6.9.0
- **Language**: TypeScript 5
- **UI Icons**: React Icons 5.5.0
- **Deployment**: Cloudflare Pages (via `@cloudflare/next-on-pages`)
- **Styling**: CSS Modules + CSS Variables (Dark Theme)

## Architecture

### Component Structure

```
src/
├── app/
│   ├── layout.tsx          # Root layout with fonts
│   ├── page.tsx            # Main entry point (configurable)
│   └── globals.css         # Global styles & CSS variables
│
├── components/
│   ├── DesignEditorWrapper.tsx  # SSR-safe wrapper with dynamic import
│   ├── DesignEditor.tsx         # Main editor component (canvas logic)
│   ├── Toolbar.tsx              # Top toolbar (add elements, export)
│   ├── LayerPanel.tsx           # Right sidebar (layer management)
│   ├── ExportDrawer.tsx         # Advanced export settings drawer
│   ├── ExportDrawer.module.css  # Export drawer styles
│   ├── DesignEditor.module.css  # Main editor styles
│   ├── Toolbar.module.css       # Toolbar styles
│   └── PropertiesPanel.tsx      # Properties panel (deprecated/legacy)
│
├── utils/
│   └── canvasUtils.ts       # Canvas helper functions
│
└── types/
    └── types.ts             # TypeScript interfaces
```

### Key Data Flow

1. **ProductConfig** → `DesignEditorWrapper` → `DesignEditor`
2. **Fabric Canvas** → Managed in `DesignEditor` with lifecycle hooks
3. **User Actions** → Toolbar → Canvas Utils → Canvas Updates
4. **Layer Updates** → Canvas Events → `LayerPanel` re-renders

## Core Features

### 1. Canvas & Mockup Management
- Loads product mockup as background image
- Automatically scales canvas to fit image (max 800px width)
- Responsive scaling for different screen sizes
- Editable area overlay (dashed blue border)

### 2. Content Creation
- **Text**: Add editable text boxes with double-click to edit
- **Images**: Upload user images or use clipart library
- **Clipart**: Predefined graphics (heart, star, circle)

### 3. Text Editing (Floating Toolbar)
- Font family selection (9 fonts)
- Font size (8-200px)
- Color picker
- Bold, Italic formatting
- Text alignment (left, center, right)
- **Draggable floating toolbar** (custom position)

### 4. Image Editing (Floating Toolbar)
- Remove white background (RemoveColor filter)
- Background color tinting
- **Draggable floating toolbar** (custom position)

### 5. Layer Management
- View all layers (text + images)
- Select layer to focus on canvas
- Toggle visibility (eye icon)
- Delete layers
- Reorder layers (bring forward/backward)
- Active layer highlighting

### 6. Export/Import

#### Basic Export
- **Export PNG**: High-res (2x multiplier) design download
- **Export JSON**: Save design state for later editing
- **Import JSON**: Load previously saved designs

#### Advanced Export (ExportDrawer)
- **Export Menu**: Dropdown with multiple format options
- **Editable Area Only**: All exports crop to design area (no mockup)
- **Resolution Options**:
  - PNG (High Res): 3x multiplier (288 DPI)
  - PNG (300 DPI): Print-ready quality
  - TIFF: Lossless archival format
  - PDF: Scalable vector-based
  - Transparent PNG: No background
  - Full Canvas PNG: Includes mockup
- **Custom Settings**: Dimensions, DPI, background options
- **Preview**: Visual preview before export

### 7. Responsive Design
- Mobile-optimized UI
- Layer panel becomes overlay on mobile
- Canvas auto-scales to fit viewport
- Touch gesture support

## Configuration

### Product Configuration (src/app/page.tsx)

```typescript
const productConfig: ProductConfig = {
  name: 'T-Shirt',
  mockupImage: '/white-tshirt.png',
  editableArea: {
    left: 200,    // X position of editable zone
    top: 200,     // Y position of editable zone
    width: 200,   // Width of editable zone
    height: 250,  // Height of editable zone
  },
};
```

**To customize for different products:**
1. Update `mockupImage` path (place in `/public/`)
2. Adjust `editableArea` coordinates to match mockup
3. Change `name` for product identification

### Adding Clipart (src/components/Toolbar.tsx)

```typescript
const CLIPART_IMAGES = [
  { name: 'Heart', url: '/clipart/heart.png' },
  { name: 'Star', url: '/clipart/star.png' },
  { name: 'Circle', url: '/clipart/circle.png' },
  // Add your clipart here
];
```

## Integration Guide

### As a Standalone Page
The app is ready to use as-is. Just configure `page.tsx` and deploy.

### As an Embedded Component
```typescript
import DesignEditorWrapper from '@/components/DesignEditorWrapper';

function ProductPage() {
  const config = {
    name: 'Mug',
    mockupImage: '/mug-mockup.png',
    editableArea: { left: 150, top: 180, width: 180, height: 200 },
  };

  return <DesignEditorWrapper productConfig={config} />;
}
```

### Integration with E-commerce
1. User selects product → Pass config to DesignEditor
2. User designs → Export PNG/JSON
3. Save design to database with order
4. Use PNG for print production

## File Structure Details

### Types (src/types/types.ts)
- `Layer`: UI layer representation
- `EditableArea`: Bounding box for design area
- `ProductConfig`: Product configuration
- `DesignExport`: Export data structure
- `TextOptions`: Text styling options

### Canvas Utils (src/utils/canvasUtils.ts)
- `addTextToCanvas`: Creates text objects
- `addImageToCanvas`: Creates image objects with auto-scaling
- `exportCanvasToPNG`: Exports high-res PNG
- `exportCanvasToJSON`: Exports canvas state
- `importCanvasFromJSON`: Imports canvas state
- `createEditableAreaOverlay`: Draws boundary box

### DesignEditor.tsx (Main Logic)
- **State**: canvas, isLoading, isLayerPanelOpen, layoutScale
- **Effects**:
  - `useEffect` (resize): Handles responsive scaling
  - `useEffect` (canvas init): Creates Fabric canvas, loads mockup
- **Constraints**: Objects stay within editable area
- **Export Handlers**: PNG/JSON export functions

### Toolbar.tsx
- **State**: activeObject, showClipart, dragPosition, hideFloatingToolbar
- **Effects**:
  - Selection tracking for active object
  - Filter detection (remove background)
  - Clipart dropdown positioning
  - Outside click detection
- **Draggable**: Mouse/touch handlers for floating toolbar
- **Portals**: Clipart & floating toolbars render in `document.body`

### LayerPanel.tsx
- **State**: layers, activeLayerId
- **Effects**: Canvas event listeners for layer sync
- **Actions**: Select, toggle visibility, delete, reorder

### ExportDrawer.tsx
- **State**: format, width, height, dpi, transparency, product color
- **Features**:
  - Preview image display
  - Format selection (PNG, JPG, PDF, SVG)
  - Dimension inputs with aspect ratio lock
  - DPI slider (72-300)
  - Background options (transparent, product color)
- **Props**: isOpen, onClose, previewImage, initialDimensions, onExport
- **Styling**: Slide-out drawer with smooth animations

## Deployment

### Cloudflare Pages (Recommended)
```bash
npm run deploy
```

### Static Export
```bash
npm run build
# Deploy `out/` folder to any static host
```

### Local Development
```bash
npm run dev
# http://localhost:3000
```

---

## 🎯 Improvement Opportunities

### 1. Performance Optimizations

#### Canvas Rendering
- **Issue**: `canvas.renderAll()` called frequently
- **Optimization**: Use `requestRenderAll()` for batch updates
- **Impact**: Smoother interactions, less CPU usage

#### State Management
- **Issue**: Multiple `useState` + `forceUpdate({})` pattern
- **Optimization**: Consolidate state or use `useReducer`
- **Impact**: Fewer re-renders, cleaner code

#### Image Loading
- **Issue**: No caching for mockup/clipart images
- **Optimization**: Implement service worker or browser caching
- **Impact**: Faster subsequent loads

### 2. Feature Enhancements

#### Advanced Text Features
- [ ] **Text Stroke/Outline**: Add stroke color and width
- [ ] **Text Shadow**: Drop shadow effects
- [ ] **Text Spacing**: Letter spacing, line height
- [ ] **Curved Text**: Arc text along path
- [ ] **Multi-line Alignment**: Better paragraph handling

#### Image Enhancements
- [ ] **Image Filters**: Brightness, contrast, saturation
- [ ] **Image Resize Handles**: Visual resize handles on canvas
- [ ] **Image Rotation**: Better rotation UI (angle input)
- [ ] **Image Duplication**: Copy/paste images
- [ ] **Image Upload Progress**: Show loading state

#### Design Tools
- [ ] **Undo/Redo**: History stack for actions
- [ ] **Copy/Paste**: Clipboard support for objects
- [ ] **Keyboard Shortcuts**: Delete, copy, paste, undo
- [ ] **Snap to Grid**: Alignment guides
- [ ] **Object Alignment**: Left/center/right align buttons
- [ ] **Distribute Objects**: Even spacing
- [ ] **Lock Objects**: Prevent accidental edits
- [ ] **Group/Ungroup**: Combine multiple objects

#### Export Options
- [ ] **Multiple Formats**: JPG, SVG, PDF
- [ ] **Resolution Options**: 1x, 2x, 3x, custom DPI
- [ ] **Transparent Background**: Option to hide mockup
- [ ] **Print-Ready**: CMYK color mode option
- [ ] **Export Presets**: Save export settings

#### Clipart Management
- [ ] **Dynamic Clipart Loading**: Load from API
- [ ] **Clipart Categories**: Organized folders
- [ ] **Search Clipart**: Filter by name
- [ ] **Upload Custom Clipart**: User clipart library
- [ ] **SVG Support**: Vector clipart

### 3. UX/UI Improvements

#### Mobile Experience
- [ ] **Touch Gestures**: Pinch-to-zoom on canvas
- [ ] **Bottom Sheet**: Better mobile layer panel
- [ ] **Floating Toolbar Position**: Save position preference
- [ ] **Gesture Hints**: Show drag instructions

#### Accessibility
- [ ] **Keyboard Navigation**: Full keyboard support
- [ ] **Screen Reader**: ARIA labels and roles
- [ ] **High Contrast Mode**: WCAG AA compliance
- [ ] **Focus Indicators**: Visible focus states
- [ ] **Color Blind Mode**: Alternative color schemes

#### Visual Polish
- [ ] **Loading States**: Skeleton screens for canvas
- [ ] **Empty States**: Better onboarding for new users
- [ ] **Tooltips**: All buttons should have titles
- [ ] **Confirmation Dialogs**: Before delete/overwrite
- [ ] **Success Notifications**: "Design exported!" messages
- [ ] **Error Handling**: User-friendly error messages

#### Onboarding
- [ ] **Welcome Modal**: Quick start guide
- [ ] **Interactive Tutorial**: Step-by-step walkthrough
- [ ] **Template Library**: Pre-made designs
- [ ] **Video Tutorials**: Help section

### 4. Code Quality & Architecture

#### Type Safety
- [ ] **Strict Mode**: Enable `strict: true` in tsconfig.json
- [ ] **Type Guards**: Better type narrowing
- [ ] **Zod Validation**: Runtime validation for JSON imports
- [ ] **API Types**: Generated types from schema

#### Testing
- [ ] **Unit Tests**: Canvas utils functions
- [ ] **Integration Tests**: User flows (add text, export)
- [ ] **E2E Tests**: Playwright/Cypress for critical paths
- [ ] **Visual Regression**: Percy/Chromatic
- [ ] **Performance Tests**: Lighthouse CI

#### Error Handling
- [ ] **Error Boundaries**: Catch React errors
- [ ] **Canvas Error Recovery**: Handle Fabric.js errors
- [ ] **Import Validation**: Validate JSON before import
- [ ] **Image Validation**: Check file size, format, dimensions

#### State Management
- [ ] **Context API**: Global state for user preferences
- [ ] **Zustand/Redux**: Centralized state for complex flows
- [ ] **Persist State**: LocalStorage for unsaved designs
- [ ] **Sync State**: WebSocket for collaboration (future)

#### Code Organization
- [ ] **Custom Hooks**: Extract reusable logic
  - `useCanvas` - Canvas management
  - `useDraggable` - Drag functionality
  - `useResponsive` - Responsive utilities
- [ ] **Feature Flags**: Enable/disable features
- [ ] **Config File**: Centralize all constants

### 5. Integration & Extensibility

#### API Layer
- [ ] **Save to Backend**: API endpoints for designs
- [ ] **User Accounts**: Save designs per user
- [ ] **Design Templates**: Template management API
- [ ] **Clipart API**: Dynamic clipart loading

#### E-commerce Integration
- [ ] **Cart Integration**: Add designed product to cart
- [ ] **Order Tracking**: Link design to order ID
- [ ] **Price Calculator**: Based on design complexity
- [ ] **Product Variants**: Different sizes/colors

#### Plugin System
- [ ] **Extension Points**: Hook system for custom features
- [ ] **Third-party Tools**: Integration with print services
- [ ] **Custom Filters**: User-defined image filters
- [ ] **Custom Fonts**: Dynamic font loading

#### Multi-language
- [ ] **i18n**: Translation support
- [ ] **RTL Support**: Right-to-left languages
- [ ] **Local Formatting**: Date, number formats

### 6. Security & Privacy

#### Data Protection
- [ ] **Sanitize Imports**: Prevent malicious JSON
- [ ] **CSP Headers**: Content Security Policy
- [ ] **Rate Limiting**: API endpoints
- [ ] **Image Validation**: Scan uploads for malware

#### Privacy
- [ ] **GDPR Compliance**: User data handling
- [ ] **Cookie Consent**: For analytics
- [ ] **Data Retention**: Auto-delete old designs
- [ ] **Anonymization**: User tracking options

### 7. Analytics & Monitoring

#### User Analytics
- [ ] **Feature Usage**: Track tool usage
- [ ] **Export Metrics**: What formats are popular
- [ ] **Drop-off Points**: Where users struggle
- [ ] **Session Recording**: (Privacy-compliant)

#### Performance Monitoring
- [ ] **Error Tracking**: Sentry/Bugsnag
- [ ] **Performance Metrics**: Core Web Vitals
- [ ] **Canvas Performance**: FPS monitoring
- [ ] **Bundle Size**: Track over time

### 8. Deployment & DevOps

#### CI/CD
- [ ] **GitHub Actions**: Automated testing
- [ ] **Preview Deploys**: Per-branch previews
- [ ] **Auto-deploy Main**: On merge to main
- [ ] **Dependency Updates**: Dependabot

#### Environment Management
- [ ] **Environment Variables**: API keys, endpoints
- [ ] **Feature Toggles**: Enable features per environment
- [ ] **Config per Environment**: Dev/Staging/Prod

#### Monitoring
- [ ] **Uptime Monitoring**: Pingdom/Upptime
- [ ] **Error Alerts**: Slack/Email notifications
- [ ] **Usage Dashboard**: Analytics dashboard

---

## Quick Wins (High Impact, Low Effort)

1. **Undo/Redo** - ~2-4 hours
   - Stack-based history in canvas utils
   - Keyboard shortcuts (Ctrl+Z, Ctrl+Y)

2. **Keyboard Shortcuts** - ~1-2 hours
   - Delete key for selected object
   - Ctrl+C/V for copy/paste
   - Arrow keys for nudging

3. **Success/Error Notifications** - ~1-2 hours
   - Toast component
   - Show on export/import

4. **Loading States** - ~1-2 hours
   - Skeleton for canvas
   - Spinner for exports

5. **Better Error Messages** - ~1-2 hours
   - User-friendly import errors
   - Image load failures

6. **Confirmation Dialogs** - ~1-2 hours
   - Before delete
   - Before overwrite import

---

## Long-term Vision

### Phase 1: Core Features (Current)
✅ Basic text/image editing
✅ Layer management
✅ Export/import
✅ Responsive design

### Phase 2: Enhanced Editing (Next)
- Undo/Redo
- Keyboard shortcuts
- Advanced text features
- Image filters

### Phase 3: Professional Tools
- Print-ready exports
- Collaboration features
- Template library
- Integration with print services

### Phase 4: Platform
- User accounts
- Design marketplace
- Mobile app (PWA)
- API for developers

---

## Useful Commands

```bash
# Development
npm run dev

# Build
npm run build

# Type Check
npx tsc --noEmit

# Lint
npm run lint

# Deploy to Cloudflare
npm run deploy

# Preview Deployment
npm run preview
```

---

## Known Issues & Workarounds

### 1. Fabric.js Type Definitions
**Issue**: TypeScript warnings for Fabric.js imports
**Workaround**: Types are functional despite warnings
**Fix**: Update to Fabric.js 7.x when stable

### 2. Mobile Canvas Touch
**Issue**: Some mobile browsers have touch conflicts
**Workaround**: `touch-action: none` on canvas
**Fix**: Test on more devices, add touch event polyfill

### 3. Large Image Uploads
**Issue**: Large images can slow down canvas
**Workaround**: Auto-scale on upload
**Fix**: Add image compression before upload

### 4. Cross-origin Images
**Issue**: External images may fail to load
**Workaround**: `crossOrigin: 'anonymous'` set
**Fix**: Use proxy or require same-origin

---

## Resources

- [Fabric.js Documentation](http://fabricjs.com/docs/)
- [Next.js Documentation](https://nextjs.org/docs)
- [Cloudflare Pages Guide](https://developers.cloudflare.com/pages/)
- [React Icons](https://react-icons.github.io/react-icons/)

---

## Contact & Support

For issues, feature requests, or questions:
- Check existing issues in repository
- Review this documentation first
- Test with minimal reproduction case

---

*Last Updated: 2026-01-09*
*Project Version: 0.1.0*

---

## 📋 Recent Changes (2026-01-09)

### Documentation Cleanup
- Removed redundant markdown files (README.md, DEPLOYMENT.md, EXPORT_FEATURES.md, IMPLEMENTATION_SUMMARY.md)
- Consolidated all documentation into this single CLAUDE.md file
- Updated component structure to include ExportDrawer

### New Components Added
- **ExportDrawer.tsx**: Advanced export settings drawer with preview
- **ExportDrawer.module.css**: Comprehensive styling for export drawer
- Features: format selection, dimension controls, DPI slider, background options

### Current State
- ✅ Core editor functionality complete
- ✅ Layer management working
- ✅ Export/import features available
- ✅ ExportDrawer with advanced settings (in development)
- 🔄 PropertiesPanel.tsx - legacy/deprecated (can be removed)
