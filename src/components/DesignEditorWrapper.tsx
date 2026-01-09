'use client';

import dynamic from 'next/dynamic';
import { ProductConfig } from '@/types/types';

const DesignEditor = dynamic(() => import('./DesignEditor'), {
    ssr: false,
    loading: () => (
        <div style={{
            height: '100vh',
            display: 'flex',
            flexDirection: 'column',
            background: 'linear-gradient(135deg, #0f172a 0%, #1a1f3a 100%)'
        }}>
            {/* Header Skeleton */}
            <div style={{ height: '80px', borderBottom: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)' }} />

            <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
                {/* Canvas Skeleton */}
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{
                        width: '400px',
                        height: '500px',
                        background: 'rgba(255,255,255,0.05)',
                        borderRadius: '8px',
                        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
                    }} />
                </div>

                {/* Sidebar Skeleton */}
                <div style={{ width: '300px', borderLeft: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.02)' }} />
            </div>
        </div>
    ),
});

interface DesignEditorWrapperProps {
    productConfig: ProductConfig;
    onSecondaryAction?: () => void;
    secondaryButtonText?: string;
}

export default function DesignEditorWrapper({ productConfig, onSecondaryAction, secondaryButtonText }: DesignEditorWrapperProps) {
    return <DesignEditor productConfig={productConfig} onSecondaryAction={onSecondaryAction} secondaryButtonText={secondaryButtonText} />;
}
