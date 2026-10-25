import React, { useState, useEffect, useRef } from 'react';
import { sound } from '../audio/sound';
import {
  Clock as ClockIcon,
  Timer as TimerIcon,
  Hourglass,
  Bell,
  Play,
  Pause,
  RotateCcw,
  Plus,
  Trash2,
  Globe,
  Compass,
  Volume2
} from 'lucide-react';

export function ClockApp() {
  const [activeTab, setActiveTab] = useState<'world' | 'timer' | 'stopwatch' | 'alarm'>('world');

  // Live Current Time
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // --- STOPWATCH STATE ---
  const [swRunning, setSwRunning] = useState(false);
  const [swTime, setSwTime] = useState(0); // in ms
  const [laps, setLaps] = useState<number[]>([]);
  const swLastRef = useRef<number | null>(null);

  useEffect(() => {
    let animId: number;
    const update = (timestamp: number) => {
      if (swLastRef.current !== null) {
        const delta = timestamp - swLastRef.current;
        setSwTime(prev => prev + delta);
      }
      swLastRef.current = timestamp;
      animId = requestAnimationFrame(update);
    };

    if (swRunning) {
      swLastRef.current = performance.now();
      animId = requestAnimationFrame(update);
    } else {
      swLastRef.current = null;
    }

    return () => cancelAnimationFrame(animId);
  }, [swRunning]);

  const handleSwToggle = () => {
    sound.playClick();
    setSwRunning(prev => !prev);
  };

  const handleSwReset = () => {
    sound.playClick();
    setSwRunning(false);
    setSwTime(0);
    setLaps([]);
  };

  const handleSwLap = () => {
    if (!swRunning) return;
    sound.playClick();
    setLaps(prev => [swTime, ...prev]);
  };

  const formatMs = (ms: number) => {
    const totalSec = Math.floor(ms / 1000);
    const m = Math.floor(totalSec / 60);
    const s = totalSec % 60;
    const centis = Math.floor((ms % 1000) / 10);
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}.${String(centis).padStart(2, '0')}`;
  };

  // --- COUNTDOWN TIMER STATE ---
  const [timerDuration, setTimerDuration] = useState(180); // default 3 min
  const [timerRemaining, setTimerRemaining] = useState(180);
  const [timerRunning, setTimerRunning] = useState(false);
  const [timerAlarmTriggered, setTimerAlarmTriggered] = useState(false);

  useEffect(() => {
    let interval: any = null;
    if (timerRunning && timerRemaining > 0) {
      interval = setInterval(() => {
        setTimerRemaining(prev => {
          if (prev <= 1) {
            setTimerRunning(false);
            setTimerAlarmTriggered(true);
            sound.playAlarm();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timerRunning, timerRemaining]);

  const handleTimerToggle = () => {
    sound.playClick();
    if (timerAlarmTriggered) {
      setTimerAlarmTriggered(false);
    }
    if (timerRemaining === 0) {
      setTimerRemaining(timerDuration);
    }
    setTimerRunning(prev => !prev);
  };

  const handleTimerReset = () => {
    sound.playClick();
    setTimerRunning(false);
    setTimerAlarmTriggered(false);
    setTimerRemaining(timerDuration);
  };

  const handleSetPreset = (seconds: number) => {
    sound.playClick();
    setTimerRunning(false);
    setTimerAlarmTriggered(false);
    setTimerDuration(seconds);
    setTimerRemaining(seconds);
  };

  // --- ALARM STATE ---
  const [alarms, setAlarms] = useState<Array<{ id: string; time: string; label: string; active: boolean }>>([
    { id: '1', time: '06:30', label: 'Vault Shift Inspection', active: true },
    { id: '2', time: '12:00', label: 'Runic Core Cycle', active: false },
    { id: '3', time: '20:00', label: 'Facility Bulkhead Lockout', active: true }
  ]);
  const [newAlarmTime, setNewAlarmTime] = useState('08:00');
  const [newAlarmLabel, setNewAlarmLabel] = useState('Deep Drill Resupply');
  const [showAddAlarm, setShowAddAlarm] = useState(false);

  const toggleAlarm = (id: string) => {
    sound.playClick();
    setAlarms(curr => curr.map(a => a.id === id ? { ...a, active: !a.active } : a));
  };

  const addAlarm = () => {
    if (!newAlarmTime) return;
    sound.playClick();
    setAlarms(curr => [
      ...curr,
      {
        id: String(Date.now()),
        time: newAlarmTime,
        label: newAlarmLabel || 'Custom Alarm',
        active: true
      }
    ]);
    setShowAddAlarm(false);
    setNewAlarmLabel('');
  };

  const deleteAlarm = (id: string) => {
    sound.playClick();
    setAlarms(curr => curr.filter(a => a.id !== id));
  };

  // Analog Clock Math
  const seconds = now.getSeconds();
  const minutes = now.getMinutes();
  const hours = now.getHours() % 12;
  const secAngle = seconds * 6;
  const minAngle = minutes * 6 + seconds * 0.1;
  const hourAngle = hours * 30 + minutes * 0.5;

  return (
    <div className="flex-1 flex flex-col bg-slate-950 text-slate-100 select-none overflow-hidden font-sans">
      {/* Top Windows 10 Header / Navigation Bar */}
      <div className="h-12 border-b border-slate-800 bg-slate-900/80 px-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ClockIcon className="w-4 h-4 text-sky-400" />
          <span className="text-xs font-bold text-sky-200 tracking-wider">CHRONOMETER & CLOCK</span>
        </div>

        <div className="flex items-center bg-slate-950/80 p-0.5 rounded-lg border border-slate-800 text-xs">
          <button
            onClick={() => { setActiveTab('world'); sound.playClick(); }}
            className={`px-3 py-1 rounded-md transition font-medium flex items-center gap-1.5 ${
              activeTab === 'world' ? 'bg-sky-500 text-white font-bold shadow' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            <span>World Clock</span>
          </button>
          <button
            onClick={() => { setActiveTab('timer'); sound.playClick(); }}
            className={`px-3 py-1 rounded-md transition font-medium flex items-center gap-1.5 ${
              activeTab === 'timer' ? 'bg-sky-500 text-white font-bold shadow' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Hourglass className="w-3.5 h-3.5" />
            <span>Timer</span>
          </button>
          <button
            onClick={() => { setActiveTab('stopwatch'); sound.playClick(); }}
            className={`px-3 py-1 rounded-md transition font-medium flex items-center gap-1.5 ${
              activeTab === 'stopwatch' ? 'bg-sky-500 text-white font-bold shadow' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <TimerIcon className="w-3.5 h-3.5" />
            <span>Stopwatch</span>
          </button>
          <button
            onClick={() => { setActiveTab('alarm'); sound.playClick(); }}
            className={`px-3 py-1 rounded-md transition font-medium flex items-center gap-1.5 ${
              activeTab === 'alarm' ? 'bg-sky-500 text-white font-bold shadow' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Bell className="w-3.5 h-3.5" />
            <span>Alarm</span>
          </button>
        </div>
      </div>

      {/* Main Body Panel */}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col">
        {/* --- TAB 1: WORLD CLOCK & FACILITY CHRONOMETER --- */}
        {activeTab === 'world' && (
          <div className="flex-1 flex flex-col sm:flex-row gap-6 items-center justify-center">
            {/* Left: Animated Analog Clock Dial */}
            <div className="relative w-48 h-48 rounded-full border-4 border-slate-700 bg-slate-900/90 shadow-2xl flex items-center justify-center">
              {/* Dial tick marks */}
              {Array.from({ length: 12 }).map((_, i) => (
                <div
                  key={i}
                  className="absolute w-1 h-3 bg-slate-600 rounded-full"
                  style={{
                    transform: `rotate(${i * 30}deg) translateY(-84px)`
                  }}
                />
              ))}

              {/* Hour hand */}
              <div
                className="absolute w-1.5 h-12 bg-sky-300 rounded-full origin-bottom shadow"
                style={{
                  bottom: '50%',
                  transform: `rotate(${hourAngle}deg)`
                }}
              />

              {/* Minute hand */}
              <div
                className="absolute w-1 h-18 bg-white rounded-full origin-bottom shadow"
                style={{
                  bottom: '50%',
                  transform: `rotate(${minAngle}deg)`
                }}
              />

              {/* Second hand */}
              <div
                className="absolute w-0.5 h-20 bg-rose-500 rounded-full origin-bottom"
                style={{
                  bottom: '50%',
                  transform: `rotate(${secAngle}deg)`
                }}
              />

              {/* Center Pivot Pin */}
              <div className="absolute w-3.5 h-3.5 rounded-full bg-rose-500 border-2 border-white shadow" />
            </div>

            {/* Right: Digital Time Readouts & Timezones */}
            <div className="space-y-4 max-w-sm w-full">
              <div className="p-4 bg-slate-900/90 border border-slate-800 rounded-xl shadow-lg">
                <span className="text-[10px] font-bold text-sky-400 uppercase tracking-widest block">
                  Room 99 Subterranean Deep Core Time
                </span>
                <div className="text-3xl font-black text-white tabular-nums tracking-wider mt-0.5">
                  {now.toLocaleTimeString([], { hour12: false })}
                </div>
                <div className="text-xs text-slate-400 mt-1 flex items-center gap-2">
                  <span>{now.toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' })}</span>
                  <span className="px-1.5 py-0.5 rounded bg-sky-950 text-sky-300 text-[10px] font-bold border border-sky-800">
                    DEPTH LEVEL 99
                  </span>
                </div>
              </div>

              {/* Secondary Zones */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800/80">
                  <div className="text-[10px] font-bold text-slate-400">SURFACE UTC</div>
                  <div className="text-sm font-bold text-slate-200 tabular-nums">
                    {now.toLocaleTimeString('en-US', { timeZone: 'UTC', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })}
                  </div>
                </div>

                <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800/80">
                  <div className="text-[10px] font-bold text-slate-400">TOKYO</div>
                  <div className="text-sm font-bold text-slate-200 tabular-nums">
                    {now.toLocaleTimeString('en-US', { timeZone: 'Asia/Tokyo', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })}
                  </div>
                </div>

                <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800/80">
                  <div className="text-[10px] font-bold text-slate-400">NEW YORK</div>
                  <div className="text-sm font-bold text-slate-200 tabular-nums">
                    {now.toLocaleTimeString('en-US', { timeZone: 'America/New_York', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })}
                  </div>
                </div>

                <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800/80">
                  <div className="text-[10px] font-bold text-slate-400">LONDON</div>
                  <div className="text-sm font-bold text-slate-200 tabular-nums">
                    {now.toLocaleTimeString('en-US', { timeZone: 'Europe/London', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* --- TAB 2: TIMER --- */}
        {activeTab === 'timer' && (
          <div className="flex-1 flex flex-col items-center justify-center space-y-5">
            {/* Alarm Banner if expired */}
            {timerAlarmTriggered && (
              <div className="px-4 py-2 rounded-xl bg-rose-600/30 border border-rose-500 text-rose-200 text-xs font-bold animate-pulse flex items-center gap-2">
                <Volume2 className="w-4 h-4 text-rose-400" />
                <span>TIMER COMPLETED! AUDIBLE ALARM SOUNDING!</span>
              </div>
            )}

            {/* Circular Progress Ring with Digital Countdown */}
            <div className="relative w-52 h-52 rounded-full border-8 border-slate-800 flex flex-col items-center justify-center bg-slate-900/80 shadow-2xl">
              <span className="text-[10px] font-bold text-sky-400 uppercase tracking-widest mb-1">
                COUNTDOWN
              </span>
              <div className="text-4xl font-black text-white tabular-nums tracking-widest">
                {String(Math.floor(timerRemaining / 60)).padStart(2, '0')}:
                {String(timerRemaining % 60).padStart(2, '0')}
              </div>
              <span className="text-[11px] text-slate-400 mt-1">
                Total: {Math.floor(timerDuration / 60)} min
              </span>
            </div>

            {/* Presets */}
            <div className="flex items-center gap-1.5 flex-wrap justify-center">
              {[60, 180, 300, 600, 900].map(sec => (
                <button
                  key={sec}
                  onClick={() => handleSetPreset(sec)}
                  className={`px-3 py-1 rounded-lg border text-xs font-semibold transition ${
                    timerDuration === sec
                      ? 'bg-sky-500/20 border-sky-400 text-sky-200'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-600 hover:text-white'
                  }`}
                >
                  {sec / 60}m
                </button>
              ))}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3">
              <button
                onClick={handleTimerToggle}
                className={`px-6 py-2.5 rounded-xl font-black text-xs flex items-center gap-2 shadow-lg transition ${
                  timerRunning
                    ? 'bg-amber-500 hover:bg-amber-400 text-amber-950'
                    : 'bg-sky-500 hover:bg-sky-400 text-white shadow-sky-500/20'
                }`}
              >
                {timerRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                <span>{timerRunning ? 'PAUSE' : 'START'}</span>
              </button>

              <button
                onClick={handleTimerReset}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-bold text-xs flex items-center gap-1.5 border border-slate-700 transition"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>RESET</span>
              </button>
            </div>
          </div>
        )}

        {/* --- TAB 3: STOPWATCH --- */}
        {activeTab === 'stopwatch' && (
          <div className="flex-1 flex flex-col items-center justify-between">
            <div className="my-auto text-center">
              <div className="text-5xl sm:text-6xl font-black text-white tabular-nums tracking-widest drop-shadow-md">
                {formatMs(swTime)}
              </div>
              <div className="text-xs text-slate-400 mt-2 font-medium">PRECISION FACILITY STOPWATCH</div>
            </div>

            {/* Split Laps Display */}
            {laps.length > 0 && (
              <div className="w-full max-w-sm h-32 overflow-y-auto bg-slate-900/90 rounded-xl border border-slate-800 p-2 space-y-1 mb-4">
                <div className="text-[10px] font-bold text-slate-500 px-2 flex justify-between">
                  <span>LAP</span>
                  <span>SPLIT TIME</span>
                </div>
                {laps.map((lapTime, idx) => (
                  <div
                    key={idx}
                    className="flex justify-between items-center px-2 py-1 rounded bg-slate-950/60 text-xs font-mono"
                  >
                    <span className="text-sky-400 font-bold">Lap {laps.length - idx}</span>
                    <span className="text-slate-200 tabular-nums">{formatMs(lapTime)}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Controls */}
            <div className="flex items-center gap-3 mb-2">
              <button
                onClick={handleSwToggle}
                className={`px-6 py-2.5 rounded-xl font-black text-xs flex items-center gap-2 shadow-lg transition ${
                  swRunning
                    ? 'bg-amber-500 hover:bg-amber-400 text-amber-950'
                    : 'bg-emerald-500 hover:bg-emerald-400 text-white shadow-emerald-500/20'
                }`}
              >
                {swRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                <span>{swRunning ? 'PAUSE' : 'START'}</span>
              </button>

              <button
                onClick={handleSwLap}
                disabled={!swRunning}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-300 hover:text-white font-bold text-xs flex items-center gap-1.5 border border-slate-700 transition"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>LAP</span>
              </button>

              <button
                onClick={handleSwReset}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-bold text-xs flex items-center gap-1.5 border border-slate-700 transition"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>RESET</span>
              </button>
            </div>
          </div>
        )}

        {/* --- TAB 4: ALARMS --- */}
        {activeTab === 'alarm' && (
          <div className="flex-1 flex flex-col space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div>
                <h3 className="text-sm font-black text-slate-100">FACILITY ALARMS</h3>
                <p className="text-[11px] text-slate-400">Program automated shift and vault inspection chimes.</p>
              </div>
              <button
                onClick={() => { setShowAddAlarm(prev => !prev); sound.playClick(); }}
                className="px-3 py-1.5 bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>New Alarm</span>
              </button>
            </div>

            {/* Add Alarm Form */}
            {showAddAlarm && (
              <div className="p-3 bg-slate-900 border border-sky-500/40 rounded-xl space-y-2 animate-fade-in">
                <div className="flex items-center gap-2">
                  <input
                    type="time"
                    value={newAlarmTime}
                    onChange={(e) => setNewAlarmTime(e.target.value)}
                    className="bg-slate-950 border border-slate-700 rounded px-2.5 py-1 text-sm font-mono text-white outline-none focus:border-sky-400"
                  />
                  <input
                    type="text"
                    value={newAlarmLabel}
                    onChange={(e) => setNewAlarmLabel(e.target.value)}
                    placeholder="Alarm label..."
                    className="flex-1 bg-slate-950 border border-slate-700 rounded px-2.5 py-1 text-xs text-white placeholder:text-slate-500 outline-none focus:border-sky-400"
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => setShowAddAlarm(false)}
                    className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={addAlarm}
                    className="px-3 py-1 rounded bg-sky-500 hover:bg-sky-400 text-white text-xs font-bold"
                  >
                    Save Alarm
                  </button>
                </div>
              </div>
            )}

            {/* Alarm List */}
            <div className="space-y-2 flex-1 overflow-y-auto">
              {alarms.map(alarm => (
                <div
                  key={alarm.id}
                  className="p-3 rounded-xl bg-slate-900/90 border border-slate-800/90 flex items-center justify-between shadow"
                >
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => toggleAlarm(alarm.id)}
                      className={`w-9 h-5 rounded-full transition p-0.5 ${
                        alarm.active ? 'bg-sky-500' : 'bg-slate-700'
                      }`}
                    >
                      <div className={`w-4 h-4 rounded-full bg-white transition-transform ${
                        alarm.active ? 'translate-x-4' : 'translate-x-0'
                      }`} />
                    </button>
                    <div>
                      <div className="text-xl font-black text-white tabular-nums tracking-wider">{alarm.time}</div>
                      <div className="text-[11px] text-slate-400">{alarm.label}</div>
                    </div>
                  </div>

                  <button
                    onClick={() => deleteAlarm(alarm.id)}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-slate-800 transition"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
