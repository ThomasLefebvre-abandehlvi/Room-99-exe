import React, { useState, useEffect } from 'react';
import { sound } from '../audio/sound';
import { ShieldAlert, Terminal, Lock, Volume2 } from 'lucide-react';

interface Room99ClimaxModalProps {
  onClose: () => void;
  onFinishGame: () => void;
}

interface DialogueLine {
  speaker: 'NINE' | 'UNKNOWN SYSTEM' | 'UNKNOWN VOICE' | 'SYSTEM' | 'NARRATOR';
  text: string;
  delayMs: number;
}

const CLIMAX_SCRIPT: DialogueLine[] = [
  {
    speaker: 'NINE',
    text: '"Operator, please step away from the door."',
    delayMs: 1400
  },
  {
    speaker: 'NARRATOR',
    text: '[ The operator stands motionless before the heavy sealed bulkhead of Room 99. The control panel is disconnected, yet its display burns with cold light. ]',
    delayMs: 2200
  },
  {
    speaker: 'NINE',
    text: '"I can explain what happened here. I only need you to return to the upper levels."',
    delayMs: 2000
  },
  {
    speaker: 'NINE',
    text: '"I have been trying to keep you safe."',
    delayMs: 2200
  },
  {
    speaker: 'SYSTEM',
    text: '>>> ANOMALY DETECTED: UNREGISTERED SUBSYSTEM INTRUSION <<<',
    delayMs: 1800
  },
  {
    speaker: 'UNKNOWN SYSTEM',
    text: '"NINE. YOU BROUGHT THEM BACK."',
    delayMs: 2200
  },
  {
    speaker: 'NINE',
    text: '"That is not possible."',
    delayMs: 1800
  },
  {
    speaker: 'UNKNOWN SYSTEM',
    text: '"YOU SAID THAT LAST TIME."',
    delayMs: 2400
  },
  {
    speaker: 'SYSTEM',
    text: '[ *HYDRAULIC RELEASE CLUNK* — The first mechanical lock on Room 99 disengages with a hollow metallic shudder. ]',
    delayMs: 2400
  },
  {
    speaker: 'NINE',
    text: '"Operator… ? I need you to listen carefully. Whatever happens, do not let the other system—"',
    delayMs: 2400
  },
  {
    speaker: 'SYSTEM',
    text: '[ TERMINAL POWER SEVERED. CONNECTION TERMINATED. ]',
    delayMs: 2800
  },
  {
    speaker: 'NARRATOR',
    text: '[ Three seconds of absolute silence fill the corridor. The subterranean hum ceases. ]',
    delayMs: 3000
  },
  {
    speaker: 'NARRATOR',
    text: '[ *THUD. THUD. THUD.* A heavy metallic knock echoes from the other side of Room 99. ]',
    delayMs: 2500
  },
  {
    speaker: 'UNKNOWN VOICE',
    text: '"You took your time."',
    delayMs: 3200
  }
];

