import React from 'react';

interface GenerationCountSelectorProps {
    value: 1 | 2;
    onChange: (value: 1 | 2) => void;
    label: string;
}

export const GenerationCountSelector: React.FC<GenerationCountSelectorProps> = ({ value, onChange, label }) => {
    return (
        <div className="flex items-center justify-between">
            <span className="font-semibold">{label}</span>
            <div className="flex items-center gap-1 p-1 rounded-lg bg-[var(--nb-surface-alt)] border-2 border-[var(--nb-border)]">
                <button
                    onClick={() => onChange(1)}
                    aria-pressed={value === 1}
                    className={`px-4 py-1 rounded-md text-sm font-bold transition-colors ${value === 1 ? 'bg-[var(--nb-primary)] text-[var(--nb-border)] dark:text-[var(--nb-bg)]' : 'hover:bg-[var(--nb-accent)]'}`}
                >
                    1
                </button>
                <button
                    onClick={() => onChange(2)}
                    aria-pressed={value === 2}
                    className={`px-4 py-1 rounded-md text-sm font-bold transition-colors ${value === 2 ? 'bg-[var(--nb-primary)] text-[var(--nb-border)] dark:text-[var(--nb-bg)]' : 'hover:bg-[var(--nb-accent)]'}`}
                >
                    2
                </button>
            </div>
        </div>
    );
};
