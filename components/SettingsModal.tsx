import React from 'react';
import { CogIcon, XIcon, AlertTriangleIcon, SaveIcon } from './Icons';

interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    tempApiKey: string;
    setTempApiKey: (key: string) => void;
    apiKeyStatus: 'saved' | 'error' | 'idle';
    handleSaveApiKey: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
    isOpen,
    onClose,
    tempApiKey,
    setTempApiKey,
    apiKeyStatus,
    handleSaveApiKey
}) => {
    if (!isOpen) return null;

    return (
        <div role="dialog" aria-modal="true" aria-labelledby="settings-modal-title">
            <div className="image-modal-backdrop" onClick={onClose}></div>
            <div className="image-modal-content">
                <div className="neo-card p-6 w-full max-w-lg space-y-4 m-4">
                    <div className="flex justify-between items-center">
                        <h2 id="settings-modal-title" className="text-2xl font-bold flex items-center gap-2"><CogIcon /> API Key Settings</h2>
                        <button onClick={onClose} className="neo-button neo-icon-button neo-button-secondary"><XIcon /></button>
                    </div>

                    <div className="bg-[var(--nb-secondary)] text-[var(--nb-border)] dark:text-[var(--nb-bg)] border-2 border-[var(--nb-border)] rounded-lg p-4 flex gap-3">
                        <AlertTriangleIcon className="w-12 h-12 flex-shrink-0" />
                        <div>
                            <h3 className="font-bold">Security Warning</h3>
                            <p className="text-sm">Saving your API key here stores it in your browser's local storage. This is for convenience during development. For a deployed application, it is strongly recommended to use a server-side proxy to protect your key.</p>
                        </div>
                    </div>

                    <div>
                        <label htmlFor="api-key-input" className="font-semibold mb-2 block">Your Gemini API Key</label>
                        <input id="api-key-input" type="password" value={tempApiKey} onChange={(e) => setTempApiKey(e.target.value)} className="neo-input" placeholder="Enter your API key here" />
                    </div>

                    <div className="flex justify-end items-center gap-3 pt-2">
                        {apiKeyStatus === 'saved' && <p className="text-sm text-[var(--nb-primary)] font-semibold">✓ Saved! Reloading...</p>}
                        {apiKeyStatus === 'error' && <p className="text-sm text-[var(--nb-secondary)] font-semibold">Key cannot be empty.</p>}
                        <button onClick={handleSaveApiKey} className="neo-button neo-button-primary"><SaveIcon /> Save Key</button>
                    </div>
                </div>
            </div>
        </div>
    );
};
