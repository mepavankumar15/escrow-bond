import { useMemo, useState, useCallback, useEffect } from 'react';
import { ConnectionProvider, WalletProvider, useWallet } from '@solana/wallet-adapter-react';
import { WalletModalProvider, WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { clusterApiUrl } from '@solana/web3.js';
import '@solana/wallet-adapter-react-ui/styles.css';
import './index.css';

import CreateEscrow from './components/CreateEscrow';
import TakerActions from './components/TakerActions';
import ExecuteCancel from './components/ExecuteCancel';
import MyEscrowsList from './components/MyEscrowsList';
import TransactionHistory from './components/TransactionHistory';

type View = 'dashboard' | 'escrows' | 'history';

const GITHUB_REPO = 'https://github.com/mepavankumar15/escrow-bond';

function AppContent() {
    const [view, setView] = useState<View>('dashboard');
    const wallet = useWallet();

    // Shared state for selecting an escrow from the list
    const [selectedEscrow, setSelectedEscrow] = useState<{maker: string, seed: string, mintB?: string} | null>(null);

    const handleSelectEscrow = useCallback((maker: string, seed: string, mintB?: string) => {
        setSelectedEscrow({ maker, seed, mintB });
        // Switch to escrows view if selected from dashboard list for better focus
        if (view === 'dashboard') setView('escrows');
    }, [view]);

    const navItem = (icon: string, label: string, target: View) => (
        <button
            onClick={() => setView(target)}
            className={`w-full text-left py-3 px-6 flex items-center gap-3 transition-all duration-200 ease-in-out ${
                view === target
                    ? 'bg-surface-container-high text-primary rounded-r-lg border-l-4 border-primary'
                    : 'text-on-surface-variant hover:bg-surface-container-low hover:text-white'
            }`}
        >
            <span className="material-symbols-outlined">{icon}</span>
            {label}
        </button>
    );

    return (
        <>
            {/* Top Nav Bar */}
            <header className="fixed top-0 w-full z-50 bg-background shadow-[0_20px_40px_rgba(6,14,32,0.4)]">
                <div className="flex justify-between items-center h-20 px-8 w-full font-headline antialiased">
                    <div className="flex items-center gap-12">
                        <button onClick={() => setView('dashboard')} className="text-2xl font-bold tracking-tighter text-primary hover:opacity-80 transition-opacity">Escrow Bond</button>
                        <nav className="hidden md:flex items-center gap-8">
                            <button onClick={() => setView('dashboard')} className={`transition-colors text-sm font-bold ${view === 'dashboard' ? 'text-on-surface border-b-2 border-primary pb-1' : 'text-on-surface-variant hover:text-on-surface'}`}>Dashboard</button>
                            <button onClick={() => setView('escrows')} className={`transition-colors text-sm font-bold ${view === 'escrows' ? 'text-on-surface border-b-2 border-primary pb-1' : 'text-on-surface-variant hover:text-on-surface'}`}>My Escrows</button>
                        </nav>
                    </div>
                    <div className="flex items-center gap-6">
                        <div className="flex items-center gap-4 text-on-surface-variant">
                            <button className="p-2 hover:bg-surface-container-high transition-all duration-300 rounded-lg active:scale-95">
                                <span className="material-symbols-outlined">notifications</span>
                            </button>
                            <button className="p-2 hover:bg-surface-container-high transition-all duration-300 rounded-lg active:scale-95">
                                <span className="material-symbols-outlined">settings</span>
                            </button>
                        </div>
                        <WalletMultiButton />
                    </div>
                </div>
            </header>

            {/* Sidebar */}
            <aside className="fixed left-0 top-20 h-[calc(100vh-5rem)] w-64 bg-background border-r border-outline-variant/15 hidden lg:block">
                <div className="flex flex-col py-6 h-full font-body text-sm tracking-wide">
                    <div className="px-6 mb-8 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-surface-container-high flex items-center justify-center overflow-hidden">
                            <span className="material-symbols-outlined text-primary">account_circle</span>
                        </div>
                        <div>
                            <p className="text-primary font-bold">Escrow Bond</p>
                            <p className="text-xs text-on-surface-variant">Solana Devnet</p>
                        </div>
                    </div>
                    <div className="flex-grow flex flex-col">
                        {navItem('dashboard', 'Dashboard', 'dashboard')}
                        {navItem('gavel', 'My Escrows', 'escrows')}
                        {navItem('history', 'History', 'history')}
                    </div>
                    <div className="mt-auto border-t border-outline-variant/10 pt-4 pb-2">
                        <a className="text-on-surface-variant py-3 px-6 hover:bg-surface-container-low hover:text-white flex items-center gap-3 transition-all duration-200" href={GITHUB_REPO} target="_blank" rel="noreferrer">
                            <span className="material-symbols-outlined">code</span>
                            GitHub Repo
                        </a>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className="lg:ml-64 pt-28 px-6 pb-12 min-h-screen font-body">
                <div className="max-w-7xl mx-auto space-y-12">

                    {view === 'dashboard' && (
                        <>
                            {/* Header */}
                            <section className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                                <div>
                                    <div className="flex items-center gap-3 mb-2">
                                        <span className="px-3 py-1 bg-primary/10 text-primary text-[10px] font-bold rounded-full tracking-widest uppercase font-mono">System: Verified</span>
                                        <div className="h-px flex-grow bg-outline-variant/10 min-w-[100px]"></div>
                                    </div>
                                    <h1 className="text-4xl font-headline font-extrabold text-on-surface tracking-tight mb-2 italic">Bond Dashboard</h1>
                                    <p className="text-on-surface-variant max-w-lg">Manage your secure transactions and monitor escrow status across the Solana devnet ecosystem.</p>
                                </div>
                                <div className="flex gap-4">
                                    <div className="bg-surface-container-low border border-outline-variant/10 rounded-2xl p-4 min-w-[160px] shadow-lg">
                                        <p className="text-[10px] text-on-surface-variant font-bold uppercase tracking-widest mb-1">Network</p>
                                        <div className="flex items-center gap-2">
                                            <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></div>
                                            <span className="text-sm font-bold text-on-surface">Devnet Online</span>
                                        </div>
                                    </div>
                                    <div className="bg-surface-container-low border border-outline-variant/10 rounded-2xl p-4 min-w-[160px] shadow-lg">
                                        <p className="text-[10px] text-on-surface-variant font-bold uppercase tracking-widest mb-1">Fee</p>
                                        <div className="flex items-center gap-1">
                                            <span className="text-sm font-bold text-primary">0.00%</span>
                                            <span className="text-[10px] text-on-surface-variant">Promotional</span>
                                        </div>
                                    </div>
                                </div>
                            </section>

                            {/* Bento Grid */}
                            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                                <div className="lg:col-span-5">
                                    <CreateEscrow />
                                </div>
                                <div className="lg:col-span-7 space-y-6">
                                    <div className="flex items-center justify-between mb-2">
                                        <h2 className="text-xl font-headline font-bold text-on-surface">Active Escrows</h2>
                                        <button onClick={() => setView('escrows')} className="text-xs font-bold text-primary hover:underline hover:opacity-80 transition-all flex items-center gap-1">
                                            Manage All
                                            <span className="material-symbols-outlined text-sm">open_in_new</span>
                                        </button>
                                    </div>
                                    
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <TakerActions 
                                            initialMaker={selectedEscrow?.maker} 
                                            initialSeed={selectedEscrow?.seed} 
                                            initialMintB={selectedEscrow?.mintB}
                                        />
                                        <ExecuteCancel 
                                            initialMaker={selectedEscrow?.maker} 
                                            initialSeed={selectedEscrow?.seed}
                                        />
                                    </div>

                                    {/* On-Chain List Integration */}
                                    <MyEscrowsList onSelect={handleSelectEscrow} />
                                    
                                    {/* Network Banner */}
                                    <div className="bg-surface-container rounded-2xl p-6 overflow-hidden relative border border-outline-variant/5">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-on-surface-variant text-[10px] font-bold uppercase tracking-widest mb-1">Network Status</p>
                                                <h4 className="text-on-surface font-headline font-bold">Solana Devnet</h4>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <div className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
                                                <span className="text-xs text-on-surface font-medium">Connected</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </>
                    )}

                    {view === 'escrows' && (
                        <>
                            <section>
                                <h1 className="text-4xl font-headline font-extrabold text-on-surface tracking-tight mb-2">My Escrows</h1>
                                <p className="text-on-surface-variant max-w-lg mb-8">View and manage your active escrow contracts directly from the blockchain state.</p>
                            </section>
                            
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                <div className="lg:col-span-1 space-y-6">
                                    <MyEscrowsList onSelect={handleSelectEscrow} />
                                    <div 
                                        onClick={() => setView('dashboard')}
                                        className="bg-surface-container-high rounded-2xl p-6 shadow-xl border border-dashed border-outline-variant/30 flex flex-col items-center justify-center min-h-[200px] group hover:border-primary/40 transition-all cursor-pointer"
                                    >
                                        <div className="p-4 bg-surface-container-highest rounded-full mb-4 group-hover:bg-primary/10 transition-colors">
                                            <span className="material-symbols-outlined text-3xl text-on-surface-variant group-hover:text-primary transition-colors">add</span>
                                        </div>
                                        <p className="text-on-surface-variant text-sm font-semibold group-hover:text-primary transition-colors">Create New Escrow</p>
                                    </div>
                                </div>
                                <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                                    <TakerActions 
                                        initialMaker={selectedEscrow?.maker} 
                                        initialSeed={selectedEscrow?.seed} 
                                        initialMintB={selectedEscrow?.mintB}
                                    />
                                    <ExecuteCancel 
                                        initialMaker={selectedEscrow?.maker} 
                                        initialSeed={selectedEscrow?.seed}
                                    />
                                </div>
                            </div>
                        </>
                    )}

                    {view === 'history' && (
                        <>
                            <section>
                                <h1 className="text-4xl font-headline font-extrabold text-on-surface tracking-tight mb-2">Transaction History</h1>
                                <p className="text-on-surface-variant max-w-lg mb-8">View past escrow transactions directly from the Solana cluster.</p>
                            </section>
                            <TransactionHistory />
                        </>
                    )}
                </div>
            </main>
        </>
    );
}

function App() {
    const endpoint = useMemo(() => clusterApiUrl('devnet'), []);
    const wallets = useMemo(() => [], []);

    return (
        <ConnectionProvider endpoint={endpoint}>
            <WalletProvider wallets={wallets} autoConnect>
                <WalletModalProvider>
                    <AppContent />
                </WalletModalProvider>
            </WalletProvider>
        </ConnectionProvider>
    );
}

export default App;