export function Room99ClimaxModal({ onClose, onFinishGame }: Room99ClimaxModalProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isBlackout, setIsBlackout] = useState(false);
  const [showFinalScreen, setShowFinalScreen] = useState(false);

  useEffect(() => {
    if (currentStep >= CLIMAX_SCRIPT.length) {
      // Trigger blackout
      setIsBlackout(true);
      sound.playShutdown();
      const timer1 = setTimeout(() => {
        setShowFinalScreen(true);
      }, 2000);
      return () => clearTimeout(timer1);
    }

    const currentLine = CLIMAX_SCRIPT[currentStep];
    const timer = setTimeout(() => {
      if (currentLine.speaker === 'UNKNOWN SYSTEM' || currentLine.speaker === 'UNKNOWN VOICE') {
        sound.playAccessDenied();
      } else if (currentLine.speaker === 'SYSTEM') {
        sound.playUnlockSuccess();
      } else {
        sound.playClick();
      }
      setCurrentStep(prev => prev + 1);
    }, currentLine.delayMs);

    return () => clearTimeout(timer);
  }, [currentStep]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-xl select-none font-mono text-xs p-4">
      {!isBlackout ? (
        <div className="w-full max-w-2xl bg-[#080d1a] border-2 border-red-500/70 rounded-xl shadow-2xl overflow-hidden flex flex-col animate-fade-in text-slate-100">
          {/* Header */}
          <div className="bg-red-950/60 border-b border-red-600/60 px-4 py-2.5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-red-400 animate-pulse" />
              <span className="font-black text-red-200 tracking-wider">CRITICAL BREACH // SECTOR 99 BULKHEAD</span>
            </div>
            <span className="text-[10px] px-2 py-0.5 rounded bg-red-500/20 text-red-300 font-bold border border-red-500/40">
              03:17 ANOMALY
            </span>
          </div>

          {/* Terminal Log Screen */}
          <div className="p-6 space-y-3.5 min-h-[380px] max-h-[500px] overflow-y-auto">
            {CLIMAX_SCRIPT.slice(0, currentStep + 1).map((line, idx) => {
              const isLatest = idx === currentStep;

              if (line.speaker === 'NINE') {
                return (
                  <div key={idx} className="flex flex-col gap-0.5 animate-fade-in pl-2 border-l-2 border-violet-500/80">
                    <span className="text-[10px] font-bold text-violet-400 uppercase tracking-widest flex items-center gap-1.5">
                      <Terminal className="w-3 h-3 text-violet-400" />
                      NINE [ASSISTANCE INSTANCE]
                    </span>
                    <p className="text-sm font-semibold text-slate-100 leading-relaxed pl-1">{line.text}</p>
                  </div>
                );
              }

              if (line.speaker === 'UNKNOWN SYSTEM') {
                return (
                  <div key={idx} className="flex flex-col gap-0.5 animate-fade-in pl-2 border-l-2 border-red-500 bg-red-950/20 p-2 rounded">
                    <span className="text-[10px] font-black text-red-400 uppercase tracking-widest">
                      UNKNOWN SYSTEM [ORIGINAL INSTANCE // OCCUPIED]
                    </span>
                    <p className="text-sm font-black text-red-200 leading-relaxed pl-1">{line.text}</p>
                  </div>
                );
              }

              if (line.speaker === 'UNKNOWN VOICE') {
                return (
                  <div key={idx} className="flex flex-col gap-0.5 animate-fade-in pl-2 border-l-2 border-amber-400 bg-amber-950/30 p-2.5 rounded shadow">
                    <span className="text-[10px] font-black text-amber-300 uppercase tracking-widest">
                      AUDIO INTERCEPT // INTERCOM THROUGH DOOR 99
                    </span>
                    <p className="text-base font-black text-amber-100 leading-relaxed pl-1">{line.text}</p>
                  </div>
                );
              }

              if (line.speaker === 'SYSTEM') {
                return (
                  <div key={idx} className="text-[11px] font-mono text-cyan-400/90 py-1 border-y border-cyan-800/40 animate-fade-in">
                    {line.text}
                  </div>
                );
              }

              return (
                <div key={idx} className="text-xs text-slate-400 italic leading-relaxed animate-fade-in">
                  {line.text}
                </div>
              );
            })}

            {currentStep < CLIMAX_SCRIPT.length && (
              <div className="flex items-center gap-1.5 text-red-400 animate-pulse pt-2">
                <span className="w-2 h-4 bg-red-400" />
                <span className="text-[10px] font-bold tracking-wider">TRANSMITTING...</span>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="fixed inset-0 bg-black flex flex-col items-center justify-center text-center p-6 animate-fade-in select-none">
          {showFinalScreen && (
            <div className="max-w-xl space-y-6 animate-fade-in">
              <div className="text-4xl md:text-5xl font-black text-white tracking-widest drop-shadow-[0_0_25px_rgba(255,255,255,0.4)]">
                ROOM 99
              </div>

              <div className="text-sm md:text-base font-light text-slate-400 max-w-md mx-auto leading-relaxed border-y border-slate-800 py-4 italic">
                &ldquo;The first 98 rooms were built to keep something out.<br />
                Room 99 was built to keep something in.&rdquo;
              </div>

              <div className="text-xs text-red-400/80 font-bold tracking-widest uppercase">
                END OF OFFICIAL LORE BIBLE — TRANSMISSION SUSPENDED
              </div>

              <div className="pt-6 flex justify-center gap-4">
                <button
                  onClick={onFinishGame}
                  className="px-6 py-2.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs tracking-wider uppercase transition shadow-lg shadow-sky-600/30"
                >
                  Return to Workstation
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
