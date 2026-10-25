import React, { useState, useEffect } from 'react';
import { sound } from '../audio/sound';
import { Lock, Unlock, X, Calculator, AlertTriangle, Sparkles, CheckCircle2 } from 'lucide-react';

export interface KeypadModalProps {
  currentRoom: number;
  puzzleFormula: string;
  puzzleSolution: string;
  onSuccess: () => void;
  onClose: () => void;
  onOpenCalculator: () => void;
}

export function KeypadModal({
  currentRoom,
  puzzleFormula,
  puzzleSolution,
  onSuccess,
  onClose,
  onOpenCalculator
}: KeypadModalProps) {
  const [entered, setEntered] = useState('');
  const [errorStatus, setErrorStatus] = useState<string | null>(null);
  const [successStatus, setSuccessStatus] = useState(false);

  const handleDigit = (digit: string) => {
    if (successStatus) return;
    setErrorStatus(null);
    if (entered.length < 4) {
      sound.playKeypadBeep(600 + entered.length * 80);
      setEntered(prev => prev + digit);
    }
  };

  const handleBackspace = () => {
    if (successStatus) return;
    sound.playClick();
    setErrorStatus(null);
    setEntered(prev => prev.slice(0, -1));
  };

  const handleClear = () => {
    if (successStatus) return;
    sound.playClick();
    setErrorStatus(null);
    setEntered('');
  };

  const handleSubmit = () => {
    if (successStatus) return;
    if (entered.length !== 4) {
      setErrorStatus('Enter all 4 digits');
      sound.playAccessDenied();
      return;
    }

    if (entered === puzzleSolution) {
      setSuccessStatus(true);
      sound.playUnlockSuccess();
      setTimeout(() => {
        onSuccess();
      }, 950);
    } else {
      sound.playAccessDenied();
      setErrorStatus('ACCESS DENIED: INCORRECT CODE');
      setEntered('');
    }
  };

  // Keyboard navigation
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'].includes(e.key)) {
        e.preventDefault();
        handleDigit(e.key);
      } else if (e.key === 'Backspace') {
        e.preventDefault();
        handleBackspace();
      } else if (e.key === 'Enter') {
        e.preventDefault();
        handleSubmit();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  });

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md bg-slate-900 border-2 border-amber-500/50 rounded-2xl shadow-2xl overflow-hidden flex flex-col ring-1 ring-amber-400/20"
      >
        {/* Terminal Header */}
        <div className="bg-slate-950 px-4 py-3 border-b border-amber-500/30 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping" />
            <span className="text-xs font-black text-amber-200 tracking-wider">
              VAULT CIPHER TERMINAL // CHAMBER {String(currentRoom).padStart(3, '0')}
            </span>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Math Note Slate Recovery */}
        <div className="p-4 bg-slate-950/60 border-b border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400 font-bold">
            <span className="text-amber-400 flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
              <span>FACILITY SECURITY CIPHER NOTE:</span>
            </span>
            <button
              onClick={() => {
                onClose();
                onOpenCalculator();
              }}
              className="px-2 py-0.5 rounded bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 border border-sky-400/40 text-[10px] font-bold flex items-center gap-1 transition"
            >
              <Calculator className="w-3 h-3 text-sky-400" />
              <span>Solve in Calculator</span>
            </button>
          </div>

          <div className="p-2.5 rounded-lg bg-black/60 border border-amber-500/30 font-mono text-center">
            <span className="text-xs sm:text-sm font-black text-amber-300 tracking-wide select-all">
              {puzzleFormula}
            </span>
          </div>
          <p className="text-[10px] text-slate-400 text-center">
            Enter the formula into your laptop Calculator to obtain the 4-digit unlock code.
          </p>
        </div>

        {/* 4 Digit Displays */}
        <div className="p-5 flex flex-col items-center justify-center space-y-4">
          <div className="flex items-center gap-3">
            {[0, 1, 2, 3].map(i => {
              const char = entered[i] || '';
              return (
                <div
                  key={i}
                  className={`w-12 h-16 rounded-xl flex items-center justify-center font-mono text-2xl font-black transition-all ${
                    successStatus
                      ? 'bg-emerald-950/80 border-2 border-emerald-400 text-emerald-300 shadow-lg shadow-emerald-500/20'
                      : errorStatus
                        ? 'bg-rose-950/80 border-2 border-rose-500 text-rose-300 animate-shake'
                        : char
                          ? 'bg-slate-800 border-2 border-amber-400 text-amber-200'
                          : 'bg-slate-950 border border-slate-700 text-slate-600'
                  }`}
                >
                  {char || '_'}
                </div>
              );
            })}
          </div>

          {errorStatus && (
            <div className="text-xs font-bold text-rose-400 animate-fade-in">{errorStatus}</div>
          )}

          {successStatus && (
            <div className="text-xs font-bold text-emerald-400 flex items-center gap-1.5 animate-bounce">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>ACCESS GRANTED! VAULT UNSEALED!</span>
            </div>
          )}

          {/* Keypad Buttons */}
          <div className="grid grid-cols-3 gap-2 w-full max-w-[260px]">
            {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map(d => (
              <button
                key={d}
                onClick={() => handleDigit(d)}
                className="h-12 rounded-xl bg-slate-800 hover:bg-slate-700 active:scale-95 text-white font-mono font-black text-lg border border-slate-700 shadow transition flex items-center justify-center"
              >
                {d}
              </button>
            ))}

            <button
              onClick={handleClear}
              className="h-12 rounded-xl bg-slate-900 hover:bg-rose-900/40 text-rose-400 font-bold text-xs border border-slate-800 transition flex items-center justify-center"
            >
              CLEAR
            </button>

            <button
              onClick={() => handleDigit('0')}
              className="h-12 rounded-xl bg-slate-800 hover:bg-slate-700 active:scale-95 text-white font-mono font-black text-lg border border-slate-700 shadow transition flex items-center justify-center"
            >
              0
            </button>

            <button
              onClick={handleSubmit}
              className="h-12 rounded-xl bg-amber-500 hover:bg-amber-400 active:scale-95 text-amber-950 font-black text-xs shadow-lg shadow-amber-500/20 transition flex items-center justify-center"
            >
              ENTER
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
