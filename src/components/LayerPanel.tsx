'use client';

import React, { useEffect, useState } from 'react';
import * as fabric from 'fabric';
import {
    FaFont,
    FaImage,
    FaEye,
    FaEyeSlash,
    FaTrash,
    FaLayerGroup,
    FaGripVertical,
    FaArrowUp,
    FaArrowDown,
} from 'react-icons/fa';
import styles from './LayerPanel.module.css';
import { Layer } from '@/types/types';

interface LayerPanelProps {
    canvas: fabric.Canvas | null;
}

export default function LayerPanel({ canvas }: LayerPanelProps) {
    const [layers, setLayers] = useState<Layer[]>([]);
    const [activeLayerId, setActiveLayerId] = useState<string | null>(null);

    const updateLayers = () => {
        if (!canvas) return;

        const objects = canvas.getObjects();
        const newLayers: Layer[] = objects
            .filter((obj: any) => obj.name !== 'editableAreaOverlay')
            .map((obj: any, index: number) => {
                const id = (obj as any).id || `layer-${index}`;
                (obj as any).id = id;

                return {
                    id,
                    name:
                        obj.type === 'i-text' || obj.type === 'textbox'
                            ? (obj as any).text || 'Text Layer'
                            : obj.type === 'image'
                                ? 'Image Layer'
                                : 'Layer',
                    type: obj.type === 'i-text' || obj.type === 'textbox' ? 'text' : 'image',
                    visible: obj.visible !== false,
                    fabricObject: obj,
                } as Layer;
            });

        setLayers(newLayers);
    };

    useEffect(() => {
        if (!canvas) return;

        const handleObjectAdded = () => updateLayers();
        const handleObjectRemoved = () => updateLayers();
        const handleObjectModified = () => updateLayers();
        const handleSelection = () => {
            const selected = canvas.getActiveObject();
            if (selected) {
                setActiveLayerId((selected as any).id || null);
            } else {
                setActiveLayerId(null);
            }
        };

        canvas.on('object:added', handleObjectAdded);
        canvas.on('object:removed', handleObjectRemoved);
        canvas.on('object:modified', handleObjectModified);
        canvas.on('selection:created', handleSelection);
        canvas.on('selection:updated', handleSelection);
        canvas.on('selection:cleared', () => setActiveLayerId(null));

        // Initial update
        updateLayers();

        return () => {
            canvas.off('object:added', handleObjectAdded);
            canvas.off('object:removed', handleObjectRemoved);
            canvas.off('object:modified', handleObjectModified);
            canvas.off('selection:created', handleSelection);
            canvas.off('selection:updated', handleSelection);
            canvas.off('selection:cleared');
        };
    }, [canvas]);

    const handleLayerClick = (layer: Layer) => {
        if (!canvas || !layer.fabricObject) return;
        canvas.setActiveObject(layer.fabricObject as any);
        canvas.renderAll();
        setActiveLayerId(layer.id);
    };

    const handleToggleVisibility = (layer: Layer, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!canvas || !layer.fabricObject) return;

        layer.fabricObject.set('visible', !layer.visible);
        canvas.renderAll();
        updateLayers();
    };

    const handleDeleteLayer = (layer: Layer, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!canvas || !layer.fabricObject) return;

        canvas.remove(layer.fabricObject as any);
        canvas.renderAll();
        updateLayers();
    };

    const handleMoveLayer = (layer: Layer, direction: 'up' | 'down') => {
        if (!canvas || !layer.fabricObject) return;

        const objects = canvas.getObjects().filter((obj: any) => obj.name !== 'editableAreaOverlay');
        const currentIndex = objects.indexOf(layer.fabricObject as any);

        if (direction === 'up' && currentIndex < objects.length - 1) {
            canvas.bringObjectForward(layer.fabricObject as any);
        } else if (direction === 'down' && currentIndex > 0) {
            canvas.sendObjectBackwards(layer.fabricObject as any);
        }

        canvas.renderAll();
        updateLayers();
    };

    return (
        <div className={styles.layerPanel}>
            <div className={styles.layerPanelHeader}>
                <FaLayerGroup />
                Layers ({layers.length})
            </div>

            <div className={styles.layerList}>
                {layers.length === 0 ? (
                    <div className={styles.emptyState}>
                        <FaLayerGroup className={styles.emptyStateIcon} />
                        <p className={styles.emptyStateText}>
                            No layers yet.
                            <br />
                            Add text or images to get started.
                        </p>
                    </div>
                ) : (
                    [...layers].reverse().map((layer) => (
                        <div
                            key={layer.id}
                            className={`${styles.layerItem} ${activeLayerId === layer.id ? styles.active : ''
                                }`}
                            onClick={() => handleLayerClick(layer)}
                        >
                            <div
                                className={styles.dragHandle}
                                title="Drag to reorder"
                                onMouseDown={(e) => e.stopPropagation()}
                            >
                                <FaGripVertical size={12} />
                            </div>

                            <div className={styles.layerIcon}>
                                {layer.type === 'text' ? <FaFont /> : <FaImage />}
                            </div>

                            <div className={styles.layerInfo}>
                                <div className={styles.layerName}>{layer.name}</div>
                                <div className={styles.layerType}>{layer.type}</div>
                            </div>

                            <div className={styles.layerActions}>
                                <button
                                    className={styles.layerActionBtn}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleMoveLayer(layer, 'up');
                                    }}
                                    title="Move Up"
                                >
                                    <FaArrowUp size={12} />
                                </button>
                                <button
                                    className={styles.layerActionBtn}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleMoveLayer(layer, 'down');
                                    }}
                                    title="Move Down"
                                >
                                    <FaArrowDown size={12} />
                                </button>
                                <button
                                    className={`${styles.layerActionBtn} ${!layer.visible ? styles.hidden : ''
                                        }`}
                                    onClick={(e) => handleToggleVisibility(layer, e)}
                                    title={layer.visible ? 'Hide layer' : 'Show layer'}
                                >
                                    {layer.visible ? <FaEye size={14} /> : <FaEyeSlash size={14} />}
                                </button>

                                <button
                                    className={`${styles.layerActionBtn} ${styles.danger}`}
                                    onClick={(e) => handleDeleteLayer(layer, e)}
                                    title="Delete layer"
                                >
                                    <FaTrash size={14} />
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
