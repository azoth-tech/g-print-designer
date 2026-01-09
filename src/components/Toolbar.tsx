'use client';

import React, { useRef, useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import * as fabric from 'fabric';
import {
    FaFileDownload,
    FaFileUpload,
    FaImage,
    FaFont,
    FaSmile,
    FaUndo,
    FaRedo,
    FaStar,
    FaLayerGroup,
    FaThLarge,
} from 'react-icons/fa';
import styles from './Toolbar.module.css';
import { addTextToCanvas, addImageToCanvas } from '@/utils/canvasUtils';
import { EditableArea } from '@/types/types';
import TemplatesModal from './TemplatesModal';

interface ToolbarProps {
    canvas: fabric.Canvas | null;
    onExportJSON: () => void;
    onImportJSON: () => void;
    editableArea?: EditableArea;
    onToggleLayerPanel: () => void;
    isLayerPanelOpen: boolean;
    templateCategory?: string;
    onLoadTemplate: (jsonUrl: string) => void;
    onOpenExport: () => void;
    onUndo: () => void;
    onRedo: () => void;
    canUndo: boolean;
    canRedo: boolean;
}

interface Template {
    name: string;
    url: string;
}

const CLIPART_IMAGES = [
    { name: 'Heart', url: '/clipart/heart.png' },
    { name: 'Star', url: '/clipart/star.png' },
    { name: 'Circle', url: '/clipart/circle.png' },
];

const ITEMS_PER_PAGE = 10;

export default function Toolbar({
    canvas,
    onExportJSON,
    onImportJSON,
    editableArea,
    onToggleLayerPanel,
    isLayerPanelOpen,
    templateCategory,
    onLoadTemplate,
    onOpenExport,
    onUndo,
    onRedo,
    canUndo,
    canRedo,
}: ToolbarProps) {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const clipartButtonRef = useRef<HTMLButtonElement>(null);
    const exportButtonRef = useRef<HTMLButtonElement>(null);
    const [showClipart, setShowClipart] = useState(false);
    const [clipartPosition, setClipartPosition] = useState({ top: 0, left: 0 });

    // Templates State
    const [showTemplates, setShowTemplates] = useState(false);

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



    return (
        <div className={styles.toolbar}>
            {/* History Tools */}
            <div className={styles.toolbarSection}>
                <button
                    className="btn-icon"
                    onClick={onUndo}
                    disabled={!canUndo}
                    title="Undo (Ctrl+Z)"
                    style={{ opacity: canUndo ? 1 : 0.5 }}
                >
                    <FaUndo />
                </button>
                <button
                    className="btn-icon"
                    onClick={onRedo}
                    disabled={!canRedo}
                    title="Redo (Ctrl+Y)"
                    style={{ opacity: canRedo ? 1 : 0.5 }}
                >
                    <FaRedo />
                </button>
            </div>

            <div className={styles.toolbarDivider} />

            {/* Add Elements */}
            <div className={styles.toolbarSection}>
                <button className="btn-secondary" onClick={handleAddText} title="Add Text">
                    <FaFont className={styles.icon} />
                    <span className={styles.buttonLabel}>Text</span>
                </button>

                <button
                    className="btn-secondary"
                    onClick={() => fileInputRef.current?.click()}
                    title="Upload Image"
                >
                    <FaImage className={styles.icon} />
                    <span className={styles.buttonLabel}>Image</span>
                </button>
                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className={styles.fileInput}
                />

                <button
                    ref={clipartButtonRef}
                    className="btn-secondary"
                    onClick={() => setShowClipart(!showClipart)}
                    title="Shapes & Clipart"
                >
                    <FaStar className={styles.icon} />
                    <span className={styles.buttonLabel}>Shapes</span>
                </button>

                {templateCategory && (
                    <button
                        className="btn-secondary"
                        onClick={() => setShowTemplates(true)}
                        title="Templates"
                    >
                        <FaThLarge className={styles.icon} />
                        <span className={styles.buttonLabel}>Templates</span>
                    </button>
                )}
            </div>

            <div style={{ flex: 1 }} />

            {/* Export/Import */}
            <div className={styles.exportButtons}>
                <button className="btn-secondary" onClick={onImportJSON} title="Import Design">
                    <FaFileUpload className={styles.icon} />
                    <span className={styles.buttonLabel}>Import</span>
                </button>

                <button className="btn-secondary" onClick={onExportJSON} title="Export as JSON">
                    <FaFileDownload className={styles.icon} />
                    <span className={styles.buttonLabel}>Save JSON</span>
                </button>



                <button className="btn-primary" onClick={onOpenExport} title="Export Design">
                    <FaFileDownload className={styles.icon} />
                    <span className={styles.buttonLabel}>Export</span>
                </button>

                <div className={styles.toolbarDivider} />

                <button
                    className={`btn-secondary ${isLayerPanelOpen ? styles.active : ''}`}
                    onClick={onToggleLayerPanel}
                    title={isLayerPanelOpen ? 'Hide Layers' : 'Show Layers'}
                >
                    <FaLayerGroup className={styles.icon} style={{ marginRight: 0 }} />
                </button>
            </div>

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



            {/* Templates Modal */}
            <TemplatesModal
                isOpen={showTemplates}
                onClose={() => setShowTemplates(false)}
                onSelect={(url) => {
                    onLoadTemplate(url);
                    setShowTemplates(false);
                }}
                initialCategory={templateCategory}
            />
        </div>
    );
}
