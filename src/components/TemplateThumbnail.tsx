'use client';

import React, { useEffect, useRef, useState } from 'react';
import * as fabric from 'fabric';
import styles from './TemplateThumbnail.module.css';

interface TemplateThumbnailProps {
    jsonUrl: string;
    width?: number;
    height?: number;
    onClick?: () => void;
}

export default function TemplateThumbnail({
    jsonUrl,
    width = 150,
    height = 150,
    onClick
}: TemplateThumbnailProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [hasError, setHasError] = useState(false);

    useEffect(() => {
        if (!canvasRef.current) return;

        let fabricCanvas: fabric.StaticCanvas | null = null;
        let isMounted = true;

        const loadTemplate = async () => {
            try {
                // Fetch the JSON
                const response = await fetch(jsonUrl);
                if (!response.ok) throw new Error('Failed to fetch template');
                const json = await response.json();

                if (!isMounted) return;

                // Initialize StaticCanvas
                fabricCanvas = new fabric.StaticCanvas(canvasRef.current as HTMLCanvasElement, {
                    width: width,
                    height: height,
                    backgroundColor: '#f3f4f6', // Light gray background
                    renderOnAddRemove: false,
                });

                if (json.objects && Array.isArray(json.objects)) {
                    // Filter out the overlay if present
                    const objectsToLoad = json.objects.filter((obj: any) => obj.name !== 'editableAreaOverlay');

                    const enlivenedObjects = await fabric.util.enlivenObjects(objectsToLoad);

                    if (fabricCanvas) {
                        enlivenedObjects.forEach((obj) => {
                            fabricCanvas?.add(obj as fabric.Object);
                        });

                        // Calculate bounds to zoom/pan to fit content
                        const objects = fabricCanvas.getObjects();
                        if (objects.length > 0) {
                            // Calculate bounding box of all objects
                            let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

                            objects.forEach(obj => {
                                const oBounds = obj.getBoundingRect();
                                minX = Math.min(minX, oBounds.left);
                                minY = Math.min(minY, oBounds.top);
                                maxX = Math.max(maxX, oBounds.left + oBounds.width);
                                maxY = Math.max(maxY, oBounds.top + oBounds.height);
                            });

                            const contentWidth = maxX - minX;
                            const contentHeight = maxY - minY;

                            // Add some padding
                            const padding = 20;
                            const scaleX = (width - padding) / contentWidth;
                            const scaleY = (height - padding) / contentHeight;
                            const scale = Math.min(scaleX, scaleY);

                            const centerX = minX + contentWidth / 2;
                            const centerY = minY + contentHeight / 2;

                            // Center and zoom
                            const zoomPoint = new fabric.Point(width / 2, height / 2);
                            fabricCanvas.zoomToPoint(zoomPoint, scale);

                            const vpt = fabricCanvas.viewportTransform;
                            if (vpt) {
                                vpt[4] = width / 2 - centerX * scale;
                                vpt[5] = height / 2 - centerY * scale;
                            }
                        }

                        fabricCanvas.renderAll();
                    }
                }

                setIsLoading(false);
            } catch (error) {
                console.error('Error loading thumbnail:', error);
                if (isMounted) setHasError(true);
                setIsLoading(false);
            }
        };

        loadTemplate();

        return () => {
            isMounted = false;
            if (fabricCanvas) {
                fabricCanvas.dispose();
            }
        };
    }, [jsonUrl, width, height]);

    return (
        <div
            className={styles.thumbnailContainer}
            onClick={onClick}
            style={{ width, height }}
        >
            <canvas ref={canvasRef} />
            {isLoading && (
                <div className={styles.loadingOverlay}>
                    <div className={styles.spinner} />
                </div>
            )}
            {hasError && (
                <div className={styles.errorOverlay}>!</div>
            )}
        </div>
    );
}
