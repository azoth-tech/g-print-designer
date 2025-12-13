import * as fabric from 'fabric';
import { saveAs } from 'file-saver';
import { EditableArea, TextOptions } from '@/types/types';

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
        const img = await fabric.FabricImage.fromURL(imageUrl, {}, { crossOrigin: 'anonymous' });

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

export const exportCanvasToJSON = (canvas: fabric.Canvas): string => {
    return JSON.stringify(canvas.toJSON());
};

export const importCanvasFromJSON = (
    canvas: fabric.Canvas,
    jsonString: string
): Promise<void> => {
    return new Promise((resolve, reject) => {
        try {
            canvas.loadFromJSON(jsonString, () => {
                canvas.renderAll();
                resolve();
            });
        } catch (error) {
            reject(error);
        }
    });
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
    });

    return overlay;
};
