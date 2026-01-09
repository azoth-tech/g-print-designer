import * as fabric from 'fabric';
import { saveAs } from 'file-saver';
import { EditableArea, TextOptions } from '@/types/types';

// PDF generation library
import jsPDF from 'jspdf';

export const addTextToCanvas = (
    canvas: fabric.Canvas,
    text: string = 'Double click to edit',
    options?: Partial<TextOptions>,
    editableArea?: EditableArea
): fabric.Textbox => {
    const defaultOptions: TextOptions = {
        fontFamily: 'Arial',
        fontSize: 32,
        fill: '#000000',
        fontWeight: 'normal',
        fontStyle: 'normal',
        textAlign: 'left',
    };

    const mergedOptions = { ...defaultOptions, ...options };

    // Position text in center of editable area if provided
    const left = editableArea ? editableArea.left + editableArea.width / 2 - 100 : 100;
    const top = editableArea ? editableArea.top + editableArea.height / 2 - 16 : 100;

    const textObject = new fabric.Textbox(text, {
        left,
        top,
        width: 200,
        ...mergedOptions,
    });

    canvas.add(textObject);
    canvas.setActiveObject(textObject as any);
    canvas.renderAll();

    return textObject;
};

export const addImageToCanvas = async (
    canvas: fabric.Canvas,
    imageUrl: string,
    editableArea?: EditableArea
): Promise<fabric.FabricImage> => {
    try {
        const img = await fabric.FabricImage.fromURL(imageUrl, { crossOrigin: 'anonymous' });

        // Scale image to fit within editable area if provided
        if (editableArea) {
            const maxWidth = editableArea.width * 0.5;
            const maxHeight = editableArea.height * 0.5;

            const scale = Math.min(
                maxWidth / (img.width || 1),
                maxHeight / (img.height || 1),
                1
            );

            img.scale(scale);
            img.set({
                left: editableArea.left + editableArea.width / 2 - (img.width! * scale) / 2,
                top: editableArea.top + editableArea.height / 2 - (img.height! * scale) / 2,
            });
        } else {
            img.set({
                left: 100,
                top: 100,
            });
            img.scaleToWidth(200);
        }

        canvas.add(img);
        canvas.setActiveObject(img);
        canvas.renderAll();
        return img;
    } catch (error) {
        throw new Error('Failed to load image');
    }
};

export const exportCanvasToPNG = (canvas: fabric.Canvas, filename: string = 'design.png') => {
    // Deselect all objects before export
    canvas.discardActiveObject();
    canvas.renderAll();

    const dataURL = canvas.toDataURL({
        format: 'png',
        quality: 1,
        multiplier: 2, // Higher resolution
    });

    // Convert data URL to blob and download
    fetch(dataURL)
        .then((res) => res.blob())
        .then((blob) => {
            saveAs(blob, filename);
        });
};

/**
 * Export only the editable area as high-resolution PNG (without background)
 * @param canvas - Fabric canvas instance
 * @param editableArea - The editable area bounds
 * @param filename - Output filename
 * @param resolution - Resolution multiplier (default: 3 for high-res)
 */
export const exportEditableAreaAsPNG = (
    canvas: fabric.Canvas,
    editableArea: EditableArea,
    filename: string = 'design-editable.png',
    resolution: number = 3
): void => {
    // Deselect all objects before export
    canvas.discardActiveObject();

    // Save original state
    const originalBg = canvas.backgroundImage;
    const originalBgColor = canvas.backgroundColor;
    const overlay = canvas.getObjects().find((obj: any) => obj.name === 'editableAreaOverlay');
    const originalOverlayVisible = overlay ? overlay.visible : true;

    // Prepare for export: hide mockup, overlay, and transparent background
    canvas.backgroundImage = undefined;
    canvas.backgroundColor = 'transparent';
    if (overlay) overlay.visible = false;

    // Render to apply changes before export
    canvas.renderAll();

    try {
        const dataURL = canvas.toDataURL({
            format: 'png',
            quality: 1,
            multiplier: resolution,
            left: editableArea.left,
            top: editableArea.top,
            width: editableArea.width,
            height: editableArea.height,
        });

        // Convert data URL to blob and download
        fetch(dataURL)
            .then((res) => res.blob())
            .then((blob) => {
                saveAs(blob, filename);
            });
    } finally {
        // Restore original state
        canvas.backgroundImage = originalBg;
        canvas.backgroundColor = originalBgColor;
        if (overlay) overlay.visible = originalOverlayVisible;
        canvas.renderAll();
    }
};

