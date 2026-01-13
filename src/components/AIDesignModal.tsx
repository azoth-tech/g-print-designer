'use client';

import React, { useState } from 'react';
import { FaTimes, FaMagic, FaSpinner } from 'react-icons/fa';
import styles from './AIDesignModal.module.css';

interface AIDesignModalProps {
    isOpen: boolean;
    onClose: () => void;
    onGenerate: (prompt: string) => Promise<void>;
}


export default function AIDesignModal({ isOpen, onClose, onGenerate }: AIDesignModalProps) {
    const [prompt, setPrompt] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleGenerate = async () => {
        if (!prompt.trim()) {
            setError('Please enter a prompt');
            return;
        }

        if (prompt.length > 500) {
            setError('Prompt is too long (max 500 characters)');
            return;
        }

        setError(null);
        setIsLoading(true);

        try {
            await onGenerate(prompt);
            // Reset form on success
            setPrompt('');
            setError(null);
            onClose();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to generate design');
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
            handleGenerate();
        }
    };

    if (!isOpen) return null;

    return (
        <>
            {/* Overlay */}
            <div
                className={styles.overlay}
                onClick={onClose}
            />

            {/* Modal */}
            <div className={styles.modal}>
                {/* Header */}
                <div className={styles.header}>
                    <div className={styles.titleSection}>
                        <FaMagic className={styles.titleIcon} />
                        <div>
                            <h2 className={styles.title}>AI Image Generator</h2>
                            <p className={styles.subtitle}>Describe the image you want to create</p>
                        </div>
                    </div>
                    <button className={styles.closeButton} onClick={onClose} disabled={isLoading}>
                        <FaTimes />
                    </button>
                </div>

                {/* Content */}
                <div className={styles.content}>
                    {/* Prompt Input */}
                    <div className={styles.section}>
                        <label className={styles.label}>
                            Image Description
                        </label>
                        <textarea
                            className={styles.textarea}
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="E.g., 'A futuristic city above the clouds', 'A watercolor painting of a cat', 'A modern company logo'"
                            rows={4}
                            maxLength={500}
                            disabled={isLoading}
                        />
                        <div className={styles.charCount}>
                            {prompt.length} / 500 characters
                        </div>
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className={styles.error}>
                            {error}
                        </div>
                    )}

                    {/* Tips */}
                    <div className={styles.tips}>
                        <strong>Tips:</strong> Be specific about the subject, style, and mood.
                        Press <kbd>Cmd/Ctrl + Enter</kbd> to generate.
                    </div>
                </div>

                {/* Footer */}
                <div className={styles.footer}>
                    <button
                        className={styles.cancelButton}
                        onClick={onClose}
                        disabled={isLoading}
                    >
                        Cancel
                    </button>
                    <button
                        className={styles.generateButton}
                        onClick={handleGenerate}
                        disabled={isLoading || !prompt.trim()}
                    >
                        {isLoading ? (
                            <>
                                <FaSpinner className={styles.spinner} />
                                Generating...
                            </>
                        ) : (
                            <>
                                <FaMagic />
                                Generate Image
                            </>
                        )}
                    </button>
                </div>
            </div>
        </>
    );
}
