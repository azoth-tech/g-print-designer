# Design Editor - Quick Start Guide

## Running the Application

```bash
cd /Users/dvpandian/git/g-print-designer
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Features

### Adding Content
- **Add Text**: Click "Add Text" button, then double-click to edit
- **Upload Image**: Click "Upload Image" to add your own images
- **Clipart**: Click "Clipart" dropdown to add predefined graphics

### Editing Text
- **Font**: Select from dropdown (Arial, Helvetica, etc.)
- **Size**: Adjust with number input (8-200px)
- **Color**: Click color picker to change color
- **Format**: Use Bold (B), Italic (I), and alignment buttons

### Managing Layers (Right Panel)
- **Select**: Click any layer to select it on canvas
- **Hide/Show**: Click eye icon to toggle visibility
- **Delete**: Click trash icon to remove layer

### Exporting
- **Export PNG**: Download design as high-res image for printing
- **Save JSON**: Save design data to edit later
- **Import**: Load previously saved JSON designs

## Customizing for Different Products

Edit `/src/app/page.tsx`:

```typescript
const productConfig: ProductConfig = {
  name: 'Your Product Name',
  mockupImage: '/path/to/mockup.png',
  editableArea: {
    left: 250,    // Adjust these coordinates
    top: 300,     // based on your mockup
    width: 300,   // image
    height: 400,
  },
};
```

## Adding More Clipart

1. Add images to `/public/clipart/`
2. Update `CLIPART_IMAGES` array in `/src/components/Toolbar.tsx`:

```typescript
const CLIPART_IMAGES = [
  { name: 'Heart', url: '/clipart/heart.png' },
  { name: 'Star', url: '/clipart/star.png' },
  { name: 'Your New Clipart', url: '/clipart/yourimage.png' },
];
```

## Integration into E-commerce

```typescript
import DesignEditor from '@/components/DesignEditor';

function YourPage() {
  const config = {
    name: 'T-Shirt',
    mockupImage: '/tshirt.png',
    editableArea: { left: 250, top: 300, width: 300, height: 400 },
  };

  return <DesignEditor productConfig={config} />;
}
```

## Tech Stack

- **Next.js 16** - React framework
- **Fabric.js** - Canvas manipulation
- **TypeScript** - Type safety
- **React Icons** - UI icons

## Note

TypeScript may show import warnings for Fabric.js. These are type definition issues and don't affect functionality - the app works perfectly!