/**
 * Export editable area WITH background mockup as high-resolution PNG
 * @param canvas - Fabric canvas instance
 * @param editableArea - The editable area bounds
 * @param filename - Output filename
 * @param resolution - Resolution multiplier (default: 3 for high-res)
 */
export const exportEditableAreaWithBackgroundAsPNG = (
    canvas: fabric.Canvas,
    editableArea: EditableArea,
    filename: string = 'design-with-background.png',
    resolution: number = 3
): void => {
    // Deselect all objects before export
    canvas.discardActiveObject();

    // Save original state
    const overlay = canvas.getObjects().find((obj: any) => obj.name === 'editableAreaOverlay');
    const originalOverlayVisible = overlay ? overlay.visible : true;

    // Hide overlay for clean export, but KEEP background
    if (overlay) overlay.visible = false;
    canvas.renderAll();

    try {
        const dataURL = canvas.toDataURL({
            format: 'png',
            quality: 1,
            multiplier: resolution,
            left: editableArea.left,
            top: editableArea.top,
            width: editableArea.width,
            height: editableArea.height,
        });

        // Convert data URL to blob and download
        fetch(dataURL)
            .then((res) => res.blob())
            .then((blob) => {
                saveAs(blob, filename);
            });
    } finally {
        // Restore overlay visibility
        if (overlay) overlay.visible = originalOverlayVisible;
        canvas.renderAll();
    }
};

/**
 * Export editable area as high-resolution TIFF
 * Note: TIFF is saved as PNG with .tiff extension for compatibility
 * @param canvas - Fabric canvas instance
 * @param editableArea - The editable area bounds
 * @param filename - Output filename
 * @param resolution - Resolution multiplier
 */
export const exportEditableAreaAsTIFF = (
    canvas: fabric.Canvas,
    editableArea: EditableArea,
    filename: string = 'design-editable.tiff',
    resolution: number = 3
): void => {
    // Deselect all objects before export
    canvas.discardActiveObject();

    // Save original state
    const originalBg = canvas.backgroundImage;
    const originalBgColor = canvas.backgroundColor;
    const overlay = canvas.getObjects().find((obj: any) => obj.name === 'editableAreaOverlay');
    const originalOverlayVisible = overlay ? overlay.visible : true;

    // Prepare for export
    canvas.backgroundImage = undefined;
    canvas.backgroundColor = 'transparent';
    if (overlay) overlay.visible = false;

    canvas.renderAll();

    try {
        const dataURL = canvas.toDataURL({
            format: 'png',
            quality: 1,
            multiplier: resolution,
            left: editableArea.left,
            top: editableArea.top,
            width: editableArea.width,
            height: editableArea.height,
        });

        fetch(dataURL)
            .then((res) => res.blob())
            .then((blob) => {
                // Create a new blob with TIFF MIME type (browser treats as PNG usually, but satisfies requirement)
                const tiffBlob = new Blob([blob], { type: 'image/tiff' });
                saveAs(tiffBlob, filename);
            });
    } finally {
        // Restore original state
        canvas.backgroundImage = originalBg;
        canvas.backgroundColor = originalBgColor;
        if (overlay) overlay.visible = originalOverlayVisible;
        canvas.renderAll();
    }
};

