import React, { useEffect, useState } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { AnchorProvider } from '@coral-xyz/anchor';
import { getEscrowProgram } from '../anchor/setup';
import { Loader2, RefreshCw, ExternalLink, ArrowRightLeft } from 'lucide-react';
import { SUPPORTED_TOKENS } from './TokenSelector';

interface EscrowItem {
    publicKey: string;
    account: {
        seed: any;
        maker: any;
        taker: any;
        mintA: any;
        mintB: any;
        expectedAmount: any;
        expiry: any;
        makerDeposited: boolean;
        takerDeposited: boolean;
    };
}

interface MyEscrowsListProps {
    onSelect: (maker: string, seed: string, mintB?: string) => void;
}

export default function MyEscrowsList({ onSelect }: MyEscrowsListProps) {
    const { connection } = useConnection();
    const wallet = useWallet();
    
    const [escrows, setEscrows] = useState<EscrowItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchEscrows = async () => {
        if (!wallet.publicKey) return;
        
        try {
            setLoading(true);
            setError(null);
            const provider = new AnchorProvider(connection, wallet as any, { commitment: 'confirmed' });
            const program = getEscrowProgram(provider);
            
            // Fetch all escrow accounts
            const allEscrows = await (program.account as any).escrowState.all();
            
            // Filter where current wallet is maker OR taker
            const myEscrows = allEscrows.filter((e: any) => 
                e.account.maker.equals(wallet.publicKey!) || 
                e.account.taker.equals(wallet.publicKey!)
            );
            
            setEscrows(myEscrows);
        } catch (err: any) {
            console.error('Failed to fetch escrows', err);
            setError('Could not sync with blockchain.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchEscrows();
    }, [wallet.publicKey]);

    if (!wallet.publicKey) {
        return (
            <div className="bg-surface-container-low rounded-2xl p-8 border border-outline-variant/10 text-center">
                <span className="material-symbols-outlined text-4xl text-on-surface-variant/40 mb-3">account_balance_wallet</span>
                <p className="text-on-surface-variant text-sm">Connect wallet to view your active vaults.</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between px-2">
                <h3 className="text-on-surface font-headline font-bold flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary text-sm">explore</span>
                    On-Chain State
                </h3>
                <button 
                    onClick={fetchEscrows} 
                    disabled={loading}
                    className="p-2 hover:bg-surface-container-high rounded-full transition-colors disabled:opacity-50"
                >
                    <RefreshCw className={`w-4 h-4 text-primary ${loading ? 'animate-spin' : ''}`} />
                </button>
            </div>

            {loading && escrows.length === 0 ? (
                <div className="flex justify-center py-12">
                    <Loader2 className="animate-spin text-primary w-8 h-8" />
                </div>
            ) : escrows.length === 0 ? (
                <div className="bg-surface-container-low rounded-2xl p-12 border border-dashed border-outline-variant/30 text-center">
                    <p className="text-on-surface-variant text-sm">No active escrows found for this wallet.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-3">
                    {escrows.map((escrow) => {
                        const isMaker = escrow.account.maker.equals(wallet.publicKey!);
                        const tokenB = SUPPORTED_TOKENS.find(t => t.mint === escrow.account.mintB.toBase58());
                        const isExpired = escrow.account.expiry.toNumber() < Math.floor(Date.now() / 1000);
                        
                        return (
                            <div key={escrow.publicKey} className={`bg-surface-container-low border rounded-xl p-4 transition-all group relative overflow-hidden ${
                                isExpired ? 'opacity-60 border-error/30' : 'hover:border-primary/40 border-outline-variant/10'
                            }`}>
                                {/* Role & Status Badges */}
                                <div className="absolute top-0 right-0 flex">
                                    {isExpired && (
                                        <div className="bg-error/20 text-error px-3 py-1 text-[10px] font-bold border-b border-l border-error/10">
                                            EXPIRED
                                        </div>
                                    )}
                                    <div className={`px-3 py-1 text-[10px] font-bold rounded-bl-lg ${isMaker ? 'bg-primary/20 text-primary' : 'bg-secondary-container text-on-secondary-container'}`}>
                                        {isMaker ? 'MAKER' : 'TAKER'}
                                    </div>
                                </div>

                                <div className="flex items-start justify-between mb-4">
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="text-xs font-mono text-on-surface-variant">SEED:</span>
                                            <span className="text-sm font-bold text-primary">{escrow.account.seed.toString()}</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-[10px] text-on-surface-variant font-mono">
                                            <span>{isMaker ? 'TO:' : 'FROM:'}</span>
                                            <span>{isMaker ? escrow.account.taker.toBase58().slice(0, 8) : escrow.account.maker.toBase58().slice(0, 8)}...</span>
                                        </div>
                                    </div>
                                    <div className="text-right mr-16">
                                        <p className="text-[10px] text-on-surface-variant uppercase font-bold">Expects</p>
                                        <p className="text-sm font-bold text-on-surface">
                                            {(escrow.account.expectedAmount.toNumber() / Math.pow(10, tokenB?.decimals || 9)).toFixed(2)} {tokenB?.symbol || '???'}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between pt-3 border-t border-outline-variant/5">
                                    <div className="flex gap-2">
                                        <div className={`h-2 w-2 rounded-full mt-1.5 ${escrow.account.makerDeposited ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]' : 'bg-outline-variant'}`} title="Maker Funded"></div>
                                        <div className={`h-2 w-2 rounded-full mt-1.5 ${escrow.account.takerDeposited ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]' : 'bg-outline-variant'}`} title="Taker Funded"></div>
                                        <span className="text-[10px] text-on-surface-variant font-medium">
                                            {escrow.account.takerDeposited ? 'Fully Funded' : 'Awaiting Deposit'}
                                        </span>
                                    </div>
                                    
                                    <button 
                                        onClick={() => onSelect(escrow.account.maker.toBase58(), escrow.account.seed.toString(), escrow.account.mintB.toBase58())}
                                        className="bg-primary/10 hover:bg-primary/20 text-primary text-[10px] font-bold px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1 group-hover:scale-105 active:scale-95"
                                    >
                                        Manage
                                        <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
