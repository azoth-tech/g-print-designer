'use client';

import React, { useEffect, useRef, useState } from 'react';
import * as fabric from 'fabric';
import { FaLayerGroup, FaTimes } from 'react-icons/fa';
import Toolbar from './Toolbar';
import LayerPanel from './LayerPanel';
import styles from './DesignEditor.module.css';
import { ProductConfig } from '@/types/types';
import {
    exportCanvasToPNG,
    exportCanvasToJSON,
    importCanvasFromJSON,
    downloadJSON,
    createEditableAreaOverlay,
} from '@/utils/canvasUtils';

interface DesignEditorProps {
    productConfig: ProductConfig;
}

export default function DesignEditor({ productConfig }: DesignEditorProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [canvas, setCanvas] = useState<fabric.Canvas | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isLayerPanelOpen, setIsLayerPanelOpen] = useState(true);
    const [layoutScale, setLayoutScale] = useState(1);
    const fileInputRef = useRef<HTMLInputElement>(null);

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
            const headerHeight = 100; // Approx header + toolbar height
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

    const handleExportPNG = () => {
        if (!canvas) return;
        exportCanvasToPNG(canvas, `${productConfig.name}-design.png`);
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

    const toggleLayerPanel = () => {
        setIsLayerPanelOpen(!isLayerPanelOpen);
    };

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h1 className={styles.title}>Design Editor</h1>
                <p className={styles.subtitle}>
                    Editing Product {productConfig.name}
                </p>
                <button
                    className={styles.layerToggle}
                    onClick={() => setIsLayerPanelOpen(!isLayerPanelOpen)}
                    title={isLayerPanelOpen ? 'Hide Layers' : 'Show Layers'}
                >
                    <FaLayerGroup className={styles.toggleIcon} />
                    <span className={styles.toggleLabel}>{isLayerPanelOpen ? 'Hide Layers' : 'Layers'}</span>
                </button>
            </div>

            <Toolbar
                canvas={canvas}
                onExportPNG={handleExportPNG}
                onExportJSON={handleExportJSON}
                onImportJSON={handleImportJSON}
                editableArea={productConfig.editableArea}
            />

            <div className={styles.mainContent}>
                <div className={styles.canvasContainer}>
                    {isLoading && (
                        <div className={styles.loadingOverlay}>
                            <div className={styles.loadingSpinner} />
                        </div>
                    )}
                    {/* Responsive Canvas Wrapper */}
                    <div
                        className={styles.canvasWrapper}
                        style={{
                            width: (canvas?.width || 800) * layoutScale,
                            height: (canvas?.height || 800) * layoutScale,
                            overflow: 'hidden'
                        }}
                    >
                        <div style={{
                            transform: `scale(${layoutScale})`,
                            transformOrigin: 'top left',
                            width: canvas?.width || 800,
                            height: canvas?.height || 800
                        }}>
                            <canvas ref={canvasRef} className={styles.canvas} />
                            {isLoading && (
                                <div className={styles.loadingOverlay}>
                                    <div className={styles.loadingSpinner} />
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className={`${styles.layerPanelContainer} ${isLayerPanelOpen ? styles.open : styles.closed}`}>
                    <div className={styles.panelHeader}>
                        <span className={styles.panelTitle}>Layers</span>
                        <button
                            className={styles.closeLayerPanel}
                            onClick={() => setIsLayerPanelOpen(false)}
                            title="Close Panel"
                        >
                            <FaTimes />
                        </button>
                    </div>
                    <LayerPanel canvas={canvas} />
                </div>
            </div>

            {/* Hidden file input for JSON import */}
            <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleFileSelect}
                style={{ display: 'none' }}
            />
        </div>
    );
}