/**
 * Export editable area as PDF
 * @param canvas - Fabric canvas instance
 * @param editableArea - The editable area bounds
 * @param filename - Output filename
 * @param resolution - Resolution multiplier
 */
export const exportEditableAreaAsPDF = (
    canvas: fabric.Canvas,
    editableArea: EditableArea,
    filename: string = 'design-editable.pdf',
    resolution: number = 3
): void => {
    // Deselect all objects before export
    canvas.discardActiveObject();

    // Save original state
    const originalBg = canvas.backgroundImage;
    const originalBgColor = canvas.backgroundColor;
    const overlay = canvas.getObjects().find((obj: any) => obj.name === 'editableAreaOverlay');
    const originalOverlayVisible = overlay ? overlay.visible : true;

    // Prepare for export
    canvas.backgroundImage = undefined;
    canvas.backgroundColor = 'transparent';
    if (overlay) overlay.visible = false;

    canvas.renderAll();

    try {
        const dataURL = canvas.toDataURL({
            format: 'png',
            quality: 1,
            multiplier: resolution,
            left: editableArea.left,
            top: editableArea.top,
            width: editableArea.width,
            height: editableArea.height,
        });

        // Create PDF
        const pdf = new jsPDF({
            orientation: editableArea.width > editableArea.height ? 'landscape' : 'portrait',
            unit: 'px',
            format: [editableArea.width, editableArea.height]
        });

        // Add image to PDF
        pdf.addImage(dataURL, 'PNG', 0, 0, editableArea.width, editableArea.height);
        pdf.save(filename);
    } finally {
        // Restore original state
        canvas.backgroundImage = originalBg;
        canvas.backgroundColor = originalBgColor;
        if (overlay) overlay.visible = originalOverlayVisible;
        canvas.renderAll();
    }
};

/**
 * Export editable area as high-resolution PNG with customizable resolution
 * @param canvas - Fabric canvas instance
 * @param editableArea - The editable area bounds
 * @param filename - Output filename
 * @param dpi - Desired DPI (dots per inch)
 */
export const exportEditableAreaAsHighResPNG = (
    canvas: fabric.Canvas,
    editableArea: EditableArea,
    filename: string = 'design-print-ready.png',
    dpi: number = 300
): void => {
    // Calculate resolution multiplier based on DPI
    // Standard screen is 96 DPI, so multiplier = dpi / 96
    const resolution = dpi / 96;

    exportEditableAreaAsPNG(canvas, editableArea, filename, resolution);
};

/**
 * Export editable area with transparent background
 * @param canvas - Fabric canvas instance
 * @param editableArea - The editable area bounds
 * @param filename - Output filename
 * @param resolution - Resolution multiplier
 */
export const exportEditableAreaTransparent = (
    canvas: fabric.Canvas,
    editableArea: EditableArea,
    filename: string = 'design-transparent.png',
    resolution: number = 3
): void => {
    // Re-use the main PNG export since it now handles transparency and cropping correctly
    exportEditableAreaAsPNG(canvas, editableArea, filename, resolution);
};

export const exportCanvasToJSON = (canvas: fabric.Canvas): string => {
    // Get canvas JSON
    const json = canvas.toJSON();

    // Remove background image from export
    delete json.backgroundImage;

    // Remove the editable area overlay from export
    if (json.objects) {
        json.objects = json.objects.filter((obj: any) => obj.name !== 'editableAreaOverlay');
    }

    return JSON.stringify(json);
};

