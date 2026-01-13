'use client';

import React, { useEffect, useRef, useState } from 'react';
import * as fabric from 'fabric';
import { FaLayerGroup, FaTimes } from 'react-icons/fa';
import Header from './Header';
import Toolbar from './Toolbar';
import LayerPanel from './LayerPanel';
import PropertiesPanel from './PropertiesPanel';
import ExportDrawer, { ExportSettings } from './ExportDrawer';
import AIDesignModal from './AIDesignModal';
import styles from './DesignEditor.module.css';
import { ProductConfig } from '@/types/types';
import {
    exportCanvasToJSON,
    importCanvasFromJSON,
    downloadJSON,
    createEditableAreaOverlay,
    exportEditableAreaAsPNG,
    exportEditableAreaAsTIFF,
    exportEditableAreaAsPDF,
    exportEditableAreaAsSVG,
    exportEditableAreaWithBackgroundAsPNG,
    exportEditableAreaWithBackgroundAsTIFF,
    exportEditableAreaWithBackgroundAsPDF,
    exportEditableAreaWithBackgroundAsSVG
} from '@/utils/canvasUtils';
import { applyAIDesignToCanvas } from '@/utils/aiUtils';

interface DesignEditorProps {
    productConfig: ProductConfig;
    onSecondaryAction?: () => void;
    secondaryButtonText?: string;
}

