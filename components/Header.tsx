import React from 'react';
import { PaletteIcon, MoonIcon, SunIcon, WandIcon } from './Icons';

interface HeaderProps {
    theme: 'light' | 'dark';
    toggleTheme: () => void;
    onOpenGenerator: () => void;
}

export const Header: React.FC<HeaderProps> = ({ theme, toggleTheme, onOpenGenerator }) => {
    return (
        <header className="w-full mb-6">
            <div className="flex justify-between items-center">
                <div className="flex-1 flex justify-start items-center gap-2">
                    <button onClick={onOpenGenerator} className="neo-button neo-button-accent hidden sm:inline-flex">
                        <WandIcon />
                        <span className="ml-2">Create New</span>
                    </button>
                    <button onClick={onOpenGenerator} aria-label="Create New Image" className="neo-button neo-icon-button neo-button-accent sm:hidden">
                        <WandIcon />
                    </button>
                </div>

                <div className="flex-shrink-0 px-4">
                    <div className="flex flex-col items-center">
                        <div className="inline-flex items-center gap-3 justify-center mb-1">
                            <PaletteIcon />
                            <h1 className="text-3xl sm:text-4xl font-extrabold text-[var(--nb-text)] text-center">
                                Virtual Dressing Room
                            </h1>
                        </div>
                        <p className="text-[var(--nb-text)] opacity-80 text-sm sm:text-base">AI-powered virtual try-on studio</p>
                    </div>
                </div>
                
                <div className="flex-1 flex justify-end">
                    <button onClick={toggleTheme} aria-label="Toggle theme" className="neo-button neo-icon-button neo-button-secondary">
                        {theme === 'light' ? <MoonIcon /> : <SunIcon />}
                    </button>
                </div>
            </div>
        </header>
    );
};