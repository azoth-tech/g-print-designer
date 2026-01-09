import React, { useEffect, useState } from 'react';
import * as fabric from 'fabric';
import {
    FaAlignLeft,
    FaAlignCenter,
    FaAlignRight,
    FaBold,
    FaItalic,
    FaUnderline,
    FaLayerGroup,
    FaArrowUp,
    FaArrowDown,
    FaTrash,
    FaEraser,
    FaFillDrip,
    FaTextWidth,
    FaArrowsAltV,
    FaPalette,
    FaBorderAll,
    FaCloud
} from 'react-icons/fa';
import styles from './PropertiesPanel.module.css';

interface PropertiesPanelProps {
    canvas: fabric.Canvas | null;
}

const FONT_FAMILIES = [
    'Arial', 'Helvetica', 'Times New Roman', 'Courier New', 'Verdana',
    'Georgia', 'Palatino', 'Garamond', 'Comic Sans MS', 'Impact'
];

// Helper function to convert RGB to hex
const rgbToHex = (color: string | any): string => {
    if (typeof color !== 'string') return '#000000';
    if (color.startsWith('#')) return color;

    const rgb = color.match(/\d+/g);
    if (!rgb || rgb.length < 3) return '#000000';

    const r = parseInt(rgb[0]).toString(16).padStart(2, '0');
    const g = parseInt(rgb[1]).toString(16).padStart(2, '0');
    const b = parseInt(rgb[2]).toString(16).padStart(2, '0');

    return `#${r}${g}${b}`;
};