export default function DesignEditor({ productConfig, onSecondaryAction, secondaryButtonText }: DesignEditorProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [canvas, setCanvas] = useState<fabric.Canvas | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isLayerPanelOpen, setIsLayerPanelOpen] = useState(true);
    const [showExportDrawer, setShowExportDrawer] = useState(false);
    const [exportPreviewImage, setExportPreviewImage] = useState<string | null>(null);
    const [showAIDesign, setShowAIDesign] = useState(false);
    const [layoutScale, setLayoutScale] = useState(1);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isDarkMode, setIsDarkMode] = useState(false);
    const [activeSidebarTab, setActiveSidebarTab] = useState<'layers' | 'properties'>('layers');

    // Core Features State
    const [history, setHistory] = useState<string[]>([]);
    const [historyIndex, setHistoryIndex] = useState(-1);
    const [clipboard, setClipboard] = useState<fabric.Object | null>(null);
    const [isHistoryProcessing, setIsHistoryProcessing] = useState(false);

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
            const padding = 32;
            const headerHeight = 0; // Header is removed
            const availableWidth = width - padding;
            const availableHeight = window.innerHeight - headerHeight - padding;

            const scaleX = availableWidth / 800;
            const scaleY = availableHeight / 800;

            const targetScale = Math.min(1, scaleX, scaleY);
            setLayoutScale(targetScale);
        };

        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        if (!canvasRef.current) return;

        let isMounted = true;

        // Initialize Fabric canvas
        const fabricCanvas = new fabric.Canvas(canvasRef.current, {
            width: 800,
            height: 1,
            backgroundColor: '#ffffff',
            preserveObjectStacking: true,
        });

        // No boundary constraints - allow objects to move/resize freely
        // The editable area overlay is just a visual guide

        const loadBackground = async () => {
            try {
                const img = await fabric.FabricImage.fromURL(
                    productConfig.mockupImage,
                    { crossOrigin: 'anonymous' }
                );

                if (!isMounted) return;

                const MAX_WIDTH = 800;
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

                const overlay = createEditableAreaOverlay(
                    fabricCanvas,
                    productConfig.editableArea
                );
                fabricCanvas.add(overlay);
                // Bring overlay to FRONT so it appears above all objects
                // Cast to any to access Fabric.js internal methods
                (fabricCanvas as any).bringObjectToFront(overlay);

                setIsLoading(false);
                setCanvas(fabricCanvas);
            } catch (error) {
                if (!isMounted) return;
                console.error('Failed to load mockup image:', error);
                setIsLoading(false);
                setCanvas(fabricCanvas);
            }
        };

        loadBackground();

        return () => {
            isMounted = false;
            fabricCanvas.dispose();
            setCanvas(null);
        };
    }, [productConfig]);

    // History & Shortcuts Logic
    useEffect(() => {
        if (!canvas) return;

        const saveHistory = () => {
            if (isHistoryProcessing) return;
            const json = JSON.stringify(canvas.toJSON());
            setHistory(prev => {
                const newHistory = prev.slice(0, historyIndex + 1);
                newHistory.push(json);
                return newHistory;
            });
            setHistoryIndex(prev => prev + 1);
        };

        if (historyIndex === -1) {
            saveHistory();
        }

        const handleObjectModified = () => {
            saveHistory();
            // Keep overlay on top
            const overlay = canvas.getObjects().find((obj: any) => obj.name === 'editableAreaOverlay');
            if (overlay) {
                (canvas as any).bringObjectToFront(overlay);
            }
        };

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
            if (!json) return;
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
            if (!json) return;
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
            if ((e.target as HTMLElement).tagName === 'INPUT' || (e.target as HTMLElement).tagName === 'TEXTAREA') return;

            const activeObject = canvas.getActiveObject();
            const cmdKey = e.metaKey || e.ctrlKey;

            if (e.key === 'Backspace' || e.key === 'Delete') {
                if (activeObject) {
                    if ((activeObject as any).name === 'editableAreaOverlay' || (activeObject as any).name === 'productMockup') return;
                    canvas.remove(activeObject);
                    canvas.discardActiveObject();
                    canvas.requestRenderAll();
                }
            }

            if (cmdKey && e.key === 'c' && activeObject) {
                activeObject.clone().then((cloned: fabric.Object) => setClipboard(cloned));
            }

            if (cmdKey && e.key === 'v' && clipboard) {
                clipboard.clone().then((cloned: fabric.Object) => {
                    canvas.discardActiveObject();
                    cloned.set({
                        left: (cloned.left || 0) + 20,
                        top: (cloned.top || 0) + 20,
                        evented: true,
                    });

                    if (cloned.type === 'activeSelection') {
                        cloned.canvas = canvas;
                        (cloned as fabric.ActiveSelection).forEachObject((obj: any) => canvas.add(obj));
                        cloned.setCoords();
                    } else {
                        canvas.add(cloned);
                    }

                    setClipboard(cloned);
                    canvas.setActiveObject(cloned);
                    canvas.requestRenderAll();
                });
            }

            if (cmdKey && e.key === 'x' && activeObject) {
                activeObject.clone().then((cloned: fabric.Object) => {
                    setClipboard(cloned);
                    canvas.remove(activeObject);
                    canvas.requestRenderAll();
                });
            }

            if (cmdKey && e.key === 'z') {
                e.preventDefault();
                e.shiftKey ? handleRedo() : handleUndo();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [canvas, clipboard, historyIndex, history]);

    const handleOpenExport = () => {
        if (!canvas || !productConfig.editableArea) return;

        // Generate a preview showing the full mockup with editable area overlay
        // Save current state
        const overlay = canvas.getObjects().find((obj: any) => obj.name === 'editableAreaOverlay');
        const wasVisible = overlay ? overlay.visible : true;

        if (overlay) overlay.visible = false;
        canvas.renderAll();

        // Create full canvas preview with background
        const fullPreview = canvas.toDataURL({
            format: 'png',
            multiplier: 0.25, // Low res for preview
        });

        // Restore overlay visibility
        if (overlay) overlay.visible = wasVisible;
        canvas.requestRenderAll();

        setExportPreviewImage(fullPreview);
        setShowExportDrawer(true);
    };

    const handleExport = (settings: ExportSettings) => {
        if (!canvas || !productConfig.editableArea) return;

        const { format, width, dpi, transparentBackground } = settings;

        // Calculate resolution multiplier based on desired width vs editable area width
        const editableWidth = productConfig.editableArea.width;
        const resolution = width / editableWidth;

        // Filename construction
        const timestamp = new Date().toISOString().slice(0, 10);
        const filename = `${productConfig.name}-design-${timestamp}.${format.toLowerCase()}`;

        // Use "with background" versions for exports (per user request)
        // transparentBackground option controls whether to include mockup background
        const useBackground = !transparentBackground;

        switch (format) {
            case 'PNG':
                if (useBackground) {
                    exportEditableAreaWithBackgroundAsPNG(canvas, productConfig.editableArea, filename, resolution);
                } else {
                    exportEditableAreaAsPNG(canvas, productConfig.editableArea, filename, resolution);
                }
                break;
            case 'JPG':
                // JPG export uses PNG function (browser handles blob type)
                if (useBackground) {
                    exportEditableAreaWithBackgroundAsPNG(canvas, productConfig.editableArea, filename, resolution);
                } else {
                    exportEditableAreaAsPNG(canvas, productConfig.editableArea, filename, resolution);
                }
                break;
            case 'PDF':
                if (useBackground) {
                    exportEditableAreaWithBackgroundAsPDF(canvas, productConfig.editableArea, filename, resolution);
                } else {
                    exportEditableAreaAsPDF(canvas, productConfig.editableArea, filename, resolution);
                }
                break;
            case 'SVG':
                if (useBackground) {
                    exportEditableAreaWithBackgroundAsSVG(canvas, productConfig.editableArea, filename);
                } else {
                    exportEditableAreaAsSVG(canvas, productConfig.editableArea, filename);
                }
                break;
        }

        setShowExportDrawer(false);
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
        e.target.value = '';
    };

    const handleLoadTemplate = async (jsonUrl: string) => {
        if (!canvas) return;
        setIsLoading(true);
        try {
            const response = await fetch(jsonUrl);
            const json = await response.json();
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

    const handleAIDesignGenerate = async (prompt: string) => {
        if (!canvas) return;

        try {
            const response = await fetch('/api/proxy-image', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    prompt,
                })
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                const errorMessage = errorData.error || `Request failed with status ${response.status}`;
                console.error('AI Design Generation failed:', errorMessage);
                alert(`AI Generation Failed: ${errorMessage}`);
                throw new Error(errorMessage);
            }

            const data = await response.json();

            if (!data.image) {
                throw new Error('No image generated');
            }

            // Construct design data for the image
            // We need to match AIDesignData interface locally or import it
            // Since we didn't import strict types, we construct an object that matches what applyAIDesignToCanvas expects
            const designData = {
                type: 'image' as const,
                imageUrl: data.image,
                position: { left: 100, top: 100 }
            };

            // Apply AI-generated design to canvas
            await applyAIDesignToCanvas(canvas, designData, productConfig.editableArea);

            // Keep overlay on top
            const overlay = canvas.getObjects().find((obj: any) => obj.name === 'editableAreaOverlay');
            if (overlay) {
                (canvas as any).bringObjectToFront(overlay);
            }

            canvas.renderAll();
        } catch (error) {
            console.error('AI Design error:', error);
            throw error;
        }
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
                    onOpenExport={handleOpenExport}
                    onUndo={handleUndo}
                    onRedo={handleRedo}
                    canUndo={historyIndex > 0}
                    canRedo={historyIndex < history.length - 1}
                    onOpenAIDesign={() => setShowAIDesign(true)}
                />
            </div>

            <main className={styles.mainContent}>
                <div className={styles.canvasArea}>
                    {isLoading && (
                        <div className={styles.loadingOverlay}>
                            <div className={styles.loadingSpinner} />
                        </div>
                    )}
                    <div className={styles.canvasCenterer}>
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

                    <div className={styles.canvasControls}>
                        <div className={styles.zoomControls}>
                            {/* Controls */}
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

            <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleFileSelect}
                style={{ display: 'none' }}
            />

            <ExportDrawer
                isOpen={showExportDrawer}
                onClose={() => setShowExportDrawer(false)}
                previewImage={exportPreviewImage}
                initialDimensions={{
                    width: productConfig.editableArea.width,
                    height: productConfig.editableArea.height
                }}
                onExport={handleExport}
                onSecondaryAction={onSecondaryAction}
                secondaryButtonText={secondaryButtonText}
            />

            <AIDesignModal
                isOpen={showAIDesign}
                onClose={() => setShowAIDesign(false)}
                onGenerate={handleAIDesignGenerate}
            />
        </div>
    );
}
