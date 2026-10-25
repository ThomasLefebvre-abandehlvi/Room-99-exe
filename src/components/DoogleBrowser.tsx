import React, { useState } from 'react';
import { Search, ArrowLeft, ArrowRight, RotateCw, Globe, ExternalLink, X, Bookmark, Sparkles, Key, CheckCircle2, AlertTriangle, ShieldCheck } from 'lucide-react';
import { sound } from '../audio/sound';

export interface DoogleBrowserProps {
  playerCoins: number;
  activeScannedCode: string | null;
  onRedeemReward: (coins: number) => void;
}

interface SearchResult {
  title: string;
  url: string;
  snippet: string;
  badge?: string;
}

export function DoogleBrowser({ playerCoins, activeScannedCode, onRedeemReward }: DoogleBrowserProps) {
  const [query, setQuery] = useState('');
  const [activeQuery, setActiveQuery] = useState<string | null>(null);
  const [urlBar, setUrlBar] = useState('https://doogle.sub-net.internal');

  // NanoScanner code input state
  const [codeInput, setCodeInput] = useState('');
  const [codeStatus, setCodeStatus] = useState<{ type: 'idle' | 'success' | 'error'; message: string }>({
    type: 'idle',
    message: ''
  });
  const [redeemedCodes, setRedeemedCodes] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('room99-redeemed-nanocodes');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const handleSearch = (searchTerm: string) => {
    const trimmed = searchTerm.trim();
    if (!trimmed) return;
    setActiveQuery(trimmed);
    setUrlBar(`https://doogle.sub-net.internal/archive?q=${encodeURIComponent(trimmed)}`);
    sound.playClick();
  };

  const handleClear = () => {
    setQuery('');
    setActiveQuery(null);
    setUrlBar('https://doogle.sub-net.internal');
    sound.playClick();
  };

  // Code redemption handler
  const handleRedeemCode = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanInput = codeInput.trim().replace(/\s+/g, '');
    if (!cleanInput) return;

    sound.playClick();

    // Check if already redeemed
    if (redeemedCodes.includes(cleanInput)) {
      setCodeStatus({
        type: 'error',
        message: 'This 8-digit NanoScanner code has already been redeemed!'
      });
      return;
    }

    // Check if matches active scanned code (supports with or without hyphen)
    const normalizedActive = activeScannedCode ? activeScannedCode.replace(/[^0-9]/g, '') : null;
    const normalizedInput = cleanInput.replace(/[^0-9]/g, '');

    if (normalizedActive && normalizedInput === normalizedActive && normalizedInput.length === 8) {
      // Valid! Award 1,000 Neno Coins!
      onRedeemReward(1000);
      const updated = [...redeemedCodes, cleanInput];
      setRedeemedCodes(updated);
      localStorage.setItem('room99-redeemed-nanocodes', JSON.stringify(updated));

      setCodeStatus({
        type: 'success',
        message: 'AUTHENTICATION VERIFIED: +1,000 Neno Coins successfully deposited into your balance!'
      });
      setCodeInput('');
      sound.playCrateJackpot();
    } else {
      setCodeStatus({
        type: 'error',
        message: 'Invalid authorization code. Scan an anomalous blue sheet on a corridor wall with the NanoScanner app first.'
      });
    }
  };

  const trendingQueries = [
    'Sub-Level 99 Blueprint Secrets',
    'NanoScanner 1000 Coin Bounties',
    'Best Hammer Runic Enchantments',
    'Room 99 Previous Courier Logs',
    'Square 9 Market Godbreaker'
  ];

  return (
    <div className="flex-1 flex flex-col bg-[#0f141c] text-slate-100 font-sans select-none overflow-hidden">
      {/* Browser Navigation Chrome Header */}
      <div className="h-9 bg-[#161f2c] border-b border-[#223145] flex items-center px-2 gap-2 text-slate-300">
        <div className="flex items-center gap-1">
          <button
            onClick={() => {
              if (activeQuery) {
                setActiveQuery(null);
                setUrlBar('https://doogle.sub-net.internal');
                sound.playClick();
              }
            }}
            disabled={!activeQuery}
            className="w-7 h-7 flex items-center justify-center rounded hover:bg-[#223145] disabled:opacity-40 disabled:cursor-not-allowed transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
          </button>
          <button
            disabled
            className="w-7 h-7 flex items-center justify-center rounded opacity-40 cursor-not-allowed"
          >
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => {
              if (activeQuery) handleSearch(activeQuery);
            }}
            className="w-7 h-7 flex items-center justify-center rounded hover:bg-[#223145] transition"
          >
            <RotateCw className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Address Bar */}
        <div className="flex-1 h-7 bg-[#0b1017] rounded-full border border-[#2b3c52] px-3 flex items-center gap-2 text-xs text-slate-200">
          <ShieldCheck className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
          <span className="truncate flex-1 font-mono text-[11px] text-cyan-300">{urlBar}</span>
          {activeQuery && (
            <button onClick={handleClear} className="hover:text-white">
              <X className="w-3 h-3 text-slate-400" />
            </button>
          )}
        </div>

        <div className="text-[10px] bg-slate-900 border border-slate-700 px-2 py-0.5 rounded font-mono text-amber-300 font-bold shrink-0">
          {playerCoins} Ⓝ
        </div>
      </div>

      {/* Bookmarks Bar */}
      <div className="h-6 bg-[#121924] border-b border-[#1d293a] px-3 flex items-center gap-4 text-[10px] text-slate-400 overflow-x-auto">
        <span className="flex items-center gap-1 hover:text-cyan-300 cursor-pointer" onClick={() => handleSearch('Vault Guide')}>
          <Bookmark className="w-3 h-3 text-cyan-400" />
          <span>Vault Guide</span>
        </span>
        <span className="flex items-center gap-1 hover:text-cyan-300 cursor-pointer" onClick={() => handleSearch('NanoScanner')}>
          <Key className="w-3 h-3 text-amber-400" />
          <span>NanoScanner Codes</span>
        </span>
        <span className="flex items-center gap-1 hover:text-cyan-300 cursor-pointer" onClick={() => handleSearch('Enchanting')}>
          <Sparkles className="w-3 h-3 text-violet-400" />
          <span>Runic Anvil</span>
        </span>
      </div>

      {/* Main Browser View */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-gradient-to-b from-[#0f141c] via-[#111722] to-[#0c1017]">
        {!activeQuery ? (
          /* Custom Subterranean "DOOGLE SUB-NET" Portal Homepage */
          <div className="max-w-2xl mx-auto flex flex-col items-center justify-center py-6">
            {/* Custom Brand Logo */}
            <div className="flex flex-col items-center mb-6">
              <div className="flex items-center gap-3 mb-1">
                <div className="w-14 h-14 rounded-2xl bg-slate-950 p-2 shadow-xl shadow-blue-500/20 border border-blue-400/40 flex items-center justify-center">
                  <img
                    src="/assets/aistudio/Multicolor_Geometric_D_Logo_7d11e51b.png"
                    alt="Doogle Logo"
                    className="w-full h-full object-contain"
                  />
                </div>
                <div className="text-4xl sm:text-5xl font-black tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-red-400 via-amber-300 to-blue-400">
                  DOOGLE
                </div>
              </div>
              <div className="flex items-center gap-2 text-[10px] text-cyan-400 uppercase tracking-widest font-mono">
                <span>SUB-NET DEEP ARCHIVE INDEX</span>
                <span className="text-slate-600">•</span>
                <span>SEC-99</span>
              </div>
            </div>

            {/* NANOSCANNER CODE REDEMPTION CENTER (1,000 Neno Coin Reward) */}
            <div className="w-full mb-6 p-4 rounded-2xl bg-gradient-to-r from-cyan-950/70 via-slate-900/90 to-blue-950/70 border-2 border-cyan-400/60 shadow-xl">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2 text-xs font-black text-cyan-300 uppercase">
                  <Key className="w-4 h-4 text-amber-400" />
                  <span>NANOSCANNER CODE REDEMPTION</span>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-bold border border-amber-500/40">
                  +1,000 Neno Coins
                </span>
              </div>
              <p className="text-[11px] text-slate-300 mb-3">
                Scanned a blue paper sheet on the corridor wall? Enter the 8-digit code below to claim your bounty!
              </p>

              <form onSubmit={handleRedeemCode} className="flex flex-col sm:flex-row items-center gap-2">
                <div className="relative flex-1 w-full">
                  <input
                    type="text"
                    value={codeInput}
                    onChange={(e) => setCodeInput(e.target.value)}
                    placeholder="Enter 8-digit code (e.g. 9842-1750)..."
                    className="w-full bg-slate-950 border border-cyan-500/50 rounded-xl px-3.5 py-2 text-xs font-mono text-cyan-200 placeholder:text-slate-500 outline-none focus:border-cyan-400 transition"
                  />
                  {activeScannedCode && (
                    <button
                      type="button"
                      onClick={() => setCodeInput(activeScannedCode)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-bold text-sky-400 hover:text-sky-200 px-2 py-0.5 rounded bg-sky-950 border border-sky-800"
                    >
                      Paste Scanned Code
                    </button>
                  )}
                </div>
                <button
                  type="submit"
                  className="w-full sm:w-auto px-5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs shadow-md transition shrink-0 active:scale-95"
                >
                  Claim 1,000 Ⓝ
                </button>
              </form>

              {codeStatus.message && (
                <div className={`mt-2.5 p-2 rounded-lg text-xs font-bold flex items-center gap-2 ${
                  codeStatus.type === 'success'
                    ? 'bg-emerald-950/80 border border-emerald-500 text-emerald-300'
                    : 'bg-rose-950/80 border border-rose-500 text-rose-300'
                }`}>
                  {codeStatus.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertTriangle className="w-4 h-4 shrink-0" />}
                  <span>{codeStatus.message}</span>
                </div>
              )}
            </div>

            {/* Central Search Box */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSearch(query);
              }}
              className="w-full bg-[#162130] rounded-2xl border border-[#2b3c52] hover:border-cyan-400/80 focus-within:border-cyan-400 flex items-center px-4 py-3 shadow-lg transition"
            >
              <Search className="w-4 h-4 text-cyan-400 mr-3 shrink-0" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search subterranean intelligence or archives..."
                className="flex-1 bg-transparent text-sm text-slate-100 placeholder:text-slate-400 outline-none"
                autoFocus
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery('')}
                  className="p-1 hover:text-white text-slate-400 mr-2"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
              <button
                type="submit"
                className="px-3 py-1 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold rounded-lg transition"
              >
                Search
              </button>
            </form>

            {/* Trending Quick Search Chips */}
            <div className="mt-6 flex flex-col items-center">
              <span className="text-[10px] text-cyan-400 uppercase tracking-widest mb-2 font-mono font-bold">
                Trending Vault Queries:
              </span>
              <div className="flex flex-wrap items-center justify-center gap-2 max-w-lg">
                {trendingQueries.map((tag) => (
                  <button
                    key={tag}
                    onClick={() => {
                      setQuery(tag);
                      handleSearch(tag);
                    }}
                    className="px-3 py-1 rounded-full bg-[#162130] hover:bg-cyan-950 hover:border-cyan-500 text-xs text-slate-300 border border-[#26374d] transition"
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          /* Search Results Page */
          <div className="max-w-3xl mx-auto space-y-4">
            {/* Top Search Input inside Results */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSearch(query);
              }}
              className="flex items-center gap-2 mb-4"
            >
              <div className="flex items-center gap-2 font-black text-xl mr-2">
                <img
                  src="/assets/aistudio/Multicolor_Geometric_D_Logo_7d11e51b.png"
                  alt="Doogle"
                  className="w-6 h-6 object-contain"
                />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-400 via-amber-300 to-blue-400">DOOGLE</span>
              </div>
              <div className="flex-1 bg-[#162130] rounded-xl border border-[#2b3c52] px-3.5 py-2 flex items-center">
                <Search className="w-3.5 h-3.5 text-cyan-400 mr-2 shrink-0" />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="flex-1 bg-transparent text-xs text-slate-100 outline-none"
                />
              </div>
              <button
                type="submit"
                className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold rounded-xl transition"
              >
                Search
              </button>
            </form>

            {/* External Google Search Link Box */}
            <div className="p-3.5 rounded-xl bg-gradient-to-r from-blue-950 via-slate-900 to-indigo-950 border border-blue-500/40 shadow-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-1.5 text-xs font-black text-blue-300">
                  <Globe className="w-4 h-4 text-blue-400" />
                  <span>EXTERNAL INTERNET LOOKUP</span>
                </div>
                <p className="text-[11px] text-slate-300 mt-0.5">
                  Launch a real search on Google for <span className="font-bold text-white">"{activeQuery}"</span> in your browser.
                </p>
              </div>

              <a
                href={`https://www.google.com/search?q=${encodeURIComponent(activeQuery)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md transition flex items-center gap-1.5 shrink-0"
              >
                <span>Search Google ↗</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>

            {/* Subterranean Internal Results */}
            <div className="space-y-3">
              <div className="text-[11px] text-slate-400 font-mono">
                Index query returned 3 subterranean archive records for <span className="text-cyan-300 font-bold">"{activeQuery}"</span>
              </div>

              <div className="p-4 rounded-xl bg-[#162130]/70 border border-[#2b3c52] hover:border-cyan-500/60 transition">
                <div className="text-[10px] text-cyan-400 font-mono mb-1">
                  https://doogle.sub-net.internal/records/vault-99
                </div>
                <h3 className="text-sm font-bold text-sky-300 hover:underline cursor-pointer">
                  {activeQuery} — Subterranean Facility Classified Brief
                </h3>
                <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                  Historical telemetry and engineering specifications regarding {activeQuery} within the Room 99 complex.
                  Hammers deal kinetic damage that scales with Overcharge and Seismic runes. Blue wall sheets emit high-frequency NanoScanner signals.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-[#162130]/70 border border-[#2b3c52] hover:border-cyan-500/60 transition">
                <div className="text-[10px] text-cyan-400 font-mono mb-1">
                  https://doogle.sub-net.internal/intel/courier-survival
                </div>
                <h3 className="text-sm font-bold text-sky-300 hover:underline cursor-pointer">
                  Courier Field Intelligence: NanoScanner & Blue Sheets
                </h3>
                <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                  In 1 out of 10 chambers, an automated schematic sheet is affixed to the wall. Opening the NanoScanner app within 160px decrypts an 8-digit key claimable on Doogle for 1,000 Neno Coins.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