export default function PropertiesPanel({ canvas }: PropertiesPanelProps) {
    const [selectedObject, setSelectedObject] = useState<fabric.Object | null>(null);
    const [hasRemoveBgFilter, setHasRemoveBgFilter] = useState(false);

    // Image Filter States
    const [imageFilters, setImageFilters] = useState({
        brightness: 0,
        contrast: 0,
        saturation: 0
    });

    // Force update for re-render when object properties change
    const [_, setForceUpdate] = useState({});

    useEffect(() => {
        if (!canvas) return;

        const updateSelection = () => {
            const active = canvas.getActiveObject();
            setSelectedObject(active || null);

            // Check for RemoveColor filter if image
            if (active && active.type === 'image') {
                const img = active as fabric.FabricImage;
                const filters = img.filters || [];

                const removeColor = filters.find((f: any) => f.type === 'RemoveColor');
                setHasRemoveBgFilter(!!removeColor);

                const brightness = filters.find((f: any) => f.type === 'Brightness') as any;
                const contrast = filters.find((f: any) => f.type === 'Contrast') as any;
                const saturation = filters.find((f: any) => f.type === 'Saturation') as any;

                setImageFilters({
                    brightness: brightness ? brightness.brightness : 0,
                    contrast: contrast ? contrast.contrast : 0,
                    saturation: saturation ? saturation.saturation : 0
                });
            } else {
                setHasRemoveBgFilter(false);
                setImageFilters({ brightness: 0, contrast: 0, saturation: 0 });
            }

            setForceUpdate({});
        };

        canvas.on('selection:created', updateSelection);
        canvas.on('selection:updated', updateSelection);
        canvas.on('selection:cleared', updateSelection);
        canvas.on('object:modified', updateSelection);

        updateSelection();

        return () => {
            canvas.off('selection:created', updateSelection);
            canvas.off('selection:updated', updateSelection);
            canvas.off('selection:cleared', updateSelection);
            canvas.off('object:modified', updateSelection);
        };
    }, [canvas]);

    const toggleRemoveBackground = () => {
        if (!canvas || !selectedObject || selectedObject.type !== 'image') return;

        const img = selectedObject as fabric.FabricImage;

        if (hasRemoveBgFilter) {
            // Remove filter
            img.filters = img.filters?.filter((f: any) => f.type !== 'RemoveColor') || [];
            setHasRemoveBgFilter(false);
        } else {
            // Add filter (removes white by default)
            const filter = new fabric.filters.RemoveColor({
                distance: 0.15, // Tolerance
            });
            img.filters = [...(img.filters || []), filter];
            setHasRemoveBgFilter(true);
        }

        img.applyFilters();
        canvas.renderAll();
        setForceUpdate({});
    };

    const updateImageFilter = (type: 'brightness' | 'contrast' | 'saturation', value: number) => {
        if (!canvas || !selectedObject || selectedObject.type !== 'image') return;

        const img = selectedObject as fabric.FabricImage;
        const filters = img.filters || [];
        let filterIndex = -1;
        let filter: any;

        switch (type) {
            case 'brightness':
                filterIndex = filters.findIndex((f: any) => f.type === 'Brightness');
                if (filterIndex > -1) {
                    (filters[filterIndex] as any).brightness = value;
                } else {
                    filter = new fabric.filters.Brightness({ brightness: value });
                    filters.push(filter);
                }
                break;
            case 'contrast':
                filterIndex = filters.findIndex((f: any) => f.type === 'Contrast');
                if (filterIndex > -1) {
                    (filters[filterIndex] as any).contrast = value;
                } else {
                    filter = new fabric.filters.Contrast({ contrast: value });
                    filters.push(filter);
                }
                break;
            case 'saturation':
                filterIndex = filters.findIndex((f: any) => f.type === 'Saturation');
                if (filterIndex > -1) {
                    (filters[filterIndex] as any).saturation = value;
                } else {
                    filter = new fabric.filters.Saturation({ saturation: value });
                    filters.push(filter);
                }
                break;
        }

        img.filters = filters;
        img.applyFilters();
        setImageFilters(prev => ({ ...prev, [type]: value }));
        canvas.requestRenderAll();
    };

    const updateShadow = (prop: string, value: any) => {
        if (!canvas || !selectedObject) return;

        const currentShadow = selectedObject.shadow as fabric.Shadow || new fabric.Shadow({ blur: 0 });

        if (prop === 'color') currentShadow.color = value;
        if (prop === 'blur') currentShadow.blur = parseInt(value);
        if (prop === 'offsetX') currentShadow.offsetX = parseInt(value);
        if (prop === 'offsetY') currentShadow.offsetY = parseInt(value);

        selectedObject.set('shadow', currentShadow);
        canvas.requestRenderAll();
        setForceUpdate({});
    };

    const updateProperty = (key: string, value: any) => {
        if (!canvas || !selectedObject) return;

        // Handle nested properties if needed, but simple for now
        (selectedObject as any).set(key, value);

        if (key === 'text') {
            // Special handling for text content
        }

        canvas.requestRenderAll();
        setForceUpdate({});
        // Trigger object:modified for history
        canvas.fire('object:modified', { target: selectedObject });
    };

    const handleLayerAction = (action: 'bringToFront' | 'sendToBack' | 'bringForward' | 'sendBackward') => {
        if (!canvas || !selectedObject) return;

        switch (action) {
            case 'bringToFront':
                canvas.bringObjectToFront(selectedObject);
                break;
            case 'sendToBack':
                canvas.sendObjectToBack(selectedObject);
                // Ensure bg overlay stays at back if exists
                const overlay = canvas.getObjects().find((o: any) => o.name === 'editableAreaOverlay');
                if (overlay) canvas.sendObjectToBack(overlay);
                const mockup = canvas.getObjects().find((o: any) => o.name === 'productMockup');
                if (mockup) canvas.sendObjectToBack(mockup);
                break;
            case 'bringForward':
                canvas.bringObjectForward(selectedObject);
                break;
            case 'sendBackward':
                canvas.sendObjectBackwards(selectedObject);
                break;
        }

        canvas.requestRenderAll();
        canvas.fire('object:modified', { target: selectedObject });
    };

    const handleDelete = () => {
        if (!canvas || !selectedObject) return;
        canvas.remove(selectedObject);
        canvas.discardActiveObject();
        canvas.requestRenderAll();
    };

    if (!selectedObject) {
        return (
            <div className={styles.container}>
                <div className={styles.emptyState}>
                    <p>Select an object to edit its properties.</p>
                </div>
            </div>
        );
    }

    const type = selectedObject.type;
    const isText = type === 'i-text' || type === 'textbox' || type === 'text';
    const isImage = type === 'image';

    return (
        <div className={styles.container}>
            {/* Common Transform Properties */}
            <div className={styles.section}>
                <div className={styles.sectionTitle}>Transform</div>

                <div className={styles.row}>
                    <div className={styles.controlGroup}>
                        <label className={styles.label}>Left</label>
                        <input
                            type="number"
                            className={styles.input}
                            value={Math.round(selectedObject.left || 0)}
                            onChange={(e) => updateProperty('left', parseInt(e.target.value))}
                        />
                    </div>
                    <div className={styles.controlGroup}>
                        <label className={styles.label}>Top</label>
                        <input
                            type="number"
                            className={styles.input}
                            value={Math.round(selectedObject.top || 0)}
                            onChange={(e) => updateProperty('top', parseInt(e.target.value))}
                        />
                    </div>
                </div>

                <div className={styles.row}>
                    <div className={styles.controlGroup}>
                        <label className={styles.label}>Angle</label>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <input
                                type="range"
                                className={styles.slider}
                                min="0"
                                max="360"
                                value={Math.round(selectedObject.angle || 0) % 360}
                                onChange={(e) => updateProperty('angle', parseInt(e.target.value))}
                            />
                            <div className={styles.valueDisplay}>{Math.round(selectedObject.angle || 0)}°</div>
                        </div>
                    </div>
                    <div className={styles.controlGroup}>
                        <label className={styles.label}>Scale</label>
                        <input
                            type="number"
                            className={styles.input}
                            step="0.1"
                            value={(selectedObject.scaleX || 1).toFixed(2)}
                            onChange={(e) => {
                                const val = parseFloat(e.target.value);
                                updateProperty('scaleX', val);
                                updateProperty('scaleY', val);
                            }}
                        />
                    </div>
                </div>

                {/* Opacity */}
                <div className={styles.row}>
                    <div className={styles.controlGroup}>
                        <label className={styles.label}>Opacity</label>
                        <input
                            type="range"
                            className={styles.slider}
                            min="0"
                            max="1"
                            step="0.01"
                            value={selectedObject.opacity || 1}
                            onChange={(e) => updateProperty('opacity', parseFloat(e.target.value))}
                        />
                    </div>
                </div>
            </div>

            {/* Text Specific Properties */}
            {isText && (
                <div className={styles.section}>
                    <div className={styles.sectionTitle}>Text</div>

                    <div className={styles.row}>
                        <div className={styles.controlGroup}>
                            <label className={styles.label}>Content</label>
                            <input
                                type="text"
                                className={styles.input}
                                value={(selectedObject as any).text || ''}
                                onChange={(e) => updateProperty('text', e.target.value)}
                            />
                        </div>
                    </div>

                    <div className={styles.row}>
                        <div className={styles.controlGroup}>
                            <label className={styles.label}>Font Family</label>
                            <select
                                className={styles.select}
                                value={(selectedObject as any).fontFamily}
                                onChange={(e) => updateProperty('fontFamily', e.target.value)}
                            >
                                {FONT_FAMILIES.map(font => (
                                    <option key={font} value={font}>{font}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className={styles.row}>
                        <div className={styles.controlGroup}>
                            <label className={styles.label}>Size</label>
                            <input
                                type="number"
                                className={styles.input}
                                value={(selectedObject as any).fontSize}
                                onChange={(e) => updateProperty('fontSize', parseInt(e.target.value))}
                            />
                        </div>
                        <div className={styles.controlGroup}>
                            <label className={styles.label}>Color</label>
                            <div className={styles.colorInputWrapper}>
                                <div className={styles.colorPreview} style={{ backgroundColor: (selectedObject as any).fill as string }}>
                                    <input
                                        type="color"
                                        className={styles.colorInput}
                                        value={(selectedObject as any).fill as string}
                                        onChange={(e) => updateProperty('fill', e.target.value)}
                                    />
                                </div>
                                <span className={styles.colorValue}>{(selectedObject as any).fill as string}</span>
                            </div>
                        </div>
                    </div>

                    <div className={styles.row}>
                        <div className={styles.buttonGroup} style={{ flex: 1 }}>
                            <button
                                className={`${styles.iconBtn} ${(selectedObject as any).fontWeight === 'bold' ? styles.active : ''}`}
                                onClick={() => updateProperty('fontWeight', (selectedObject as any).fontWeight === 'bold' ? 'normal' : 'bold')}
                                title="Bold"
                            >
                                <FaBold />
                            </button>
                            <button
                                className={`${styles.iconBtn} ${(selectedObject as any).fontStyle === 'italic' ? styles.active : ''}`}
                                onClick={() => updateProperty('fontStyle', (selectedObject as any).fontStyle === 'italic' ? 'normal' : 'italic')}
                                title="Italic"
                            >
                                <FaItalic />
                            </button>
                            <button
                                className={`${styles.iconBtn} ${(selectedObject as any).underline ? styles.active : ''}`}
                                onClick={() => updateProperty('underline', !(selectedObject as any).underline)}
                                title="Underline"
                            >
                                <FaUnderline />
                            </button>
                        </div>
                    </div>

                    <div className={styles.row}>
                        <div className={styles.buttonGroup} style={{ flex: 1 }}>
                            <button
                                className={`${styles.iconBtn} ${(selectedObject as any).textAlign === 'left' ? styles.active : ''}`}
                                onClick={() => updateProperty('textAlign', 'left')}
                                title="Align Left"
                            >
                                <FaAlignLeft />
                            </button>
                            <button
                                className={`${styles.iconBtn} ${(selectedObject as any).textAlign === 'center' ? styles.active : ''}`}
                                onClick={() => updateProperty('textAlign', 'center')}
                                title="Align Center"
                            >
                                <FaAlignCenter />
                            </button>
                            <button
                                className={`${styles.iconBtn} ${(selectedObject as any).textAlign === 'right' ? styles.active : ''}`}
                                onClick={() => updateProperty('textAlign', 'right')}
                                title="Align Right"
                            >
                                <FaAlignRight />
                            </button>
                        </div>
                    </div>

                    <div className={styles.row}>
                        <div className={styles.controlGroup}>
                            <label className={styles.label}>Spacing</label>
                            <div className={styles.row}>
                                <div style={{ flex: 1 }}>
                                    <div className={styles.label} style={{ fontSize: '0.7rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                        <FaTextWidth /> Letter
                                    </div>
                                    <input
                                        type="range"
                                        className={styles.slider}
                                        min="-100"
                                        max="500"
                                        value={(selectedObject as any).charSpacing || 0}
                                        onChange={(e) => updateProperty('charSpacing', parseInt(e.target.value))}
                                    />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <div className={styles.label} style={{ fontSize: '0.7rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                        <FaArrowsAltV /> Line
                                    </div>
                                    <input
                                        type="range"
                                        className={styles.slider}
                                        min="0.5"
                                        max="3"
                                        step="0.1"
                                        value={(selectedObject as any).lineHeight || 1.16}
                                        onChange={(e) => updateProperty('lineHeight', parseFloat(e.target.value))}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className={styles.sectionTitle}>Stroke & Shadow</div>
                    <div className={styles.row}>
                        <div className={styles.controlGroup}>
                            <label className={styles.label}>Stroke</label>
                            <div className={styles.row} style={{ marginBottom: '0.25rem' }}>
                                <div className={styles.colorInputWrapper} style={{ flex: 1 }}>
                                    <div className={styles.colorPreview} style={{ backgroundColor: (selectedObject.stroke as string) || 'transparent' }}>
                                        <input
                                            type="color"
                                            className={styles.colorInput}
                                            value={(selectedObject.stroke as string) || '#000000'}
                                            onChange={(e) => updateProperty('stroke', e.target.value)}
                                        />
                                    </div>
                                </div>
                                <input
                                    type="number"
                                    className={styles.input}
                                    style={{ width: '60px' }}
                                    min="0"
                                    value={(selectedObject.strokeWidth || 0)}
                                    onChange={(e) => updateProperty('strokeWidth', parseInt(e.target.value))}
                                />
                            </div>
                        </div>
                    </div>

                    <div className={styles.row}>
                        <div className={styles.controlGroup}>
                            <label className={styles.label}>Shadow</label>
                            <div className={styles.row} style={{ marginBottom: '0.25rem' }}>
                                <div className={styles.colorInputWrapper} style={{ flex: 1 }}>
                                    <div className={styles.colorPreview} style={{ backgroundColor: ((selectedObject.shadow as fabric.Shadow)?.color) || 'transparent' }}>
                                        <input
                                            type="color"
                                            className={styles.colorInput}
                                            value={((selectedObject.shadow as fabric.Shadow)?.color) || '#000000'}
                                            onChange={(e) => updateShadow('color', e.target.value)}
                                        />
                                    </div>
                                </div>
                                <input
                                    type="number"
                                    placeholder="Blur"
                                    className={styles.input}
                                    style={{ width: '60px' }}
                                    value={((selectedObject.shadow as fabric.Shadow)?.blur) || 0}
                                    onChange={(e) => updateShadow('blur', e.target.value)}
                                />
                            </div>
                            <div className={styles.row}>
                                <div className={styles.controlGroup}>
                                    <label className={styles.label} style={{ fontSize: '0.7em' }}>X Offset</label>
                                    <input type="range" className={styles.slider} min="-20" max="20"
                                        value={((selectedObject.shadow as fabric.Shadow)?.offsetX) || 0}
                                        onChange={(e) => updateShadow('offsetX', e.target.value)}
                                    />
                                </div>
                                <div className={styles.controlGroup}>
                                    <label className={styles.label} style={{ fontSize: '0.7em' }}>Y Offset</label>
                                    <input type="range" className={styles.slider} min="-20" max="20"
                                        value={((selectedObject.shadow as fabric.Shadow)?.offsetY) || 0}
                                        onChange={(e) => updateShadow('offsetY', e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Image Specific Properties */}
            {isImage && (
                <div className={styles.section}>
                    <div className={styles.sectionTitle}>Image Properties</div>
                    <div className={styles.row}>
                        <button
                            className={`${styles.iconBtn} ${hasRemoveBgFilter ? styles.active : ''}`}
                            style={{ flex: 1, justifyContent: 'center' }}
                            onClick={toggleRemoveBackground}
                            title="Remove White Background"
                        >
                            <FaEraser style={{ marginRight: '8px' }} />
                            {hasRemoveBgFilter ? 'Restore Background' : 'Remove Background'}
                        </button>
                    </div>

                    <div className={styles.row}>
                        <div className={styles.controlGroup}>
                            <label className={styles.label}>Brightness ({imageFilters.brightness.toFixed(2)})</label>
                            <input
                                type="range"
                                className={styles.slider}
                                min="-1"
                                max="1"
                                step="0.05"
                                value={imageFilters.brightness}
                                onChange={(e) => updateImageFilter('brightness', parseFloat(e.target.value))}
                            />
                        </div>
                    </div>

                    <div className={styles.row}>
                        <div className={styles.controlGroup}>
                            <label className={styles.label}>Contrast ({imageFilters.contrast.toFixed(2)})</label>
                            <input
                                type="range"
                                className={styles.slider}
                                min="-1"
                                max="1"
                                step="0.05"
                                value={imageFilters.contrast}
                                onChange={(e) => updateImageFilter('contrast', parseFloat(e.target.value))}
                            />
                        </div>
                    </div>

                    <div className={styles.row}>
                        <div className={styles.controlGroup}>
                            <label className={styles.label}>Saturation ({imageFilters.saturation.toFixed(2)})</label>
                            <input
                                type="range"
                                className={styles.slider}
                                min="-1"
                                max="1"
                                step="0.05"
                                value={imageFilters.saturation}
                                onChange={(e) => updateImageFilter('saturation', parseFloat(e.target.value))}
                            />
                        </div>
                    </div>

                    <div className={styles.row}>
                        <div className={styles.controlGroup}>
                            <label className={styles.label}>Background Color</label>
                            <div className={styles.colorInputWrapper}>
                                <div className={styles.colorPreview} style={{ backgroundColor: rgbToHex(selectedObject.backgroundColor || '#ffffff') }}>
                                    <input
                                        type="color"
                                        className={styles.colorInput}
                                        value={rgbToHex(selectedObject.backgroundColor || '#ffffff')}
                                        onChange={(e) => updateProperty('backgroundColor', e.target.value)}
                                    />
                                </div>
                                <span className={styles.colorValue}>
                                    <FaFillDrip style={{ marginRight: '4px' }} />
                                    {rgbToHex(selectedObject.backgroundColor || '#ffffff')}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Shape/Generic Color (Fill) */}
            {!isText && !isImage && (
                <div className={styles.section}>
                    <div className={styles.sectionTitle}>Appearance</div>
                    <div className={styles.row}>
                        <div className={styles.controlGroup}>
                            <label className={styles.label}>Fill Color</label>
                            <div className={styles.colorInputWrapper}>
                                <div className={styles.colorPreview} style={{ backgroundColor: selectedObject.fill as string }}>
                                    <input
                                        type="color"
                                        className={styles.colorInput}
                                        value={typeof selectedObject.fill === 'string' ? selectedObject.fill : '#000000'}
                                        onChange={(e) => updateProperty('fill', e.target.value)}
                                    />
                                </div>
                                <span className={styles.colorValue}>{typeof selectedObject.fill === 'string' ? selectedObject.fill : 'Pattern'}</span>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Layer Management */}
            <div className={styles.section}>
                <div className={styles.sectionTitle}>Arrangement</div>
                <div className={styles.row}>
                    <div className={styles.buttonGroup} style={{ flex: 1 }}>
                        <button className={styles.iconBtn} onClick={() => handleLayerAction('bringForward')} title="Bring Forward">
                            <FaArrowUp />
                        </button>
                        <button className={styles.iconBtn} onClick={() => handleLayerAction('sendBackward')} title="Send Backward">
                            <FaArrowDown />
                        </button>
                        <button className={styles.iconBtn} onClick={() => handleLayerAction('bringToFront')} title="Bring to Front">
                            <FaLayerGroup />↑
                        </button>
                        <button className={styles.iconBtn} onClick={() => handleLayerAction('sendToBack')} title="Send to Back">
                            <FaLayerGroup />↓
                        </button>
                    </div>
                </div>
                <div className={styles.row}>
                    <button className={`${styles.iconBtn} ${styles.danger}`} style={{ color: 'var(--danger-color)', width: '100%', justifyContent: 'center' }} onClick={handleDelete}>
                        <FaTrash style={{ marginRight: '0.5rem' }} /> Delete Object
                    </button>
                </div>
            </div>
        </div>
    );
}
