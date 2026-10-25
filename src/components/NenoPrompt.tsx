import React, { useState, useRef, useEffect } from 'react';
import { sound } from '../audio/sound';
import { Terminal } from 'lucide-react';

export interface NenoPromptProps {
  playerCoins: number;
  currentRoom: number;
  hammerName: string;
  hammerPower: number;
  onGrantCoins: (amount: number, reason: string) => void;
  onUnlockAstronautSkin: () => void;
}

interface OutputLine {
  id: number;
  type: 'prompt' | 'system' | 'success' | 'error' | 'gold';
  text: string;
}

export function NenoPrompt({
  playerCoins,
  currentRoom,
  hammerName,
  hammerPower,
  onGrantCoins,
  onUnlockAstronautSkin
}: NenoPromptProps) {
  const [inputVal, setInputVal] = useState('');
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);
  const [redeemedCodes, setRedeemedCodes] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('room99-nmd-redeemed');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [output, setOutput] = useState<OutputLine[]>([
    { id: 1, type: 'system', text: 'Neno Machine Diagnostic (NMD) [Version 9.9.102]' },
    { id: 2, type: 'system', text: '(C) 2026 Room 99 Systems Architecture. Sub-Level Command Line.' },
    { id: 3, type: 'system', text: 'Type "help" for system diagnostics or enter classified authorization codes.\n' }
  ]);

  const bottomRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [output]);

  const handleCommand = (rawCmd: string) => {
    const cmd = rawCmd.trim();
    if (!cmd) return;

    // Add command line to output
    const promptLine: OutputLine = {
      id: Date.now(),
      type: 'prompt',
      text: `<System99/A:/> ${cmd}`
    };

    setHistory(prev => [...prev, cmd]);
    setHistoryIndex(-1);
    sound.playClick();

    const lower = cmd.toLowerCase();
    const newLines: OutputLine[] = [promptLine];

    // Cheat 1: abandehlvi -> 500 Neno Coins
    if (lower === 'abandehlvi') {
      if (redeemedCodes.includes('abandehlvi')) {
        newLines.push({
          id: Date.now() + 1,
          type: 'error',
          text: '[ACCESS REFUSED] Override key "abandehlvi" has already been utilized for this session ledger.'
        });
      } else {
        onGrantCoins(500, 'NMD Override: abandehlvi');
        const updated = [...redeemedCodes, 'abandehlvi'];
        setRedeemedCodes(updated);
        localStorage.setItem('room99-nmd-redeemed', JSON.stringify(updated));
        sound.playCrateJackpot();

        newLines.push({
          id: Date.now() + 1,
          type: 'gold',
          text: '==================================================\n[AUTHORIZATION ACCEPTED: MASTER DEVELOPER BYPASS]\n> Key Authenticated: abandehlvi\n> Ledger Credit: +500 Neno Coins deposited successfully!\n=================================================='
        });
      }
    }
    // Cheat 2: neondepths -> 250 Neno Coins + Secret Astronaut Skin
    else if (lower === 'neondepths') {
      if (redeemedCodes.includes('neondepths')) {
        newLines.push({
          id: Date.now() + 1,
          type: 'error',
          text: '[ACCESS REFUSED] Override key "neondepths" has already been utilized.'
        });
      } else {
        onGrantCoins(250, 'NMD Override: neondepths');
        onUnlockAstronautSkin();
        const updated = [...redeemedCodes, 'neondepths'];
        setRedeemedCodes(updated);
        localStorage.setItem('room99-nmd-redeemed', JSON.stringify(updated));
        sound.playCrateJackpot();

        newLines.push({
          id: Date.now() + 1,
          type: 'gold',
          text: '==================================================\n[CLASSIFIED BIO-DEPOT ARCHIVE BREACHED]\n> Deep Override: neondepths\n> Ledger Credit: +250 Neno Coins deposited!\n> *** UNLOCKED SECRET SKIN: Lunar Astronaut EVA ***\n> Protocol status: Apollo EVA suit now accessible in Wardrobe!\n=================================================='
        });
      }
    }
    // Command: help
    else if (lower === 'help') {
      newLines.push({
        id: Date.now() + 1,
        type: 'system',
        text: `AVAILABLE NMD COMMANDS:
  help            - Display this diagnostics overview
  balance         - Print active subterranean Neno Coin reserves
  status          - Display chamber telemetry, current hammer & power
  cls / clear     - Clear the terminal screen buffer
  matrix          - Trigger the green subterranean neural stream
  ver             - Display NMD Subterranean Kernel build information
  <KEY>           - Input developer authorization override keys`
      });
    }
    // Command: balance
    else if (lower === 'balance') {
      newLines.push({
        id: Date.now() + 1,
        type: 'success',
        text: `ACTIVE LEDGER BALANCE: ${playerCoins} Neno Coins (Ⓝ)`
      });
    }
    // Command: status
    else if (lower === 'status') {
      newLines.push({
        id: Date.now() + 1,
        type: 'system',
        text: `SUB-LEVEL TELEMETRY REPORT:
  Sector Location   : Chamber ${String(currentRoom).padStart(3, '0')}
  Equipped Impact   : ${hammerName} (Power ×${hammerPower})
  Terminal Protocol : NMD Kernel 9.9 Active
  Registered Cheats : ${redeemedCodes.length > 0 ? redeemedCodes.join(', ') : 'None'}`
      });
    }
    // Command: cls or clear
    else if (lower === 'cls' || lower === 'clear') {
      setOutput([]);
      setInputVal('');
      return;
    }
    // Command: ver
    else if (lower === 'ver') {
      newLines.push({
        id: Date.now() + 1,
        type: 'system',
        text: 'Neno Machine Diagnostic (NMD) [Kernel v9.9.102_x64-Subterranean]'
      });
    }
    // Command: matrix
    else if (lower === 'matrix') {
      newLines.push({
        id: Date.now() + 1,
        type: 'success',
        text: `01010010 01001111 01001111 01001101 00111001 00111001
[NEURAL STREAM ONLINE]: Wake up, Courier. The vault has you.`
      });
    }
    // Unknown command
    else {
      newLines.push({
        id: Date.now() + 1,
        type: 'error',
        text: `'${cmd}' is not recognized as an internal or external command, operable program or valid authorization key.`
      });
    }

    setOutput(prev => [...prev, ...newLines]);
    setInputVal('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleCommand(inputVal);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (history.length === 0) return;
      const nextIdx = historyIndex === -1 ? history.length - 1 : Math.max(0, historyIndex - 1);
      setHistoryIndex(nextIdx);
      setInputVal(history[nextIdx]);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex === -1) return;
      const nextIdx = historyIndex + 1;
      if (nextIdx >= history.length) {
        setHistoryIndex(-1);
        setInputVal('');
      } else {
        setHistoryIndex(nextIdx);
        setInputVal(history[nextIdx]);
      }
    }
  };

  return (
    <div
      onClick={() => inputRef.current?.focus()}
      className="flex-1 flex flex-col bg-[#0c0c0c] text-[#cccccc] font-mono p-3 text-xs select-text overflow-hidden cursor-text"
    >
      {/* Terminal Title Bar Sub-header */}
      <div className="flex items-center justify-between border-b border-[#222222] pb-1.5 mb-2 select-none">
        <div className="flex items-center gap-1.5 text-slate-400">
          <Terminal className="w-3.5 h-3.5 text-emerald-400" />
          <span className="text-[11px] font-bold">NMD: Command Prompt - System99</span>
        </div>
        <span className="text-[10px] text-slate-600 font-sans">Type 'help' for docs</span>
      </div>

      {/* Terminal Output Stream */}
      <div className="flex-1 overflow-y-auto space-y-1 pr-1 leading-relaxed whitespace-pre-wrap">
        {output.map((line) => (
          <div
            key={line.id}
            className={`${
              line.type === 'prompt'
                ? 'text-white font-bold'
                : line.type === 'gold'
                  ? 'text-amber-300 font-bold'
                  : line.type === 'success'
                    ? 'text-emerald-400'
                    : line.type === 'error'
                      ? 'text-rose-400'
                      : 'text-[#aaaaaa]'
            }`}
          >
            {line.text}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Active Command Line Input (<System99/A:/>) */}
      <div className="flex items-center gap-2 mt-2 pt-2 border-t border-[#1e1e1e] select-none">
        <span className="text-emerald-400 font-bold shrink-0">&lt;System99/A:/&gt;</span>
        <input
          ref={inputRef}
          type="text"
          value={inputVal}
          onChange={(e) => setInputVal(e.target.value)}
          onKeyDown={handleKeyDown}
          autoFocus
          spellCheck={false}
          autoComplete="off"
          className="flex-1 bg-transparent text-white font-mono outline-none border-none caret-emerald-400 text-xs"
          placeholder="Enter command or cheat key..."
        />
      </div>
    </div>
  );
}
