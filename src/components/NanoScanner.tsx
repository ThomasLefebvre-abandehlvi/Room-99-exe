import React, { useState } from 'react';
import { sound } from '../audio/sound';
import { Radio, Scan, CheckCircle2, AlertCircle, Copy, Sparkles, ExternalLink } from 'lucide-react';

export interface NanoScannerProps {
  playerX: number;
  hasBlueSheet: boolean;
  blueSheetX: number;
  currentRoom: number;
  scannedCode: string | null;
  onCodeScanned: (code: string) => void;
  onOpenDoogle: () => void;
}

export function NanoScanner({
  playerX,
  hasBlueSheet,
  blueSheetX,
  currentRoom,
  scannedCode,
  onCodeScanned,
  onOpenDoogle
}: NanoScannerProps) {
  const [isScanning, setIsScanning] = useState(false);
  const [copied, setCopied] = useState(false);

  const distance = hasBlueSheet ? Math.abs(playerX - blueSheetX) : 9999;
  const inRange = hasBlueSheet && distance <= 160;

  const handleScan = () => {
    if (!inRange || isScanning) return;
    setIsScanning(true);
    sound.playClick();

    // 1.5s radar scan effect
    setTimeout(() => {
      // Generate a formatted 8-digit code like "9842-1750"
      const part1 = Math.floor(1000 + Math.random() * 9000);
      const part2 = Math.floor(1000 + Math.random() * 9000);
      const code = `${part1}-${part2}`;

      onCodeScanned(code);
      setIsScanning(false);
      sound.playCrateJackpot();
    }, 1500);
  };

  const handleCopy = () => {
    if (!scannedCode) return;
    navigator.clipboard?.writeText(scannedCode).catch(() => {});
    setCopied(true);
    sound.playClick();
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex-1 flex flex-col p-4 bg-slate-950 text-slate-100 font-sans select-none overflow-y-auto">
      {/* Header Banner */}
      <div className="flex items-center justify-between border-b border-cyan-900/60 pb-3 mb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shadow-md">
            <Radio className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-black text-cyan-300 tracking-wide uppercase">
                NANOSCANNER DECRYPTOR
              </h2>
              <span className="text-[9px] px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold">
                Frequency 88.4 MHz
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Scans encrypted blue schematic sheets found on subterranean corridor walls.
            </p>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-lg text-right">
          <div className="text-[9px] font-bold text-slate-400 uppercase">Current Sector</div>
          <div className="text-xs font-black text-cyan-300">Room {String(currentRoom).padStart(3, '0')}</div>
        </div>
      </div>

      {/* Main Radar Screen Display */}
      <div className="flex-1 flex flex-col items-center justify-center p-4 bg-slate-900/70 rounded-2xl border border-slate-800 relative overflow-hidden my-1 min-h-[220px]">
        {/* Holographic Radar Ring Graphics */}
        <div className="relative w-40 h-40 rounded-full border-2 border-cyan-500/30 flex items-center justify-center">
          <div className="w-28 h-28 rounded-full border border-cyan-400/20 flex items-center justify-center" />
          <div className="w-16 h-16 rounded-full border border-cyan-400/30" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-full h-0.5 bg-cyan-500/20" />
          </div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="h-full w-0.5 bg-cyan-500/20" />
          </div>

          {/* Radar Sweep Animation */}
          <div className={`absolute inset-0 rounded-full bg-gradient-to-tr from-transparent via-cyan-500/20 to-transparent ${isScanning ? 'animate-spin' : ''}`} />

          {/* Proximity Blip */}
          {hasBlueSheet && (
            <div
              className={`absolute w-3 h-3 rounded-full ${
                inRange ? 'bg-cyan-400 shadow-[0_0_12px_#38bdf8] animate-ping' : 'bg-slate-600'
              }`}
              style={{
                top: inRange ? '45%' : '20%',
                left: inRange ? '52%' : '75%'
              }}
            />
          )}
        </div>

        {/* Proximity Status Card */}
        <div className="mt-4 text-center max-w-md">
          {inRange ? (
            <div className="p-2.5 rounded-xl bg-cyan-950/60 border border-cyan-400/80 text-cyan-200 animate-fade-in">
              <div className="flex items-center justify-center gap-1.5 text-xs font-black text-cyan-300 mb-0.5">
                <CheckCircle2 className="w-4 h-4 text-cyan-400" />
                <span>TARGET ACQUIRED: BLUEPRINT IN SCAN RANGE!</span>
              </div>
              <div className="text-[11px] text-slate-300">
                Proximity: <span className="font-bold text-white">{Math.round(distance)}px</span> from target wall sheet.
              </div>
            </div>
          ) : hasBlueSheet ? (
            <div className="p-2.5 rounded-xl bg-amber-950/40 border border-amber-500/50 text-amber-200">
              <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-amber-300 mb-0.5">
                <AlertCircle className="w-4 h-4 text-amber-400" />
                <span>SIGNAL DETECTED IN THIS ROOM, BUT OUT OF RANGE</span>
              </div>
              <div className="text-[11px] text-slate-400">
                Move your character closer to the glowing blue paper sheet on the wall (within 160px).
              </div>
            </div>
          ) : (
            <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-slate-400 text-center">
              <div className="text-xs font-bold text-slate-300 mb-0.5">No Anomaly in Chamber {currentRoom}</div>
              <div className="text-[11px] text-slate-500">
                Blue blueprint sheets spawn on chamber walls in 1 out of 10 rooms. Keep exploring!
              </div>
            </div>
          )}
        </div>

        {/* Scan Action Button */}
        <div className="mt-3">
          <button
            onClick={handleScan}
            disabled={!inRange || isScanning}
            className={`px-5 py-2.5 rounded-xl font-black text-xs tracking-wider uppercase transition shadow-lg flex items-center gap-2 ${
              inRange && !isScanning
                ? 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-cyan-500/30 active:scale-95'
                : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
            }`}
          >
            <Scan className="w-4 h-4" />
            <span>{isScanning ? 'DECRYPTING FREQUENCY...' : 'SCAN TARGET BLUEPRINT'}</span>
          </button>
        </div>

        {/* Decrypted Code Output Display */}
        {scannedCode && (
          <div className="mt-4 p-3.5 rounded-xl bg-gradient-to-r from-cyan-950 via-slate-900 to-indigo-950 border-2 border-cyan-400 shadow-xl max-w-md w-full text-center animate-fade-in">
            <div className="text-[10px] font-black uppercase text-cyan-400 tracking-wider mb-1 flex items-center justify-center gap-1">
              <Sparkles className="w-3.5 h-3.5" />
              <span>DECRYPTED 8-DIGIT AUTHORIZATION CODE:</span>
            </div>

            <div className="flex items-center justify-center gap-3 my-2">
              <span className="font-mono text-2xl font-black text-white tracking-widest bg-slate-950 px-4 py-1.5 rounded-lg border border-cyan-500/60 shadow-inner">
                {scannedCode}
              </span>
              <button
                onClick={handleCopy}
                className="px-2.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs flex items-center gap-1 transition"
                title="Copy Code"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>{copied ? 'Copied!' : 'Copy'}</span>
              </button>
            </div>

            <p className="text-[11px] text-slate-300 mt-1">
              Enter this code into <span className="font-bold text-cyan-300">Doogle</span> to claim your{' '}
              <span className="font-black text-amber-300">1,000 Neno Coin Reward</span>!
            </p>

            <button
              onClick={onOpenDoogle}
              className="mt-2.5 inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow transition"
            >
              <img src="/assets/aistudio/Multicolor_Geometric_D_Logo_7d11e51b.png" alt="" className="w-4 h-4 object-contain shrink-0" />
              <span>Open Doogle &amp; Redeem Now</span>
              <ExternalLink className="w-3.5 h-3.5 ml-0.5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
