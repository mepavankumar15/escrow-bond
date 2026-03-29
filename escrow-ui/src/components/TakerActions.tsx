import React, { useState } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { AnchorProvider, BN } from '@coral-xyz/anchor';
import { PublicKey } from '@solana/web3.js';
import { getAssociatedTokenAddressSync, TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { getEscrowProgram, getEscrowStatePDA, getVaultBPDA } from '../anchor/setup';
import { Loader2 } from 'lucide-react';
import TokenSelector, { SUPPORTED_TOKENS } from './TokenSelector';

interface TakerActionsProps {
    initialMaker?: string;
    initialSeed?: string;
    initialMintB?: string;
}

export default function TakerActions({ initialMaker = '', initialSeed = '', initialMintB = SUPPORTED_TOKENS[2].mint }: TakerActionsProps) {
    const { connection } = useConnection();
    const wallet = useWallet();

    const [seed, setSeed] = useState(initialSeed);
    const [maker, setMaker] = useState(initialMaker);
    const [mintB, setMintB] = useState(initialMintB);
    
    // Sync if props change
    React.useEffect(() => {
        if (initialMaker) setMaker(initialMaker);
        if (initialSeed) setSeed(initialSeed);
        if (initialMintB) setMintB(initialMintB);
    }, [initialMaker, initialSeed, initialMintB]);
    
    const [loading, setLoading] = useState(false);
    const [txHash, setTxHash] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const handleDeposit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setTxHash(null);

        if (!wallet.publicKey || !wallet.signTransaction) {
            setError('Please connect your wallet.');
            return;
        }

        try {
            setLoading(true);
            const provider = new AnchorProvider(connection, wallet as any, { commitment: 'confirmed' });
            const program = getEscrowProgram(provider);

            const seedBN = new BN(seed);
            const makerPubkey = new PublicKey(maker);
            const mintBPubkey = new PublicKey(mintB);

            const [escrowStatePDA] = getEscrowStatePDA(makerPubkey, seedBN);
            const [vaultBPDA] = getVaultBPDA(escrowStatePDA);

            const takerTokenAccountB = getAssociatedTokenAddressSync(mintBPubkey, wallet.publicKey);

            const tx = await program.methods.depositByTaker().accounts({
                taker: wallet.publicKey,
                escrowState: escrowStatePDA,
                mintB: mintBPubkey,
                takerTokenAccountB,
                vaultB: vaultBPDA,
                tokenProgram: TOKEN_PROGRAM_ID,
            }).rpc();

            setTxHash(tx);
        } catch (err: any) {
            console.error('Failed to deposit as taker', err);
            setError(err.message || 'Transaction failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-surface-container-high rounded-2xl p-6 shadow-xl border border-white/5 hover:border-primary/30 transition-all flex flex-col">
            <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-surface-container-highest rounded-lg text-primary">
                    <span className="material-symbols-outlined">input</span>
                </div>
                <h3 className="text-on-surface font-headline font-bold text-lg">Taker Deposit</h3>
            </div>
            <p className="text-on-surface-variant text-xs mb-5">Identify an escrow and fulfill the requested token deposit.</p>

            <form onSubmit={handleDeposit} className="space-y-4">
                <div>
                    <label className="block text-[10px] text-on-surface-variant uppercase font-semibold mb-1 ml-1">MAKER ADDRESS</label>
                    <input 
                        required 
                        value={maker} 
                        onChange={(e) => setMaker(e.target.value)} 
                        className="w-full bg-surface-container-lowest border border-outline-variant/20 rounded-lg p-3 text-on-surface placeholder:text-outline focus:ring-1 focus:ring-primary/40 transition-all text-sm font-mono" 
                        placeholder="Maker's Pubkey..." 
                    />
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="block text-[10px] text-on-surface-variant uppercase font-semibold mb-1 ml-1">ESCROW SEED</label>
                        <input 
                            required 
                            value={seed} 
                            onChange={(e) => setSeed(e.target.value)} 
                            className="w-full bg-surface-container-lowest border border-outline-variant/20 rounded-lg p-3 text-on-surface placeholder:text-outline focus:ring-1 focus:ring-primary/40 transition-all text-sm font-mono" 
                            placeholder="e.g. 1" 
                            type="number" 
                        />
                    </div>
                    <div className="relative">
                         <TokenSelector 
                            label="EXPECTED TOKEN" 
                            value={mintB} 
                            onChange={setMintB} 
                        />
                    </div>
                </div>

                <button 
                    disabled={loading || !wallet.publicKey} 
                    type="submit" 
                    className="w-full py-4 bg-primary text-on-primary font-bold rounded-xl hover:shadow-[0_4px_14px_rgba(164,230,255,0.25)] transition-all flex items-center justify-center gap-2 mt-2"
                >
                    {loading && <Loader2 className="animate-spin w-4 h-4" />}
                    Confirm & Deposit
                </button>
            </form>

            {error && (
                <div className="mt-4 p-3 rounded-lg bg-error/10 border border-error/20 text-error text-xs font-medium flex items-start gap-2">
                    <span className="material-symbols-outlined text-sm mt-0.5">error</span>
                    <span>{error}</span>
                </div>
            )}
            {txHash && (
                <div className="mt-4 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium flex items-start gap-2">
                    <span className="material-symbols-outlined text-sm mt-0.5">check_circle</span>
                    <span>TX: <a href={`https://explorer.solana.com/tx/${txHash}?cluster=devnet`} target="_blank" rel="noreferrer" className="underline hover:text-emerald-300 break-all">{txHash.slice(0, 15)}...</a></span>
                </div>
            )}
        </div>
    );
}
