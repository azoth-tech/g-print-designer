import React from 'react';
import { FaPalette, FaSave, FaFileDownload, FaMoon, FaSun } from 'react-icons/fa';
import styles from './Header.module.css';

interface HeaderProps {
    productName: string;
    toggleTheme: () => void;
    isDarkMode: boolean;
}

export default function Header({ productName, toggleTheme, isDarkMode }: HeaderProps) {
    return (
        <header className={styles.header}>
            <div className={styles.leftSection}>
                <div className={styles.logoBox}>
                    <FaPalette className={styles.logoIcon} />
                </div>
                <div>
                    <h1 className={styles.appTitle}>PrintEditor</h1>
                    <div className={styles.productInfo}>
                        <span>Product:</span>
                        <span className={styles.productName}>{productName}</span>
                    </div>
                </div>
            </div>

            <div className={styles.rightSection}>
                <button className={styles.iconBtn} onClick={toggleTheme} title="Toggle Theme">
                    {isDarkMode ? <FaSun /> : <FaMoon />}
                </button>
            </div>
        </header>
    );
}
