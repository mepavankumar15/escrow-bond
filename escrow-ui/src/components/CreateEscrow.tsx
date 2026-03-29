import React, { useState } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { AnchorProvider, BN } from '@coral-xyz/anchor';
import { PublicKey, SystemProgram } from '@solana/web3.js';
import { getAssociatedTokenAddressSync, TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { getEscrowProgram, getEscrowStatePDA, getVaultAPDA, getVaultBPDA } from '../anchor/setup';
import { Loader2 } from 'lucide-react';
import TokenSelector, { SUPPORTED_TOKENS } from './TokenSelector';

export default function CreateEscrow() {
    const { connection } = useConnection();
    const wallet = useWallet();

    const [seed, setSeed] = useState('');
    const [takerAddress, setTakerAddress] = useState('');
    const [mintA, setMintA] = useState(SUPPORTED_TOKENS[0].mint);
    const [mintB, setMintB] = useState(SUPPORTED_TOKENS[2].mint);
    
    // Custom decimal states for non-preset tokens
    const [customDecimalsA, setCustomDecimalsA] = useState(9);
    const [customDecimalsB, setCustomDecimalsB] = useState(9);

    const [depositAmount, setDepositAmount] = useState('');
    const [expectedAmount, setExpectedAmount] = useState('');
    const [expiry, setExpiry] = useState('');
    const [loading, setLoading] = useState(false);
    const [txHash, setTxHash] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const handleCreate = async (e: React.FormEvent) => {
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

            const tokenA = SUPPORTED_TOKENS.find(t => t.mint === mintA);
            const tokenB = SUPPORTED_TOKENS.find(t => t.mint === mintB);

            const decimalsA = tokenA ? tokenA.decimals : customDecimalsA;
            const decimalsB = tokenB ? tokenB.decimals : customDecimalsB;

            const seedBN = new BN(seed);
            const depositBN = new BN(parseFloat(depositAmount) * Math.pow(10, decimalsA));
            const expectedBN = new BN(parseFloat(expectedAmount) * Math.pow(10, decimalsB));
            const expiryBN = new BN(expiry);

            const takerPubkey = new PublicKey(takerAddress);
            const mintAPubkey = new PublicKey(mintA);
            const mintBPubkey = new PublicKey(mintB);

            const [escrowStatePDA] = getEscrowStatePDA(wallet.publicKey, seedBN);
            const [vaultAPDA] = getVaultAPDA(escrowStatePDA);
            const [vaultBPDA] = getVaultBPDA(escrowStatePDA);

            const makerTokenAccountA = getAssociatedTokenAddressSync(mintAPubkey, wallet.publicKey);

            const tx = await program.methods
                .initializeEscrow(seedBN, depositBN, expectedBN, expiryBN)
                .accounts({
                    maker: wallet.publicKey,
                    taker: takerPubkey,
                    mintA: mintAPubkey,
                    mintB: mintBPubkey,
                    makerTokenAccountA,
                    vaultA: vaultAPDA,
                    vaultB: vaultBPDA,
                    escrowState: escrowStatePDA,
                    systemProgram: SystemProgram.programId,
                    tokenProgram: TOKEN_PROGRAM_ID,
                })
                .rpc();

            setTxHash(tx);
        } catch (err: any) {
            console.error('Failed to create escrow', err);
            setError(err.message || 'Transaction failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="bg-surface-container-low rounded-2xl p-8 relative overflow-hidden group">
                <div className="absolute -top-24 -right-24 w-48 h-48 bg-primary/5 rounded-full blur-3xl group-hover:bg-primary/10 transition-colors"></div>
                <h2 className="text-xl font-headline font-bold text-on-surface mb-6 flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary">add_circle</span>
                    Create New Escrow
                </h2>
                
                <form onSubmit={handleCreate} className="space-y-6 relative z-10">
                    <div>
                        <label className="block text-xs font-semibold text-on-surface-variant mb-2 ml-1">TAKER WALLET ADDRESS</label>
                        <input 
                            required 
                            value={takerAddress} 
                            onChange={(e) => setTakerAddress(e.target.value)} 
                            className="w-full bg-surface-container-lowest border border-outline-variant/20 rounded-lg p-3 text-on-surface placeholder:text-outline focus:ring-1 focus:ring-primary/40 transition-all font-mono text-xs" 
                            placeholder="Paste Taker's Pubkey (e.g. 925DG...)" 
                            type="text" 
                        />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                            <TokenSelector 
                                label="TOKEN YOU SEND (MINT A)" 
                                value={mintA} 
                                onChange={setMintA} 
                                customDecimals={customDecimalsA}
                                onCustomDecimalsChange={setCustomDecimalsA}
                            />
                            <div>
                                <label className="block text-[10px] text-on-surface-variant uppercase font-semibold mb-2 ml-1">AMOUNT TO SEND</label>
                                <input 
                                    required 
                                    value={depositAmount} 
                                    onChange={(e) => setDepositAmount(e.target.value)} 
                                    className="w-full bg-surface-container-lowest border border-outline-variant/20 rounded-lg p-3 text-on-surface placeholder:text-outline focus:ring-1 focus:ring-primary/40 transition-all text-sm" 
                                    placeholder="e.g. 10.5" 
                                    type="number"
                                    step="any"
                                />
                            </div>
                        </div>

                        <div className="space-y-4">
                            <TokenSelector 
                                label="TOKEN YOU RECEIVE (MINT B)" 
                                value={mintB} 
                                onChange={setMintB} 
                                customDecimals={customDecimalsB}
                                onCustomDecimalsChange={setCustomDecimalsB}
                            />
                            <div>
                                <label className="block text-[10px] text-on-surface-variant uppercase font-semibold mb-2 ml-1">EXPECTED AMOUNT</label>
                                <input 
                                    required 
                                    value={expectedAmount} 
                                    onChange={(e) => setExpectedAmount(e.target.value)} 
                                    className="w-full bg-surface-container-lowest border border-outline-variant/20 rounded-lg p-3 text-on-surface placeholder:text-outline focus:ring-1 focus:ring-primary/40 transition-all text-sm" 
                                    placeholder="e.g. 5.0" 
                                    type="number"
                                    step="any"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-semibold text-on-surface-variant mb-2 ml-1">ESCROW SEED (ID)</label>
                            <div className="flex gap-2">
                                <input 
                                    required 
                                    value={seed} 
                                    onChange={(e) => setSeed(e.target.value)} 
                                    className="flex-grow bg-surface-container-lowest border border-outline-variant/20 rounded-lg p-3 text-on-surface placeholder:text-outline focus:ring-1 focus:ring-primary/40 transition-all text-xs font-mono" 
                                    placeholder="Unique ID (Number)" 
                                    type="number" 
                                />
                                <button
                                    type="button"
                                    onClick={() => setSeed(Math.floor(Math.random() * 1000000).toString())}
                                    className="bg-surface-container-highest hover:bg-primary/20 hover:text-primary p-3 rounded-lg text-on-surface-variant transition-colors"
                                    title="Generate Random Seed"
                                >
                                    <span className="material-symbols-outlined text-sm">casino</span>
                                </button>
                            </div>
                        </div>
                        <div className="relative">
                            <label className="block text-xs font-semibold text-on-surface-variant mb-2 ml-1">EXPIRY (UNIX)</label>
                            <div className="flex gap-2">
                                <input 
                                    required 
                                    value={expiry} 
                                    onChange={(e) => setExpiry(e.target.value)} 
                                    className="flex-grow bg-surface-container-lowest border border-outline-variant/20 rounded-lg p-3 text-on-surface placeholder:text-outline focus:ring-1 focus:ring-primary/40 transition-all text-xs font-mono" 
                                    placeholder="Timestamp" 
                                    type="number" 
                                />
                                <button
                                    type="button"
                                    onClick={() => setExpiry((Math.floor(Date.now() / 1000) + 3600).toString())}
                                    className="bg-surface-container-highest hover:bg-primary/20 hover:text-primary p-3 rounded-lg text-on-surface-variant transition-colors"
                                    title="Set for 1 hour from now"
                                >
                                    <span className="material-symbols-outlined text-sm">schedule</span>
                                </button>
                            </div>
                        </div>
                    </div>

                    <button 
                        disabled={loading || !wallet.publicKey} 
                        type="submit" 
                        className="w-full bg-gradient-to-br from-primary to-primary-container text-on-primary-fixed py-4 rounded-xl font-bold text-lg hover:shadow-[0_4px_20px_rgba(164,230,255,0.4)] hover:scale-[1.01] transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {loading && <Loader2 className="animate-spin w-5 h-5" />}
                        {wallet.publicKey ? "Initiate Secure Vault" : "Connect Wallet"}
                    </button>
                </form>

                {error && (
                    <div className="mt-4 p-4 rounded-lg bg-error/10 border border-error/20 text-error text-xs font-medium flex items-start gap-2">
                        <span className="material-symbols-outlined text-sm mt-0.5">error</span>
                        <span>{error}</span>
                    </div>
                )}
                {txHash && (
                    <div className="mt-4 p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium flex items-start gap-2">
                        <span className="material-symbols-outlined text-sm mt-0.5">verified</span>
                        <span>
                            Escrow created! TX: <a href={`https://explorer.solana.com/tx/${txHash}?cluster=devnet`} target="_blank" rel="noreferrer" className="underline hover:text-emerald-200 transition-colors break-all ml-1 truncate inline-block max-w-[200px] align-bottom">
                                {txHash}
                            </a>
                        </span>
                    </div>
                )}
            </div>

            <div className="bg-surface-container-lowest rounded-2xl p-6 border border-outline-variant/10 flex items-start gap-4">
                <div className="p-3 bg-primary/10 rounded-full">
                    <span className="material-symbols-outlined text-primary" style={{fontVariationSettings: "'FILL' 1"}}>verified_user</span>
                </div>
                <div>
                    <h4 className="text-on-surface font-semibold text-sm">Triple-Audit Security Ready</h4>
                    <p className="text-on-surface-variant text-xs mt-1 leading-relaxed">
                        This vault uses audited Anchor framework patterns. Locked assets are held in Program-Derived Addresses (PDAs) with multi-sig compatible governance logic.
                    </p>
                </div>
            </div>
        </div>
    );
}
