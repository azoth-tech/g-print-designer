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
    FaTrash
} from 'react-icons/fa';
import styles from './PropertiesPanel.module.css';

interface PropertiesPanelProps {
    canvas: fabric.Canvas | null;
}

const FONT_FAMILIES = [
    'Arial', 'Helvetica', 'Times New Roman', 'Courier New', 'Verdana',
    'Georgia', 'Palatino', 'Garamond', 'Comic Sans MS', 'Impact'
];

export default function PropertiesPanel({ canvas }: PropertiesPanelProps) {
    const [selectedObject, setSelectedObject] = useState<fabric.Object | null>(null);
    // Force update for re-render when object properties change
    const [_, setForceUpdate] = useState({});

    useEffect(() => {
        if (!canvas) return;

        const updateSelection = () => {
            const active = canvas.getActiveObject();
            setSelectedObject(active || null);
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
                        <input
                            type="number"
                            className={styles.input}
                            value={Math.round(selectedObject.angle || 0)}
                            onChange={(e) => updateProperty('angle', parseInt(e.target.value))}
                        />
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
                            min="0"
                            max="1"
                            step="0.01"
                            style={{ width: '100%' }}
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
                            <label className={styles.label}>Like color</label>
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
