import React, { useState } from 'react';
import { ChevronDown, Search, Plus } from 'lucide-react';

export interface TokenInfo {
    symbol: string;
    name: string;
    mint: string;
    logo: string;
    decimals: number;
}

export const SUPPORTED_TOKENS: TokenInfo[] = [
    {
        symbol: 'USDC',
        name: 'USD Coin',
        mint: '4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU',
        logo: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v/logo.png',
        decimals: 6,
    },
    {
        symbol: 'VLT-A',
        name: 'Vault Demo Token A',
        mint: '5jNJyJSuu21DABhr8WBbSFBDM3oqhNWpWzhzsHY7C7xL',
        logo: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/So11111111111111111111111111111111111111112/logo.png',
        decimals: 9,
    },
    {
        symbol: 'VLT-B',
        name: 'Vault Demo Token B',
        mint: 'FiDV5w1rHdQX1eJr843hcrwnsa19LMFhUAD4rcThaMge',
        logo: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/Es9vMFrzaCERiE2bILcJ145qH1UyWb8jGl5qg1nzHef4/logo.png',
        decimals: 9,
    },
];

interface TokenSelectorProps {
    label: string;
    value: string;
    onChange: (mint: string) => void;
    customDecimals?: number;
    onCustomDecimalsChange?: (decimals: number) => void;
}

export default function TokenSelector({ label, value, onChange, customDecimals = 9, onCustomDecimalsChange }: TokenSelectorProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [isCustom, setIsCustom] = useState(false);
    const [customMint, setCustomMint] = useState('');
    
    const selectedToken = SUPPORTED_TOKENS.find(t => t.mint === value);

    const handleCustomSubmit = () => {
        if (customMint.length >= 32) {
            onChange(customMint);
            setIsOpen(false);
        }
    };

    return (
        <div className="relative">
            <label className="block text-[10px] text-on-surface-variant uppercase font-semibold mb-2 ml-1">{label}</label>
            
            <div className="flex flex-col gap-2">
                <button
                    type="button"
                    onClick={() => setIsOpen(!isOpen)}
                    className="w-full bg-surface-container-lowest border border-outline-variant/20 rounded-lg p-3 text-on-surface hover:border-primary/40 transition-all flex items-center justify-between group"
                >
                    <div className="flex items-center gap-3">
                        {selectedToken ? (
                            <>
                                <img src={selectedToken.logo} alt={selectedToken.symbol} className="w-6 h-6 rounded-full shadow-sm" />
                                <div className="text-left">
                                    <p className="text-sm font-bold leading-tight">{selectedToken.symbol}</p>
                                    <p className="text-[10px] text-on-surface-variant font-mono">{selectedToken.mint.slice(0, 4)}...{selectedToken.mint.slice(-4)}</p>
                                </div>
                            </>
                        ) : isCustom && value ? (
                            <>
                                <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center">
                                    <span className="material-symbols-outlined text-[14px] text-primary">token</span>
                                </div>
                                <div className="text-left">
                                    <p className="text-sm font-bold leading-tight">Custom Token</p>
                                    <p className="text-[10px] text-on-surface-variant font-mono">{value.slice(0, 8)}...</p>
                                </div>
                            </>
                        ) : (
                            <div className="flex items-center gap-3 text-on-surface-variant">
                                <span className="material-symbols-outlined text-sm">search</span>
                                <span className="text-sm">Select Token...</span>
                            </div>
                        )}
                    </div>
                    <ChevronDown className={`w-4 h-4 text-on-surface-variant group-hover:text-primary transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                </button>

                {isCustom && (
                    <div className="flex gap-2 animate-in fade-in slide-in-from-top-1 duration-200">
                         <input 
                            value={customMint}
                            onChange={(e) => setCustomMint(e.target.value)}
                            onBlur={handleCustomSubmit}
                            placeholder="Paste Mint Address..."
                            className="flex-grow bg-surface-container-lowest border border-primary/30 rounded-lg p-2 text-[10px] font-mono text-primary placeholder:text-primary/40 focus:ring-1 focus:ring-primary/40 outline-none"
                        />
                        {onCustomDecimalsChange && (
                            <input 
                                type="number"
                                value={customDecimals}
                                onChange={(e) => onCustomDecimalsChange(parseInt(e.target.value) || 0)}
                                className="w-12 bg-surface-container-lowest border border-primary/30 rounded-lg p-2 text-[10px] text-center text-primary"
                                title="Decimals"
                            />
                        )}
                    </div>
                )}
            </div>

            {isOpen && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-surface-container-high border border-outline-variant/30 rounded-xl shadow-2xl z-[100] overflow-hidden backdrop-blur-xl animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="p-2 space-y-1 max-h-60 overflow-y-auto">
                        {SUPPORTED_TOKENS.map((token) => (
                            <button
                                key={token.mint}
                                type="button"
                                onClick={() => {
                                    onChange(token.mint);
                                    setIsCustom(false);
                                    setIsOpen(false);
                                }}
                                className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors hover:bg-surface-container-highest ${
                                    value === token.mint ? 'bg-primary/10 text-primary border border-primary/20' : 'text-on-surface'
                                }`}
                            >
                                <img src={token.logo} alt={token.symbol} className="w-8 h-8 rounded-full shadow-lg" />
                                <div className="text-left flex-grow">
                                    <p className="text-sm font-bold">{token.symbol}</p>
                                    <p className="text-[10px] text-on-surface-variant">{token.name}</p>
                                </div>
                            </button>
                        ))}
                        
                        <button
                            type="button"
                            onClick={() => {
                                setIsCustom(true);
                                setIsOpen(false);
                            }}
                            className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors hover:bg-surface-container-highest ${
                                isCustom ? 'bg-primary/10 text-primary border border-primary/20' : 'text-on-surface'
                            }`}
                        >
                            <div className="w-8 h-8 rounded-full bg-surface-container-highest flex items-center justify-center text-on-surface-variant border border-dashed border-outline-variant/40">
                                <Plus className="w-5 h-5" />
                            </div>
                            <div className="text-left flex-grow">
                                <p className="text-sm font-bold">Use Custom Mint</p>
                                <p className="text-[10px] text-on-surface-variant">Paste any SPL token address</p>
                            </div>
                        </button>
                    </div>
                    
                    <div className="bg-surface-container-lowest p-2 border-t border-outline-variant/10">
                        <p className="text-[9px] text-center text-on-surface-variant font-medium">
                            Select a preset or enter a custom address.
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
}
