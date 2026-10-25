import React, { useState, useEffect } from 'react';
import { sound } from '../audio/sound';
import { Calculator as CalcIcon, Delete, Copy, Check, Sparkles, KeyRound } from 'lucide-react';

export interface CalculatorAppProps {
  currentRoom: number;
  isPuzzleRoom: boolean;
  puzzleFormula: string;
  puzzleSolution: string;
  vaultCodeLocked: boolean;
  onUnlockVaultWithCode: (code: string) => void;
}

export function CalculatorApp({
  currentRoom,
  isPuzzleRoom,
  puzzleFormula,
  puzzleSolution,
  vaultCodeLocked,
  onUnlockVaultWithCode
}: CalculatorAppProps) {
  const [expression, setExpression] = useState('');
  const [displayValue, setDisplayValue] = useState('0');
  const [history, setHistory] = useState<string[]>([]);
  const [copied, setCopied] = useState(false);

  // Safe Math Expression Evaluator
  const evaluateExpression = (expr: string): string => {
    try {
      // Clean up expression: replace standard display symbols if any
      const sanitized = expr
        .replace(/×/g, '*')
        .replace(/÷/g, '/')
        .replace(/\^/g, '**');

      // Only allow digits, basic operators, parens, decimal, spaces
      if (!/^[0-9+\-*/().\s*]+$/.test(sanitized)) {
        return 'Error';
      }

      // Safe evaluation using Function
      const result = new Function(`'use strict'; return (${sanitized});`)();
      if (typeof result !== 'number' || isNaN(result) || !isFinite(result)) {
        return 'Error';
      }

      // Format result (round to 6 decimal places if needed)
      return String(Math.round(result * 1000000) / 1000000);
    } catch {
      return 'Error';
    }
  };

  const handleInput = (char: string) => {
    sound.playKeypadBeep(650);
    setExpression(prev => {
      // If previous display is Error or 0, start clean for numbers
      if (prev === 'Error') return char;
      return prev + char;
    });
  };

  const handleClear = () => {
    sound.playClick();
    setExpression('');
    setDisplayValue('0');
  };

  const handleBackspace = () => {
    sound.playClick();
    setExpression(prev => prev.slice(0, -1));
  };

  const handleEqual = () => {
    if (!expression.trim()) return;
    const res = evaluateExpression(expression);
    sound.playKeypadBeep(920);

    if (res !== 'Error') {
      setHistory(prev => [`${expression} = ${res}`, ...prev.slice(0, 7)]);
      setDisplayValue(res);
      setExpression(res);
    } else {
      setDisplayValue('Error');
      sound.playAccessDenied();
    }
  };

  const handleLoadPuzzleFormula = () => {
    sound.playClick();
    setExpression(puzzleFormula);
    setDisplayValue(puzzleFormula);
  };

  const handleCopy = () => {
    navigator.clipboard?.writeText(displayValue);
    setCopied(true);
    sound.playClick();
    setTimeout(() => setCopied(false), 1800);
  };

  // Keyboard support when inside Calculator
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key;
      if (['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '+', '-', '*', '/', '(', ')'].includes(key)) {
        e.preventDefault();
        handleInput(key);
      } else if (key === 'Enter' || key === '=') {
        e.preventDefault();
        handleEqual();
      } else if (key === 'Backspace') {
        e.preventDefault();
        handleBackspace();
      } else if (key === 'Escape' || key.toLowerCase() === 'c') {
        e.preventDefault();
        handleClear();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  });

  const isSolvedCode = displayValue === puzzleSolution && puzzleSolution.length === 4;

  return (
    <div className="flex-1 flex flex-col bg-slate-950 text-slate-100 select-none overflow-hidden font-sans">
      {/* Math Puzzle Quick-Load Banner if currently in a Puzzle Room */}
      {isPuzzleRoom && vaultCodeLocked && (
        <div className="bg-gradient-to-r from-amber-950/80 via-slate-900 to-amber-950/80 border-b border-amber-500/40 p-2.5 px-3 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2 overflow-hidden">
            <KeyRound className="w-4 h-4 text-amber-400 shrink-0" />
            <div className="truncate">
              <span className="text-[10px] font-bold text-amber-300 block uppercase tracking-wider">
                CHAMBER {String(currentRoom).padStart(3, '0')} VAULT CIPHER:
              </span>
              <code className="text-xs font-mono text-amber-100 font-bold">{puzzleFormula}</code>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleLoadPuzzleFormula}
              className="px-2.5 py-1 rounded bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-400/50 text-xs font-bold transition flex items-center gap-1"
            >
              <Sparkles className="w-3 h-3 text-amber-300" />
              <span>Load Puzzle</span>
            </button>

            {isSolvedCode && (
              <button
                onClick={() => onUnlockVaultWithCode(puzzleSolution)}
                className="px-3 py-1 rounded bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-black transition animate-bounce shadow-lg shadow-emerald-500/20"
              >
                Unlock Vault ({puzzleSolution})
              </button>
            )}
          </div>
        </div>
      )}

      {/* Main Calculator Workspace */}
      <div className="flex-1 p-4 flex flex-col max-w-sm mx-auto w-full justify-between">
        {/* Screen Display */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3 flex flex-col justify-end text-right shadow-inner min-h-[90px]">
          <div className="text-xs font-mono text-slate-400 truncate mb-1 min-h-[16px]">
            {expression || ' '}
          </div>
          <div className="text-3xl sm:text-4xl font-mono font-black text-white truncate tracking-wider">
            {displayValue || '0'}
          </div>

          <div className="flex items-center justify-between pt-1 border-t border-slate-800 mt-1">
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Standard Calc</span>
            <button
              onClick={handleCopy}
              className="text-[10px] text-slate-400 hover:text-sky-300 flex items-center gap-1 transition"
            >
              {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>
          </div>
        </div>

        {/* Keypad Grid (Standard Keys) */}
        <div className="grid grid-cols-4 gap-1.5 mt-3">
          {/* Row 1 */}
          <button
            onClick={() => handleInput('(')}
            className="p-2.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-sky-400 font-bold text-sm border border-slate-800"
          >
            (
          </button>
          <button
            onClick={() => handleInput(')')}
            className="p-2.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-sky-400 font-bold text-sm border border-slate-800"
          >
            )
          </button>
          <button
            onClick={handleClear}
            className="p-2.5 rounded-lg bg-slate-800/80 hover:bg-rose-900/40 text-rose-300 font-bold text-xs border border-slate-700"
          >
            C
          </button>
          <button
            onClick={handleBackspace}
            className="p-2.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 font-bold text-sm border border-slate-700 flex items-center justify-center"
          >
            <Delete className="w-4 h-4" />
          </button>

          {/* Row 2 */}
          <button
            onClick={() => handleInput('7')}
            className="p-3 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-black text-base border border-slate-800/80 shadow"
          >
            7
          </button>
          <button
            onClick={() => handleInput('8')}
            className="p-3 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-black text-base border border-slate-800/80 shadow"
          >
            8
          </button>
          <button
            onClick={() => handleInput('9')}
            className="p-3 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-black text-base border border-slate-800/80 shadow"
          >
            9
          </button>
          <button
            onClick={() => handleInput('/')}
            className="p-3 rounded-lg bg-slate-800 hover:bg-sky-600/40 text-sky-300 font-black text-base border border-slate-700"
          >
            /
          </button>

          {/* Row 3 */}
          <button
            onClick={() => handleInput('4')}
            className="p-3 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-black text-base border border-slate-800/80 shadow"
          >
            4
          </button>
          <button
            onClick={() => handleInput('5')}
            className="p-3 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-black text-base border border-slate-800/80 shadow"
          >
            5
          </button>
          <button
            onClick={() => handleInput('6')}
            className="p-3 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-black text-base border border-slate-800/80 shadow"
          >
            6
          </button>
          <button
            onClick={() => handleInput('*')}
            className="p-3 rounded-lg bg-slate-800 hover:bg-sky-600/40 text-sky-300 font-black text-base border border-slate-700"
          >
            *
          </button>

          {/* Row 4 */}
          <button
            onClick={() => handleInput('1')}
            className="p-3 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-black text-base border border-slate-800/80 shadow"
          >
            1
          </button>
          <button
            onClick={() => handleInput('2')}
            className="p-3 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-black text-base border border-slate-800/80 shadow"
          >
            2
          </button>
          <button
            onClick={() => handleInput('3')}
            className="p-3 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-black text-base border border-slate-800/80 shadow"
          >
            3
          </button>
          <button
            onClick={() => handleInput('-')}
            className="p-3 rounded-lg bg-slate-800 hover:bg-sky-600/40 text-sky-300 font-black text-base border border-slate-700"
          >
            -
          </button>

          {/* Row 5 */}
          <button
            onClick={() => handleInput('0')}
            className="p-3 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-black text-base border border-slate-800/80 shadow"
          >
            0
          </button>
          <button
            onClick={() => handleInput('.')}
            className="p-3 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-black text-base border border-slate-800/80 shadow"
          >
            .
          </button>
          <button
            onClick={handleEqual}
            className="p-3 rounded-lg bg-sky-500 hover:bg-sky-400 text-slate-950 font-black text-base shadow-lg shadow-sky-500/20"
          >
            =
          </button>
          <button
            onClick={() => handleInput('+')}
            className="p-3 rounded-lg bg-slate-800 hover:bg-sky-600/40 text-sky-300 font-black text-base border border-slate-700"
          >
            +
          </button>
        </div>
      </div>
    </div>
  );
}
