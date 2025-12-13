'use client';

import React, { useRef, useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import * as fabric from 'fabric';
import {
    FaBold,
    FaItalic,
    FaAlignLeft,
    FaAlignCenter,
    FaAlignRight,
    FaFileDownload,
    FaFileUpload,
    FaImage,
    FaFont,
    FaSmile,
} from 'react-icons/fa';
import styles from './Toolbar.module.css';
import { addTextToCanvas, addImageToCanvas } from '@/utils/canvasUtils';
import { EditableArea } from '@/types/types';

interface ToolbarProps {
    canvas: fabric.Canvas | null;
    onExportPNG: () => void;
    onExportJSON: () => void;
    onImportJSON: () => void;
    editableArea?: EditableArea;
}

const FONT_FAMILIES = [
    'Arial',
    'Helvetica',
    'Times New Roman',
    'Courier New',
    'Verdana',
    'Georgia',
    'Palatino',
    'Garamond',
    'Comic Sans MS',
    'Impact',
];

const CLIPART_IMAGES = [
    { name: 'Heart', url: '/clipart/heart.png' },
    { name: 'Star', url: '/clipart/star.png' },
    { name: 'Circle', url: '/clipart/circle.png' },
];

export default function Toolbar({
    canvas,
    onExportPNG,
    onExportJSON,
    onImportJSON,
    editableArea,
}: ToolbarProps) {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const clipartButtonRef = useRef<HTMLButtonElement>(null);
    const [activeObject, setActiveObject] = useState<fabric.Object | null>(null);
    const [showClipart, setShowClipart] = useState(false);
    const [clipartPosition, setClipartPosition] = useState({ top: 0, left: 0 });

    const [forceUpdate, setForceUpdate] = useState({});

    // Update active object when selection changes
    React.useEffect(() => {
        if (!canvas) return;

        const handleSelection = () => {
            const selected = canvas.getActiveObject();
            setActiveObject(selected || null);
            setForceUpdate({});
        };

        const handleModification = () => {
            setForceUpdate({});
        };

        canvas.on('selection:created', handleSelection);
        canvas.on('selection:updated', handleSelection);
        canvas.on('selection:cleared', () => setActiveObject(null));
        canvas.on('object:modified', handleModification);

        return () => {
            canvas.off('selection:created', handleSelection);
            canvas.off('selection:updated', handleSelection);
            canvas.off('selection:cleared');
            canvas.off('object:modified', handleModification);
        };
    }, [canvas]);

    // Update clipart dropdown position when shown
    useEffect(() => {
        if (showClipart && clipartButtonRef.current) {
            const rect = clipartButtonRef.current.getBoundingClientRect();
            setClipartPosition({
                top: rect.bottom + 8,
                left: rect.left,
            });
        }
    }, [showClipart]);

    // Close clipart dropdown when clicking outside
    useEffect(() => {
        if (!showClipart) return;

        const handleClickOutside = (e: MouseEvent) => {
            if (
                clipartButtonRef.current &&
                !clipartButtonRef.current.contains(e.target as Node)
            ) {
                const clipartDropdown = document.getElementById('clipart-dropdown');
                if (clipartDropdown && !clipartDropdown.contains(e.target as Node)) {
                    setShowClipart(false);
                }
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [showClipart]);

    const handleAddText = () => {
        if (!canvas) return;
        addTextToCanvas(canvas, 'Double click to edit', undefined, editableArea);
    };

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !canvas) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            const imageUrl = event.target?.result as string;
            addImageToCanvas(canvas, imageUrl, editableArea);
        };
        reader.readAsDataURL(file);

        // Reset input
        e.target.value = '';
    };

    const handleClipartSelect = (url: string) => {
        if (!canvas) return;
        addImageToCanvas(canvas, url, editableArea);
        setShowClipart(false);
    };

    const handleFontChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        if (!canvas || !activeObject || (activeObject.type !== 'i-text' && activeObject.type !== 'textbox')) return;
        (activeObject as any).set('fontFamily', e.target.value);
        canvas.renderAll();
        setForceUpdate({});
    };

    const handleFontSizeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!canvas || !activeObject || (activeObject.type !== 'i-text' && activeObject.type !== 'textbox')) return;
        const size = parseInt(e.target.value);
        if (size > 0) {
            (activeObject as any).set('fontSize', size);
            canvas.renderAll();
            setForceUpdate({});
        }
    };

    const handleColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!canvas || !activeObject) return;
        activeObject.set('fill', e.target.value);
        canvas.renderAll();
        setForceUpdate({});
    };

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

    const toggleBold = () => {
        if (!canvas || !activeObject || (activeObject.type !== 'i-text' && activeObject.type !== 'textbox')) return;
        const text = activeObject as any;
        const currentWeight = text.fontWeight;
        text.set('fontWeight', currentWeight === 'bold' ? 'normal' : 'bold');
        canvas.renderAll();
        setForceUpdate({});
    };

    const toggleItalic = () => {
        if (!canvas || !activeObject || (activeObject.type !== 'i-text' && activeObject.type !== 'textbox')) return;
        const text = activeObject as any;
        const currentStyle = text.fontStyle;
        text.set('fontStyle', currentStyle === 'italic' ? 'normal' : 'italic');
        canvas.renderAll();
        setForceUpdate({});
    };

    const setTextAlign = (align: string) => {
        if (!canvas || !activeObject || (activeObject.type !== 'i-text' && activeObject.type !== 'textbox')) return;
        (activeObject as any).set('textAlign', align);
        canvas.renderAll();
        setForceUpdate({});
    };

    const isTextSelected = activeObject?.type === 'i-text' || activeObject?.type === 'textbox';
    const currentText = isTextSelected ? (activeObject as any) : null;

    return (
        <div className={styles.toolbar}>
            {/* Add Elements */}
            <div className={styles.toolbarSection}>
                <button className="btn-primary" onClick={handleAddText} title="Add Text">
                    <FaFont className={styles.icon} />
                    <span className={styles.buttonLabel}>Add Text</span>
                </button>

                <button
                    className="btn-primary"
                    onClick={() => fileInputRef.current?.click()}
                    title="Upload Image"
                >
                    <FaImage className={styles.icon} />
                    <span className={styles.buttonLabel}>Upload Image</span>
                </button>
                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className={styles.fileInput}
                />

                <div>
                    <button
                        ref={clipartButtonRef}
                        className="btn-secondary"
                        onClick={() => setShowClipart(!showClipart)}
                        title="Clipart Library"
                    >
                        <FaSmile className={styles.icon} />
                        <span className={styles.buttonLabel}>Clipart</span>
                    </button>
                </div>
            </div>

            <div className={styles.toolbarDivider} />

            {/* Clipart Dropdown - Rendered via Portal */}
            {showClipart &&
                typeof window !== 'undefined' &&
                createPortal(
                    <div
                        id="clipart-dropdown"
                        style={{
                            position: 'fixed',
                            top: `${clipartPosition.top}px`,
                            left: `${clipartPosition.left}px`,
                            background: 'var(--bg-secondary)',
                            border: '1px solid var(--border-color)',
                            borderRadius: 'var(--radius-md)',
                            boxShadow: 'var(--shadow-lg)',
                            zIndex: 9999,
                        }}
                    >
                        <div className={styles.clipartGrid}>
                            {CLIPART_IMAGES.map((clipart) => (
                                <div
                                    key={clipart.name}
                                    className={styles.clipartItem}
                                    onClick={() => handleClipartSelect(clipart.url)}
                                    title={clipart.name}
                                >
                                    <img src={clipart.url} alt={clipart.name} />
                                </div>
                            ))}
                        </div>
                    </div>,
                    document.body
                )}

            {/* Export/Import */}
            <div className={styles.exportButtons}>
                <button className="btn-secondary" onClick={onImportJSON} title="Import Design">
                    <FaFileUpload className={styles.icon} />
                    <span className={styles.buttonLabel}>Import</span>
                </button>

                <button className="btn-primary" onClick={onExportJSON} title="Export as JSON">
                    <FaFileDownload className={styles.icon} />
                    <span className={styles.buttonLabel}>Save JSON</span>
                </button>

                <button className="btn-primary" onClick={onExportPNG} title="Export as PNG">
                    <FaFileDownload className={styles.icon} />
                    <span className={styles.buttonLabel}>Export PNG</span>
                </button>
            </div>

            {/* Floating Text Toolbar - Only visible when text is selected */}
            {isTextSelected && (
                <div className={styles.floatingToolbar}>
                    <div className={styles.toolbarSection}>
                        <span className={styles.toolbarLabel}>Font:</span>
                        <select
                            className={styles.fontSelect}
                            value={currentText?.fontFamily || 'Arial'}
                            onChange={handleFontChange}
                        >
                            {FONT_FAMILIES.map((font) => (
                                <option key={font} value={font}>
                                    {font}
                                </option>
                            ))}
                        </select>

                        <input
                            type="number"
                            className={styles.fontSizeInput}
                            value={currentText?.fontSize || 32}
                            onChange={handleFontSizeChange}
                            min="8"
                            max="200"
                            title="Font Size"
                        />

                        <input
                            type="color"
                            className={styles.colorInput}
                            value={rgbToHex(activeObject?.fill || '#000000')}
                            onChange={handleColorChange}
                            title="Color"
                        />
                    </div>

                    <div className={styles.toolbarSection}>
                        <button
                            className={`${styles.formatButton} ${currentText?.fontWeight === 'bold' ? styles.active : ''}`}
                            onClick={toggleBold}
                            title="Bold"
                        >
                            <FaBold />
                        </button>

                        <button
                            className={`${styles.formatButton} ${currentText?.fontStyle === 'italic' ? styles.active : ''}`}
                            onClick={toggleItalic}
                            title="Italic"
                        >
                            <FaItalic />
                        </button>

                        <button
                            className={`${styles.formatButton} ${currentText?.textAlign === 'left' ? styles.active : ''}`}
                            onClick={() => setTextAlign('left')}
                            title="Align Left"
                        >
                            <FaAlignLeft />
                        </button>

                        <button
                            className={`${styles.formatButton} ${currentText?.textAlign === 'center' ? styles.active : ''}`}
                            onClick={() => setTextAlign('center')}
                            title="Align Center"
                        >
                            <FaAlignCenter />
                        </button>

                        <button
                            className={`${styles.formatButton} ${currentText?.textAlign === 'right' ? styles.active : ''}`}
                            onClick={() => setTextAlign('right')}
                            title="Align Right"
                        >
                            <FaAlignRight />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
