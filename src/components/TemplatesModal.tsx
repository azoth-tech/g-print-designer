'use client';

import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { FaTimes, FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import styles from './TemplatesModal.module.css';
import TemplateThumbnail from './TemplateThumbnail';

interface Template {
    name: string;
    url: string;
    category?: string;
}

interface TemplatesModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (url: string) => void;
    initialCategory?: string;
}

const ITEMS_PER_PAGE = 6;

// Static template list - no API needed for Cloudflare Pages
const STATIC_TEMPLATES: Template[] = [
    { name: 'demo_template', url: '/templates/tshirt/demo_template.json', category: 'tshirt' },
];

export default function TemplatesModal({ isOpen, onClose, onSelect, initialCategory = 'all' }: TemplatesModalProps) {
    const [templates, setTemplates] = useState<Template[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);

    useEffect(() => {
        if (isOpen) {
            fetchTemplates();
        }
    }, [isOpen]);

    const fetchTemplates = async () => {
        setIsLoading(true);
        try {
            // Filter templates by category if specified
            const filtered = initialCategory === 'all'
                ? STATIC_TEMPLATES
                : STATIC_TEMPLATES.filter(t => t.category === initialCategory);
            setTemplates(filtered);
        } catch (error) {
            console.error('Failed to load templates:', error);
        } finally {
            setIsLoading(false);
        }
    };

    // Pagination Logic
    const totalPages = Math.ceil(templates.length / ITEMS_PER_PAGE);
    const paginatedTemplates = templates.slice(
        (currentPage - 1) * ITEMS_PER_PAGE,
        currentPage * ITEMS_PER_PAGE
    );

    const handleNextPage = () => {
        if (currentPage < totalPages) setCurrentPage(prev => prev + 1);
    };

    const handlePrevPage = () => {
        if (currentPage > 1) setCurrentPage(prev => prev - 1);
    };

    if (!isOpen) return null;
    if (typeof window === 'undefined') return null;

    return ReactDOM.createPortal(
        <div className={styles.overlay} onClick={onClose}>
            <div className={styles.modalContainer} onClick={e => e.stopPropagation()}>

                {/* Header */}
                <div className={styles.header}>
                    <div>
                        <h2 className={styles.title}>All Templates</h2>
                        <p className={styles.subtitle}>Select a template to start designing</p>
                    </div>
                    <button className={styles.closeButton} onClick={onClose}>
                        <FaTimes size={20} />
                    </button>
                </div>

                <div className={styles.content}>
                    {/* Main Grid Area (Full Width) */}
                    <div className={styles.mainArea} style={{ display: 'flex', flexDirection: 'column' }}>

                        {isLoading ? (
                            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                                Loading templates...
                            </div>
                        ) : (
                            <>
                                <div className={styles.grid} style={{ flex: 1 }}>
                                    {paginatedTemplates.map((template) => (
                                        <div key={template.url}>
                                            <div className={styles.card} onClick={() => onSelect(template.url)}>
                                                <div style={{ width: '100%', height: '100%', pointerEvents: 'none' }}>
                                                    <TemplateThumbnail
                                                        jsonUrl={template.url}
                                                        width={200}
                                                        height={250}
                                                    />
                                                </div>
                                                <div className={styles.cardOverlay}>
                                                    <button className={styles.useBtn}>Use Template</button>
                                                </div>
                                            </div>
                                            <div className={styles.cardInfo}>
                                                <h4 className={styles.cardTitle}>{template.name.replace('.json', '')}</h4>
                                            </div>
                                        </div>
                                    ))}

                                    {templates.length === 0 && (
                                        <div style={{ gridColumn: '1/-1', textAlign: 'center', color: 'var(--text-muted)' }}>
                                            No templates found.
                                        </div>
                                    )}
                                </div>

                                {/* Pagination Controls */}
                                <div className={styles.pagination} style={{
                                    display: 'flex',
                                    justifyContent: 'center',
                                    gap: '1rem',
                                    padding: '1rem',
                                    borderTop: '1px solid var(--border-color)',
                                    marginTop: 'auto'
                                }}>
                                    <button
                                        className={styles.paginationBtn}
                                        onClick={handlePrevPage}
                                        disabled={currentPage === 1}
                                        style={{
                                            padding: '0.5rem 1rem',
                                            borderRadius: 'var(--radius-md)',
                                            background: 'var(--bg-tertiary)',
                                            color: currentPage === 1 ? 'var(--text-muted)' : 'var(--text-primary)',
                                            cursor: currentPage === 1 ? 'not-allowed' : 'pointer'
                                        }}
                                    >
                                        <FaChevronLeft /> Prev
                                    </button>
                                    <span style={{ display: 'flex', alignItems: 'center' }}>
                                        Page {currentPage} of {totalPages || 1}
                                    </span>
                                    <button
                                        className={styles.paginationBtn}
                                        onClick={handleNextPage}
                                        disabled={currentPage === totalPages || totalPages === 0}
                                        style={{
                                            padding: '0.5rem 1rem',
                                            borderRadius: 'var(--radius-md)',
                                            background: 'var(--bg-tertiary)',
                                            color: (currentPage === totalPages || totalPages === 0) ? 'var(--text-muted)' : 'var(--text-primary)',
                                            cursor: (currentPage === totalPages || totalPages === 0) ? 'not-allowed' : 'pointer'
                                        }}
                                    >
                                        Next <FaChevronRight />
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
}
