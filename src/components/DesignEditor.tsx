'use client';

import React, { useEffect, useRef, useState } from 'react';
import * as fabric from 'fabric';
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
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (!canvasRef.current) return;

        // Initialize Fabric canvas
        const fabricCanvas = new fabric.Canvas(canvasRef.current, {
            width: 800,
            height: 1000,
            backgroundColor: '#ffffff',
        });

        // Add boundary constraints
        fabricCanvas.on('object:moving', (e) => {
            const obj = e.target;
            if (!obj || (obj as any).name === 'editableAreaOverlay') return;

            const { editableArea } = productConfig;
            const objWidth = (obj.width || 0) * (obj.scaleX || 1);
            const objHeight = (obj.height || 0) * (obj.scaleY || 1);

            // Constrain to editable area
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
                    {},
                    { crossOrigin: 'anonymous' }
                );

                // Scale image to fit canvas
                const scale = Math.min(
                    fabricCanvas.width! / (img.width || 1),
                    fabricCanvas.height! / (img.height || 1)
                );

                img.scale(scale);
                img.set({
                    left: 0,
                    top: 0,
                    selectable: false,
                    evented: false,
                });

                fabricCanvas.backgroundImage = img;
                fabricCanvas.renderAll();

                // Add editable area overlay
                const overlay = createEditableAreaOverlay(
                    fabricCanvas,
                    productConfig.editableArea
                );
                fabricCanvas.add(overlay);
                fabricCanvas.sendObjectToBack(overlay);

                setIsLoading(false);
            } catch (error) {
                console.error('Failed to load mockup image:', error);
                setIsLoading(false);
            }
        };

        loadBackground();
        setCanvas(fabricCanvas);

        // Cleanup
        return () => {
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

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h1 className={styles.title}>Design Editor</h1>
                <p className={styles.subtitle}>
                    Editing Product {productConfig.name}
                </p>
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
                    <div className={styles.canvasWrapper}>
                        <canvas ref={canvasRef} className={styles.canvas} />
                    </div>
                </div>

                <LayerPanel canvas={canvas} />
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
