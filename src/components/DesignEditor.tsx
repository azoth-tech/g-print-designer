'use client';

import React, { useEffect, useRef, useState } from 'react';
import * as fabric from 'fabric';
import { FaLayerGroup, FaTimes, FaFileImage, FaFilePdf, FaFile, FaPalette } from 'react-icons/fa';
import Header from './Header';
import Toolbar from './Toolbar';
import LayerPanel from './LayerPanel';
import PropertiesPanel from './PropertiesPanel';
import styles from './DesignEditor.module.css';
import { ProductConfig } from '@/types/types';
import {
    exportCanvasToPNG,
    exportCanvasToJSON,
    importCanvasFromJSON,
    downloadJSON,
    createEditableAreaOverlay,
    exportEditableAreaAsPNG,
    exportEditableAreaAsTIFF,
    exportEditableAreaAsPDF,
    exportEditableAreaAsHighResPNG,
    exportEditableAreaTransparent,
} from '@/utils/canvasUtils';

interface DesignEditorProps {
    productConfig: ProductConfig;
}

export default function DesignEditor({ productConfig }: DesignEditorProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [canvas, setCanvas] = useState<fabric.Canvas | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isLayerPanelOpen, setIsLayerPanelOpen] = useState(true);
    const [showExportModal, setShowExportModal] = useState(false);
    const [layoutScale, setLayoutScale] = useState(1);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isDarkMode, setIsDarkMode] = useState(false);
    const [activeSidebarTab, setActiveSidebarTab] = useState<'layers' | 'properties'>('layers');

    // Core Features State
    const [history, setHistory] = useState<string[]>([]);
    const [historyIndex, setHistoryIndex] = useState(-1);
    const [clipboard, setClipboard] = useState<fabric.Object | null>(null);
    const [isHistoryProcessing, setIsHistoryProcessing] = useState(false);

    // Zoom State (using layoutScale)
    // We already have layoutScale, but we need to track if it's manual or auto
    // For simplicity, we'll just manipulate layoutScale directly


    const toggleTheme = () => {
        setIsDarkMode(!isDarkMode);
        if (!isDarkMode) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    };

    // Toggle layer panel on mobile and calculate scale
    useEffect(() => {
        const handleResize = () => {
            const width = window.innerWidth;
            if (width < 768) {
                setIsLayerPanelOpen(false);
            } else {
                setIsLayerPanelOpen(true);
            }

            // Calculate scale to fit 800px canvas into screen
            // Check both width and height constraints
            const padding = 32;
            const headerHeight = 0; // Header is removed
            const availableWidth = width - padding;
            const availableHeight = window.innerHeight - headerHeight - padding;

            const scaleX = availableWidth / 800;
            const scaleY = availableHeight / 800;

            // Use the smaller scale to ensure it fits in both dimensions
            const targetScale = Math.min(1, scaleX, scaleY);
            setLayoutScale(targetScale);
        };

        handleResize(); // Initial check
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        if (!canvasRef.current) return;

        let isMounted = true;

        // Initialize Fabric canvas
        const fabricCanvas = new fabric.Canvas(canvasRef.current, {
            width: 800,
            height: 1, // Start small, will resize to image
            backgroundColor: '#ffffff',
            preserveObjectStacking: true, // Fix for layers behind rendering
        });

        // Add boundary constraints - logic is now simple again (no scaling needed)
        fabricCanvas.on('object:moving', (e) => {
            const obj = e.target;
            if (!obj || (obj as any).name === 'editableAreaOverlay') return;

            const { editableArea } = productConfig;

            const objWidth = (obj.width || 0) * (obj.scaleX || 1);
            const objHeight = (obj.height || 0) * (obj.scaleY || 1);

            // Constrain to editable area (using original coordinates)
            if (obj.left! < editableArea.left) {
                obj.left = editableArea.left;
            }
            if (obj.top! < editableArea.top) {
                obj.top = editableArea.top;
            }
            if (obj.left! + objWidth > editableArea.left + editableArea.width) {
                obj.left = editableArea.left + editableArea.width - objWidth;
            }
            if (obj.top! + objHeight > editableArea.top + editableArea.height) {
                obj.top = editableArea.top + editableArea.height - objHeight;
            }
        });

        // Load product mockup as background
        const loadBackground = async () => {
            try {
                const img = await fabric.FabricImage.fromURL(
                    productConfig.mockupImage,
                    { crossOrigin: 'anonymous' }
                );

                if (!isMounted) return;

                // Set canvas to exact image dimensions (or max 800 width logic if preferred, 
                // but let's stick to 800 max width for consistency with scale calculation)
                const MAX_WIDTH = 800;
                // Scale image to fit 800px width constraint if it's huge, otherwise keep original
                const scale = img.width && img.width > MAX_WIDTH ? MAX_WIDTH / img.width : 1;

                const finalWidth = (img.width || 800) * scale;
                const finalHeight = (img.height || 800) * scale;

                fabricCanvas.setDimensions({
                    width: finalWidth,
                    height: finalHeight
                });

                img.scale(scale);
                img.set({
                    left: 0,
                    top: 0,
                    selectable: false,
                    evented: false,
                });

                fabricCanvas.backgroundImage = img;
                fabricCanvas.renderAll();

                // Add editable area overlay (using original coordinates)
                const overlay = createEditableAreaOverlay(
                    fabricCanvas,
                    productConfig.editableArea
                );
                fabricCanvas.add(overlay);
                fabricCanvas.sendObjectToBack(overlay);

                setIsLoading(false);
            } catch (error) {
                if (!isMounted) return;
                console.error('Failed to load mockup image:', error);
                setIsLoading(false);
            }
        };

        loadBackground();
        setCanvas(fabricCanvas);

        // Cleanup
        return () => {
            isMounted = false;
            fabricCanvas.dispose();
        };
    }, [productConfig]);

    // History & Shortcuts Logic
    useEffect(() => {
        if (!canvas) return;

        const saveHistory = () => {
            if (isHistoryProcessing) return;

            const json = JSON.stringify(canvas.toJSON(['id', 'name', 'selectable', 'evented']));

            setHistory(prev => {
                const newHistory = prev.slice(0, historyIndex + 1);
                newHistory.push(json);
                return newHistory;
            });
            setHistoryIndex(prev => prev + 1);
        };

        // Initial save
        if (historyIndex === -1) {
            saveHistory();
        }

        const handleObjectModified = () => saveHistory();

        canvas.on('object:modified', handleObjectModified);
        canvas.on('object:added', handleObjectModified);
        canvas.on('object:removed', handleObjectModified);

        return () => {
            canvas.off('object:modified', handleObjectModified);
            canvas.off('object:added', handleObjectModified);
            canvas.off('object:removed', handleObjectModified);
        };
    }, [canvas, isHistoryProcessing, historyIndex]);

    const handleUndo = async () => {
        if (historyIndex <= 0 || !canvas) return;

        setIsHistoryProcessing(true);
        const prevIndex = historyIndex - 1;
        const json = history[prevIndex];

        try {
            if (!json) {
                console.error('No history state found at index', prevIndex);
                return;
            }
            await canvas.loadFromJSON(JSON.parse(json));
            canvas.renderAll();
            setHistoryIndex(prevIndex);
        } finally {
            setIsHistoryProcessing(false);
        }
    };

    const handleRedo = async () => {
        if (historyIndex >= history.length - 1 || !canvas) return;

        setIsHistoryProcessing(true);
        const nextIndex = historyIndex + 1;
        const json = history[nextIndex];

        try {
            if (!json) {
                console.error('No history state found at index', nextIndex);
                return;
            }
            await canvas.loadFromJSON(JSON.parse(json));
            canvas.renderAll();
            setHistoryIndex(nextIndex);
        } finally {
            setIsHistoryProcessing(false);
        }
    };

    // Keyboard Shortcuts
    useEffect(() => {
        if (!canvas) return;

        const handleKeyDown = async (e: KeyboardEvent) => {
            // Ignore if input focused
            if ((e.target as HTMLElement).tagName === 'INPUT' || (e.target as HTMLElement).tagName === 'TEXTAREA') return;

            const activeObject = canvas.getActiveObject();
            const cmdKey = e.metaKey || e.ctrlKey;

            // Delete
            if (e.key === 'Backspace' || e.key === 'Delete') {
                if (activeObject) {
                    // Prevent deleting background overlay or editable area
                    if ((activeObject as any).name === 'editableAreaOverlay' || (activeObject as any).name === 'productMockup') return;
                    canvas.remove(activeObject);
                    canvas.discardActiveObject();
                    canvas.requestRenderAll();
                }
            }

            // Copy
            if (cmdKey && e.key === 'c') {
                if (activeObject) {
                    activeObject.clone().then((cloned: fabric.Object) => {
                        setClipboard(cloned);
                    });
                }
            }

            // Paste
            if (cmdKey && e.key === 'v') {
                if (clipboard) {
                    clipboard.clone().then((cloned: fabric.Object) => {
                        canvas.discardActiveObject();
                        cloned.set({
                            left: (cloned.left || 0) + 20,
                            top: (cloned.top || 0) + 20,
                            evented: true,
                        });

                        if (cloned.type === 'activeSelection') {
                            cloned.canvas = canvas;
                            cloned.forEachObject((obj: any) => {
                                canvas.add(obj);
                            });
                            cloned.setCoords();
                        } else {
                            canvas.add(cloned);
                        }

                        setClipboard(cloned);
                        canvas.setActiveObject(cloned);
                        canvas.requestRenderAll();
                    });
                }
            }

            // Cut
            if (cmdKey && e.key === 'x') {
                if (activeObject) {
                    activeObject.clone().then((cloned: fabric.Object) => {
                        setClipboard(cloned);
                        canvas.remove(activeObject);
                        canvas.requestRenderAll();
                    });
                }
            }

            // Undo/Redo
            if (cmdKey && e.key === 'z') {
                e.preventDefault();
                if (e.shiftKey) {
                    handleRedo();
                } else {
                    handleUndo();
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [canvas, clipboard, historyIndex, history]);

    // Zoom Handlers
    const handleZoomIn = () => setLayoutScale(prev => Math.min(prev + 0.1, 3));
    const handleZoomOut = () => setLayoutScale(prev => Math.max(prev - 0.1, 0.2));
    const handleResetZoom = () => {
        // Re-calculate fit scale
        const width = window.innerWidth;
        const padding = 32;
        const availableWidth = width - padding;
        const availableHeight = window.innerHeight - padding;
        const scaleX = availableWidth / 800;
        const scaleY = availableHeight / 800;
        setLayoutScale(Math.min(1, scaleX, scaleY));
    };
    const handleExportPNG = () => {
        if (!canvas) return;
        exportCanvasToPNG(canvas, `${productConfig.name}-design.png`);
    };

    const handleExportEditablePNG = () => {
        if (!canvas || !productConfig.editableArea) return;
        exportEditableAreaAsPNG(canvas, productConfig.editableArea, `${productConfig.name}-editable.png`, 3);
    };

    const handleExportHighResPNG = () => {
        if (!canvas || !productConfig.editableArea) return;
        exportEditableAreaAsHighResPNG(canvas, productConfig.editableArea, `${productConfig.name}-print-300dpi.png`, 300);
    };

    const handleExportTIFF = () => {
        if (!canvas || !productConfig.editableArea) return;
        exportEditableAreaAsTIFF(canvas, productConfig.editableArea, `${productConfig.name}-editable.tiff`, 3);
    };

    const handleExportPDF = () => {
        if (!canvas || !productConfig.editableArea) return;
        exportEditableAreaAsPDF(canvas, productConfig.editableArea, `${productConfig.name}-editable.pdf`, 3);
    };

    const handleExportTransparent = () => {
        if (!canvas || !productConfig.editableArea) return;
        exportEditableAreaTransparent(canvas, productConfig.editableArea, `${productConfig.name}-transparent.png`, 3);
    };

    const handleExportJSON = () => {
        if (!canvas) return;
        const jsonString = exportCanvasToJSON(canvas);
        downloadJSON(jsonString, `${productConfig.name}-design.json`);
    };

    const handleImportJSON = () => {
        fileInputRef.current?.click();
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !canvas) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            const jsonString = event.target?.result as string;
            importCanvasFromJSON(canvas, jsonString).catch((error) => {
                console.error('Failed to import design:', error);
                alert('Failed to import design. Please check the file format.');
            });
        };
        reader.readAsText(file);

        // Reset input
        e.target.value = '';
    };

    const handleLoadTemplate = async (jsonUrl: string) => {
        if (!canvas) return;

        setIsLoading(true);
        try {
            const response = await fetch(jsonUrl);
            const json = await response.json();

            // Assuming importCanvasFromJSON handles clearing and loading
            await importCanvasFromJSON(canvas, JSON.stringify(json));
            setIsLoading(false);
        } catch (error) {
            console.error('Error loading template:', error);
            alert('Failed to load template');
            setIsLoading(false);
        }
    };

    const toggleLayerPanel = () => {
        setIsLayerPanelOpen(!isLayerPanelOpen);
    };

    return (
        <div className={`${styles.appContainer} ${isDarkMode ? 'dark' : ''}`}>
            <Header
                productName={productConfig.name}
                toggleTheme={toggleTheme}
                isDarkMode={isDarkMode}
            />

            <div className={styles.secondaryToolbarWrapper}>
                <Toolbar
                    canvas={canvas}
                    onExportJSON={handleExportJSON}
                    onImportJSON={handleImportJSON}
                    editableArea={productConfig.editableArea}
                    onToggleLayerPanel={toggleLayerPanel}
                    isLayerPanelOpen={isLayerPanelOpen}
                    templateCategory={productConfig.templateCategory}
                    onLoadTemplate={handleLoadTemplate}
                    onOpenExport={() => setShowExportModal(true)}
                    onUndo={handleUndo}
                    onRedo={handleRedo}
                    canUndo={historyIndex > 0}
                    canRedo={historyIndex < history.length - 1}
                />
            </div>

            <main className={styles.mainContent}>
                <div className={styles.canvasArea}>
                    {isLoading && (
                        <div className={styles.loadingOverlay}>
                            <div className={styles.loadingSpinner} />
                        </div>
                    )}
                    {/* Responsive Canvas Wrapper */}
                    <div
                        className={styles.canvasCenterer}
                    >
                        <div
                            className={styles.canvasWrapper}
                            style={{
                                width: (canvas?.width || 800) * layoutScale,
                                height: (canvas?.height || 800) * layoutScale,
                            }}
                        >
                            <div style={{
                                transform: `scale(${layoutScale})`,
                                transformOrigin: 'top left',
                                width: canvas?.width || 800,
                                height: canvas?.height || 800
                            }}>
                                <canvas ref={canvasRef} className={styles.canvas} />
                            </div>
                        </div>
                    </div>

                    {/* Zoom / Canvas Controls (Floating) - Could be a component */}
                    <div className={styles.canvasControls}>
                        <div className={styles.zoomControls}>
                            {/* ... Zoom buttons logic to be added later or reuse exisitng ... */}
                        </div>
                    </div>
                </div>

                <aside className={`${styles.rightSidebar} ${isLayerPanelOpen ? styles.open : styles.closed}`}>
                    <div className={styles.sidebarHeader}>
                        <div className={styles.sidebarTabs}>
                            <button
                                className={`${styles.sidebarTab} ${activeSidebarTab === 'layers' ? styles.activeTab : ''}`}
                                onClick={() => setActiveSidebarTab('layers')}
                            >
                                Layers
                            </button>
                            <button
                                className={`${styles.sidebarTab} ${activeSidebarTab === 'properties' ? styles.activeTab : ''}`}
                                onClick={() => setActiveSidebarTab('properties')}
                            >
                                Properties
                            </button>
                        </div>
                        <button
                            className={styles.closeSidebarBtn}
                            onClick={() => setIsLayerPanelOpen(false)}
                            title="Close Sidebar"
                        >
                            <FaTimes />
                        </button>
                    </div>
                    <div className={styles.sidebarContent}>
                        {activeSidebarTab === 'layers' ? (
                            <LayerPanel canvas={canvas} />
                        ) : (
                            <PropertiesPanel canvas={canvas} />
                        )}
                    </div>
                </aside>
            </main>

            {/* Hidden file input for JSON import */}
            <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleFileSelect}
                style={{ display: 'none' }}
            />
            {/* Export Modal */}
            {showExportModal && (
                <div className={styles.modalOverlay} onClick={() => setShowExportModal(false)}>
                    <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
                        <div className={styles.modalHeader}>
                            <h3 className={styles.modalTitle}>Export Options</h3>
                            <button
                                className={styles.modalClose}
                                onClick={() => setShowExportModal(false)}
                            >
                                <FaTimes />
                            </button>
                        </div>

                        <div className={styles.exportSection}>
                            <div className={styles.exportSectionTitle}>Print Files (Editable Area)</div>
                            <div className={styles.exportGrid}>
                                <button
                                    className={styles.exportBtn}
                                    onClick={() => {
                                        handleExportEditablePNG();
                                        setShowExportModal(false);
                                    }}
                                >
                                    <FaFileImage className={styles.exportBtnIcon} />
                                    <span>PNG (High Res)</span>
                                </button>
                                <button
                                    className={styles.exportBtn}
                                    onClick={() => {
                                        handleExportHighResPNG();
                                        setShowExportModal(false);
                                    }}
                                >
                                    <FaFileImage className={styles.exportBtnIcon} />
                                    <span>PNG (300 DPI Print Ready)</span>
                                </button>
                                <button
                                    className={styles.exportBtn}
                                    onClick={() => {
                                        handleExportTIFF();
                                        setShowExportModal(false);
                                    }}
                                >
                                    <FaFile className={styles.exportBtnIcon} />
                                    <span>TIFF</span>
                                </button>
                                <button
                                    className={styles.exportBtn}
                                    onClick={() => {
                                        handleExportPDF();
                                        setShowExportModal(false);
                                    }}
                                >
                                    <FaFilePdf className={styles.exportBtnIcon} />
                                    <span>PDF</span>
                                </button>
                                <button
                                    className={styles.exportBtn}
                                    onClick={() => {
                                        handleExportTransparent();
                                        setShowExportModal(false);
                                    }}
                                >
                                    <FaPalette className={styles.exportBtnIcon} />
                                    <span>Transparent PNG</span>
                                </button>
                            </div>
                        </div>

                        <div className={styles.exportSection}>
                            <div className={styles.exportSectionTitle}>Mockup</div>
                            <div className={styles.exportGrid}>
                                <button
                                    className={styles.exportBtn}
                                    onClick={() => {
                                        handleExportPNG();
                                        setShowExportModal(false);
                                    }}
                                >
                                    <FaFileImage className={styles.exportBtnIcon} />
                                    <span>Full Canvas Mockup</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
