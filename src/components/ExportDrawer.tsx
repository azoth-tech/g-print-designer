'use client';

import React, { useState, useEffect } from 'react';
import {
    FaTimes,
    FaLock,
    FaLockOpen,
    FaImage,
    FaAdjust,
    FaDownload,
    FaChevronDown
} from 'react-icons/fa';
import styles from './ExportDrawer.module.css';

export interface ExportSettings {
    format: 'PNG' | 'JPG' | 'PDF' | 'SVG';
    width: number;
    height: number;
    dpi: number;
    transparentBackground: boolean;
    includeProductColor: boolean;
}

interface ExportDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    previewImage: string | null;
    initialDimensions: { width: number; height: number };
    onExport: (settings: ExportSettings) => void;
    onSecondaryAction?: () => void;
    secondaryButtonText?: string;
}

export default function ExportDrawer({
    isOpen,
    onClose,
    previewImage,
    initialDimensions,
    onExport,
    onSecondaryAction,
    secondaryButtonText
}: ExportDrawerProps) {
    // State
    const [format, setFormat] = useState<'PNG' | 'JPG' | 'PDF' | 'SVG'>('PNG');
    const [width, setWidth] = useState(4500);
    const [height, setHeight] = useState(5400);
    const [dpi, setDpi] = useState(300);
    const [isAspectLocked, setIsAspectLocked] = useState(true);
    const [transparentBackground, setTransparentBackground] = useState(true);
    const [includeProductColor, setIncludeProductColor] = useState(false);

    // Initialize dimensions from props when opening
    useEffect(() => {
        if (isOpen && initialDimensions) {
            const aspect = initialDimensions.width / initialDimensions.height;
            if (aspect) {
                const baseSize = 4500;
                if (initialDimensions.width > initialDimensions.height) {
                    setWidth(baseSize);
                    setHeight(Math.round(baseSize / aspect));
                } else {
                    setHeight(5400);
                    setWidth(Math.round(5400 * aspect));
                }
            }
        }
    }, [isOpen, initialDimensions]);

    const handleWidthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newWidth = parseInt(e.target.value) || 0;
        setWidth(newWidth);
        if (isAspectLocked && initialDimensions) {
            const aspect = initialDimensions.width / initialDimensions.height;
            setHeight(Math.round(newWidth / aspect));
        }
    };

    const handleHeightChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newHeight = parseInt(e.target.value) || 0;
        setHeight(newHeight);
        if (isAspectLocked && initialDimensions) {
            const aspect = initialDimensions.width / initialDimensions.height;
            setWidth(Math.round(newHeight * aspect));
        }
    };

    const handleExportClick = () => {
        onExport({
            format,
            width,
            height,
            dpi,
            transparentBackground,
            includeProductColor
        });
    };

    // Prevent scrolling background when drawer is open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    return (
        <>
            {/* Overlay */}
            <div
                className={styles.overlay}
                style={{
                    opacity: isOpen ? 1 : 0,
                    pointerEvents: isOpen ? 'auto' : 'none'
                }}
                onClick={onClose}
            />

            {/* Drawer */}
            <div className={`${styles.drawer} ${isOpen ? styles.open : ''}`}>
                {/* Header */}
                <div className={styles.header}>
                    <div className={styles.title}>
                        <h2>Export Design</h2>
                        <p>Configure your print file settings</p>
                    </div>
                    <button className={styles.closeButton} onClick={onClose}>
                        <FaTimes />
                    </button>
                </div>

                {/* Content */}
                <div className={styles.content}>
                    {/* Preview Section */}
                    <div className={styles.section}>
                        <div className={styles.sectionHeader}>
                            <label className={styles.label}>Preview (Editable Area on Product)</label>
                        </div>
                        <div className={styles.previewContainer}>
                            {previewImage ? (
                                <div
                                    className={styles.previewImage}
                                    style={{ backgroundImage: `url(${previewImage})` }}
                                />
                            ) : (
                                <div className={styles.previewImage} style={{ backgroundColor: '#eee', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <span>No Preview</span>
                                </div>
                            )}
                            <div className={styles.previewOverlay}>
                                <p style={{ fontWeight: 600, fontSize: '0.875rem' }}>Design on Product</p>
                                <p style={{ fontSize: '0.75rem', opacity: 0.8 }}>Editable Area: {initialDimensions.width}×{initialDimensions.height}px</p>
                                <p style={{ fontSize: '0.75rem', opacity: 0.8 }}>Export: {width}×{height}px @ {dpi} DPI</p>
                            </div>
                        </div>
                    </div>

                    {/* File Format */}
                    <div className={styles.section}>
                        <label className={styles.label}>File Format</label>
                        <div className={styles.formatGroup}>
                            {(['PNG', 'JPG', 'PDF', 'SVG'] as const).map((fmt) => (
                                <label key={fmt} className={styles.formatOption}>
                                    <input
                                        type="radio"
                                        name="format"
                                        value={fmt}
                                        checked={format === fmt}
                                        onChange={() => setFormat(fmt)}
                                    />
                                    <div className={styles.formatLabel}>{fmt}</div>
                                </label>
                            ))}
                        </div>
                        <p className={styles.hint}>
                            {format === 'PNG' ? 'PNG is recommended for transparent backgrounds.' :
                                format === 'JPG' ? 'JPG is best for smaller file sizes (no transparency).' :
                                    format === 'PDF' ? 'PDF is best for print documents.' :
                                        'SVG is best for vector editing.'}
                        </p>
                    </div>

                    {/* Dimensions */}
                    <div className={styles.section}>
                        <div className={styles.sectionHeader}>
                            <label className={styles.label}>Dimensions (px)</label>
                            <button
                                className={styles.linkButton}
                                onClick={() => setIsAspectLocked(!isAspectLocked)}
                                style={{ color: isAspectLocked ? 'var(--primary-color)' : 'var(--text-muted)' }}
                            >
                                {isAspectLocked ? <FaLock size={12} /> : <FaLockOpen size={12} />}
                                {isAspectLocked ? 'Aspect Locked' : 'Unlock Aspect'}
                            </button>
                        </div>
                        <div className={styles.dimensionsGroup}>
                            <div className={styles.inputWrapper}>
                                <input
                                    type="number"
                                    value={width}
                                    onChange={handleWidthChange}
                                />
                                <span className={styles.inputUnit}>W</span>
                            </div>
                            <span style={{ color: 'var(--text-muted)' }}>×</span>
                            <div className={styles.inputWrapper}>
                                <input
                                    type="number"
                                    value={height}
                                    onChange={handleHeightChange}
                                />
                                <span className={styles.inputUnit}>H</span>
                            </div>
                        </div>
                    </div>

                    {/* Resolution Detail */}
                    <details className={styles.detailGroup} open>
                        <summary className={styles.detailSummary}>
                            <div className={styles.summaryContent}>
                                <div className={styles.iconBox}>
                                    <FaImage />
                                </div>
                                <span className={styles.label}>Resolution (DPI)</span>
                            </div>
                            <FaChevronDown style={{ fontSize: '0.75rem' }} />
                        </summary>
                        <div className={styles.detailContent}>
                            <div style={{ paddingTop: '0.5rem' }}>
                                <input
                                    type="range"
                                    min="72"
                                    max="300"
                                    step="1"
                                    value={dpi}
                                    onChange={(e) => setDpi(parseInt(e.target.value))}
                                    className={styles.rangeInput}
                                />
                                <div className={styles.rangeLabels}>
                                    <span>72 DPI (Web)</span>
                                    <span>150 DPI</span>
                                    <span style={{ color: 'var(--primary-color)', fontWeight: 700 }}>{dpi} DPI (Print)</span>
                                </div>
                            </div>
                        </div>
                    </details>

                    {/* Background Detail */}
                    <details className={styles.detailGroup}>
                        <summary className={styles.detailSummary}>
                            <div className={styles.summaryContent}>
                                <div className={styles.iconBox}>
                                    <FaAdjust />
                                </div>
                                <span className={styles.label}>Background Options</span>
                            </div>
                            <FaChevronDown style={{ fontSize: '0.75rem' }} />
                        </summary>
                        <div className={styles.detailContent}>
                            <label className={styles.toggleLabel}>
                                <span style={{ fontSize: '0.875rem' }}>Transparent Background</span>
                                <div className={styles.toggleWrapper}>
                                    <input
                                        type="checkbox"
                                        checked={transparentBackground}
                                        onChange={(e) => setTransparentBackground(e.target.checked)}
                                        className={styles.toggleCheckbox}
                                    />
                                    <div className={styles.toggleSwitch}>
                                        <div className={styles.toggleSlider}></div>
                                    </div>
                                </div>
                            </label>

                            <label className={styles.toggleLabel}>
                                <span style={{ fontSize: '0.875rem' }}>Include Product Color</span>
                                <div className={styles.toggleWrapper}>
                                    <input
                                        type="checkbox"
                                        checked={includeProductColor}
                                        onChange={(e) => setIncludeProductColor(e.target.checked)}
                                        className={styles.toggleCheckbox}
                                    />
                                    <div className={styles.toggleSwitch}>
                                        <div className={styles.toggleSlider}></div>
                                    </div>
                                </div>
                            </label>
                        </div>
                    </details>

                </div>

                {/* Footer */}
                <div className={styles.footer}>
                    <div className={styles.actions}>
                        {onSecondaryAction && secondaryButtonText && (
                            <button
                                className={styles.secondaryButton}
                                onClick={onSecondaryAction}
                            >
                                {secondaryButtonText}
                            </button>
                        )}
                        <button className={styles.downloadButton} onClick={handleExportClick}>
                            <FaDownload /> Export Download
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
}