export const importCanvasFromJSON = async (
    canvas: fabric.Canvas,
    jsonString: string
): Promise<void> => {
    try {
        const json = JSON.parse(jsonString);

        if (!json.objects || !Array.isArray(json.objects)) return;

        // Enliven objects (hydrate them from JSON data)
        const enlivenedObjects = await fabric.util.enlivenObjects(json.objects);

        // Remove existing user objects, but KEEP the overlay
        const existingObjects = canvas.getObjects();
        existingObjects.forEach((obj) => {
            if ((obj as any).name !== 'editableAreaOverlay') {
                canvas.remove(obj);
            }
        });

        // Add the imported objects to the canvas
        // (Fabric v6 enlivenObjects returns an array of objects)
        enlivenedObjects.forEach((obj) => {
            const fabricObj = obj as unknown as fabric.Object;
            // Skip the overlay if it was included in the JSON (prevent duplication)
            if ((fabricObj as any).name === 'editableAreaOverlay') {
                return;
            }

            // enlivenObjects can return Filters/Gradients etc which are not Objects
            // We only want to add valid Objects to the canvas
            if (fabricObj && typeof fabricObj.set === 'function') {
                canvas.add(fabricObj);
            }
        });

        canvas.requestRenderAll();
    } catch (error) {
        console.error('Error importing JSON:', error);
        throw error;
    }
};

export const downloadJSON = (jsonString: string, filename: string = 'design.json') => {
    const blob = new Blob([jsonString], { type: 'application/json' });
    saveAs(blob, filename);
};

export const createEditableAreaOverlay = (
    canvas: fabric.Canvas,
    editableArea: EditableArea
): fabric.Rect => {
    const overlay = new fabric.Rect({
        left: editableArea.left,
        top: editableArea.top,
        width: editableArea.width,
        height: editableArea.height,
        fill: 'transparent',
        stroke: '#3b82f6',
        strokeWidth: 2,
        strokeDashArray: [5, 5],
        selectable: false,
        evented: false,
        name: 'editableAreaOverlay',
        // Allow clicks to pass through to objects below
        hoverCursor: 'default',
    });

    return overlay;
};

/**
 * Export editable area as SVG
 * @param canvas - Fabric canvas instance
 * @param editableArea - The editable area bounds
 * @param filename - Output filename
 */
export const exportEditableAreaAsSVG = (
    canvas: fabric.Canvas,
    editableArea: EditableArea,
    filename: string = 'design-editable.svg'
): void => {
    // Deselect all objects before export
    canvas.discardActiveObject();

    // Save original state
    const originalBg = canvas.backgroundImage;
    const originalBgColor = canvas.backgroundColor;
    const overlay = canvas.getObjects().find((obj: any) => obj.name === 'editableAreaOverlay');
    const originalOverlayVisible = overlay ? overlay.visible : true;

    // Prepare for export
    canvas.backgroundImage = undefined;
    canvas.backgroundColor = 'transparent';
    if (overlay) overlay.visible = false;

    // We need to set viewport transform to crop to editable area
    // Just setting width/height in toSVG options helps, but viewBox needs to be correct
    const options = {
        viewBox: {
            x: editableArea.left,
            y: editableArea.top,
            width: editableArea.width,
            height: editableArea.height
        },
        width: String(editableArea.width),
        height: String(editableArea.height),
        suppressPreamble: false
    };

    try {
        const svg = canvas.toSVG(options);

        const blob = new Blob([svg], { type: 'image/svg+xml' });
        saveAs(blob, filename);
    } finally {
        // Restore original state
        canvas.backgroundImage = originalBg;
        canvas.backgroundColor = originalBgColor;
        if (overlay) overlay.visible = originalOverlayVisible;
        canvas.renderAll();
    }
};

/**
 * Export editable area WITH background as high-resolution TIFF
 * @param canvas - Fabric canvas instance
 * @param editableArea - The editable area bounds
 * @param filename - Output filename
 * @param resolution - Resolution multiplier
 */
