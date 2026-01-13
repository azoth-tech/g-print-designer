import * as fabric from 'fabric';
import { EditableArea } from '@/types/types';

export interface AIDesignData {
    type: 'text' | 'rect' | 'circle' | 'layout' | 'image';
    content?: string;
    imageUrl?: string;
    styles?: {
        fontSize?: number;
        fontFamily?: string;
        fill?: string;
        fontWeight?: string;
        fontStyle?: string;
        textAlign?: string;
        width?: number;
        height?: number;
        radius?: number;
        opacity?: number;
    };
    position?: {
        left: number;
        top: number;
    };
}

/**
 * Apply AI-generated design to canvas
 */
export async function applyAIDesignToCanvas(
    canvas: fabric.Canvas,
    designData: AIDesignData | AIDesignData[],
    editableArea?: EditableArea
): Promise<void> {
    if (!canvas) return;

    // Handle array of elements (layout)
    if (Array.isArray(designData)) {
        for (const element of designData) {
            await createFabricObject(canvas, element, editableArea);
        }
        canvas.renderAll();
        return;
    }

    // Handle single element
    await createFabricObject(canvas, designData, editableArea);
    canvas.renderAll();
}

/**
 * Create a Fabric.js object from AI design data
 */
async function createFabricObject(
    canvas: fabric.Canvas,
    data: AIDesignData,
    editableArea?: EditableArea
): Promise<fabric.Object | null> {
    const { type, content, imageUrl, styles = {}, position = { left: 100, top: 100 } } = data;

    let fabricObject: fabric.Object | null = null;

    switch (type) {
        case 'text':
            fabricObject = new fabric.Text(content || 'AI Generated Text', {
                left: position.left,
                top: position.top,
                fontSize: styles.fontSize || 32,
                fontFamily: styles.fontFamily || 'Arial',
                fill: styles.fill || '#000000',
                fontWeight: styles.fontWeight || 'normal',
                fontStyle: styles.fontStyle || 'normal',
                textAlign: (styles.textAlign as any) || 'left',
            });
            break;

        case 'image':
            if (imageUrl) {
                try {
                    const img = await fabric.FabricImage.fromURL(imageUrl, { crossOrigin: 'anonymous' });

                    let scale = 0.5;
                    let left = position.left;
                    let top = position.top;

                    if (editableArea) {
                        // Calculate scale to fit within editable area with padding
                        const padding = 20;
                        const availableWidth = Math.max(0, editableArea.width - padding * 2);
                        const availableHeight = Math.max(0, editableArea.height - padding * 2);

                        const scaleX = availableWidth / (img.width || 1);
                        const scaleY = availableHeight / (img.height || 1);

                        // Use the smaller scale to fit entirely, capping at 1 (don't upscale tiny images too much)
                        scale = Math.min(scaleX, scaleY, 1);

                        // Center in editable area
                        left = editableArea.left + (editableArea.width - (img.width || 0) * scale) / 2;
                        top = editableArea.top + (editableArea.height - (img.height || 0) * scale) / 2;
                    }

                    img.set({
                        left: left,
                        top: top,
                        scaleX: scale,
                        scaleY: scale,
                    });
                    fabricObject = img;
                } catch (error) {
                    console.error('Failed to load AI-generated image:', error);
                    return null;
                }
            }
            break;

        case 'rect':
            fabricObject = new fabric.Rect({
                left: position.left,
                top: position.top,
                width: styles.width || 200,
                height: styles.height || 100,
                fill: styles.fill || '#3b82f6',
                opacity: styles.opacity !== undefined ? styles.opacity : 1,
            });
            break;

        case 'circle':
            fabricObject = new fabric.Circle({
                left: position.left,
                top: position.top,
                radius: styles.radius || 50,
                fill: styles.fill || '#3b82f6',
                opacity: styles.opacity !== undefined ? styles.opacity : 1,
            });
            break;

        default:
            console.warn('Unknown design type:', type);
            return null;
    }

    if (fabricObject) {
        // Ensure object is within editable area if specified
        if (editableArea) {
            ensureWithinEditableArea(fabricObject, editableArea);
        }

        canvas.add(fabricObject);
        canvas.setActiveObject(fabricObject);
        return fabricObject;
    }

    return null;
}

/**
 * Ensure object stays within editable area bounds
 */
function ensureWithinEditableArea(obj: fabric.Object, editableArea: EditableArea): void {
    const objWidth = (obj.width || 0) * (obj.scaleX || 1);
    const objHeight = (obj.height || 0) * (obj.scaleY || 1);

    // Adjust position if outside bounds
    if (obj.left !== undefined) {
        if (obj.left < editableArea.left) {
            obj.left = editableArea.left + 10;
        } else if (obj.left + objWidth > editableArea.left + editableArea.width) {
            obj.left = editableArea.left + editableArea.width - objWidth - 10;
        }
    }

    if (obj.top !== undefined) {
        if (obj.top < editableArea.top) {
            obj.top = editableArea.top + 10;
        } else if (obj.top + objHeight > editableArea.top + editableArea.height) {
            obj.top = editableArea.top + editableArea.height - objHeight - 10;
        }
    }
}

/**
 * Validate AI design data
 */
export function validateAIDesign(data: any): data is AIDesignData | AIDesignData[] {
    if (Array.isArray(data)) {
        return data.every(item =>
            item &&
            typeof item === 'object' &&
            ['text', 'rect', 'circle', 'layout', 'image'].includes(item.type)
        );
    }

    return (
        data &&
        typeof data === 'object' &&
        ['text', 'rect', 'circle', 'layout', 'image'].includes(data.type)
    );
}

/**
 * Get default position based on editable area
 */
export function getDefaultPosition(editableArea?: EditableArea): { left: number; top: number } {
    if (!editableArea) {
        return { left: 100, top: 100 };
    }

    return {
        left: editableArea.left + editableArea.width / 2 - 100,
        top: editableArea.top + editableArea.height / 2 - 50,
    };
}
