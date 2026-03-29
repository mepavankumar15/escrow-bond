import React, { useState } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { AnchorProvider, BN } from '@coral-xyz/anchor';
import { PublicKey } from '@solana/web3.js';
import { getAssociatedTokenAddressSync, TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { getEscrowProgram, getEscrowStatePDA, getVaultAPDA, getVaultBPDA } from '../anchor/setup';
import { Loader2 } from 'lucide-react';

interface ExecuteCancelProps {
    initialMaker?: string;
    initialSeed?: string;
}

export default function ExecuteCancel({ initialMaker = '', initialSeed = '' }: ExecuteCancelProps) {
    const { connection } = useConnection();
    const wallet = useWallet();

    const [seed, setSeed] = useState(initialSeed);
    const [maker, setMaker] = useState(initialMaker);

    // Sync if props change
    React.useEffect(() => {
        if (initialMaker) setMaker(initialMaker);
        if (initialSeed) setSeed(initialSeed);
    }, [initialMaker, initialSeed]);
    
    const [loadingAction, setLoadingAction] = useState<'execute' | 'cancel' | null>(null);
    const [txHash, setTxHash] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const performAction = async (action: 'execute' | 'cancel') => {
        setError(null);
        setTxHash(null);

        if (!wallet.publicKey || !wallet.signTransaction) {
            setError('Please connect your wallet.');
            return;
        }

        try {
            setLoadingAction(action);
            const provider = new AnchorProvider(connection, wallet as any, { commitment: 'confirmed' });
            const program = getEscrowProgram(provider);

            const seedBN = new BN(seed);
            const makerPubkey = new PublicKey(maker);

            const [escrowStatePDA] = getEscrowStatePDA(makerPubkey, seedBN);

            let state: any;
            try {
                state = await (program.account as any).escrowState.fetch(escrowStatePDA);
            } catch {
                throw new Error("Escrow state not found. Check maker address and seed.");
            }

            const [vaultAPDA] = getVaultAPDA(escrowStatePDA);
            const [vaultBPDA] = getVaultBPDA(escrowStatePDA);

            const takerTokenAccountA = getAssociatedTokenAddressSync(state.mintA, state.taker);
            const makerTokenAccountA = getAssociatedTokenAddressSync(state.mintA, state.maker);
            const makerTokenAccountB = getAssociatedTokenAddressSync(state.mintB, state.maker);
            const takerTokenAccountB = getAssociatedTokenAddressSync(state.mintB, state.taker);

            let tx;

            if (action === 'execute') {
                tx = await program.methods.executeEscrow().accounts({
                    taker: wallet.publicKey,
                    maker: state.maker,
                    escrowState: escrowStatePDA,
                    mintA: state.mintA,
                    mintB: state.mintB,
                    vaultA: vaultAPDA,
                    vaultB: vaultBPDA,
                    takerTokenAccountA,
                    makerTokenAccountB,
                    tokenProgram: TOKEN_PROGRAM_ID,
                }).rpc();
            } else {
                tx = await program.methods.cancelEscrow().accounts({
                    signer: wallet.publicKey,
                    maker: state.maker,
                    escrowState: escrowStatePDA,
                    vaultA: vaultAPDA,
                    vaultB: vaultBPDA,
                    makerTokenAccountA,
                    takerTokenAccountB,
                    tokenProgram: TOKEN_PROGRAM_ID,
                }).rpc();
            }

            setTxHash(tx);
        } catch (err: any) {
            console.error(`Failed to ${action} escrow`, err);
            setError(err.message || 'Transaction failed');
        } finally {
            setLoadingAction(null);
        }
    };

    return (
        <div className="bg-surface-container-high rounded-2xl p-6 shadow-xl border border-white/5 hover:border-primary/30 transition-all flex flex-col">
            {/* Header */}
            <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-surface-container-highest rounded-lg text-primary">
                    <span className="material-symbols-outlined">gavel</span>
                </div>
                <h3 className="text-on-surface font-headline font-bold text-lg">Finalize Escrow</h3>
            </div>
            <p className="text-on-surface-variant text-xs mb-5">Execute to release funds, or cancel to refund.</p>

            {/* Inputs */}
            <div className="space-y-3 mb-5">
                <div>
                    <label className="block text-[10px] text-on-surface-variant uppercase font-semibold mb-1 ml-1">MAKER ADDRESS</label>
                    <input 
                        value={maker} 
                        onChange={(e) => setMaker(e.target.value)} 
                        className="w-full bg-surface-container-lowest border border-outline-variant/20 rounded-lg p-3 text-on-surface placeholder:text-outline focus:ring-1 focus:ring-primary/40 transition-all text-sm font-mono" 
                        placeholder="Base58 pubkey..." 
                    />
                </div>
                <div>
                    <label className="block text-[10px] text-on-surface-variant uppercase font-semibold mb-1 ml-1">ESCROW SEED</label>
                    <input 
                        value={seed} 
                        onChange={(e) => setSeed(e.target.value)} 
                        className="w-full bg-surface-container-lowest border border-outline-variant/20 rounded-lg p-3 text-on-surface placeholder:text-outline focus:ring-1 focus:ring-primary/40 transition-all text-sm font-mono" 
                        placeholder="e.g. 1" 
                        type="number" 
                    />
                </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 mt-auto">
                <button 
                    onClick={() => performAction('execute')}
                    disabled={!!loadingAction || !wallet.publicKey || !seed || !maker} 
                    className="flex-1 py-3 bg-gradient-to-br from-primary to-primary-container text-on-primary-fixed text-sm font-bold rounded-lg hover:shadow-[0_4px_14px_rgba(164,230,255,0.25)] transition-all flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.97]"
                >
                    {loadingAction === 'execute' ? <Loader2 className="animate-spin w-4 h-4" /> : <span className="material-symbols-outlined text-base">check_circle</span>}
                    Execute
                </button>
                <button 
                    onClick={() => performAction('cancel')}
                    disabled={!!loadingAction || !wallet.publicKey || !seed || !maker} 
                    className="flex-1 py-3 bg-surface-container-highest text-error text-sm font-bold rounded-lg hover:bg-error/10 border border-error/20 transition-all flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.97]"
                >
                    {loadingAction === 'cancel' ? <Loader2 className="animate-spin w-4 h-4" /> : <span className="material-symbols-outlined text-base">cancel</span>}
                    Cancel
                </button>
            </div>

            {/* Feedback */}
            {error && (
                <div className="mt-4 p-3 rounded-lg bg-error/10 border border-error/20 text-error text-xs font-medium flex items-start gap-2">
                    <span className="material-symbols-outlined text-sm mt-0.5">error</span>
                    <span>{error}</span>
                </div>
            )}
            {txHash && (
                <div className="mt-4 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium flex items-start gap-2">
                    <span className="material-symbols-outlined text-sm mt-0.5">check_circle</span>
                    <span>TX: <a href={`https://explorer.solana.com/tx/${txHash}?cluster=devnet`} target="_blank" rel="noreferrer" className="underline hover:text-emerald-300 break-all">{txHash.slice(0, 20)}...{txHash.slice(-8)}</a></span>
                </div>
            )}
        </div>
    );
}
