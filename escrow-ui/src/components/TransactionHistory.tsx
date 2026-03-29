import React, { useEffect, useState } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { Loader2, ExternalLink, History } from 'lucide-react';
import { PROGRAM_ID } from '../anchor/setup';

interface HistoryItem {
    signature: string;
    slot: number;
    time: number | null;
    status: 'success' | 'err';
    memo?: string;
}

export default function TransactionHistory() {
    const { connection } = useConnection();
    const wallet = useWallet();
    
    const [history, setHistory] = useState<HistoryItem[]>([]);
    const [loading, setLoading] = useState(false);

    const fetchHistory = async () => {
        if (!wallet.publicKey) return;
        
        try {
            setLoading(true);
            const signatures = await connection.getSignaturesForAddress(wallet.publicKey, { limit: 20 });
            
            const items: HistoryItem[] = signatures.map(sig => ({
                signature: sig.signature,
                slot: sig.slot,
                time: sig.blockTime ?? null,
                status: sig.err ? 'err' : 'success'
            }));
            
            setHistory(items);
        } catch (err) {
            console.error('Failed to fetch history', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchHistory();
        // Refresh every 30 seconds
        const interval = setInterval(fetchHistory, 30000);
        return () => clearInterval(interval);
    }, [wallet.publicKey]);

    if (!wallet.publicKey) return null;

    return (
        <div className="bg-surface-container-low rounded-2xl overflow-hidden shadow-2xl border border-outline-variant/5">
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-surface-container-lowest border-b border-outline-variant/10">
                            <th className="px-8 py-5 text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Transaction Hash</th>
                            <th className="px-8 py-5 text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Date / Time</th>
                            <th className="px-8 py-5 text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Slot</th>
                            <th className="px-8 py-5 text-[10px] font-bold text-on-surface-variant uppercase tracking-widest text-center">Status</th>
                            <th className="px-8 py-5 text-[10px] font-bold text-on-surface-variant uppercase tracking-widest text-right">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-outline-variant/5">
                        {loading && history.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="px-8 py-12 text-center">
                                    <Loader2 className="animate-spin text-primary w-8 h-8 mx-auto" />
                                </td>
                            </tr>
                        ) : history.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="px-8 py-12 text-center text-on-surface-variant">
                                    <History className="w-12 h-12 mx-auto mb-4 opacity-20" />
                                    No transactions found yet.
                                </td>
                            </tr>
                        ) : (
                            history.map((item) => (
                                <tr key={item.signature} className="hover:bg-surface-container-highest/30 transition-colors group">
                                    <td className="px-8 py-4">
                                        <div className="flex items-center gap-2">
                                            <div className="w-8 h-8 rounded-lg bg-primary/5 flex items-center justify-center">
                                                <span className="material-symbols-outlined text-sm text-primary">receipt_long</span>
                                            </div>
                                            <span className="text-xs font-mono text-on-surface group-hover:text-primary transition-colors cursor-pointer">
                                                {item.signature.slice(0, 12)}...{item.signature.slice(-8)}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-8 py-4">
                                        <div className="text-xs text-on-surface">
                                            {item.time ? new Date(item.time * 1000).toLocaleString() : 'Pending...'}
                                        </div>
                                    </td>
                                    <td className="px-8 py-4">
                                        <div className="text-xs font-mono text-on-surface-variant">
                                            #{item.slot.toLocaleString()}
                                        </div>
                                    </td>
                                    <td className="px-8 py-4">
                                        <div className="flex justify-center">
                                            {item.status === 'success' ? (
                                                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-[0_0_12px_rgba(16,185,129,0.1)]">
                                                    <span className="material-symbols-outlined text-sm">check_circle</span>
                                                    SUCCESS
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold bg-error/10 text-error border border-error/20 shadow-[0_0_12px_rgba(239,68,68,0.1)]">
                                                    <span className="material-symbols-outlined text-sm">cancel</span>
                                                    FAILED
                                                </div>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-8 py-4 text-right">
                                        <a 
                                            href={`https://explorer.solana.com/tx/${item.signature}?cluster=devnet`} 
                                            target="_blank" 
                                            rel="noreferrer"
                                            className="inline-flex items-center gap-1 text-xs font-bold text-primary hover:underline hover:opacity-80"
                                        >
                                            View
                                            <ExternalLink className="w-3 h-3" />
                                        </a>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
            
            <div className="bg-surface-container-lowest p-4 border-t border-outline-variant/10 flex justify-between items-center">
                <p className="text-[10px] text-on-surface-variant font-medium">
                    Showing last 20 transactions from Solana Devnet.
                </p>
                <div className="flex items-center gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                    <span className="text-[10px] text-on-surface-variant">Live Syncing</span>
                </div>
            </div>
        </div>
    );
}