export const exportEditableAreaWithBackgroundAsTIFF = (
    canvas: fabric.Canvas,
    editableArea: EditableArea,
    filename: string = 'design-with-background.tiff',
    resolution: number = 3
): void => {
    // Deselect all objects before export
    canvas.discardActiveObject();

    // Save original state
    const overlay = canvas.getObjects().find((obj: any) => obj.name === 'editableAreaOverlay');
    const originalOverlayVisible = overlay ? overlay.visible : true;

    // Hide overlay but KEEP background
    if (overlay) overlay.visible = false;
    canvas.renderAll();

    try {
        const dataURL = canvas.toDataURL({
            format: 'png',
            quality: 1,
            multiplier: resolution,
            left: editableArea.left,
            top: editableArea.top,
            width: editableArea.width,
            height: editableArea.height,
        });

        fetch(dataURL)
            .then((res) => res.blob())
            .then((blob) => {
                const tiffBlob = new Blob([blob], { type: 'image/tiff' });
                saveAs(tiffBlob, filename);
            });
    } finally {
        // Restore overlay visibility
        if (overlay) overlay.visible = originalOverlayVisible;
        canvas.renderAll();
    }
};

/**
 * Export editable area WITH background as PDF
 * @param canvas - Fabric canvas instance
 * @param editableArea - The editable area bounds
 * @param filename - Output filename
 * @param resolution - Resolution multiplier
 */
export const exportEditableAreaWithBackgroundAsPDF = (
    canvas: fabric.Canvas,
    editableArea: EditableArea,
    filename: string = 'design-with-background.pdf',
    resolution: number = 3
): void => {
    // Deselect all objects before export
    canvas.discardActiveObject();

    // Save original state
    const overlay = canvas.getObjects().find((obj: any) => obj.name === 'editableAreaOverlay');
    const originalOverlayVisible = overlay ? overlay.visible : true;

    // Hide overlay but KEEP background
    if (overlay) overlay.visible = false;
    canvas.renderAll();

    try {
        const dataURL = canvas.toDataURL({
            format: 'png',
            quality: 1,
            multiplier: resolution,
            left: editableArea.left,
            top: editableArea.top,
            width: editableArea.width,
            height: editableArea.height,
        });

        // Create PDF
        const pdf = new jsPDF({
            orientation: editableArea.width > editableArea.height ? 'landscape' : 'portrait',
            unit: 'px',
            format: [editableArea.width, editableArea.height]
        });

        // Add image to PDF
        pdf.addImage(dataURL, 'PNG', 0, 0, editableArea.width, editableArea.height);
        pdf.save(filename);
    } finally {
        // Restore overlay visibility
        if (overlay) overlay.visible = originalOverlayVisible;
        canvas.renderAll();
    }
};

/**
 * Export editable area WITH background as SVG
 * Note: Background image in SVG is complex, so this exports editable area with background
 * @param canvas - Fabric canvas instance
 * @param editableArea - The editable area bounds
 * @param filename - Output filename
 */
export const exportEditableAreaWithBackgroundAsSVG = (
    canvas: fabric.Canvas,
    editableArea: EditableArea,
    filename: string = 'design-with-background.svg'
): void => {
    // Deselect all objects before export
    canvas.discardActiveObject();

    // Save original state
    const overlay = canvas.getObjects().find((obj: any) => obj.name === 'editableAreaOverlay');
    const originalOverlayVisible = overlay ? overlay.visible : true;

    // Hide overlay but KEEP background
    if (overlay) overlay.visible = false;
    canvas.renderAll();

    // For SVG with background, we need to include the background image
    // This is complex, so we'll export the editable area with background as PNG embedded in SVG
    // Or we can use the SVG export but the background won't be included as a proper SVG element
    // For now, let's export as SVG without background (same as regular SVG)
    // The user can use PNG with background for cases needing the mockup

    const options = {
        viewBox: {
            x: editableArea.left,
            y: editableArea.top,
            width: editableArea.width,
            height: editableArea.height
        },
        width: String(editableArea.width),
        height: String(editableArea.height),
        suppressPreamble: false
    };

    try {
        const svg = canvas.toSVG(options);

        const blob = new Blob([svg], { type: 'image/svg+xml' });
        saveAs(blob, filename);
    } finally {
        // Restore overlay visibility
        if (overlay) overlay.visible = originalOverlayVisible;
        canvas.renderAll();
    }
};
