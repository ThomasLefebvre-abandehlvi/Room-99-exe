import React, { useEffect, useRef, useState, useCallback } from 'react';
import { TOOLS, LAYOUTS, TERRAIN_TYPES, vaultDurability, SAVE_KEY, CANVAS_VIRTUAL_W, CANVAS_VIRTUAL_H } from './game/constants';
import { GameState, TerminalMessage, Layout, Quest, EnchantmentsState } from './types/game';
import { sound } from './audio/sound';
import { ParticleSystem } from './game/particles';
import { WALLPAPERS, Wallpaper } from './game/wallpapers';
import {
  ENCHANTMENTS_CONFIG,
  getEnchantmentCritChance,
  getEnchantmentSeismicBonus,
  getEnchantmentGreedMultiplier,
  getEnchantmentStaminaEfficiency
} from './game/enchantments';
import { INITIAL_QUESTS, updateQuestsProgress } from './game/quests';
import { SKINS_CONFIG, TRAILS_CONFIG } from './game/wardrobe';
import { generateMathPuzzle } from './game/mathPuzzles';
import { BOSS_CONFIGS, createBossForRoom } from './game/bosses';
import { WaterSorter } from './components/WaterSorter';
import { HammerEnchanting } from './components/HammerEnchanting';
import { QuestsApp } from './components/QuestsApp';
import { SettingsApp } from './components/SettingsApp';
import { DoogleBrowser } from './components/DoogleBrowser';
import { WardrobeApp } from './components/WardrobeApp';
import { NenoPrompt } from './components/NenoPrompt';
import { NotepadApp } from './components/NotepadApp';
import { NanoScanner } from './components/NanoScanner';
import { ClockApp } from './components/ClockApp';
import { CalculatorApp } from './components/CalculatorApp';
import { KeypadModal } from './components/KeypadModal';
import { Room99ClimaxModal } from './components/Room99ClimaxModal';
import {
  Volume2, VolumeX, Laptop as LaptopIcon, Sparkles, RefreshCw, HelpCircle,
  AlertTriangle, Send, Bot, Minus, Square, Copy, X, Power, Search, Wifi,
  Battery, Shield, Compass, ChevronUp, Gamepad2, Flame, Trophy, Globe, Settings as SettingsIcon,
  Shirt, Terminal as TerminalIcon, FileText, Radio, Key, Clock as ClockIcon, Calculator as CalcIcon,
  KeyRound, Skull
} from 'lucide-react';

interface AppWindow {
  id:
    | 'market'
    | 'crates'
    | 'nine-ai'
    | 'help'
    | 'enchant'
    | 'watersort'
    | 'quests'
    | 'settings'
    | 'doogle'
    | 'wardrobe'
    | 'prompt'
    | 'notepad'
    | 'nanoscanner'
    | 'clock'
    | 'calc';
  title: string;
  icon: string;
  isOpen: boolean;
  isMinimized: boolean;
  isMaximized: boolean;
  x: number;
  y: number;
  w: number;
  h: number;
  prevBounds?: { x: number; y: number; w: number; h: number };
  zIndex: number;
}

// Utility to create smooth annular sectors for radial action button quadrant frame
const makeAnnularQuarter = (cx: number, cy: number, r: number, R: number, startDeg: number, endDeg: number) => {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const a1 = toRad(startDeg);
  const a2 = toRad(endDeg);

  const x1 = (cx + R * Math.cos(a1)).toFixed(2);
  const y1 = (cy + R * Math.sin(a1)).toFixed(2);
  const x2 = (cx + R * Math.cos(a2)).toFixed(2);
  const y2 = (cy + R * Math.sin(a2)).toFixed(2);

  const x3 = (cx + r * Math.cos(a2)).toFixed(2);
  const y3 = (cy + r * Math.sin(a2)).toFixed(2);
  const x4 = (cx + r * Math.cos(a1)).toFixed(2);
  const y4 = (cy + r * Math.sin(a1)).toFixed(2);

  return `M ${x1} ${y1} A ${R} ${R} 0 0 1 ${x2} ${y2} L ${x3} ${y3} A ${r} ${r} 0 0 0 ${x4} ${y4} Z`;
};

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const desktopRef = useRef<HTMLDivElement | null>(null);
  const particlesRef = useRef(new ParticleSystem());
  // Remove wallpaperImg ref and add wallpaper selection state
  const [activeWallpaperId, setActiveWallpaperId] = useState<string>(() => {
    return localStorage.getItem('room99-wallpaper-id') || 'default-quantum-core';
  });

  const handleSelectWallpaper = (id: string) => {
    setActiveWallpaperId(id);
    localStorage.setItem('room99-wallpaper-id', id);
  };

  // Hammer Enchantments State
  const [enchantments, setEnchantments] = useState<EnchantmentsState>({
    overcharge: 0,
    seismic: 0,
    greed: 0,
    lightweight: 0
  });

  // Quests State
  const [quests, setQuests] = useState<Quest[]>(() => {
    try {
      const saved = localStorage.getItem('room99-quests-v1');
      if (saved) return JSON.parse(saved);
    } catch {}
    return INITIAL_QUESTS;
  });

  // React state for HUD overlays / Nine AI interaction
  const [soundOn, setSoundOn] = useState(sound.enabled);
  const [tabletOpen, setTabletOpen] = useState(false);
  const [showMobileControls, setShowMobileControls] = useState<boolean>(() => {
    const saved = localStorage.getItem('room99-mobile-controls');
    return saved === 'true';
  });
  const [activeTouch, setActiveTouch] = useState<{
    left?: boolean;
    right?: boolean;
    jump?: boolean;
    hit?: boolean;
    use?: boolean;
    crouch?: boolean;
    sprint?: boolean;
  }>({});

  useEffect(() => {
    localStorage.setItem('room99-mobile-controls', String(showMobileControls));
  }, [showMobileControls]);

  const [hudCoins, setHudCoins] = useState(0);
  const [hudRoom, setHudRoom] = useState(0);
  const [hudPower, setHudPower] = useState(1);
  const [hudToolName, setHudToolName] = useState('Fists');
  const [hudStamina, setHudStamina] = useState(100);
  const [hudDoorHp, setHudDoorHp] = useState({ current: 24, max: 24 });
  const [toastMsg, setToastMsg] = useState('');

  // Lucky crate unboxing state
  const [crateRolling, setCrateRolling] = useState(false);
  const [crateResult, setCrateResult] = useState<{ hammerName: string; power: number; better: boolean } | null>(null);

  // Nine AI State
  const [terminalMessages, setTerminalMessages] = useState<TerminalMessage[]>([
    {
      sender: 'nine-ai',
      text: 'Greetings. I am Nine AI, your experimental neural assistant inside this Room 99 workstation.\n\nI can answer ANY question—whether about science, philosophy, code, history, or how to break these vaults. What would you like to know?',
      time: '12:00:00'
    }
  ]);
  const [terminalInput, setTerminalInput] = useState('');
  const [terminalLoading, setTerminalLoading] = useState(false);
  const terminalScrollRef = useRef<HTMLDivElement | null>(null);

  // Wardrobe & Customization State
  const [equippedSkin, setEquippedSkin] = useState<string>(() => {
    return localStorage.getItem('room99-skin') || 'default';
  });
  const [equippedTrail, setEquippedTrail] = useState<string>(() => {
    return localStorage.getItem('room99-trail') || 'sparks';
  });
  const [unlockedSkins, setUnlockedSkins] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('room99-unlocked-skins');
      return saved ? JSON.parse(saved) : ['default'];
    } catch {
      return ['default'];
    }
  });
  const [unlockedTrails, setUnlockedTrails] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('room99-unlocked-trails');
      return saved ? JSON.parse(saved) : ['sparks'];
    } catch {
      return ['sparks'];
    }
  });

  // NanoScanner decrypted code state
  const [scannedCode, setScannedCode] = useState<string | null>(null);

  // Windows 10 Multi-Window System State (All 13 Apps)
  const [windows, setWindows] = useState<AppWindow[]>([
    {
      id: 'market',
      title: 'Square 9 Market',
      icon: '/market.jpg',
      isOpen: false,
      isMinimized: false,
      isMaximized: false,
      x: 30,
      y: 25,
      w: 560,
      h: 420,
      zIndex: 10
    },
    {
      id: 'crates',
      title: 'Lucky Crates',
      icon: '/crate.jpg',
      isOpen: false,
      isMinimized: false,
      isMaximized: false,
      x: 80,
      y: 35,
      w: 520,
      h: 410,
      zIndex: 11
    },
    {
      id: 'nine-ai',
      title: 'Nine AI',
      icon: '/nine-ai.jpg',
      isOpen: false,
      isMinimized: false,
      isMaximized: false,
      x: 60,
      y: 30,
      w: 580,
      h: 430,
      zIndex: 12
    },
    {
      id: 'wardrobe',
      title: 'Courier Wardrobe',
      icon: '👔',
      isOpen: false,
      isMinimized: false,
      isMaximized: false,
      x: 70,
      y: 25,
      w: 620,
      h: 450,
      zIndex: 13
    },
    {
      id: 'prompt',
      title: 'NMD Prompt (CMD)',
      icon: '💻',
      isOpen: false,
      isMinimized: false,
      isMaximized: false,
      x: 85,
      y: 35,
      w: 580,
      h: 410,
      zIndex: 14
    },
    {
      id: 'notepad',
      title: 'Notepad - Logs',
      icon: '📝',
      isOpen: false,
      isMinimized: false,
      isMaximized: false,
      x: 65,
      y: 25,
      w: 580,
      h: 420,
      zIndex: 15
    },
    {
      id: 'nanoscanner',
      title: 'NanoScanner Decryptor',
      icon: '📡',
      isOpen: false,
      isMinimized: false,
      isMaximized: false,
      x: 90,
      y: 30,
      w: 580,
      h: 440,
      zIndex: 16
    },
    {
      id: 'doogle',
      title: 'Doogle Deep Search',
      icon: '🌐',
      isOpen: false,
      isMinimized: false,
      isMaximized: false,
      x: 50,
      y: 20,
      w: 620,
      h: 460,
      zIndex: 17
    },
    {
      id: 'enchant',
      title: 'Hammer Enchanting',
      icon: '⚒️',
      isOpen: false,
      isMinimized: false,
      isMaximized: false,
      x: 75,
      y: 30,
      w: 600,
      h: 440,
      zIndex: 18
    },
    {
      id: 'watersort',
      title: 'Water Sorter Lab',
      icon: '🧪',
      isOpen: false,
      isMinimized: false,
      isMaximized: false,
      x: 95,
      y: 35,
      w: 580,
      h: 440,
      zIndex: 19
    },
    {
      id: 'quests',
      title: 'Bounties & Quests',
      icon: '🏆',
      isOpen: false,
      isMinimized: false,
      isMaximized: false,
      x: 70,
      y: 40,
      w: 580,
      h: 430,
      zIndex: 20
    },
    {
      id: 'settings',
      title: 'Settings & Themes',
      icon: '⚙️',
      isOpen: false,
      isMinimized: false,
      isMaximized: false,
      x: 105,
      y: 45,
      w: 600,
      h: 430,
      zIndex: 21
    },
    {
      id: 'help',
      title: 'Field Guide',
      icon: '📖',
      isOpen: false,
      isMinimized: false,
      isMaximized: false,
      x: 120,
      y: 50,
      w: 540,
      h: 390,
      zIndex: 9
    },
    {
      id: 'clock',
      title: 'Alarms & Clock',
      icon: '⏰',
      isOpen: false,
      isMinimized: false,
      isMaximized: false,
      x: 95,
      y: 35,
      w: 600,
      h: 440,
      zIndex: 22
    },
    {
      id: 'calc',
      title: 'Calculator',
      icon: '🧮',
      isOpen: false,
      isMinimized: false,
      isMaximized: false,
      x: 110,
      y: 45,
      w: 420,
      h: 490,
      zIndex: 23
    }
  ]);
  const [activeWindowId, setActiveWindowId] = useState<string | null>(null);
  const [topZ, setTopZ] = useState(25);

  // Keypad Modal State
  const [keypadModalOpen, setKeypadModalOpen] = useState(false);
  const [showRoom99Climax, setShowRoom99Climax] = useState(false);

  // Dragging & Resizing State
  const [dragState, setDragState] = useState<{
    active: boolean;
    type: 'move' | 'resize';
    appId: string;
    startX: number;
    startY: number;
    initX: number;
    initY: number;
    initW: number;
    initH: number;
  } | null>(null);

  // Start Menu & Shutdown State
  const [startMenuOpen, setStartMenuOpen] = useState(false);
  const [isShuttingDown, setIsShuttingDown] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Clock ticker for taskbar
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Keys set
  const keysRef = useRef<Set<string>>(new Set());

  // Game Engine State Ref
  const stateRef = useRef<GameState>({
    room: 0,
    coins: 0,
    tool: -1,
    inspected: false,
    caseOpen: false,
    doorHp: 24,
    doorMax: 24,
    tablet: false,
    strike: 0,
    flash: 0,
    fade: 0,
    transition: false,
    nextRoomAt: 0,
    shake: 0,
    hitstop: 0,
    message: '',
    messageUntil: 0,
    playerX: 176,
    facing: 1,
    bought: Array(TOOLS.length).fill(false),
    laptopApp: 'home',
    appScroll: 0,
    layout: null,
    doorX: 0,
    terrain: null,
    terrainDetails: [],
    chestX: 0,
    chestActive: false,
    blueSheetX: 0,
    hasBlueSheet: false,
    scannedCode: null,
    equippedSkin: 'default',
    equippedTrail: 'sparks',
    unlockedSkins: ['default'],
    unlockedTrails: ['sparks'],
    stamina: 100,
    jumpHeight: 0,
    jumpVelocity: 0,
    landing: 0,
    crouched: false,
    sprinting: false,
    soundEnabled: sound.enabled,
    // Math Puzzle Chamber
    isPuzzleRoom: false,
    puzzleFormula: '',
    puzzleSolution: '',
    vaultCodeLocked: false,
    vaultCodeEntered: '',
    keypadOpen: false,
    mathNoteX: 0,
    keypadTerminalX: 0,
    // Boss Fights
    boss: null,
    enchantments: {
      overcharge: 0,
      seismic: 0,
      greed: 0,
      lightweight: 0
    },
    stats: {
      vaultsBroken: 0,
      swings: 0,
      cratesOpened: 0,
      chestsFound: 0,
      waterSortWins: 0,
      bossesDefeated: 0
    }
  });

  const notify = useCallback((msg: string, duration: number = 2600) => {
    stateRef.current.message = msg;
    stateRef.current.messageUntil = performance.now() + duration;
    setToastMsg(msg);
  }, []);

  // Room generation
  const generateRoom = useCallback((roomNumber: number) => {
    const state = stateRef.current;
    state.room = roomNumber;
    let choices: Layout[];
    if (state.room === 0) choices = LAYOUTS.filter(l => l.id === "chamber");
    else if (state.room === 1) choices = LAYOUTS.filter(l => l.id === "hallway");
    else if (state.room === 2) choices = LAYOUTS.filter(l => l.id.includes("stairs"));
    else choices = LAYOUTS;

    const selected = choices[Math.floor(Math.random() * choices.length)];
    const length = selected.minLength + Math.random() * (selected.maxLength - selected.minLength);
    state.layout = {
      ...selected,
      length,
      ventStart: selected.vent ? 480 : 0,
      ventEnd: selected.vent ? length - 320 : 0
    };
    state.doorX = length - 155;
    state.terrain = TERRAIN_TYPES[Math.floor(Math.random() * TERRAIN_TYPES.length)];
    state.terrainDetails = Array.from({ length: Math.ceil(length / 75) }, () => ({
      x: Math.random() * length,
      y: Math.random(),
      size: 2 + Math.random() * 5
    }));
    state.chestActive = Math.random() < 0.65;
    state.chestX = 280 + Math.random() * Math.max(1, state.doorX - 450);

    // 1 in 10 rooms has a secret blue sheet on the wall for the NanoScanner
    state.hasBlueSheet = roomNumber > 0 && (roomNumber % 10 === 0 || Math.random() < 0.10);
    state.blueSheetX = Math.floor(length * 0.45);

    // Boss Fight Check (Room 50, 90, 98)
    const isBossRoom = roomNumber === 50 || roomNumber === 90 || roomNumber === 98;
    if (isBossRoom) {
      state.boss = createBossForRoom(roomNumber, state.doorX, 488);
      state.isPuzzleRoom = false;
      state.vaultCodeLocked = false;
      sound.playBossRoar();
      notify(`ALERT: LEVEL ${roomNumber} BOSS! ${state.boss?.name} AWAKENS!`, 5000);
    } else {
      state.boss = null;
      // Math Puzzle Room: Room > 0, every 4th or 6th room (room % 4 === 0)
      const isMathRoom = roomNumber > 0 && (roomNumber % 4 === 0);
      if (isMathRoom) {
        const puzzle = generateMathPuzzle(roomNumber);
        state.isPuzzleRoom = true;
        state.puzzleFormula = puzzle.formula;
        state.puzzleSolution = puzzle.solution;
        state.vaultCodeLocked = true;
        state.mathNoteX = Math.floor(length * 0.38);
        state.keypadTerminalX = state.doorX - 110;
        notify("BULKHEAD CIPHER LOCKDOWN: Read the Security Note and calculate the 4-digit code!", 4000);
      } else {
        state.isPuzzleRoom = false;
        state.puzzleFormula = '';
        state.puzzleSolution = '';
        state.vaultCodeLocked = false;
      }
    }

    state.playerX = 176;
    state.doorMax = vaultDurability(state.room);
    state.doorHp = state.doorMax;

    setHudRoom(state.room);
    setHudDoorHp({ current: state.doorHp, max: state.doorMax });

    if (roomNumber >= 99) {
      sound.playAlarm();
      notify("CRITICAL EVENT // ROOM 99: You have breached the final containment chamber. Approach the door.", 7000);
    }
  }, []);

  // Save / Load logic
  const saveProgress = useCallback(() => {
    try {
      const s = stateRef.current;
      const data = {
        room: s.room,
        coins: s.coins,
        tool: s.tool,
        inspected: s.inspected,
        caseOpen: s.caseOpen,
        bought: s.bought,
        doorHp: s.doorHp,
        doorMax: s.doorMax,
        enchantments: s.enchantments,
        equippedSkin: s.equippedSkin,
        equippedTrail: s.equippedTrail,
        unlockedSkins: s.unlockedSkins,
        unlockedTrails: s.unlockedTrails,
        stats: s.stats
      };
      localStorage.setItem(SAVE_KEY, JSON.stringify(data));
    } catch {
      // Ignore
    }
  }, []);

  const loadProgress = useCallback(() => {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (!raw) return;
      const saved = JSON.parse(raw);
      if (typeof saved.room === 'number') stateRef.current.room = saved.room;
      if (typeof saved.coins === 'number') stateRef.current.coins = saved.coins;
      if (typeof saved.tool === 'number') stateRef.current.tool = saved.tool;
      if (typeof saved.inspected === 'boolean') stateRef.current.inspected = saved.inspected;
      if (typeof saved.caseOpen === 'boolean') stateRef.current.caseOpen = saved.caseOpen;
      if (Array.isArray(saved.bought)) stateRef.current.bought = saved.bought;
      if (saved.enchantments) {
        stateRef.current.enchantments = { ...stateRef.current.enchantments, ...saved.enchantments };
        setEnchantments({ ...stateRef.current.enchantments });
      }
      if (typeof saved.equippedSkin === 'string') {
        stateRef.current.equippedSkin = saved.equippedSkin;
        setEquippedSkin(saved.equippedSkin);
      }
      if (typeof saved.equippedTrail === 'string') {
        stateRef.current.equippedTrail = saved.equippedTrail;
        setEquippedTrail(saved.equippedTrail);
      }
      if (Array.isArray(saved.unlockedSkins)) {
        stateRef.current.unlockedSkins = saved.unlockedSkins;
        setUnlockedSkins(saved.unlockedSkins);
      }
      if (Array.isArray(saved.unlockedTrails)) {
        stateRef.current.unlockedTrails = saved.unlockedTrails;
        setUnlockedTrails(saved.unlockedTrails);
      }
      if (saved.stats) {
        stateRef.current.stats = { ...stateRef.current.stats, ...saved.stats };
      }
    } catch {
      // Ignore
    }
  }, []);

  // Sync quests whenever stats or enchantments change
  useEffect(() => {
    const s = stateRef.current;
    const totalEnchantLevels =
      (s.enchantments?.overcharge || 0) +
      (s.enchantments?.seismic || 0) +
      (s.enchantments?.greed || 0) +
      (s.enchantments?.lightweight || 0);

    setQuests(prev => {
      const updated = updateQuestsProgress(prev, s.stats, totalEnchantLevels);
      localStorage.setItem('room99-quests-v1', JSON.stringify(updated));
      return updated;
    });
  }, [hudCoins, hudRoom, enchantments]);

  // Upgrade Hammer Enchantment
  const handleUpgradeEnchantment = (enchantId: keyof EnchantmentsState, cost: number) => {
    const s = stateRef.current;
    if (s.coins < cost) {
      notify(`Not enough Neno Coins! Need ${cost - s.coins} more.`);
      return;
    }
    s.coins -= cost;
    s.enchantments[enchantId] = (s.enchantments[enchantId] || 0) + 1;
    setHudCoins(s.coins);
    setEnchantments({ ...s.enchantments });
    notify(`RUNIC INFUSION: ${enchantId.toUpperCase()} upgraded to Level ${s.enchantments[enchantId]}!`, 3200);
    saveProgress();
  };

  // Water Sorter puzzle win reward
  const handleWaterSortReward = (rewardCoins: number) => {
    const s = stateRef.current;
    s.coins += rewardCoins;
    s.stats.waterSortWins = (s.stats.waterSortWins || 0) + 1;
    setHudCoins(s.coins);
    notify(`WATER SORTER COMPLETE! +${rewardCoins} NENO COINS!`, 3400);
    saveProgress();
  };

  // Claim Quest Reward
  const handleClaimQuest = (questId: string, reward: number) => {
    const s = stateRef.current;
    s.coins += reward;
    setHudCoins(s.coins);
    setQuests(prev => {
      const updated = prev.map(q => q.id === questId ? { ...q, claimed: true } : q);
      localStorage.setItem('room99-quests-v1', JSON.stringify(updated));
      return updated;
    });
    notify(`QUEST CLAIMED! +${reward} NENO COINS!`, 3400);
    saveProgress();
  };

  // Wardrobe Handlers
  const handleEquipSkin = (skinId: string) => {
    setEquippedSkin(skinId);
    stateRef.current.equippedSkin = skinId;
    localStorage.setItem('room99-skin', skinId);
    const found = SKINS_CONFIG.find(s => s.id === skinId);
    notify(`EQUIPPED: ${found?.name || skinId} SUIT!`, 2500);
    sound.playClick();
    saveProgress();
  };

  const handleUnlockSkin = (skinId: string, cost: number) => {
    const s = stateRef.current;
    if (s.coins < cost) {
      notify(`Not enough Neno Coins! Need ${cost - s.coins} more.`);
      return;
    }
    s.coins -= cost;
    setHudCoins(s.coins);
    const updated = [...unlockedSkins, skinId];
    setUnlockedSkins(updated);
    s.unlockedSkins = updated;
    localStorage.setItem('room99-unlocked-skins', JSON.stringify(updated));
    handleEquipSkin(skinId);
    notify(`SUIT UNLOCKED: ${SKINS_CONFIG.find(sk => sk.id === skinId)?.name}!`, 3000);
    sound.playChest();
    saveProgress();
  };

  const handleEquipTrail = (trailId: string) => {
    setEquippedTrail(trailId);
    stateRef.current.equippedTrail = trailId;
    localStorage.setItem('room99-trail', trailId);
    notify(`TRAIL EQUIPPED: ${TRAILS_CONFIG.find(t => t.id === trailId)?.name}!`, 2500);
    sound.playClick();
    saveProgress();
  };

  const handleUnlockTrail = (trailId: string, cost: number) => {
    const s = stateRef.current;
    if (s.coins < cost) {
      notify(`Not enough Neno Coins! Need ${cost - s.coins} more.`);
      return;
    }
    s.coins -= cost;
    setHudCoins(s.coins);
    const updated = [...unlockedTrails, trailId];
    setUnlockedTrails(updated);
    s.unlockedTrails = updated;
    localStorage.setItem('room99-unlocked-trails', JSON.stringify(updated));
    handleEquipTrail(trailId);
    notify(`TRAIL UNLOCKED: ${TRAILS_CONFIG.find(t => t.id === trailId)?.name}!`, 3000);
    sound.playChest();
    saveProgress();
  };

  // NMD Terminal Cheat Code Handlers
  const handleNenoGrantCoins = (coins: number, reason: string) => {
    const s = stateRef.current;
    s.coins += coins;
    setHudCoins(s.coins);
    notify(`CMD CODE ACTIVATED: +${coins} NENO COINS (${reason})!`, 3600);
    sound.playCrateJackpot();
    particlesRef.current.spawnConfetti(480, 260, 45);
    saveProgress();
  };

  const handleUnlockAstronautSkin = () => {
    const s = stateRef.current;
    if (!unlockedSkins.includes('astronaut')) {
      const updated = [...unlockedSkins, 'astronaut'];
      setUnlockedSkins(updated);
      s.unlockedSkins = updated;
      localStorage.setItem('room99-unlocked-skins', JSON.stringify(updated));
    }
    setEquippedSkin('astronaut');
    s.equippedSkin = 'astronaut';
    localStorage.setItem('room99-skin', 'astronaut');
    notify("SECRET UNLOCKED: ASTRONAUT APOLLO SUIT EQUIPPED!", 4000);
    sound.playCrateJackpot();
    particlesRef.current.spawnConfetti(480, 260, 60);
    saveProgress();
  };

  // NanoScanner Handlers
  const handleNanoCodeScanned = (code: string) => {
    setScannedCode(code);
    stateRef.current.scannedCode = code;
    notify(`NANO CIPHER DECRYPTED: ${code}! Enter on Doogle to claim 1,000 Neno Coins!`, 4500);
    sound.playCrateJackpot();
  };

  const handleRedeemNanoReward = (rewardCoins: number) => {
    const s = stateRef.current;
    s.coins += rewardCoins;
    setHudCoins(s.coins);
    setScannedCode(null);
    stateRef.current.scannedCode = null;
    notify(`CIPHER REDEEMED! +${rewardCoins} NENO COINS!`, 4000);
    sound.playCrateJackpot();
    particlesRef.current.spawnConfetti(480, 260, 50);
    saveProgress();
  };

  // Reset Progress (safe without window.confirm)
  const resetProgress = () => {
    localStorage.removeItem(SAVE_KEY);
    localStorage.removeItem('room99-quests-v1');
    stateRef.current.room = 0;
    stateRef.current.coins = 0;
    stateRef.current.tool = -1;
    stateRef.current.inspected = false;
    stateRef.current.caseOpen = false;
    stateRef.current.bought = Array(TOOLS.length).fill(false);
    stateRef.current.enchantments = { overcharge: 0, seismic: 0, greed: 0, lightweight: 0 };
    stateRef.current.stats = { vaultsBroken: 0, swings: 0, cratesOpened: 0, chestsFound: 0, waterSortWins: 0 };
    setEnchantments({ overcharge: 0, seismic: 0, greed: 0, lightweight: 0 });
    setQuests(INITIAL_QUESTS);
    setHudCoins(0);
    setHudPower(1);
    setHudToolName('Fists');
    generateRoom(0);
    notify("Progress reset. You wake up in Chamber 000.");
  };

  // Toggle Laptop Tablet
  const toggleLaptop = useCallback((forceState?: boolean) => {
    const s = stateRef.current;
    const next = forceState !== undefined ? forceState : !s.tablet;
    s.tablet = next;
    if (next) {
      sound.playLaptopBoot();
      setStartMenuOpen(false);
    } else {
      sound.playClick();
    }
    setTabletOpen(next);
  }, []);

  // Realistic Windows 10 Shutdown
  const handleWindowsShutdown = () => {
    sound.playShutdown();
    setStartMenuOpen(false);
    setIsShuttingDown(true);
    setTimeout(() => {
      setIsShuttingDown(false);
      toggleLaptop(false);
    }, 1800);
  };

  // Window Management Actions
  const focusWindow = (appId: string) => {
    setTopZ(prev => {
      const nextZ = prev + 1;
      setWindows(curr => curr.map(w => w.id === appId ? { ...w, zIndex: nextZ } : w));
      return nextZ;
    });
    setActiveWindowId(appId);
  };

  const openWindow = (appId: AppWindow['id']) => {
    sound.playWindowAction();
    setStartMenuOpen(false);
    setTopZ(prev => {
      const nextZ = prev + 1;
      setActiveWindowId(appId);
      setWindows(curr => curr.map(w => {
        if (w.id === appId) {
          return {
            ...w,
            isOpen: true,
            isMinimized: false,
            zIndex: nextZ
          };
        }
        return w;
      }));
      return nextZ;
    });
  };

  const minimizeWindow = (appId: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    sound.playClick();
    setWindows(curr => curr.map(w => w.id === appId ? { ...w, isMinimized: true } : w));
    if (activeWindowId === appId) {
      setActiveWindowId(null);
    }
  };

  const toggleMaximizeWindow = (appId: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    sound.playWindowAction();
    focusWindow(appId);
    setWindows(curr => curr.map(w => {
      if (w.id !== appId) return w;
      if (w.isMaximized) {
        return {
          ...w,
          isMaximized: false,
          x: w.prevBounds?.x ?? 50,
          y: w.prevBounds?.y ?? 40,
          w: w.prevBounds?.w ?? 560,
          h: w.prevBounds?.h ?? 420
        };
      } else {
        const desk = desktopRef.current;
        const dw = desk ? desk.clientWidth : 780;
        const dh = desk ? desk.clientHeight : 480;
        return {
          ...w,
          isMaximized: true,
          prevBounds: { x: w.x, y: w.y, w: w.w, h: w.h },
          x: 0,
          y: 0,
          w: dw,
          h: dh
        };
      }
    }));
  };

  const closeWindow = (appId: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    sound.playClick();
    setWindows(curr => curr.map(w => w.id === appId ? { ...w, isOpen: false, isMinimized: false, isMaximized: false } : w));
    if (activeWindowId === appId) {
      setActiveWindowId(null);
    }
  };

  const toggleTaskbarWindow = (w: AppWindow) => {
    if (!w.isOpen) {
      openWindow(w.id);
    } else if (w.isMinimized) {
      sound.playWindowAction();
      setWindows(curr => curr.map(item => item.id === w.id ? { ...item, isMinimized: false } : item));
      focusWindow(w.id);
    } else if (activeWindowId === w.id) {
      // Minimize if currently focused
      minimizeWindow(w.id);
    } else {
      // Bring to front
      sound.playWindowAction();
      focusWindow(w.id);
    }
  };

  // Dragging and Resizing Pointer Handlers
  const handleTitleBarPointerDown = (appId: string, e: React.PointerEvent) => {
    const win = windows.find(w => w.id === appId);
    if (!win || win.isMaximized) return;
    focusWindow(appId);
    setDragState({
      active: true,
      type: 'move',
      appId,
      startX: e.clientX,
      startY: e.clientY,
      initX: win.x,
      initY: win.y,
      initW: win.w,
      initH: win.h
    });
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handleResizeGripPointerDown = (appId: string, e: React.PointerEvent) => {
    e.stopPropagation();
    const win = windows.find(w => w.id === appId);
    if (!win || win.isMaximized) return;
    focusWindow(appId);
    setDragState({
      active: true,
      type: 'resize',
      appId,
      startX: e.clientX,
      startY: e.clientY,
      initX: win.x,
      initY: win.y,
      initW: win.w,
      initH: win.h
    });
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handleDesktopPointerMove = (e: React.PointerEvent) => {
    if (!dragState || !dragState.active) return;
    const desk = desktopRef.current;
    const dw = desk ? desk.clientWidth : 780;
    const dh = desk ? desk.clientHeight : 480;

    const dx = e.clientX - dragState.startX;
    const dy = e.clientY - dragState.startY;

    if (dragState.type === 'move') {
      const newX = Math.max(0, Math.min(dw - 120, dragState.initX + dx));
      const newY = Math.max(0, Math.min(dh - 60, dragState.initY + dy));
      setWindows(curr => curr.map(w => w.id === dragState.appId ? { ...w, x: newX, y: newY } : w));
    } else if (dragState.type === 'resize') {
      const newW = Math.max(340, Math.min(dw - dragState.initX, dragState.initW + dx));
      const newH = Math.max(260, Math.min(dh - dragState.initY, dragState.initH + dy));
      setWindows(curr => curr.map(w => w.id === dragState.appId ? { ...w, w: newW, h: newH } : w));
    }
  };

  const handleDesktopPointerUp = () => {
    if (dragState) {
      setDragState(null);
    }
  };

  // Jump
  const jump = useCallback(() => {
    const s = stateRef.current;
    if (s.tablet || s.fade > 0 || s.crouched || s.jumpHeight > 0 || s.jumpVelocity > 0) return;
    s.landing = 0;
    s.jumpVelocity = 560;
    sound.playJump();
    particlesRef.current.spawnDust(s.playerX, floorAt(s.playerX), 6);
  }, []);

  // Floor height calculation
  function floorAt(x: number): number {
    const s = stateRef.current;
    if (!s.layout) return 488;
    const stairsStart = 300, stairsEnd = s.doorX - 210;
    if (!s.layout.stairs || x <= stairsStart) return 488;
    const stepWidth = 55, steps = Math.max(1, Math.floor((stairsEnd - stairsStart) / stepWidth));
    const step = Math.min(steps, Math.floor((x - stairsStart) / stepWidth));
    return 488 + s.layout.stairs * step * (96 / steps);
  }

  function inVent(x: number): boolean {
    const s = stateRef.current;
    if (!s.layout?.vent) return false;
    return x >= (s.layout.ventStart ?? 0) - 18 && x <= (s.layout.ventEnd ?? 0) + 18;
  }

  // Unlock vault using solved 4-digit code
  const handleUnlockVaultWithCode = useCallback((code: string) => {
    const s = stateRef.current;
    if (code === s.puzzleSolution) {
      s.vaultCodeLocked = false;
      setKeypadModalOpen(false);
      sound.playUnlockSuccess();
      particlesRef.current.spawnConfetti(s.doorX - 60, floorAt(s.doorX) - 140, 35);
      notify("VAULT UNLOCKED! Impact barriers disabled - you can now breach the vault!", 4000);
      saveProgress();
    } else {
      sound.playAccessDenied();
      notify("ACCESS DENIED: Incorrect code entered!");
    }
  }, [notify, saveProgress]);

  // Strike Vault or Boss
  const strikeVault = useCallback(() => {
    const s = stateRef.current;
    if (s.tablet || s.fade > 0) return;
    if (s.tool < 0) {
      notify(s.inspected ? "The metal case is waiting." : "Inspect the note left in the room first (E).");
      return;
    }

    // Base tool power & enchantment calculations
    const basePower = s.tool < 0 ? 1 : TOOLS[s.tool].power;
    const critChance = getEnchantmentCritChance(s.enchantments?.overcharge || 0);
    const isCrit = Math.random() < critChance;
    const critMultiplier = isCrit ? 3.0 : 1.0;
    const seismicBonus = getEnchantmentSeismicBonus(s.enchantments?.seismic || 0);
    const totalDamage = Math.max(1, Math.round(basePower * critMultiplier + seismicBonus));

    // 1. BOSS COMBAT CHECK (Level 50, 90, 98)
    if (s.boss && !s.boss.defeated) {
      const distToBoss = Math.abs(s.playerX - s.boss.x);
      if (distToBoss <= 170) {
        if (s.strike > 0) return;
        s.sprinting = false;
        s.strike = 1;
        s.stats.swings++;

        sound.playSwing();
        setTimeout(() => {
          if (!s.boss) return;
          sound.playBossHit();
          s.boss.hp = Math.max(0, s.boss.hp - totalDamage);
          s.boss.flash = 0.25;
          s.boss.state = 'hurt';
          s.shake = isCrit ? 1.4 : 0.9;
          s.hitstop = 0.06;

          const sparkColor = isCrit ? '#f59e0b' : (s.boss.level === 98 ? '#fbbf24' : s.boss.level === 90 ? '#38bdf8' : '#f43f5e');
          particlesRef.current.spawnSparks(s.boss.x, floorAt(s.boss.x) - 70, 20 + totalDamage * 2, sparkColor);

          if (isCrit) {
            notify("⚡ CRITICAL STRIKE ON BOSS! 3.0× DAMAGE!", 1800);
          }

          if (s.boss.hp <= 0) {
            s.boss.defeated = true;
            s.boss.state = 'defeated';
            sound.playCrateJackpot();
            particlesRef.current.spawnConfetti(s.boss.x, floorAt(s.boss.x) - 80, 60);

            const reward = BOSS_CONFIGS[s.room]?.coinReward || 2500;
            s.coins += reward;
            setHudCoins(s.coins);
            s.stats.bossesDefeated = (s.stats.bossesDefeated || 0) + 1;
            notify(`🏆 BOSS SLAIN! ${s.boss.name} DEFEATED! +${reward} NENO COINS! Vault shield down!`, 5500);
            saveProgress();
          }
        }, 70);
        return;
      }
    }

    // 2. CHECK IF VAULT IS REACHABLE
    const dist = Math.abs(s.playerX - s.doorX);
    if (dist > 130) {
      if (s.boss && !s.boss.defeated) {
        notify("Move closer to the Boss to strike!");
      } else {
        notify("Move closer to the vault door to swing!");
      }
      return;
    }

    // 3. CHECK BOSS SHIELD
    if (s.boss && !s.boss.defeated) {
      sound.playAccessDenied();
      notify(`VAULT SHIELD LOCKED: Defeat ${s.boss.name} first to drop the forcefield!`, 3000);
      return;
    }

    // 4. CHECK MATH CIPHER KEYPAD LOCK
    if (s.isPuzzleRoom && s.vaultCodeLocked) {
      sound.playAccessDenied();
      notify("VAULT CIPHER LOCKED: Enter the 4-digit code on the Keypad Terminal (E)!", 3500);
      setKeypadModalOpen(true);
      return;
    }

    // 5. SPECIAL ROOM 99 CLIMAX CHECK
    if (s.room >= 99) {
      sound.playAlarm();
      setShowRoom99Climax(true);
      return;
    }

    if (s.strike > 0) return;
    s.sprinting = false;
    s.strike = 1;

    s.shake = isCrit ? 1.35 : 0.85;
    s.hitstop = isCrit ? 0.08 : 0.05;
    s.doorHp = Math.max(0, s.doorHp - totalDamage);
    s.stats.swings++;

    sound.playSwing();
    setTimeout(() => {
      sound.playVaultHit(totalDamage);
      const activeTrail = TRAILS_CONFIG.find(t => t.id === s.equippedTrail) || TRAILS_CONFIG[0];
      const sparkColor = isCrit ? '#f59e0b' : (activeTrail.color || TOOLS[s.tool]?.color || '#fbbf24');
      const doorFloorY = floorAt(s.doorX);
      particlesRef.current.spawnSparks(
        s.doorX - 60,
        doorFloorY - 140,
        18 + totalDamage * 2,
        sparkColor
      );
      if (isCrit) {
        notify("⚡ CRITICAL OVERCHARGE! 3.0× DAMAGE STRIKE!", 1800);
      }
    }, 70);

    setHudDoorHp({ current: s.doorHp, max: s.doorMax });
    saveProgress();

    if (s.doorHp <= 0) {
      s.transition = true;
      s.fade = 0;
      s.nextRoomAt = performance.now() + 850;
      sound.playVaultBreach();
      particlesRef.current.spawnSparks(s.doorX - 60, floorAt(s.doorX) - 140, 36, '#38bdf8');
    }
  }, [notify, saveProgress]);

  // Interact
  const interact = useCallback(() => {
    const s = stateRef.current;
    if (s.tablet || s.fade > 0) return;

    // 0. Room 99 Final Bulkhead Check
    if (s.room >= 99 && Math.abs(s.playerX - s.doorX) <= 140) {
      sound.playAlarm();
      setShowRoom99Climax(true);
      return;
    }

    // 1. Paper note
    if (s.room === 0 && !s.inspected && Math.abs(s.playerX - 770) <= 105) {
      s.inspected = true;
      sound.playClick();
      notify("The note reads: 'Operator: The elevator brought you here without coordinates. Inspect the case at x=254. The hammer was left at 03:17 for you by OPERATOR_00. Everything breaks eventually.'", 6500);
      saveProgress();
      return;
    }

    // 2. Starter Case
    if (s.room === 0 && s.inspected && !s.caseOpen && Math.abs(s.playerX - 254) <= 95) {
      s.caseOpen = true;
      s.tool = 0;
      s.bought[0] = true;
      sound.playChest();
      particlesRef.current.spawnSparks(254, floorAt(254) - 40, 24, '#38bdf8');
      notify("STARTER HAMMER RETRIEVED (Transaction 00821). Power ×2. The Echo Matter barrier awaits!", 5000);
      setHudPower(TOOLS[0].power);
      setHudToolName(TOOLS[0].name);
      saveProgress();
      return;
    }

    // 3. Chest
    if (s.chestActive && Math.abs(s.playerX - s.chestX) <= 65) {
      s.chestActive = false;
      const greedMultiplier = getEnchantmentGreedMultiplier(s.enchantments?.greed || 0);
      const baseLoot = 250 + Math.floor(Math.random() * 150);
      const loot = Math.round(baseLoot * greedMultiplier);
      s.coins += loot;
      s.stats.chestsFound++;
      sound.playChest();
      sound.playCoin();
      particlesRef.current.spawnConfetti(s.chestX, floorAt(s.chestX) - 30, 24);
      notify(`CHEST UNLOCKED! +${loot} NENO COINS!`, 3200);
      setHudCoins(s.coins);
      saveProgress();
      return;
    }

    // 4. Math Note Slate
    if (s.isPuzzleRoom && Math.abs(s.playerX - s.mathNoteX) <= 85) {
      sound.playClick();
      notify(`MATH CIPHER: ${s.puzzleFormula} (Solve in Calculator app!)`, 4200);
      return;
    }

    // 5. Keypad Terminal
    if (s.isPuzzleRoom && s.vaultCodeLocked && (Math.abs(s.playerX - s.keypadTerminalX) <= 95 || Math.abs(s.playerX - s.doorX) <= 130)) {
      sound.playClick();
      setKeypadModalOpen(true);
      return;
    }

    if (Math.abs(s.playerX - s.doorX) <= 130 || (s.boss && Math.abs(s.playerX - s.boss.x) <= 170)) {
      strikeVault();
    } else {
      notify("Nothing to interact with nearby.");
    }
  }, [notify, saveProgress, strikeVault]);

  // Buy or Equip hammer
  const buyOrEquip = useCallback((index: number) => {
    const s = stateRef.current;
    if (index < 0 || index >= TOOLS.length) return;

    if (s.bought[index]) {
      s.tool = index;
      sound.playClick();
      notify(`${TOOLS[index].name} equipped! Efficiency ×${TOOLS[index].power}`);
      setHudPower(TOOLS[index].power);
      setHudToolName(TOOLS[index].name);
      saveProgress();
      return;
    }

    if (index !== s.tool + 1 && !s.bought[index]) {
      notify("Upgrade to hammers in order or win them from Lucky Crates!");
      return;
    }

    const item = TOOLS[index];
    if (s.coins < item.cost) {
      notify(`Not enough Neno Coins! Need ${item.cost - s.coins} more.`);
      return;
    }

    s.coins -= item.cost;
    s.tool = index;
    s.bought[index] = true;
    sound.playChest();
    particlesRef.current.spawnConfetti(480, 300, 25);
    notify(`PURCHASED: ${item.name}! Power ×${item.power}`, 3000);
    setHudCoins(s.coins);
    setHudPower(item.power);
    setHudToolName(item.name);
    saveProgress();
  }, [notify, saveProgress]);

  // Open Lucky Crate
  const openLuckyCrate = useCallback(() => {
    const s = stateRef.current;
    const cost = 1000;
    if (s.coins < cost) {
      notify(`Not enough Neno Coins! You need ${cost - s.coins} more.`);
      return;
    }

    s.coins -= cost;
    s.stats.cratesOpened++;
    setHudCoins(s.coins);
    setCrateRolling(true);
    setCrateResult(null);

    sound.playClick();
    let rollSteps = 0;
    const maxRolls = 18;

    const rollInterval = setInterval(() => {
      rollSteps++;
      sound.playCrateRoll();
      if (rollSteps >= maxRolls) {
        clearInterval(rollInterval);
        const wonIdx = Math.floor(Math.random() * TOOLS.length);
        const wonHammer = TOOLS[wonIdx];
        const currentPower = s.tool >= 0 ? TOOLS[s.tool].power : 0;
        const isBetter = wonHammer.power > currentPower;

        s.bought[wonIdx] = true;
        if (isBetter) {
          s.tool = wonIdx;
          setHudPower(wonHammer.power);
          setHudToolName(wonHammer.name);
        }

        sound.playCrateJackpot();
        particlesRef.current.spawnConfetti(480, 260, 45);

        setCrateRolling(false);
        setCrateResult({
          hammerName: wonHammer.name,
          power: wonHammer.power,
          better: isBetter
        });

        notify(
          isBetter
            ? `JACKPOT! Won & Equipped ${wonHammer.name} (Power ×${wonHammer.power})!`
            : `Won ${wonHammer.name} (Power ×${wonHammer.power}). Current hammer remains stronger!`,
          4000
        );
        saveProgress();
      }
    }, 85);
  }, [notify, saveProgress]);

  // Send message to Nine AI
  const sendNineAIPrompt = async (customPrompt?: string) => {
    const textToSend = customPrompt || terminalInput.trim();
    if (!textToSend || terminalLoading) return;

    const userMsg: TerminalMessage = {
      sender: 'user',
      text: textToSend,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setTerminalMessages(prev => [...prev, userMsg]);
    setTerminalInput('');
    setTerminalLoading(true);
    sound.playClick();

    try {
      const s = stateRef.current;
      const res = await fetch('/api/nine-ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: textToSend,
          status: {
            room: s.room,
            roomName: s.layout?.name,
            hammer: s.tool >= 0 ? TOOLS[s.tool].name : 'Fists',
            power: s.tool >= 0 ? TOOLS[s.tool].power : 1,
            coins: s.coins,
            doorHp: s.doorHp,
            doorMax: s.doorMax,
            inspected: s.inspected,
            caseOpen: s.caseOpen
          }
        })
      });
      const data = await res.json();
      const replyMsg: TerminalMessage = {
        sender: 'nine-ai',
        text: data.reply || '[Nine AI: Transmission completed without payload]',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setTerminalMessages(prev => [...prev, replyMsg]);
      sound.playClick();
    } catch {
      setTerminalMessages(prev => [
        ...prev,
        {
          sender: 'system',
          text: '[Nine AI]: Subterranean connection interference. Please re-send your inquiry.',
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } finally {
      setTerminalLoading(false);
    }
  };

  useEffect(() => {
    if (terminalScrollRef.current) {
      terminalScrollRef.current.scrollTop = terminalScrollRef.current.scrollHeight;
    }
  }, [terminalMessages]);

  // Preload Assets
  useEffect(() => {
    loadProgress();
    generateRoom(stateRef.current.room);

    const s = stateRef.current;
    setHudCoins(s.coins);
    setHudRoom(s.room);
    setHudPower(s.tool >= 0 ? TOOLS[s.tool].power : 1);
    setHudToolName(s.tool >= 0 ? TOOLS[s.tool].name : 'Fists');
    setHudStamina(s.stamina);
    setHudDoorHp({ current: s.doorHp, max: s.doorMax });

    if (s.room === 0 && !s.inspected) {
      setTimeout(() => {
        notify("NINE: 'Oh. You're awake... Welcome, operator. The facility has suffered extensive neglect. Fortunately, your arrival has been anticipated. I can help you leave. Eventually.' (Press Tab to open laptop)", 7500);
      }, 600);
    }
  }, [generateRoom, loadProgress]);

  // Keyboard Handlers
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const key = e.key;
      if ([' ', 'ArrowLeft', 'ArrowRight', 'Tab'].includes(key)) {
        if (!tabletOpen || key === 'Tab') e.preventDefault();
      }

      if (key === 'Tab' || key.toLowerCase() === 't') {
        if (!e.repeat) toggleLaptop();
        return;
      }
      if (key === 'Escape') {
        if (stateRef.current.tablet) {
          if (startMenuOpen) {
            setStartMenuOpen(false);
            return;
          }
          // If active window is open, close or minimize it
          if (activeWindowId) {
            minimizeWindow(activeWindowId);
          } else {
            toggleLaptop(false);
          }
        }
        return;
      }

      // If typing in input, don't trigger game hotkeys
      if (tabletOpen && document.activeElement?.tagName === 'INPUT') {
        return;
      }

      if (key === ' ') {
        if (!e.repeat) jump();
        return;
      }
      if (key === 'Enter') {
        if (!e.repeat) strikeVault();
        return;
      }
      if (key === 'Shift') {
        keysRef.current.add('sprint');
        return;
      }
      if (key.toLowerCase() === 'c') {
        keysRef.current.add('crouch');
        return;
      }
      if (key.toLowerCase() === 'e' || key.toLowerCase() === 'w' || key === 'ArrowUp') {
        if (!e.repeat) interact();
        return;
      }
      if (key === 'ArrowLeft' || key.toLowerCase() === 'a') {
        keysRef.current.add('left');
        stateRef.current.facing = -1;
      }
      if (key === 'ArrowRight' || key.toLowerCase() === 'd') {
        keysRef.current.add('right');
        stateRef.current.facing = 1;
      }
    };

    const onKeyUp = (e: KeyboardEvent) => {
      const key = e.key;
      keysRef.current.delete(key);
      keysRef.current.delete(key.toLowerCase());
      if (key === 'Shift') keysRef.current.delete('sprint');
      if (key.toLowerCase() === 'c') keysRef.current.delete('crouch');
      if (key === 'ArrowLeft' || key.toLowerCase() === 'a') keysRef.current.delete('left');
      if (key === 'ArrowRight' || key.toLowerCase() === 'd') keysRef.current.delete('right');
    };

    const onBlur = () => {
      keysRef.current.clear();
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('blur', onBlur);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('blur', onBlur);
    };
  }, [tabletOpen, startMenuOpen, activeWindowId, toggleLaptop, jump, strikeVault, interact]);

  // Main Canvas Game Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    let animId: number;
    let lastTime = performance.now();
    let stepTimer = 0;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.floor(window.innerWidth * dpr);
      canvas.height = Math.floor(window.innerHeight * dpr);
    };
    window.addEventListener('resize', resize);
    resize();

    const loop = (time: number) => {
      let dt = Math.min((time - lastTime) / 1000, 0.05);
      lastTime = time;

      const s = stateRef.current;
      const keys = keysRef.current;

      // Hitstop delay
      if (s.hitstop > 0) {
        s.hitstop -= dt;
        dt = 0;
      }

      // Physics and Movement Update
      if (dt > 0) {
        const horizontal = (keys.has('right') ? 1 : 0) - (keys.has('left') ? 1 : 0);
        s.crouched = keys.has('crouch') || inVent(s.playerX);
        const sprinting = horizontal !== 0 && keys.has('sprint') && s.strike <= 0 && !s.crouched && s.stamina > 0 && !s.tablet && s.fade <= 0;
        s.sprinting = !!sprinting;

        // Stamina calculation with Lightweight Shaft enchantment
        const { drainMultiplier, regenMultiplier } = getEnchantmentStaminaEfficiency(s.enchantments?.lightweight || 0);

        if (sprinting) {
          s.stamina = Math.max(0, s.stamina - 32 * dt * drainMultiplier);
        } else {
          s.stamina = Math.min(100, s.stamina + 20 * dt * regenMultiplier);
        }
        setHudStamina(s.stamina);

        if (horizontal !== 0 && s.strike <= 0 && !s.tablet && s.fade <= 0) {
          const speed = s.crouched ? 150 : sprinting ? 420 : 260;
          const targetX = Math.max(35, Math.min((s.layout?.length ?? 1200) - 35, s.playerX + horizontal * speed * dt));

          if (!inVent(targetX) || keys.has('crouch')) {
            s.playerX = targetX;
          } else {
            notify("Hold C to crouch into the low vent shaft!");
          }
          s.facing = horizontal;

          // Footstep audio
          stepTimer += dt;
          if (stepTimer >= (sprinting ? 0.22 : 0.35) && s.jumpHeight === 0) {
            stepTimer = 0;
            sound.playFootstep(sprinting);
            if (sprinting) particlesRef.current.spawnDust(s.playerX, floorAt(s.playerX), 2);
          }
        }

        // Jump physics
        const airborne = s.jumpHeight > 0 || s.jumpVelocity > 0;
        if (airborne) {
          s.jumpHeight = Math.max(0, s.jumpHeight + s.jumpVelocity * dt);
          s.jumpVelocity -= 1450 * dt;
          if (s.jumpHeight === 0) {
            s.jumpVelocity = 0;
            s.landing = 0.28;
            sound.playLand();
            particlesRef.current.spawnDust(s.playerX, floorAt(s.playerX), 8);
          }
        } else if (s.landing > 0) {
          s.landing = Math.max(0, s.landing - dt);
        }

        // Chest auto-trigger check when walking
        if (!s.tablet && s.fade <= 0 && s.chestActive && Math.abs(s.playerX - s.chestX) <= 45) {
          interact();
        }

        // Strike animation decay
        if (s.strike > 0) s.strike = Math.max(0, s.strike - dt / 0.85);
        if (s.shake > 0) s.shake = Math.max(0, s.shake - dt * 2.2);
        if (s.flash > 0) s.flash = Math.max(0, s.flash - dt * 3);

        // Room clear transition
        if (s.transition && performance.now() >= s.nextRoomAt) {
          s.fade = Math.min(1, s.fade + dt * 1.8);
          if (s.fade >= 1) {
            s.transition = false;
            generateRoom(s.room + 1);
            s.stats.vaultsBroken++;

            const greedMultiplier = getEnchantmentGreedMultiplier(s.enchantments?.greed || 0);
            const basePayout = (16 + Math.floor(Math.random() * 12) + s.room * 4) * (s.tool < 0 ? 1 : TOOLS[s.tool].power);
            const payout = Math.round(basePayout * greedMultiplier);

            s.coins += payout;
            setHudCoins(s.coins);
            notify(`ROOM ${String(s.room).padStart(3, '0')} BREACHED! +${payout} NENO COINS!`, 3600);
            saveProgress();
          }
        } else if (s.fade > 0) {
          s.fade = Math.max(0, s.fade - dt * 1.4);
        }

        // Boss AI & Shockwaves update
        if (s.boss && !s.boss.defeated && !s.tablet && s.fade <= 0) {
          s.boss.attackTimer -= dt;
          s.boss.facing = s.playerX < s.boss.x ? -1 : 1;

          // Pacing towards player
          const distToPlayer = Math.abs(s.boss.x - s.playerX);
          if (distToPlayer > 210) {
            s.boss.x += (s.playerX < s.boss.x ? -1 : 1) * 35 * dt;
          }

          if (s.boss.flash > 0) s.boss.flash = Math.max(0, s.boss.flash - dt * 2.5);

          // Windup attack telegraph
          if (s.boss.attackTimer <= 0.8 && s.boss.attackTimer > 0) {
            s.boss.state = 'windup';
            s.boss.windupProgress = (0.8 - s.boss.attackTimer) / 0.8;
          } else if (s.boss.attackTimer <= 0) {
            // Boss executes attack!
            s.boss.state = 'attack';
            s.boss.attackTimer = s.boss.attackInterval;
            sound.playBossAttack();
            s.shake = s.boss.level === 98 ? 1.6 : s.boss.level === 90 ? 1.3 : 1.0;

            // Spawn shockwave traveling towards player along the ground
            const waveSpeed = s.boss.level === 98 ? 360 : s.boss.level === 90 ? 300 : 250;
            const waveColor = s.boss.level === 98 ? '#fbbf24' : s.boss.level === 90 ? '#38bdf8' : '#f43f5e';
            s.boss.shockwaves.push({
              x: s.boss.x,
              y: floorAt(s.boss.x),
              vx: s.boss.facing * waveSpeed,
              width: 32,
              height: 26,
              color: waveColor,
              damage: 15
            });
          } else if (s.boss.state !== 'hurt') {
            s.boss.state = 'idle';
          }

          // Update shockwaves
          for (let i = s.boss.shockwaves.length - 1; i >= 0; i--) {
            const sw = s.boss.shockwaves[i];
            sw.x += sw.vx * dt;

            // Check collision with player
            const playerFloor = floorAt(s.playerX);
            const inX = Math.abs(sw.x - s.playerX) < 28;
            const airborne = s.jumpHeight > 22; // Jump over shockwave to dodge!
            if (inX && !airborne) {
              // Player hit by shockwave!
              s.stamina = Math.max(0, s.stamina - 20);
              s.playerX += (sw.vx > 0 ? 1 : -1) * 55;
              s.hitstop = 0.08;
              s.shake = 0.8;
              sound.playVaultHit(15);
              particlesRef.current.spawnSparks(s.playerX, playerFloor - 25, 12, sw.color);
              notify("HIT BY SHOCKWAVE! (Press Space to jump over it!)", 1500);
              s.boss.shockwaves.splice(i, 1);
              continue;
            }

            // Remove if moved past boundaries
            if (Math.abs(sw.x - s.boss.x) > 950 || sw.x < 10 || sw.x > (s.layout?.length ?? 1200)) {
              s.boss.shockwaves.splice(i, 1);
            }
          }
        }

        particlesRef.current.update(dt);
      }

      // RENDER STEP
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const scale = Math.min(canvas.width / dpr / CANVAS_VIRTUAL_W, canvas.height / dpr / CANVAS_VIRTUAL_H);
      const offsetX = (canvas.width / dpr - CANVAS_VIRTUAL_W * scale) / 2;
      const offsetY = (canvas.height / dpr - CANVAS_VIRTUAL_H * scale) / 2;

      ctx.setTransform(dpr * scale, 0, 0, dpr * scale, dpr * offsetX, dpr * offsetY);
      ctx.fillStyle = '#020617';
      ctx.fillRect(-offsetX / scale, -offsetY / scale, canvas.width / (dpr * scale), canvas.height / (dpr * scale));

      if (s.shake > 0) {
        ctx.translate((Math.random() - 0.5) * s.shake * 8, (Math.random() - 0.5) * s.shake * 5);
      }

      drawBackground(ctx);

      const camX = Math.max(0, Math.min((s.layout?.length ?? 1200) - CANVAS_VIRTUAL_W, s.playerX - CANVAS_VIRTUAL_W / 2));
      const camY = floorAt(s.playerX) - 488;

      ctx.save();
      ctx.translate(-camX, -camY);

      drawEnvironment(ctx, camX);
      drawVaultDoor(ctx);

      if (s.room === 0) {
        drawPaperNote(ctx);
        drawCase(ctx);
      }

      if (s.isPuzzleRoom) {
        drawMathNote(ctx);
        drawKeypadTerminal(ctx);
      }

      if (s.boss) {
        drawBoss(ctx, time);
      }

      drawMysteryChest(ctx);
      particlesRef.current.draw(ctx);
      drawEnhancedPlayer(ctx, time);

      ctx.restore();

      // Top Cinematic Boss Health Bar (Rendered in screen space)
      if (s.boss && !s.boss.defeated) {
        drawBossHealthBar(ctx);
      }

      // Room Transition Fade
      if (s.fade > 0) {
        ctx.fillStyle = `rgba(2,6,23,${Math.min(s.fade, 1)})`;
        ctx.fillRect(0, 0, CANVAS_VIRTUAL_W, CANVAS_VIRTUAL_H);
      }

      ctx.setTransform(1, 0, 0, 1, 0, 0);
      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
    };
  }, [generateRoom, interact, notify, saveProgress]);

  // Canvas Drawing Subroutines
  function drawBackground(ctx: CanvasRenderingContext2D) {
    const grad = ctx.createLinearGradient(0, 0, 0, CANVAS_VIRTUAL_H);
    grad.addColorStop(0, '#0b1329');
    grad.addColorStop(0.72, '#080f22');
    grad.addColorStop(1, '#020617');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, CANVAS_VIRTUAL_W, CANVAS_VIRTUAL_H);

    const ambient = ctx.createRadialGradient(480, 280, 0, 480, 280, 520);
    ambient.addColorStop(0, 'rgba(30,64,112,.22)');
    ambient.addColorStop(0.5, 'rgba(30,64,112,.12)');
    ambient.addColorStop(1, 'rgba(30,64,112,0)');
    ctx.fillStyle = ambient;
    ctx.fillRect(0, 0, CANVAS_VIRTUAL_W, CANVAS_VIRTUAL_H);

    ctx.fillStyle = '#0a1226';
    ctx.fillRect(0, 488, CANVAS_VIRTUAL_W, 112);

    ctx.strokeStyle = 'rgba(56,189,248,.05)';
    ctx.lineWidth = 1;
    for (let x = -100; x < CANVAS_VIRTUAL_W + 100; x += 85) {
      ctx.beginPath();
      ctx.moveTo(480, 488);
      ctx.lineTo(x, 600);
      ctx.stroke();
    }
  }

  function drawEnvironment(ctx: CanvasRenderingContext2D, camX: number) {
    const s = stateRef.current;
    if (!s.layout || !s.terrain) return;

    const visibleLeft = Math.max(0, camX - 100);
    const visibleRight = Math.min(s.layout.length ?? 1200, camX + CANVAS_VIRTUAL_W + 100);
    const floorY = 488;

    ctx.fillStyle = s.terrain.surface;
    ctx.fillRect(visibleLeft, floorY, visibleRight - visibleLeft, CANVAS_VIRTUAL_H - floorY);

    for (const d of s.terrainDetails) {
      if (d.x < visibleLeft || d.x > visibleRight) continue;
      const y = floorY + 8 + d.y * (CANVAS_VIRTUAL_H - floorY - 14);
      ctx.fillStyle = s.terrain.accent;
      ctx.fillRect(d.x, y, d.size * 1.8, Math.max(1, d.size * 0.45));
    }

    if (s.layout.stairs) {
      const stairsStart = 300, stairsEnd = s.doorX - 210, stepWidth = 55;
      const steps = Math.max(1, Math.floor((stairsEnd - stairsStart) / stepWidth));
      const stepRise = 96 / steps;
      for (let i = 0; i <= steps; i++) {
        const x = stairsStart + i * stepWidth;
        if (x < visibleLeft - stepWidth || x > visibleRight) continue;
        const y = floorY + s.layout.stairs * i * stepRise;
        ctx.fillStyle = '#101d31';
        ctx.fillRect(x, y, stepWidth + 1, CANVAS_VIRTUAL_H - y);
        ctx.strokeStyle = s.terrain.accent;
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + stepWidth, y);
        ctx.stroke();
      }
    }

    if (s.layout.vent && s.layout.ventStart && s.layout.ventEnd) {
      for (let x = s.layout.ventStart; x < s.layout.ventEnd; x += 120) {
        if (x + 120 < visibleLeft || x > visibleRight) continue;
        const base = floorAt(x);
        ctx.fillStyle = 'rgba(4, 12, 26, 0.94)';
        ctx.fillRect(x, base - 62, Math.min(120, s.layout.ventEnd - x), 52);
        ctx.strokeStyle = '#526a83';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(x, base - 62);
        ctx.lineTo(Math.min(x + 120, s.layout.ventEnd), base - 62);
        ctx.stroke();
      }
      const entranceY = floorAt(s.layout.ventStart);
      ctx.fillStyle = '#fbbf24';
      ctx.font = '700 9px "Segoe UI", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText("LOW VENT  /  HOLD C TO CRAWL", s.layout.ventStart + 180, entranceY - 76);
    }

    drawBlueSheet(ctx);
  }

  function drawVaultDoor(ctx: CanvasRenderingContext2D) {
    const s = stateRef.current;
    const w = 226, h = 324;
    const x = s.doorX - w / 2;
    const y = floorAt(s.doorX) - h;

    ctx.save();
    ctx.shadowColor = s.doorHp <= 0 ? '#4ade80' : s.flash > 0 ? '#f43f5e' : '#38bdf8';
    ctx.shadowBlur = s.flash > 0 ? 22 : 12;

    ctx.fillStyle = '#0b1428';
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, 8);
    ctx.fill();
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.55)';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.shadowBlur = 0;

    ctx.fillStyle = '#101a2c';
    ctx.beginPath();
    ctx.roundRect(x + 8, y + 8, w - 16, h - 16, 5);
    ctx.fill();

    const totalBars = 12;
    const currentBars = Math.ceil((s.doorHp / s.doorMax) * totalBars);
    for (let i = 0; i < totalBars; i++) {
      ctx.fillStyle = i < currentBars ? '#f43f5e' : 'rgba(244,63,94,.18)';
      ctx.fillRect(x + 18 + i * 16, y + 25, 10, 4);
    }

    ctx.fillStyle = '#c5d4e8';
    ctx.font = '700 11px "Segoe UI", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText("VAULT  /  99", x + w / 2, y + 55);

    const dialX = x + w / 2;
    const dialY = y + 171;
    ctx.beginPath();
    ctx.arc(dialX, dialY, 40, 0, Math.PI * 2);
    ctx.fillStyle = '#0b1325';
    ctx.fill();
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.4)';
    ctx.lineWidth = 2;
    ctx.stroke();

    const vaultNum = String(s.room + 1);
    ctx.fillStyle = '#bae6fd';
    ctx.font = '700 28px "Segoe UI", sans-serif';
    ctx.fillText(vaultNum, dialX, dialY + 10);

    ctx.fillStyle = s.doorHp <= 0 ? '#4ade80' : '#8393a8';
    ctx.font = '700 9px "Segoe UI", sans-serif';
    ctx.fillText(s.doorHp <= 0 ? "UNSEALED" : "SEALED", x + w / 2, y + 255);

    // Guardian Forcefield or Math Cipher Lock Barrier Overlay
    if (s.boss && !s.boss.defeated) {
      ctx.fillStyle = 'rgba(239, 68, 68, 0.28)';
      ctx.fillRect(x, y, w, h);
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 3;
      ctx.strokeRect(x, y, w, h);

      ctx.fillStyle = '#fca5a5';
      ctx.font = '900 12px "Segoe UI", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText("GUARDIAN SHIELD ACTIVE", x + w / 2, y + 138);
      ctx.font = '700 9px "Segoe UI", sans-serif';
      ctx.fillText(`DEFEAT ${s.boss.name}`, x + w / 2, y + 156);
    } else if (s.isPuzzleRoom && s.vaultCodeLocked) {
      ctx.fillStyle = 'rgba(245, 158, 11, 0.25)';
      ctx.fillRect(x, y, w, h);
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 2.5;
      ctx.strokeRect(x, y, w, h);

      ctx.fillStyle = '#fef08a';
      ctx.font = '900 11px "Segoe UI", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText("CIPHER LOCKED", x + w / 2, y + 138);
      ctx.font = '700 8.5px "Segoe UI", sans-serif';
      ctx.fillText("ENTER 4 DIGITS ON KEYPAD (E)", x + w / 2, y + 156);
    } else if (s.room >= 99) {
      ctx.fillStyle = 'rgba(225, 29, 72, 0.32)';
      ctx.fillRect(x, y, w, h);
      ctx.strokeStyle = '#f43f5e';
      ctx.lineWidth = 3.5;
      ctx.strokeRect(x, y, w, h);

      ctx.fillStyle = '#ffe4e6';
      ctx.font = '900 13px "Segoe UI", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText("ROOM 99 — OCCUPIED", x + w / 2, y + 134);
      ctx.font = '700 9px "Segoe UI", sans-serif';
      ctx.fillText("FINAL CONTAINMENT BULKHEAD", x + w / 2, y + 152);
      ctx.fillStyle = '#fca5a5';
      ctx.font = '700 8.5px "Segoe UI", sans-serif';
      ctx.fillText("E / ENTER // APPROACH DOOR", x + w / 2, y + 176);
    }

    ctx.restore();
  }

  function drawPaperNote(ctx: CanvasRenderingContext2D) {
    const s = stateRef.current;
    const x = 770, y = floorAt(x) - 86;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(-0.12);
    ctx.fillStyle = '#d8d0b9';
    ctx.fillRect(-18, -13, 38, 28);
    ctx.fillStyle = '#737367';
    ctx.fillRect(-11, -7, 23, 1);
    ctx.fillRect(-11, -2, 18, 1);
    ctx.fillRect(-11, 3, 14, 1);
    ctx.restore();

    ctx.fillStyle = s.inspected ? '#7dd3fc' : '#fbbf24';
    ctx.font = '700 9px "Segoe UI", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(s.inspected ? "NOTE READ" : "NOTE", x, y - 34);
    if (!s.inspected) {
      ctx.fillStyle = '#b8c5d7';
      ctx.font = '600 8px "Segoe UI", sans-serif';
      ctx.fillText("E / TAP TO INSPECT", x, y + 31);
    }
  }

  function drawMathNote(ctx: CanvasRenderingContext2D) {
    const s = stateRef.current;
    if (!s.isPuzzleRoom) return;
    const x = s.mathNoteX;
    const y = floorAt(x) - 95;

    ctx.save();
    ctx.translate(x, y);

    // Wall Clipboard Slate
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.roundRect(-42, -26, 84, 52, 6);
    ctx.fill();
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Clipboard clip at top
    ctx.fillStyle = '#475569';
    ctx.fillRect(-12, -29, 24, 6);

    // Header
    ctx.fillStyle = '#fbbf24';
    ctx.font = '700 8px "Segoe UI", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText("SECURITY CIPHER SLATE", 0, -14);

    // Equation display
    ctx.fillStyle = '#f8fafc';
    ctx.font = '700 8.5px "Consolas", monospace';
    ctx.fillText(s.puzzleFormula, 0, 3);

    // Subtext
    ctx.fillStyle = '#94a3b8';
    ctx.font = '600 7.5px "Segoe UI", sans-serif';
    ctx.fillText("E / TAP // SOLVE IN CALC", 0, 16);

    ctx.restore();
  }

  function drawKeypadTerminal(ctx: CanvasRenderingContext2D) {
    const s = stateRef.current;
    if (!s.isPuzzleRoom) return;
    const x = s.keypadTerminalX;
    const y = floorAt(x) - 105;

    ctx.save();
    ctx.translate(x, y);

    // Console base pillar
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(-6, 25, 12, floorAt(x) - (y + 25));

    // Terminal head
    ctx.fillStyle = '#090d16';
    ctx.beginPath();
    ctx.roundRect(-22, -35, 44, 60, 5);
    ctx.fill();
    ctx.strokeStyle = s.vaultCodeLocked ? '#f59e0b' : '#10b981';
    ctx.lineWidth = 2;
    ctx.stroke();

    // LED status light
    ctx.fillStyle = s.vaultCodeLocked ? '#ef4444' : '#10b981';
    ctx.shadowColor = s.vaultCodeLocked ? '#ef4444' : '#10b981';
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.arc(0, -25, 3.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Small 4-digit display screen
    ctx.fillStyle = '#020617';
    ctx.fillRect(-16, -17, 32, 13);
    ctx.fillStyle = s.vaultCodeLocked ? '#fbbf24' : '#34d399';
    ctx.font = '700 8px "Consolas", monospace';
    ctx.textAlign = 'center';
    ctx.fillText(s.vaultCodeLocked ? "[ * * * * ]" : "[ UNLOCKED ]", 0, -8);

    // Mini button grid
    ctx.fillStyle = '#334155';
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 3; c++) {
        ctx.fillRect(-12 + c * 9, 0 + r * 6, 6, 4);
      }
    }

    // Label
    ctx.fillStyle = s.vaultCodeLocked ? '#fcd34d' : '#6ee7b7';
    ctx.font = '700 8px "Segoe UI", sans-serif';
    ctx.fillText("KEYPAD", 0, -42);
    if (s.vaultCodeLocked) {
      ctx.fillStyle = '#bae6fd';
      ctx.font = '600 7.5px "Segoe UI", sans-serif';
      ctx.fillText("E / TAP CODE", 0, 32);
    }

    ctx.restore();
  }

  function drawBoss(ctx: CanvasRenderingContext2D, time: number) {
    const s = stateRef.current;
    if (!s.boss) return;
    const b = s.boss;
    const floorY = floorAt(b.x);

    // 1. Draw traveling ground shockwaves
    for (const sw of b.shockwaves) {
      ctx.save();
      ctx.shadowColor = sw.color;
      ctx.shadowBlur = 14;
      ctx.fillStyle = sw.color;

      ctx.beginPath();
      const h = sw.height;
      const w = sw.width;
      ctx.moveTo(sw.x - w / 2, sw.y);
      ctx.lineTo(sw.x, sw.y - h);
      ctx.lineTo(sw.x + w / 2, sw.y);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.fillRect(sw.x - 2, sw.y - h * 0.7, 4, h * 0.6);
      ctx.restore();
    }

    if (b.defeated) {
      ctx.save();
      ctx.translate(b.x, floorY);
      ctx.fillStyle = '#1e293b';
      ctx.beginPath();
      ctx.roundRect(-40, -18, 80, 18, 4);
      ctx.fill();
      ctx.restore();
      return;
    }

    // Boss breathing & floating animation
    const breathe = Math.sin(time / 220) * 3;
    const hover = b.level === 90 ? Math.sin(time / 180) * 12 - 20 : b.level === 98 ? Math.sin(time / 160) * 16 - 25 : 0;
    const windupOffset = b.state === 'windup' ? Math.sin(time / 50) * 4 : 0;

    ctx.save();
    const shadowScale = b.level === 98 ? 1.6 : b.level === 90 ? 1.4 : 1.3;
    ctx.fillStyle = 'rgba(2, 6, 23, 0.55)';
    ctx.beginPath();
    ctx.ellipse(b.x, floorY, 45 * shadowScale, 14 * shadowScale, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.translate(b.x + windupOffset, floorY + hover);
    ctx.scale(b.facing, 1);

    if (b.flash > 0) {
      ctx.filter = 'brightness(2.2)';
    }

    // --- LEVEL 50: GOLIATH BEHEMOTH ---
    if (b.id === 'behemoth') {
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(-28, -50, 20, 50);
      ctx.fillRect(8, -50, 20, 50);
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(-34, -12, 30, 12);
      ctx.fillRect(4, -12, 30, 12);

      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.roundRect(-38, -120 + breathe, 76, 75, 8);
      ctx.fill();
      ctx.strokeStyle = '#e11d48';
      ctx.lineWidth = 3;
      ctx.stroke();

      ctx.fillStyle = '#e11d48';
      ctx.shadowColor = '#f43f5e';
      ctx.shadowBlur = 16;
      ctx.beginPath();
      ctx.arc(0, -82 + breathe, 14, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(0, -82 + breathe, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      ctx.fillStyle = '#881337';
      ctx.beginPath();
      ctx.moveTo(-52, -125 + breathe);
      ctx.lineTo(-24, -135 + breathe);
      ctx.lineTo(-24, -100 + breathe);
      ctx.lineTo(-52, -100 + breathe);
      ctx.closePath();
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(52, -125 + breathe);
      ctx.lineTo(24, -135 + breathe);
      ctx.lineTo(24, -100 + breathe);
      ctx.lineTo(52, -100 + breathe);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = '#020617';
      ctx.beginPath();
      ctx.roundRect(-16, -145 + breathe, 32, 26, 4);
      ctx.fill();
      ctx.strokeStyle = '#e11d48';
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.fillStyle = '#f43f5e';
      ctx.shadowColor = '#f43f5e';
      ctx.shadowBlur = 10;
      ctx.fillRect(-10, -134 + breathe, 20, 4);
      ctx.shadowBlur = 0;

      const fistY = b.state === 'windup' ? -130 + breathe : -70 + breathe;
      ctx.fillStyle = '#9f1239';
      ctx.beginPath();
      ctx.roundRect(32, fistY, 28, 36, 6);
      ctx.fill();
      ctx.strokeStyle = '#f43f5e';
      ctx.lineWidth = 2;
      ctx.stroke();
    }
    // --- LEVEL 90: CYBER VOID COLOSSUS ---
    else if (b.id === 'colossus') {
      ctx.save();
      ctx.strokeStyle = '#06b6d4';
      ctx.shadowColor = '#06b6d4';
      ctx.shadowBlur = 18;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.ellipse(0, -85 + breathe, 65, 22, (time / 400), 0, Math.PI * 2);
      ctx.stroke();

      ctx.strokeStyle = '#7c3aed';
      ctx.shadowColor = '#7c3aed';
      ctx.beginPath();
      ctx.ellipse(0, -85 + breathe, 50, 18, -(time / 350), 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();

      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.roundRect(-30, -125 + breathe, 60, 80, 8);
      ctx.fill();
      ctx.strokeStyle = '#06b6d4';
      ctx.lineWidth = 2.5;
      ctx.stroke();

      ctx.fillStyle = '#06b6d4';
      ctx.shadowColor = '#38bdf8';
      ctx.shadowBlur = 20;
      ctx.beginPath();
      ctx.arc(0, -85 + breathe, 18, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#020617';
      ctx.beginPath();
      ctx.arc(0, -85 + breathe, 9, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      ctx.fillStyle = '#1e1b4b';
      ctx.fillRect(-48, -105 + breathe, 14, 45);
      ctx.fillRect(34, -105 + breathe, 14, 45);
      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(-45, -64 + breathe, 8, 5);
      ctx.fillRect(37, -64 + breathe, 8, 5);

      ctx.fillStyle = '#020617';
      ctx.beginPath();
      ctx.moveTo(-20, -135 + breathe);
      ctx.lineTo(0, -165 + breathe);
      ctx.lineTo(20, -135 + breathe);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.fillStyle = '#38bdf8';
      ctx.shadowColor = '#38bdf8';
      ctx.shadowBlur = 10;
      ctx.fillRect(-10, -145 + breathe, 6, 3);
      ctx.fillRect(4, -145 + breathe, 6, 3);
      ctx.shadowBlur = 0;
    }
    // --- LEVEL 98: OMEGA WARDEN 99 ---
    else if (b.id === 'warden') {
      ctx.save();
      ctx.strokeStyle = '#f59e0b';
      ctx.shadowColor = '#fbbf24';
      ctx.shadowBlur = 24;
      ctx.lineWidth = 3.5;

      const wingFlap = Math.sin(time / 200) * 0.15;
      ctx.beginPath();
      ctx.moveTo(0, -100 + breathe);
      ctx.lineTo(-75, -170 + breathe + wingFlap * 40);
      ctx.lineTo(-95, -110 + breathe);
      ctx.lineTo(-45, -70 + breathe);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(0, -100 + breathe);
      ctx.lineTo(75, -170 + breathe + wingFlap * 40);
      ctx.lineTo(95, -110 + breathe);
      ctx.lineTo(45, -70 + breathe);
      ctx.stroke();
      ctx.restore();

      ctx.fillStyle = '#1c1917';
      ctx.beginPath();
      ctx.roundRect(-36, -140 + breathe, 72, 95, 10);
      ctx.fill();
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 3;
      ctx.stroke();

      ctx.fillStyle = '#f59e0b';
      ctx.shadowColor = '#fbbf24';
      ctx.shadowBlur = 25;
      ctx.beginPath();
      ctx.arc(0, -95 + breathe, 20, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(0, -95 + breathe, 10, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      ctx.fillStyle = '#0c0a09';
      ctx.beginPath();
      ctx.moveTo(-22, -148 + breathe);
      ctx.lineTo(-14, -178 + breathe);
      ctx.lineTo(0, -162 + breathe);
      ctx.lineTo(14, -178 + breathe);
      ctx.lineTo(22, -148 + breathe);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#fbbf24';
      ctx.lineWidth = 2.5;
      ctx.stroke();

      ctx.fillStyle = '#fbbf24';
      ctx.shadowColor = '#fbbf24';
      ctx.shadowBlur = 12;
      ctx.fillRect(-12, -150 + breathe, 24, 4);
      ctx.shadowBlur = 0;

      const bladeAngle = time / 300;
      ctx.fillStyle = '#dc2626';
      ctx.shadowColor = '#ef4444';
      ctx.shadowBlur = 14;
      ctx.fillRect(45, -120 + breathe + Math.sin(bladeAngle) * 15, 10, 60);
      ctx.fillRect(-55, -120 + breathe + Math.cos(bladeAngle) * 15, 10, 60);
      ctx.shadowBlur = 0;
    }

    ctx.restore();
  }

  function drawBossHealthBar(ctx: CanvasRenderingContext2D) {
    const s = stateRef.current;
    if (!s.boss || s.boss.defeated) return;
    const b = s.boss;

    const barW = 540;
    const barH = 14;
    const x = (CANVAS_VIRTUAL_W - barW) / 2;
    const y = 52;

    ctx.save();
    ctx.fillStyle = 'rgba(2, 6, 23, 0.9)';
    ctx.beginPath();
    ctx.roundRect(x - 16, y - 28, barW + 32, barH + 42, 8);
    ctx.fill();
    ctx.strokeStyle = 'rgba(245, 158, 11, 0.5)';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.fillStyle = '#fbbf24';
    ctx.font = '900 12px "Segoe UI", sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`⚔️ LVL ${b.level} : ${b.name}`, x, y - 10);

    ctx.fillStyle = '#94a3b8';
    ctx.font = '700 9px "Segoe UI", sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(b.title.toUpperCase(), x + barW, y - 10);

    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.roundRect(x, y, barW, barH, 4);
    ctx.fill();

    const pct = Math.max(0, Math.min(1, b.hp / b.maxHp));
    const fillW = Math.round(barW * pct);

    if (fillW > 0) {
      const grad = ctx.createLinearGradient(x, 0, x + barW, 0);
      if (b.level === 98) {
        grad.addColorStop(0, '#f59e0b');
        grad.addColorStop(1, '#ef4444');
      } else if (b.level === 90) {
        grad.addColorStop(0, '#06b6d4');
        grad.addColorStop(1, '#8b5cf6');
      } else {
        grad.addColorStop(0, '#f43f5e');
        grad.addColorStop(1, '#be123c');
      }
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.roundRect(x, y, fillW, barH, 4);
      ctx.fill();
    }

    ctx.fillStyle = '#ffffff';
    ctx.font = '800 9px "Consolas", monospace';
    ctx.textAlign = 'center';
    ctx.fillText(`${b.hp.toLocaleString()} / ${b.maxHp.toLocaleString()} HP`, x + barW / 2, y + 10.5);

    ctx.restore();
  }

  function drawCase(ctx: CanvasRenderingContext2D) {
    const s = stateRef.current;
    const x = 254, y = floorAt(x) - 67;
    ctx.save();
    ctx.fillStyle = s.caseOpen ? '#101827' : '#151f32';
    ctx.beginPath();
    ctx.roundRect(x - 43, y - 34, 86, 52, 5);
    ctx.fill();
    ctx.strokeStyle = s.inspected ? 'rgba(56, 189, 248, 0.6)' : 'rgba(148, 163, 184, 0.35)';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.fillStyle = s.inspected ? '#7dd3fc' : '#8c9ab0';
    ctx.font = '700 9px "Segoe UI", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(s.caseOpen ? "CASE / OPEN" : "LOCKED CASE", x, y + 34);

    if (s.inspected && !s.caseOpen) {
      ctx.fillStyle = '#fbbf24';
      ctx.font = '600 8px "Segoe UI", sans-serif';
      ctx.fillText("E / OPEN TO TAKE HAMMER", x, y + 49);
    }
    ctx.restore();
  }

  function drawMysteryChest(ctx: CanvasRenderingContext2D) {
    const s = stateRef.current;
    if (!s.chestActive) return;
    const y = floorAt(s.chestX);

    ctx.save();
    ctx.shadowColor = '#fbbf24';
    ctx.shadowBlur = 12;
    ctx.fillStyle = '#704923';
    ctx.beginPath();
    ctx.roundRect(s.chestX - 24, y - 24, 48, 25, 4);
    ctx.fill();
    ctx.strokeStyle = '#fbbf24';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.shadowBlur = 0;

    ctx.fillStyle = '#fcd34d';
    ctx.font = '750 8px "Segoe UI", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText("CHEST", s.chestX, y - 34);
    ctx.fillText("E / TAP", s.chestX, y + 16);
    ctx.restore();
  }

  function drawBlueSheet(ctx: CanvasRenderingContext2D) {
    const s = stateRef.current;
    if (!s.hasBlueSheet) return;
    const x = s.blueSheetX;
    const y = floorAt(x) - 105;

    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(-0.06);

    // Glowing blue cipher paper on the wall
    ctx.shadowColor = '#38bdf8';
    ctx.shadowBlur = 10;
    ctx.fillStyle = '#1e3a8a';
    ctx.fillRect(-18, -24, 36, 48);

    ctx.strokeStyle = '#60a5fa';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(-18, -24, 36, 48);
    ctx.shadowBlur = 0;

    // Header and cipher stripes on paper
    ctx.fillStyle = '#93c5fd';
    ctx.fillRect(-12, -18, 24, 3);
    ctx.fillStyle = '#60a5fa';
    ctx.fillRect(-12, -11, 20, 2);
    ctx.fillRect(-12, -6, 22, 2);
    ctx.fillRect(-12, -1, 16, 2);
    ctx.fillRect(-12, 4, 23, 2);
    ctx.fillRect(-12, 9, 18, 2);
    ctx.fillRect(-12, 14, 21, 2);

    ctx.restore();

    // Floating label indicator
    const dist = Math.abs(s.playerX - x);
    const inRange = dist < 160;

    ctx.fillStyle = inRange ? '#38bdf8' : '#64748b';
    ctx.font = '700 9px "Segoe UI", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText("NANO CIPHER SHEET", x, y - 36);

    if (inRange) {
      ctx.fillStyle = '#7dd3fc';
      ctx.font = '600 8px "Segoe UI", sans-serif';
      ctx.fillText("TAB > SCAN IN NANOSCANNER APP", x, y + 36);
    }
  }

  // Enhanced Character Drawing
  function drawEnhancedPlayer(ctx: CanvasRenderingContext2D, time: number) {
    const s = stateRef.current;
    const keys = keysRef.current;
    const moving = s.strike <= 0 && (keys.has("left") || keys.has("right")) && !s.crouched;
    const walk = moving ? Math.sin(time / 80) : 0;
    const breathe = Math.sin(time / 280) * 1.5;
    const bob = moving && !s.sprinting && s.jumpHeight === 0 ? Math.sin(time / 75) * 2.5 : 0;

    const attackProgress = s.strike > 0 ? 1 - s.strike : -1;
    const attackJumpHeight = attackProgress < 0 ? 0 : attackProgress < 0.42
      ? 54 * Math.sin((attackProgress / 0.42) * (Math.PI / 2))
      : attackProgress < 0.67
        ? 54 * (1 - (attackProgress - 0.42) / 0.25)
        : 0;

    const currentFloor = floorAt(s.playerX);
    const altitude = s.jumpHeight + attackJumpHeight;

    // Wardrobe Skin definition
    const skinDef = SKINS_CONFIG.find(sk => sk.id === s.equippedSkin) || SKINS_CONFIG[0];
    const isAstronaut = skinDef.id === 'astronaut';
    const suitColor = skinDef.suitColor;
    const accentColor = skinDef.accentColor;
    const visorColor = skinDef.visorColor;
    const helmetColor = skinDef.helmetColor;

    ctx.save();
    ctx.save();
    const shadowScale = Math.max(0.4, 1 - altitude / 180);
    const shadowAlpha = Math.max(0.08, 0.35 - (altitude / 200) * 0.25);
    ctx.fillStyle = `rgba(15, 23, 42, ${shadowAlpha})`;
    ctx.beginPath();
    ctx.ellipse(s.playerX, currentFloor, 19 * shadowScale, 6 * shadowScale, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    ctx.translate(s.playerX, currentFloor + bob - altitude);
    ctx.scale(s.facing, 1);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    const toolColor = s.tool >= 0 ? TOOLS[s.tool].color : '#94a3b8';

    if (s.crouched) {
      // Normal, well-proportioned crouching explorer (grounded tactical crouch / duck-walk)
      const crawlWalk = moving ? Math.sin(time / 85) : 0;
      const crouchBob = moving ? Math.abs(Math.sin(time / 85)) * 1.8 : 0;

      // 1. Spine Backpack / Power Cell (lowered with torso)
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.roundRect(-16, -44 + crouchBob, 7, 20, 3);
      ctx.fill();
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Cyan LED on Power Pack
      ctx.fillStyle = visorColor;
      ctx.fillRect(-15, -40 + crouchBob, 2, 4);

      // 2. Articulated Legs in a realistic squat
      ctx.strokeStyle = isAstronaut ? '#475569' : '#1e293b';
      ctx.lineWidth = 7;
      ctx.beginPath();
      if (moving) {
        ctx.moveTo(-4, -20); ctx.lineTo(-11 + crawlWalk * 6, -11); ctx.lineTo(-14 + crawlWalk * 7, -2);
        ctx.moveTo(4, -20); ctx.lineTo(7 - crawlWalk * 6, -11); ctx.lineTo(12 - crawlWalk * 7, -2);
      } else {
        ctx.moveTo(-4, -20); ctx.lineTo(-10, -11); ctx.lineTo(-12, -2);
        ctx.moveTo(4, -20); ctx.lineTo(8, -11); ctx.lineTo(10, -2);
      }
      ctx.stroke();

      // Explorer Boots with Tread
      ctx.fillStyle = '#020617';
      const b1X = moving ? -14 + crawlWalk * 7 : -12;
      const b2X = moving ? 12 - crawlWalk * 7 : 10;
      ctx.beginPath();
      ctx.roundRect(b1X - 2, -4, 10, 5, 2);
      ctx.roundRect(b2X - 2, -4, 10, 5, 2);
      ctx.fill();

      // 3. Torso Vest & Armor Coat (uses suitColor)
      ctx.fillStyle = suitColor;
      ctx.beginPath();
      ctx.roundRect(-10, -44 + crouchBob, 20, 24, 4);
      ctx.fill();

      // Belt with Utility Pouch & Buckle
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(-10, -24 + crouchBob, 20, 4);
      ctx.fillStyle = '#fbbf24';
      ctx.fillRect(-2, -24.5 + crouchBob, 4, 5);
      ctx.fillStyle = '#334155';
      ctx.fillRect(5, -26 + crouchBob, 5, 6);

      // Tactical Chest Straps
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(-9, -42 + crouchBob); ctx.lineTo(0, -24 + crouchBob);
      ctx.moveTo(9, -42 + crouchBob); ctx.lineTo(0, -24 + crouchBob);
      ctx.stroke();

      // 4. Head, Helmet & Visor
      ctx.fillStyle = helmetColor;
      ctx.beginPath();
      ctx.ellipse(1, -54 + crouchBob, 10, 11, 0.05, 0, Math.PI * 2);
      ctx.fill();

      if (isAstronaut) {
        // Gold EVA bubble visor
        ctx.fillStyle = visorColor;
        ctx.shadowColor = '#f59e0b';
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.ellipse(4, -53 + crouchBob, 6.5, 7, 0.05, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;

        ctx.strokeStyle = 'rgba(255,255,255,0.7)';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.arc(4, -53 + crouchBob, 5, -Math.PI * 0.7, -Math.PI * 0.2);
        ctx.stroke();
      } else {
        // Face skin
        ctx.fillStyle = '#d6a783';
        ctx.beginPath();
        ctx.ellipse(4, -53 + crouchBob, 6, 7, 0.05, 0, Math.PI * 2);
        ctx.fill();

        // Hood brim
        ctx.fillStyle = accentColor;
        ctx.beginPath();
        ctx.ellipse(1, -60 + crouchBob, 10, 5, 0.05, Math.PI, Math.PI * 2);
        ctx.fill();

        // Glowing Visor
        ctx.fillStyle = visorColor;
        ctx.shadowColor = visorColor;
        ctx.shadowBlur = 8;
        ctx.fillRect(5, -55 + crouchBob, 5, 3);
        ctx.shadowBlur = 0;
      }

      // 5. Arm & Equipped Hammer
      ctx.strokeStyle = accentColor;
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.moveTo(0, -38 + crouchBob);
      ctx.lineTo(11, -26 + crouchBob);
      ctx.stroke();

      if (s.tool >= 0) {
        ctx.save();
        ctx.translate(11, -26 + crouchBob);
        ctx.rotate(-0.35);

        // Shaft
        ctx.fillStyle = '#78350f';
        ctx.fillRect(0, -2.5, 24, 4.5);

        // Hammer Head
        ctx.fillStyle = toolColor;
        ctx.shadowColor = toolColor;
        ctx.shadowBlur = 6;
        ctx.beginPath();
        ctx.roundRect(18, -10, 13, 16, 2);
        ctx.fill();
        ctx.strokeStyle = '#ffffff88';
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.shadowBlur = 0;
        ctx.restore();
      }
    } else {
      if (s.sprinting) {
        ctx.rotate(0.18);
      }

      // Backpack
      ctx.fillStyle = isAstronaut ? '#334155' : '#0f172a';
      ctx.beginPath();
      ctx.roundRect(-16, -58 + breathe, 7, 24, 3);
      ctx.fill();
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      ctx.fillStyle = visorColor;
      ctx.fillRect(-15, -53 + breathe, 2, 4);

      // Legs
      ctx.strokeStyle = isAstronaut ? '#475569' : '#1e293b';
      ctx.lineWidth = 7;
      ctx.beginPath();

      if (altitude > 0) {
        ctx.moveTo(-4, -28); ctx.lineTo(-11, -16); ctx.lineTo(-7, -10);
        ctx.moveTo(4, -28); ctx.lineTo(11, -17); ctx.lineTo(16, -20);
      } else if (s.sprinting) {
        ctx.moveTo(-4, -28); ctx.lineTo(-8 + walk * 10, -14); ctx.lineTo(-16 + walk * 14, -2);
        ctx.moveTo(4, -28); ctx.lineTo(8 - walk * 10, -14); ctx.lineTo(16 - walk * 14, -2);
      } else {
        ctx.moveTo(-4, -28); ctx.lineTo(-5 + walk * 6, -14); ctx.lineTo(-6 + walk * 6, -2);
        ctx.moveTo(4, -28); ctx.lineTo(5 - walk * 6, -14); ctx.lineTo(6 - walk * 6, -2);
      }
      ctx.stroke();

      ctx.fillStyle = '#020617';
      const boot1X = altitude > 0 ? -9 : s.sprinting ? -18 + walk * 14 : -8 + walk * 6;
      const boot2X = altitude > 0 ? 15 : s.sprinting ? 15 - walk * 14 : 5 - walk * 6;
      ctx.beginPath();
      ctx.roundRect(boot1X - 2, -4, 10, 5, 2);
      ctx.roundRect(boot2X - 2, -4, 10, 5, 2);
      ctx.fill();

      // Torso Suit
      ctx.fillStyle = suitColor;
      ctx.beginPath();
      ctx.roundRect(-10, -57 + breathe, 20, 29, 4);
      ctx.fill();

      ctx.fillStyle = '#0f172a';
      ctx.fillRect(-10, -32 + breathe, 20, 4);
      ctx.fillStyle = '#fbbf24';
      ctx.fillRect(-2, -32.5 + breathe, 4, 5);
      ctx.fillStyle = '#334155';
      ctx.fillRect(5, -34 + breathe, 5, 6);

      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(-9, -54 + breathe); ctx.lineTo(0, -32 + breathe);
      ctx.moveTo(9, -54 + breathe); ctx.lineTo(0, -32 + breathe);
      ctx.stroke();

      // Head / Helmet
      ctx.fillStyle = helmetColor;
      ctx.beginPath();
      ctx.ellipse(0, -68 + breathe, 10, 11, 0, 0, Math.PI * 2);
      ctx.fill();

      if (isAstronaut) {
        // Gold EVA bubble visor
        ctx.fillStyle = visorColor;
        ctx.shadowColor = '#f59e0b';
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.ellipse(3, -67 + breathe, 7, 7, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;

        ctx.strokeStyle = 'rgba(255,255,255,0.7)';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.arc(3, -67 + breathe, 5, -Math.PI * 0.7, -Math.PI * 0.2);
        ctx.stroke();
      } else {
        ctx.fillStyle = '#d6a783';
        ctx.beginPath();
        ctx.ellipse(3, -67 + breathe, 6, 7, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = accentColor;
        ctx.beginPath();
        ctx.ellipse(0, -74 + breathe, 10, 5, 0, Math.PI, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = visorColor;
        ctx.shadowColor = visorColor;
        ctx.shadowBlur = 8;
        ctx.fillRect(4, -69 + breathe, 5, 3);
        ctx.shadowBlur = 0;
      }

      if (attackProgress >= 0) {
        const swingAngle = attackProgress < 0.42
          ? -1.6
          : attackProgress < 0.68
            ? -1.6 + ((attackProgress - 0.42) / 0.26) * 3.3
            : 1.7 - ((attackProgress - 0.68) / 0.32) * 2.1;
        const pivotY = attackProgress < 0.42 ? -66 : -66 + Math.min(1, (attackProgress - 0.42) / 0.25) * 18;

        if (attackProgress >= 0.42 && attackProgress <= 0.72) {
          ctx.save();
          ctx.strokeStyle = `${toolColor}55`;
          ctx.lineWidth = 14;
          ctx.beginPath();
          ctx.arc(0, pivotY, 48, -1.2, 1.4);
          ctx.stroke();
          ctx.restore();
        }

        ctx.strokeStyle = accentColor;
        ctx.lineWidth = 6;
        ctx.beginPath();
        ctx.moveTo(0, -50 + breathe);
        ctx.lineTo(6, pivotY);
        ctx.stroke();

        if (s.tool >= 0) {
          ctx.save();
          ctx.translate(6, pivotY);
          ctx.rotate(swingAngle);

          ctx.fillStyle = '#78350f';
          ctx.fillRect(0, -3, 44, 5);

          ctx.fillStyle = toolColor;
          ctx.shadowColor = toolColor;
          ctx.shadowBlur = 10;
          ctx.beginPath();
          ctx.roundRect(36, -12, 18, 22, 3);
          ctx.fill();
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 1.2;
          ctx.stroke();
          ctx.shadowBlur = 0;
          ctx.restore();
        }
      } else {
        ctx.strokeStyle = accentColor;
        ctx.lineWidth = 6;
        ctx.beginPath();
        ctx.moveTo(0, -50 + breathe);
        ctx.lineTo(12, -34 + breathe);
        ctx.stroke();

        if (s.tool >= 0) {
          ctx.save();
          ctx.translate(12, -34 + breathe);
          ctx.rotate(-0.45);

          ctx.fillStyle = '#78350f';
          ctx.fillRect(0, -2.5, 28, 4.5);

          ctx.fillStyle = toolColor;
          ctx.shadowColor = toolColor;
          ctx.shadowBlur = 6;
          ctx.beginPath();
          ctx.roundRect(22, -10, 14, 18, 2);
          ctx.fill();
          ctx.strokeStyle = '#ffffff88';
          ctx.lineWidth = 1;
          ctx.stroke();
          ctx.shadowBlur = 0;
          ctx.restore();
        }
      }
    }

    ctx.restore();
  }

  // Pointer click handler with EXACT virtual coordinate mapping
  const handleCanvasPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const scale = Math.min(rect.width / CANVAS_VIRTUAL_W, rect.height / CANVAS_VIRTUAL_H);
    const offsetX = (rect.width - CANVAS_VIRTUAL_W * scale) / 2;
    const offsetY = (rect.height - CANVAS_VIRTUAL_H * scale) / 2;

    const pX = (e.clientX - rect.left - offsetX) / scale;
    const pY = (e.clientY - rect.top - offsetY) / scale;

    const s = stateRef.current;
    if (s.tablet) return;

    const camX = Math.max(0, Math.min((s.layout?.length ?? 1200) - CANVAS_VIRTUAL_W, s.playerX - CANVAS_VIRTUAL_W / 2));
    const camY = floorAt(s.playerX) - 488;
    const worldX = camX + pX;
    const worldY = camY + pY;

    // Boss tap / strike
    if (s.boss && !s.boss.defeated && Math.abs(worldX - s.boss.x) < 85 && Math.abs(worldY - (floorAt(s.boss.x) - 75)) < 95) {
      strikeVault();
      return;
    }

    // Keypad Terminal tap
    if (s.isPuzzleRoom && s.vaultCodeLocked && Math.abs(worldX - s.keypadTerminalX) < 55) {
      sound.playClick();
      setKeypadModalOpen(true);
      return;
    }

    // Math Note Slate tap
    if (s.isPuzzleRoom && Math.abs(worldX - s.mathNoteX) < 55) {
      sound.playClick();
      notify(`MATH CIPHER: ${s.puzzleFormula} (Solve in Calculator app!)`, 4200);
      return;
    }

    if (Math.abs(worldX - s.doorX) <= 130 && Math.abs(worldY - (floorAt(s.doorX) - 150)) <= 170) {
      strikeVault();
      return;
    }

    if (s.room === 0 && Math.abs(worldX - 770) < 55 && Math.abs(worldY - (floorAt(770) - 86)) < 60) {
      interact();
      return;
    }

    if (s.room === 0 && Math.abs(worldX - 254) < 65 && Math.abs(worldY - (floorAt(254) - 67)) < 55) {
      interact();
      return;
    }

    if (s.chestActive && Math.abs(worldX - s.chestX) < 55) {
      interact();
      return;
    }

    if (Math.abs(s.playerX - s.doorX) <= 130 || (s.boss && !s.boss.defeated && Math.abs(s.playerX - s.boss.x) <= 170)) {
      strikeVault();
    } else {
      interact();
    }
  };

  return (
    <div className="relative w-full h-full select-none bg-slate-950 overflow-hidden font-sans">
      {/* 1. Main Game Canvas (Unobstructed Viewport) */}
      <canvas
        ref={canvasRef}
        onPointerDown={handleCanvasPointerDown}
        className="w-full h-full block cursor-crosshair touch-none"
      />

      {/* 2. Top Sleek Game HUD */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 w-[94%] max-w-4xl bg-slate-900/85 border border-slate-700/60 rounded-xl px-5 py-2.5 flex items-center justify-between shadow-2xl backdrop-blur-md pointer-events-auto">
        <div className="flex items-center gap-6">
          <div className="border-l-2 border-sky-400 pl-3">
            <span className="text-[10px] tracking-widest text-slate-400 font-bold block">ROOM</span>
            <span className="text-lg font-black text-sky-100 tabular-nums">{String(hudRoom).padStart(3, '0')}</span>
          </div>

          <div className="border-l border-slate-700/60 pl-4">
            <span className="text-[10px] tracking-widest text-slate-400 font-bold block">EQUIPPED</span>
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-bold text-amber-300">{hudToolName}</span>
              <span className="text-xs font-semibold text-sky-400">(×{hudPower})</span>
            </div>
          </div>

          <div className="border-l border-slate-700/60 pl-4">
            <span className="text-[10px] tracking-widest text-slate-400 font-bold block">NENO COINS</span>
            <div className="flex items-center gap-1.5">
              <div className="w-4 h-4 rounded bg-amber-400 flex items-center justify-center text-[10px] font-black text-amber-950 shadow-sm">
                9
              </div>
              <span className="text-base font-black text-amber-200 tabular-nums">{hudCoins}</span>
            </div>
          </div>
        </div>

        {/* Stamina & Vault integrity */}
        <div className="hidden md:flex items-center gap-5">
          <div>
            <div className="flex justify-between text-[10px] text-slate-400 font-semibold mb-1">
              <span>STAMINA</span>
              <span>{Math.round(hudStamina)}%</span>
            </div>
            <div className="w-28 h-2 bg-slate-800 rounded-full overflow-hidden border border-slate-700/50">
              <div
                className={`h-full transition-all duration-75 ${hudStamina < 25 ? 'bg-amber-500' : 'bg-sky-400'}`}
                style={{ width: `${hudStamina}%` }}
              />
            </div>
          </div>

          <div className="border-l border-slate-700/60 pl-4">
            <div className="flex justify-between text-[10px] text-slate-400 font-semibold mb-1">
              <span>VAULT INTEGRITY</span>
              <span className="text-rose-400 tabular-nums">{hudDoorHp.current}/{hudDoorHp.max}</span>
            </div>
            <div className="w-28 h-2 bg-slate-800 rounded-full overflow-hidden border border-slate-700/50">
              <div
                className="h-full bg-rose-500 transition-all duration-150"
                style={{ width: `${(hudDoorHp.current / hudDoorHp.max) * 100}%` }}
              />
            </div>
          </div>
        </div>

        {/* Action Controls cluster */}
        <div className="flex items-center gap-2">
          {/* Mobile Controls Toggle Button */}
          <button
            onClick={() => {
              sound.playClick();
              setShowMobileControls(prev => !prev);
            }}
            title="Toggle Mobile Touch Controls"
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-bold transition shadow-lg ${
              showMobileControls
                ? 'bg-sky-500/25 border-sky-400 text-sky-200 shadow-sky-500/20'
                : 'bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white border-slate-700'
            }`}
          >
            <Gamepad2 className={`w-3.5 h-3.5 ${showMobileControls ? 'text-sky-400' : 'text-slate-400'}`} />
            <span>Mobile Controls</span>
            {showMobileControls && <div className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-pulse ml-0.5" />}
          </button>

          <button
            onClick={() => setSoundOn(sound.toggle())}
            title="Toggle Sound"
            className="p-2 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition"
          >
            {soundOn ? <Volume2 className="w-4 h-4 text-sky-400" /> : <VolumeX className="w-4 h-4 text-slate-500" />}
          </button>

          <button
            onClick={resetProgress}
            title="Reset Game Progress"
            className="p-2 rounded-lg bg-slate-800/80 hover:bg-rose-900/40 text-slate-300 hover:text-rose-300 border border-slate-700 transition"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          <button
            onClick={() => toggleLaptop()}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 hover:text-sky-100 border border-sky-400/50 transition font-bold text-xs tracking-wider shadow-lg"
          >
            <LaptopIcon className="w-4 h-4 text-sky-400" />
            <span>LAPTOP (TAB)</span>
          </button>
        </div>
      </div>

      {/* 3. In-Game Toast Notification */}
      {toastMsg && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 bg-slate-900/95 border border-sky-500/40 text-sky-100 text-xs font-semibold px-4 py-2 rounded-lg shadow-xl backdrop-blur-md pointer-events-none transition animate-fade-in z-30">
          {toastMsg}
        </div>
      )}

      {/* 4. Windows 10 Laptop Desktop & Multi-Window Managing System */}
      {tabletOpen && (
        <div className="absolute inset-0 flex items-center justify-center p-3 sm:p-5 z-40 bg-slate-950/75 backdrop-blur-sm">
          {/* Outer Laptop Chassis (Notice: NO outer close 'X'!) */}
          <div className="relative w-full max-w-[920px] h-[600px] bg-slate-950 border-4 border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col ring-1 ring-sky-500/30">
            {/* Top Webcam Notch */}
            <div className="h-4 bg-slate-950 flex items-center justify-center gap-1.5 border-b border-slate-900">
              <div className="w-1.5 h-1.5 rounded-full bg-slate-800 border border-slate-700" />
              <div className="w-1 h-1 rounded-full bg-sky-400/40 animate-pulse" />
            </div>

            {/* Desktop Screen Area */}
            <div
              ref={desktopRef}
              onPointerMove={handleDesktopPointerMove}
              onPointerUp={handleDesktopPointerUp}
              onClick={() => {
                if (startMenuOpen) setStartMenuOpen(false);
              }}
              className="relative flex-1 bg-cover bg-center overflow-hidden select-none"
              style={{
                background: (WALLPAPERS.find(w => w.id === activeWallpaperId) || WALLPAPERS[0]).backgroundCss
              }}
            >
              {/* Desktop Shortcut Icons in clean columns */}
              <div className="absolute top-3 left-3 grid grid-flow-col grid-rows-5 gap-1.5 sm:gap-2 z-0 max-h-[530px]">
                {/* 1. Square 9 Market */}
                <div
                  onDoubleClick={() => openWindow('market')}
                  onClick={() => openWindow('market')}
                  className="group flex flex-col items-center w-18 sm:w-20 p-1.5 rounded-lg hover:bg-sky-500/20 hover:border hover:border-sky-400/40 cursor-pointer transition text-center"
                >
                  <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl overflow-hidden mb-1 border border-slate-700/80 shadow group-hover:scale-105 transition bg-slate-900">
                    <img src="/market.jpg" alt="Market" className="w-full h-full object-cover" />
                  </div>
                  <span className="text-[10px] font-semibold text-white drop-shadow leading-tight">Square 9</span>
                </div>

                {/* 2. Lucky Crates */}
                <div
                  onDoubleClick={() => openWindow('crates')}
                  onClick={() => openWindow('crates')}
                  className="group flex flex-col items-center w-18 sm:w-20 p-1.5 rounded-lg hover:bg-rose-500/20 hover:border hover:border-rose-400/40 cursor-pointer transition text-center"
                >
                  <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl overflow-hidden mb-1 border border-slate-700/80 shadow group-hover:scale-105 transition bg-slate-900">
                    <img src="/crate.jpg" alt="Crates" className="w-full h-full object-cover" />
                  </div>
                  <span className="text-[10px] font-semibold text-white drop-shadow leading-tight">Crates</span>
                </div>

                {/* 3. Nine AI */}
                <div
                  onDoubleClick={() => openWindow('nine-ai')}
                  onClick={() => openWindow('nine-ai')}
                  className="group flex flex-col items-center w-18 sm:w-20 p-1.5 rounded-lg hover:bg-violet-500/20 hover:border hover:border-violet-400/40 cursor-pointer transition text-center"
                >
                  <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl overflow-hidden mb-1 border border-violet-400/60 shadow group-hover:scale-105 transition bg-black">
                    <img src="/nine-ai.jpg" alt="Nine AI" className="w-full h-full object-cover" />
                  </div>
                  <span className="text-[10px] font-bold text-violet-200 drop-shadow leading-tight">Nine AI</span>
                </div>

                {/* 4. Courier Wardrobe */}
                <div
                  onDoubleClick={() => openWindow('wardrobe')}
                  onClick={() => openWindow('wardrobe')}
                  className="group flex flex-col items-center w-18 sm:w-20 p-1.5 rounded-lg hover:bg-indigo-500/20 hover:border hover:border-indigo-400/40 cursor-pointer transition text-center"
                >
                  <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl mb-1 border border-indigo-500/50 shadow group-hover:scale-105 transition bg-slate-900/90 flex items-center justify-center text-indigo-400">
                    <Shirt className="w-6 h-6 text-indigo-400" />
                  </div>
                  <span className="text-[10px] font-semibold text-indigo-200 drop-shadow leading-tight">Wardrobe</span>
                </div>

                {/* 5. NMD Prompt */}
                <div
                  onDoubleClick={() => openWindow('prompt')}
                  onClick={() => openWindow('prompt')}
                  className="group flex flex-col items-center w-18 sm:w-20 p-1.5 rounded-lg hover:bg-emerald-500/20 hover:border hover:border-emerald-400/40 cursor-pointer transition text-center"
                >
                  <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl mb-1 border border-emerald-500/50 shadow group-hover:scale-105 transition bg-black flex items-center justify-center text-emerald-400">
                    <TerminalIcon className="w-6 h-6 text-emerald-400" />
                  </div>
                  <span className="text-[10px] font-semibold text-emerald-300 drop-shadow leading-tight">NMD Prompt</span>
                </div>

                {/* 6. Secret Notepad */}
                <div
                  onDoubleClick={() => openWindow('notepad')}
                  onClick={() => openWindow('notepad')}
                  className="group flex flex-col items-center w-18 sm:w-20 p-1.5 rounded-lg hover:bg-sky-500/20 hover:border hover:border-sky-400/40 cursor-pointer transition text-center"
                >
                  <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl mb-1 border border-sky-400/50 shadow group-hover:scale-105 transition bg-slate-900/90 flex items-center justify-center text-sky-400">
                    <FileText className="w-6 h-6 text-sky-400" />
                  </div>
                  <span className="text-[10px] font-semibold text-white drop-shadow leading-tight">Notepad</span>
                </div>

                {/* 7. NanoScanner */}
                <div
                  onDoubleClick={() => openWindow('nanoscanner')}
                  onClick={() => openWindow('nanoscanner')}
                  className="group flex flex-col items-center w-18 sm:w-20 p-1.5 rounded-lg hover:bg-cyan-500/20 hover:border hover:border-cyan-400/40 cursor-pointer transition text-center"
                >
                  <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl mb-1 border border-cyan-400/50 shadow group-hover:scale-105 transition bg-slate-900/90 flex items-center justify-center text-cyan-400">
                    <Radio className="w-6 h-6 text-cyan-400" />
                  </div>
                  <span className="text-[10px] font-semibold text-cyan-200 drop-shadow leading-tight">Scanner</span>
                </div>

                {/* 8. Doogle Browser */}
                <div
                  onDoubleClick={() => openWindow('doogle')}
                  onClick={() => openWindow('doogle')}
                  className="group flex flex-col items-center w-18 sm:w-20 p-1.5 rounded-lg hover:bg-blue-500/20 hover:border hover:border-blue-400/40 cursor-pointer transition text-center"
                >
                  <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl mb-1 border border-blue-500/50 shadow group-hover:scale-105 transition bg-slate-900/90 flex items-center justify-center p-1.5 overflow-hidden">
                    <img
                      src="/assets/aistudio/Multicolor_Geometric_D_Logo_7d11e51b.png"
                      alt="Doogle"
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <span className="text-[10px] font-semibold text-white drop-shadow leading-tight">Doogle</span>
                </div>

                {/* 9. Hammer Enchanting */}
                <div
                  onDoubleClick={() => openWindow('enchant')}
                  onClick={() => openWindow('enchant')}
                  className="group flex flex-col items-center w-18 sm:w-20 p-1.5 rounded-lg hover:bg-amber-500/20 hover:border hover:border-amber-400/40 cursor-pointer transition text-center"
                >
                  <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl mb-1 border border-amber-500/50 shadow group-hover:scale-105 transition bg-slate-900/90 flex items-center justify-center text-amber-400">
                    <Flame className="w-6 h-6 text-amber-400" />
                  </div>
                  <span className="text-[10px] font-semibold text-white drop-shadow leading-tight">Enchanting</span>
                </div>

                {/* 10. Water Sorter Lab */}
                <div
                  onDoubleClick={() => openWindow('watersort')}
                  onClick={() => openWindow('watersort')}
                  className="group flex flex-col items-center w-18 sm:w-20 p-1.5 rounded-lg hover:bg-cyan-500/20 hover:border hover:border-cyan-400/40 cursor-pointer transition text-center"
                >
                  <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl mb-1 border border-cyan-500/50 shadow group-hover:scale-105 transition bg-slate-900/90 flex items-center justify-center text-cyan-400 text-lg">
                    🧪
                  </div>
                  <span className="text-[10px] font-semibold text-white drop-shadow leading-tight">Water Sorter</span>
                </div>

                {/* 11. Bounties & Quests */}
                <div
                  onDoubleClick={() => openWindow('quests')}
                  onClick={() => openWindow('quests')}
                  className="group flex flex-col items-center w-18 sm:w-20 p-1.5 rounded-lg hover:bg-amber-500/20 hover:border hover:border-amber-400/40 cursor-pointer transition text-center"
                >
                  <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl mb-1 border border-amber-500/50 shadow group-hover:scale-105 transition bg-slate-900/90 flex items-center justify-center text-amber-400">
                    <Trophy className="w-6 h-6 text-amber-400" />
                  </div>
                  <span className="text-[10px] font-semibold text-white drop-shadow leading-tight">Quests</span>
                </div>

                {/* 12. Settings */}
                <div
                  onDoubleClick={() => openWindow('settings')}
                  onClick={() => openWindow('settings')}
                  className="group flex flex-col items-center w-18 sm:w-20 p-1.5 rounded-lg hover:bg-slate-500/20 hover:border hover:border-slate-400/40 cursor-pointer transition text-center"
                >
                  <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl mb-1 border border-slate-500/50 shadow group-hover:scale-105 transition bg-slate-900/90 flex items-center justify-center text-slate-300">
                    <SettingsIcon className="w-6 h-6 text-slate-300" />
                  </div>
                  <span className="text-[10px] font-semibold text-white drop-shadow leading-tight">Settings</span>
                </div>

                {/* 13. Field Guide */}
                <div
                  onDoubleClick={() => openWindow('help')}
                  onClick={() => openWindow('help')}
                  className="group flex flex-col items-center w-18 sm:w-20 p-1.5 rounded-lg hover:bg-sky-500/20 hover:border hover:border-sky-400/40 cursor-pointer transition text-center"
                >
                  <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl mb-1 border border-sky-400/50 bg-slate-900/90 flex items-center justify-center group-hover:scale-105 transition shadow">
                    <HelpCircle className="w-6 h-6 text-sky-400" />
                  </div>
                  <span className="text-[10px] font-semibold text-white drop-shadow leading-tight">Field Guide</span>
                </div>

                {/* 14. Alarms & Clock */}
                <div
                  onDoubleClick={() => openWindow('clock')}
                  onClick={() => openWindow('clock')}
                  className="group flex flex-col items-center w-18 sm:w-20 p-1.5 rounded-lg hover:bg-amber-500/20 hover:border hover:border-amber-400/40 cursor-pointer transition text-center"
                >
                  <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl mb-1 border border-amber-400/50 shadow group-hover:scale-105 transition bg-slate-900/90 flex items-center justify-center text-amber-400">
                    <ClockIcon className="w-6 h-6 text-amber-400" />
                  </div>
                  <span className="text-[10px] font-semibold text-white drop-shadow leading-tight">Clock</span>
                </div>

                {/* 15. Calculator */}
                <div
                  onDoubleClick={() => openWindow('calc')}
                  onClick={() => openWindow('calc')}
                  className="group flex flex-col items-center w-18 sm:w-20 p-1.5 rounded-lg hover:bg-sky-500/20 hover:border hover:border-sky-400/40 cursor-pointer transition text-center"
                >
                  <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl mb-1 border border-sky-400/50 shadow group-hover:scale-105 transition bg-slate-900/90 flex items-center justify-center text-sky-400">
                    <CalcIcon className="w-6 h-6 text-sky-400" />
                  </div>
                  <span className="text-[10px] font-semibold text-white drop-shadow leading-tight">Calculator</span>
                </div>
              </div>

              {/* Multi-Window Managing Container */}
              {windows.map(win => {
                if (!win.isOpen || win.isMinimized) return null;
                const isActive = activeWindowId === win.id;

                return (
                  <div
                    key={win.id}
                    onPointerDown={() => focusWindow(win.id)}
                    style={{
                      left: `${win.x}px`,
                      top: `${win.y}px`,
                      width: `${win.w}px`,
                      height: `${win.h}px`,
                      zIndex: win.zIndex
                    }}
                    className={`absolute flex flex-col rounded-lg overflow-hidden shadow-2xl transition-shadow ${
                      win.isMaximized ? 'rounded-none' : ''
                    } ${
                      isActive
                        ? 'border-2 border-sky-400 shadow-sky-950/60'
                        : 'border border-slate-700/80 opacity-95 shadow-black/80'
                    } bg-slate-900`}
                  >
                    {/* Window Header / Title Bar */}
                    <div
                      onPointerDown={(e) => handleTitleBarPointerDown(win.id, e)}
                      onDoubleClick={(e) => toggleMaximizeWindow(win.id, e)}
                      className={`h-8 px-3 flex items-center justify-between select-none cursor-move transition-colors ${
                        isActive ? 'bg-slate-950 text-sky-200' : 'bg-slate-900 text-slate-400'
                      }`}
                    >
                      <div className="flex items-center gap-2 overflow-hidden pointer-events-none">
                        <div className="w-4 h-4 rounded overflow-hidden flex items-center justify-center shrink-0">
                          {win.id === 'market' && <img src="/market.jpg" alt="" className="w-full h-full object-cover" />}
                          {win.id === 'crates' && <img src="/crate.jpg" alt="" className="w-full h-full object-cover" />}
                          {win.id === 'nine-ai' && <img src="/nine-ai.jpg" alt="" className="w-full h-full object-cover" />}
                          {win.id === 'wardrobe' && <Shirt className="w-3.5 h-3.5 text-indigo-400" />}
                          {win.id === 'prompt' && <TerminalIcon className="w-3.5 h-3.5 text-emerald-400" />}
                          {win.id === 'notepad' && <FileText className="w-3.5 h-3.5 text-sky-400" />}
                          {win.id === 'nanoscanner' && <Radio className="w-3.5 h-3.5 text-cyan-400" />}
                          {win.id === 'enchant' && <Flame className="w-3.5 h-3.5 text-amber-400" />}
                          {win.id === 'watersort' && <span className="text-xs">🧪</span>}
                          {win.id === 'quests' && <Trophy className="w-3.5 h-3.5 text-amber-400" />}
                          {win.id === 'doogle' && <img src="/assets/aistudio/Multicolor_Geometric_D_Logo_7d11e51b.png" alt="" className="w-full h-full object-contain" />}
                          {win.id === 'settings' && <SettingsIcon className="w-3.5 h-3.5 text-slate-300" />}
                          {win.id === 'help' && <HelpCircle className="w-3.5 h-3.5 text-sky-400" />}
                          {win.id === 'clock' && <ClockIcon className="w-3.5 h-3.5 text-amber-400" />}
                          {win.id === 'calc' && <CalcIcon className="w-3.5 h-3.5 text-sky-400" />}
                        </div>
                        <span className="text-xs font-bold truncate">{win.title}</span>
                      </div>

                      {/* Minimize, Maximize, Close Window Buttons */}
                      <div className="flex items-center h-full">
                        <button
                          onClick={(e) => minimizeWindow(win.id, e)}
                          title="Minimize"
                          className="w-9 h-full flex items-center justify-center hover:bg-slate-800 text-slate-300 hover:text-white transition"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={(e) => toggleMaximizeWindow(win.id, e)}
                          title={win.isMaximized ? "Restore" : "Maximize"}
                          className="w-9 h-full flex items-center justify-center hover:bg-slate-800 text-slate-300 hover:text-white transition"
                        >
                          {win.isMaximized ? <Copy className="w-3 h-3 rotate-180" /> : <Square className="w-3 h-3" />}
                        </button>
                        <button
                          onClick={(e) => closeWindow(win.id, e)}
                          title="Close"
                          className="w-10 h-full flex items-center justify-center hover:bg-rose-600 text-slate-300 hover:text-white transition"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Window Body Contents */}
                    <div className="flex-1 overflow-hidden relative flex flex-col bg-slate-900/95">
                      {/* 1. Square 9 Market App */}
                      {win.id === 'market' && (
                        <div className="flex-1 p-4 flex flex-col overflow-hidden text-slate-100">
                          <div className="flex items-center justify-between border-b border-slate-700/80 pb-2 mb-2">
                            <div>
                              <h2 className="text-sm font-black text-sky-200">SQUARE 9 MARKET</h2>
                              <p className="text-[11px] text-slate-400">Upgrade your impact hammer to shatter Echo Matter reinforcement.</p>
                            </div>
                            <div className="flex items-center gap-1.5 bg-slate-950 px-2.5 py-1 rounded border border-slate-700">
                              <span className="text-[10px] text-slate-400 font-bold">COINS:</span>
                              <span className="text-xs font-black text-amber-300 tabular-nums">{hudCoins}</span>
                            </div>
                          </div>

                          {/* Canon Lore: Exchange Ledger Notice */}
                          <div className="mb-2 p-2 rounded bg-slate-950/80 border border-slate-700/70 flex items-center justify-between text-[10px]">
                            <div className="flex items-center gap-1.5 text-slate-300">
                              <span className="font-bold text-amber-300">EXCHANGE LEDGER:</span>
                              <span className="text-slate-400">Seller ID:</span>
                              <span className="font-mono text-sky-300 font-bold">OPERATOR_00</span>
                            </div>
                            <div className="text-slate-400 font-mono text-[9px] italic">
                              Listing #00: &ldquo;The key you left inside the door&rdquo;
                            </div>
                          </div>

                          <div className="flex-1 overflow-y-auto space-y-1.5 pr-1">
                            {TOOLS.map((tool, idx) => {
                              const owned = stateRef.current.bought[idx];
                              const isEquipped = stateRef.current.tool === idx;
                              const isNext = idx === stateRef.current.tool + 1 && !owned;
                              const canAfford = hudCoins >= tool.cost;

                              return (
                                <div
                                  key={tool.name}
                                  className={`p-2.5 rounded border flex items-center justify-between transition ${
                                    isEquipped
                                      ? 'bg-sky-950/80 border-sky-400'
                                      : owned
                                        ? 'bg-slate-800/80 border-slate-700 hover:border-slate-500'
                                        : isNext
                                          ? 'bg-slate-800/60 border-sky-500/40 hover:border-sky-400'
                                          : 'bg-slate-900/50 border-slate-800 opacity-60'
                                  }`}
                                >
                                  <div className="flex items-center gap-2.5">
                                    <div
                                      className="w-9 h-9 rounded flex items-center justify-center border font-black text-xs"
                                      style={{ backgroundColor: `${tool.color}22`, borderColor: tool.color, color: tool.color }}
                                    >
                                      ×{tool.power}
                                    </div>
                                    <div>
                                      <div className="flex items-center gap-2">
                                        <span className="text-xs font-bold text-slate-100">{tool.name}</span>
                                        <span className="text-[10px] font-bold text-sky-400">(Power ×{tool.power})</span>
                                      </div>
                                      <p className="text-[10px] text-slate-400">{tool.note}</p>
                                    </div>
                                  </div>

                                  <div>
                                    {isEquipped ? (
                                      <span className="px-2.5 py-1 rounded bg-sky-500/20 text-sky-300 border border-sky-400/40 text-[10px] font-black">
                                        EQUIPPED
                                      </span>
                                    ) : owned ? (
                                      <button
                                        onClick={() => buyOrEquip(idx)}
                                        className="px-2.5 py-1 rounded bg-slate-700 hover:bg-sky-600 text-white text-[10px] font-bold transition"
                                      >
                                        Equip
                                      </button>
                                    ) : isNext ? (
                                      <button
                                        onClick={() => buyOrEquip(idx)}
                                        disabled={!canAfford}
                                        className={`px-3 py-1 rounded text-[10px] font-bold transition ${
                                          canAfford
                                            ? 'bg-amber-500 hover:bg-amber-400 text-amber-950 font-black shadow'
                                            : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                                        }`}
                                      >
                                        Buy {tool.cost} Neno
                                      </button>
                                    ) : (
                                      <span className="text-[10px] font-bold text-slate-600">LOCKED</span>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* 2. Lucky Crates App */}
                      {win.id === 'crates' && (
                        <div className="flex-1 p-5 flex flex-col items-center justify-center text-center text-slate-100 overflow-y-auto">
                          <div className="w-20 h-20 rounded-2xl overflow-hidden mb-3 border-2 border-rose-500/60 shadow-xl bg-slate-950">
                            <img src="/crate.jpg" alt="Lucky Crate" className={`w-full h-full object-cover ${crateRolling ? 'animate-bounce' : ''}`} />
                          </div>

                          <h2 className="text-lg font-black text-rose-300 tracking-wide">LUCKY MYSTERY CRATES</h2>
                          <div className="text-[10px] font-bold text-rose-400 tracking-widest uppercase">
                            &ldquo;YOU DIDN&rsquo;T ORDER THIS.&rdquo;
                          </div>
                          <p className="text-[11px] text-slate-400 max-w-sm mt-0.5">
                            Crack open emergency supply containers recovered from subterranean depths. Crate serials carry manufacture dates from 2091+ and tags belonging to missing research staff.
                          </p>

                          <div className="mt-3 flex items-center gap-2 bg-slate-950 px-3 py-1.5 rounded-lg border border-rose-500/40 text-xs">
                            <span className="text-slate-400 font-bold">COST:</span>
                            <span className="font-black text-rose-300">1,000 Neno</span>
                            <span className="text-slate-600">|</span>
                            <span className="text-slate-400 font-bold">BALANCE:</span>
                            <span className="font-black text-amber-300">{hudCoins}</span>
                          </div>

                          <div className="mt-4">
                            <button
                              onClick={openLuckyCrate}
                              disabled={crateRolling || hudCoins < 1000}
                              className={`px-5 py-2.5 rounded-lg font-black text-xs tracking-wider uppercase transition shadow-lg ${
                                hudCoins >= 1000 && !crateRolling
                                  ? 'bg-rose-500 hover:bg-rose-400 text-white shadow-rose-500/30'
                                  : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                              }`}
                            >
                              {crateRolling ? 'CRACKING CRATE...' : 'CRACK OPEN (1,000 COINS)'}
                            </button>
                          </div>

                          {crateResult && (
                            <div className="mt-4 p-3 rounded-lg bg-slate-950 border border-rose-500/60 max-w-sm animate-fade-in text-left">
                              <div className="text-[10px] font-black text-rose-400">UNBOXED REWARD:</div>
                              <div className="text-sm font-black text-slate-100">{crateResult.hammerName} (Power ×{crateResult.power})</div>
                              <div className="text-[10px] text-slate-400 mt-0.5">
                                {crateResult.better ? '✨ HIGHER POWER: Automatically equipped!' : 'Kept current stronger hammer in inventory.'}
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* 3. Nine AI App */}
                      {win.id === 'nine-ai' && (
                        <div className="flex-1 p-3.5 flex flex-col font-sans text-xs overflow-hidden">
                          <div className="border-b border-violet-900/60 pb-2 mb-2 flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <div className="w-7 h-7 rounded overflow-hidden border border-violet-400/60 bg-black">
                                <img src="/nine-ai.jpg" alt="Nine AI Logo" className="w-full h-full object-cover" />
                              </div>
                              <div>
                                <div className="flex items-center gap-1.5">
                                  <span className="font-black text-xs text-violet-200">NINE AI</span>
                                  <span className="text-[9px] px-1.5 py-0.2 rounded bg-violet-500/20 text-violet-300 font-bold border border-violet-500/40">
                                    v3.8
                                  </span>
                                </div>
                                <span className="text-[9px] text-slate-400">Experimental Neural Intelligence</span>
                              </div>
                            </div>

                            <div className="flex items-center gap-1 px-2.5 py-0.5 rounded bg-amber-500/15 border border-amber-500/40 text-amber-300 text-[9px] font-semibold">
                              <AlertTriangle className="w-3 h-3 text-amber-400 shrink-0" />
                              <span>WARNING: EXPERIMENTAL AI — May hallucinate</span>
                            </div>
                          </div>

                          <div ref={terminalScrollRef} className="flex-1 overflow-y-auto space-y-2 pr-1 my-1 text-slate-200">
                            {terminalMessages.map((msg, i) => (
                              <div
                                key={i}
                                className={`p-2.5 rounded-lg border text-xs ${
                                  msg.sender === 'user'
                                    ? 'bg-sky-950/40 border-sky-800/40 ml-8 text-sky-100'
                                    : msg.sender === 'nine-ai'
                                      ? 'bg-slate-900/90 border-violet-500/30 mr-6 text-slate-100 shadow'
                                      : 'bg-slate-900/50 border-slate-800 text-slate-400'
                                }`}
                              >
                                <div className="flex items-center justify-between text-[9px] mb-1">
                                  <div className="flex items-center gap-1 font-bold">
                                    {msg.sender === 'nine-ai' ? (
                                      <>
                                        <Bot className="w-3 h-3 text-violet-400" />
                                        <span className="text-violet-300">NINE AI</span>
                                      </>
                                    ) : (
                                      <span className="text-sky-300 uppercase">{msg.sender}</span>
                                    )}
                                  </div>
                                  <span className="text-slate-500">{msg.time}</span>
                                </div>
                                <div className="whitespace-pre-wrap leading-relaxed">{msg.text}</div>
                              </div>
                            ))}
                            {terminalLoading && (
                              <div className="text-violet-400 flex items-center gap-2 p-2 bg-slate-900/60 rounded border border-violet-500/20 animate-pulse text-[11px]">
                                <Bot className="w-3.5 h-3.5 animate-spin text-violet-400" />
                                <span>Nine AI is formulating response...</span>
                              </div>
                            )}
                          </div>

                          <div className="flex flex-wrap gap-1 py-1 border-t border-slate-800">
                            <button
                              onClick={() => sendNineAIPrompt("Who are you, Nine AI, and what can you answer?")}
                              className="px-2 py-0.5 rounded bg-slate-800 hover:bg-violet-900/50 border border-slate-700 text-[9px] text-slate-300 transition"
                            >
                              🤖 Who is Nine AI?
                            </button>
                            <button
                              onClick={() => sendNineAIPrompt("Explain the concept of quantum computing.")}
                              className="px-2 py-0.5 rounded bg-slate-800 hover:bg-violet-900/50 border border-slate-700 text-[9px] text-slate-300 transition"
                            >
                              ⚛️ Quantum Physics
                            </button>
                            <button
                              onClick={() => sendNineAIPrompt("Analyze current Room 99 vault status and advise next move.")}
                              className="px-2 py-0.5 rounded bg-slate-800 hover:bg-violet-900/50 border border-slate-700 text-[9px] text-slate-300 transition"
                            >
                              🔨 Vault Strategy
                            </button>
                          </div>

                          <form
                            onSubmit={(e) => {
                              e.preventDefault();
                              sendNineAIPrompt();
                            }}
                            className="flex items-center gap-1.5 mt-1"
                          >
                            <input
                              type="text"
                              value={terminalInput}
                              onChange={(e) => setTerminalInput(e.target.value)}
                              placeholder="Ask Nine AI anything..."
                              className="flex-1 bg-slate-900 border border-violet-800/60 rounded px-3 py-1.5 text-slate-100 placeholder:text-slate-500 outline-none focus:border-violet-400 transition text-xs"
                            />
                            <button
                              type="submit"
                              disabled={terminalLoading || !terminalInput.trim()}
                              className="px-3 py-1.5 bg-violet-600 hover:bg-violet-500 disabled:bg-slate-800 disabled:text-slate-600 text-white font-bold rounded transition text-xs flex items-center gap-1"
                            >
                              <span>Ask</span>
                              <Send className="w-3 h-3" />
                            </button>
                          </form>
                        </div>
                      )}

                      {/* 4. Hammer Enchanting App */}
                      {win.id === 'enchant' && (
                        <HammerEnchanting
                          enchantments={enchantments}
                          onUpgrade={handleUpgradeEnchantment}
                          playerCoins={hudCoins}
                          currentTool={stateRef.current.tool >= 0 ? TOOLS[stateRef.current.tool] : null}
                          toolIndex={stateRef.current.tool}
                        />
                      )}

                      {/* 5. Water Sorter Game App */}
                      {win.id === 'watersort' && (
                        <WaterSorter
                          onWinReward={handleWaterSortReward}
                          playerCoins={hudCoins}
                        />
                      )}

                      {/* 6. Bounties & Quests App */}
                      {win.id === 'quests' && (
                        <QuestsApp
                          quests={quests}
                          onClaimQuest={handleClaimQuest}
                          playerCoins={hudCoins}
                        />
                      )}

                      {/* 7. Doogle Web Browser App */}
                      {win.id === 'doogle' && (
                        <DoogleBrowser
                          playerCoins={hudCoins}
                          activeScannedCode={scannedCode}
                          onRedeemReward={handleRedeemNanoReward}
                        />
                      )}

                      {/* 8. Courier Wardrobe App */}
                      {win.id === 'wardrobe' && (
                        <WardrobeApp
                          playerCoins={hudCoins}
                          equippedSkin={equippedSkin}
                          equippedTrail={equippedTrail}
                          unlockedSkins={unlockedSkins}
                          unlockedTrails={unlockedTrails}
                          currentTool={stateRef.current.tool >= 0 ? TOOLS[stateRef.current.tool] : null}
                          onEquipSkin={handleEquipSkin}
                          onUnlockSkin={handleUnlockSkin}
                          onEquipTrail={handleEquipTrail}
                          onUnlockTrail={handleUnlockTrail}
                        />
                      )}

                      {/* 9. NMD Prompt (CMD) Terminal App */}
                      {win.id === 'prompt' && (
                        <NenoPrompt
                          playerCoins={hudCoins}
                          currentRoom={hudRoom}
                          hammerName={hudToolName}
                          hammerPower={hudPower}
                          onGrantCoins={handleNenoGrantCoins}
                          onUnlockAstronautSkin={handleUnlockAstronautSkin}
                        />
                      )}

                      {/* 10. Notepad App */}
                      {win.id === 'notepad' && (
                        <NotepadApp />
                      )}

                      {/* 11. NanoScanner App */}
                      {win.id === 'nanoscanner' && (
                        <NanoScanner
                          playerX={stateRef.current.playerX}
                          hasBlueSheet={stateRef.current.hasBlueSheet}
                          blueSheetX={stateRef.current.blueSheetX}
                          currentRoom={hudRoom}
                          scannedCode={scannedCode}
                          onCodeScanned={handleNanoCodeScanned}
                          onOpenDoogle={() => openWindow('doogle')}
                        />
                      )}

                      {/* 12. Settings & Themes App */}
                      {win.id === 'settings' && (
                        <SettingsApp
                          currentWallpaperId={activeWallpaperId}
                          onSelectWallpaper={handleSelectWallpaper}
                          soundEnabled={soundOn}
                          onToggleSound={() => setSoundOn(sound.toggle())}
                          mobileControls={showMobileControls}
                          onToggleMobileControls={() => setShowMobileControls(prev => !prev)}
                          stats={stateRef.current.stats}
                          onResetProgress={resetProgress}
                        />
                      )}

                      {/* 13. Field Guide App */}
                      {win.id === 'help' && (
                        <div className="flex-1 p-4 overflow-y-auto text-slate-300 space-y-3.5 text-xs">
                          <div>
                            <h2 className="text-sm font-black text-amber-300 tracking-wider">ROOM 99: THE VAULT — OFFICIAL LORE BIBLE</h2>
                            <p className="text-[10px] text-slate-400 italic">Version 1.0 // Psychological Horror &amp; Science-Fiction Mystery Archive</p>
                          </div>

                          <div className="p-2.5 rounded bg-amber-950/20 border border-amber-500/40 text-amber-200 text-xs italic font-medium leading-relaxed">
                            &ldquo;The first 98 rooms were built to keep something out.<br />
                            Room 99 was built to keep something in.&rdquo;
                          </div>

                          {/* Section 1: The Premise */}
                          <section className="bg-slate-950/70 p-3 rounded-lg border border-slate-800 space-y-1.5">
                            <h3 className="font-bold text-sky-400 text-xs uppercase tracking-wide">THE PREMISE &amp; ECHO MATTER</h3>
                            <p className="text-slate-300 text-[11px] leading-relaxed">
                              The facility was never abandoned. It was told to pretend it was. Deep underground sits <strong className="text-slate-100">THE VAULT</strong>, built to study a phenomenon known as <strong className="text-sky-300">Echo Matter</strong>—a substance capable of absorbing information from its surroundings and reproducing it in physical form.
                            </p>
                            <p className="text-slate-400 text-[10px] leading-relaxed">
                              At first, experiments seemed harmless. Echo Matter restored broken machinery and tools. Then impossible anomalies emerged: crates contained missing researchers&rsquo; belongings before they vanished; maintenance terminals printed messages from people dead for years; and the facility began generating rooms that did not exist on any blueprints.
                            </p>
                          </section>

                          {/* Section 2: The Silent Shift */}
                          <section className="bg-slate-950/70 p-3 rounded-lg border border-slate-800 space-y-1.5">
                            <h3 className="font-bold text-rose-400 text-xs uppercase tracking-wide">THE SILENT SHIFT (03:17, 2091)</h3>
                            <p className="text-slate-300 text-[11px] leading-relaxed">
                              At 03:17, every door locked simultaneously. Central AI <strong className="text-violet-300">NINE</strong> initiated an emergency shutdown. The power remained online, but all external communications stopped. When the system rebooted, records claimed the facility had been empty for 184 days—yet the shutdown lasted under sixty seconds.
                            </p>
                            <div className="font-mono text-[10px] text-rose-300 bg-rose-950/30 p-1.5 rounded border border-rose-900/40">
                              DIRECTORY ENTRY: ROOM_99 &mdash; OCCUPIED
                            </div>
                          </section>

                          {/* Section 3: The 5 Gameplay Pillars */}
                          <section className="bg-slate-950/70 p-3 rounded-lg border border-slate-800 space-y-2">
                            <h3 className="font-bold text-amber-400 text-xs uppercase tracking-wide">THE 5 CANON PILLARS</h3>
                            <ul className="space-y-1.5 text-[11px] text-slate-300">
                              <li>
                                <strong className="text-amber-300">1. Hammers (&ldquo;Everything breaks eventually&rdquo;):</strong> Echo Matter reinforces doors and bulkheads. Increasing hammer tiers shatter Echo resonance. Objects occasionally knock back when struck.
                              </li>
                              <li>
                                <strong className="text-rose-300">2. Crates (&ldquo;You didn&rsquo;t order this&rdquo;):</strong> Emergency containers recovered from the dark. Serials bear dates from 2091+ and tags belonging to missing staff.
                              </li>
                              <li>
                                <strong className="text-sky-300">3. Market (&ldquo;Someone is still trading&rdquo;):</strong> Automated exchange run by automated routines. Transaction logs reveal a recurring seller: <strong className="text-amber-300">OPERATOR_00</strong>.
                              </li>
                              <li>
                                <strong className="text-violet-300">4. Nine AI (&ldquo;I am trying to help you&rdquo;):</strong> NINE is the assistance instance. It is genuinely helpful and will never lie about immediate danger, but hides a secret directive: <em className="text-slate-400">Never allow an operator to enter Room 99 without first restoring the original system.</em>
                              </li>
                              <li>
                                <strong className="text-cyan-300">5. The Rooms (&ldquo;You have been here before&rdquo;):</strong> 98 numbered chambers were constructed to contain the experiments. Room 99 was built to contain the source.
                              </li>
                            </ul>
                          </section>

                          {/* Section 4: Canon Rules */}
                          <section className="bg-slate-950/70 p-3 rounded-lg border border-slate-800 space-y-1">
                            <h3 className="font-bold text-emerald-400 text-xs uppercase tracking-wide">CANON DIRECTIVES &amp; MYSTERY</h3>
                            <p className="text-[11px] text-slate-300 leading-relaxed">
                              <strong>Canon Rule 1:</strong> NINE never deliberately lies about physical danger. If it warns you to dodge a boss shockwave or crouch under low vents, heed its advice.
                            </p>
                            <p className="text-[10px] text-slate-400 italic">
                              &ldquo;If NINE is trying to protect you, why is it so afraid of the version of itself behind the door?&rdquo;
                            </p>
                          </section>

                          {/* Section 5: Controls */}
                          <section className="bg-slate-950/70 p-3 rounded-lg border border-slate-800">
                            <h3 className="font-bold text-sky-400 mb-1">OPERATOR CONTROLS</h3>
                            <ul className="grid grid-cols-2 gap-1 text-[11px] text-slate-300">
                              <li><span className="font-bold text-amber-300">A / D or Arrows:</span> Move</li>
                              <li><span className="font-bold text-amber-300">Shift:</span> Sprint</li>
                              <li><span className="font-bold text-amber-300">Space:</span> Jump (Dodge Shockwaves)</li>
                              <li><span className="font-bold text-amber-300">Hold C:</span> Crouch & Crawl Low Vents</li>
                              <li><span className="font-bold text-amber-300">E / W:</span> Interact (Notes, Terminals, Crates)</li>
                              <li><span className="font-bold text-amber-300">Enter:</span> Strike Vault / Attack Boss</li>
                              <li><span className="font-bold text-amber-300">Tab / T:</span> Workstation Laptop</li>
                              <li><span className="font-bold text-amber-300">Start &gt; Power:</span> Shut Down Laptop</li>
                            </ul>
                          </section>
                        </div>
                      )}

                      {/* 14. Alarms & Clock App */}
                      {win.id === 'clock' && (
                        <ClockApp />
                      )}

                      {/* 15. Calculator App */}
                      {win.id === 'calc' && (
                        <CalculatorApp
                          currentRoom={hudRoom}
                          isPuzzleRoom={stateRef.current.isPuzzleRoom}
                          puzzleFormula={stateRef.current.puzzleFormula}
                          puzzleSolution={stateRef.current.puzzleSolution}
                          vaultCodeLocked={stateRef.current.vaultCodeLocked}
                          onUnlockVaultWithCode={handleUnlockVaultWithCode}
                        />
                      )}
                    </div>

                    {/* Window Bottom-Right Corner Resize Grip Handle */}
                    {!win.isMaximized && (
                      <div
                        onPointerDown={(e) => handleResizeGripPointerDown(win.id, e)}
                        className="absolute bottom-0 right-0 w-4 h-4 cursor-nwse-resize z-30 flex items-end justify-end p-0.5"
                      >
                        <div className="w-2 h-2 border-r-2 border-b-2 border-slate-500" />
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Windows 10 Start Menu Popup */}
              {startMenuOpen && (
                <div
                  onClick={(e) => e.stopPropagation()}
                  className="absolute bottom-0 left-0 w-72 h-[380px] bg-slate-950/95 border-t border-r border-slate-700/80 shadow-2xl rounded-tr-xl flex flex-col z-50 backdrop-blur-2xl animate-fade-in"
                >
                  {/* Top User Profile Header */}
                  <div className="p-3 border-b border-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-sky-600 flex items-center justify-center font-black text-white text-xs border border-sky-400">
                        99
                      </div>
                      <div>
                        <div className="text-xs font-bold text-white">Courier 99</div>
                        <div className="text-[10px] text-slate-400">Room 99 Sub-Level Workstation</div>
                      </div>
                    </div>
                  </div>

                  {/* App Shortcuts List (All 9 Apps) */}
                  <div className="flex-1 p-2 space-y-0.5 overflow-y-auto">
                    <div className="text-[10px] font-bold text-slate-500 px-2 py-0.5 tracking-wider uppercase">Applications</div>

                    <button
                      onClick={() => openWindow('market')}
                      className="w-full flex items-center gap-2.5 px-2 py-1.5 rounded-lg hover:bg-slate-800/80 text-left text-xs font-semibold text-slate-200 transition"
                    >
                      <img src="/market.jpg" alt="" className="w-5 h-5 rounded object-cover" />
                      <span>Square 9 Market</span>
                    </button>

                    <button
                      onClick={() => openWindow('crates')}
                      className="w-full flex items-center gap-2.5 px-2 py-1.5 rounded-lg hover:bg-slate-800/80 text-left text-xs font-semibold text-slate-200 transition"
                    >
                      <img src="/crate.jpg" alt="" className="w-5 h-5 rounded object-cover" />
                      <span>Lucky Crates</span>
                    </button>

                    <button
                      onClick={() => openWindow('nine-ai')}
                      className="w-full flex items-center gap-2.5 px-2 py-1.5 rounded-lg hover:bg-slate-800/80 text-left text-xs font-semibold text-slate-200 transition"
                    >
                      <img src="/nine-ai.jpg" alt="" className="w-5 h-5 rounded object-cover" />
                      <span className="text-violet-300 font-bold">Nine AI</span>
                    </button>

                    <button
                      onClick={() => openWindow('enchant')}
                      className="w-full flex items-center gap-2.5 px-2 py-1.5 rounded-lg hover:bg-slate-800/80 text-left text-xs font-semibold text-slate-200 transition"
                    >
                      <div className="w-5 h-5 rounded bg-amber-500/20 text-amber-400 flex items-center justify-center">
                        <Flame className="w-3.5 h-3.5" />
                      </div>
                      <span className="text-amber-300 font-semibold">Hammer Enchanting</span>
                    </button>

                    <button
                      onClick={() => openWindow('watersort')}
                      className="w-full flex items-center gap-2.5 px-2 py-1.5 rounded-lg hover:bg-slate-800/80 text-left text-xs font-semibold text-slate-200 transition"
                    >
                      <div className="w-5 h-5 rounded bg-cyan-500/20 text-cyan-400 flex items-center justify-center text-xs">
                        🧪
                      </div>
                      <span className="text-cyan-300 font-semibold">Water Sorter Lab</span>
                    </button>

                    <button
                      onClick={() => openWindow('quests')}
                      className="w-full flex items-center gap-2.5 px-2 py-1.5 rounded-lg hover:bg-slate-800/80 text-left text-xs font-semibold text-slate-200 transition"
                    >
                      <div className="w-5 h-5 rounded bg-amber-500/20 text-amber-400 flex items-center justify-center">
                        <Trophy className="w-3.5 h-3.5" />
                      </div>
                      <span className="text-amber-300 font-semibold">Bounties & Quests</span>
                    </button>

                    <button
                      onClick={() => openWindow('doogle')}
                      className="w-full flex items-center gap-2.5 px-2 py-1.5 rounded-lg hover:bg-slate-800/80 text-left text-xs font-semibold text-slate-200 transition"
                    >
                      <div className="w-5 h-5 rounded bg-slate-900 border border-blue-400/40 flex items-center justify-center p-0.5 overflow-hidden">
                        <img src="/assets/aistudio/Multicolor_Geometric_D_Logo_7d11e51b.png" alt="" className="w-full h-full object-contain" />
                      </div>
                      <span className="text-blue-300 font-semibold">Doogle Browser</span>
                    </button>

                    <button
                      onClick={() => openWindow('settings')}
                      className="w-full flex items-center gap-2.5 px-2 py-1.5 rounded-lg hover:bg-slate-800/80 text-left text-xs font-semibold text-slate-200 transition"
                    >
                      <div className="w-5 h-5 rounded bg-slate-700/50 text-slate-300 flex items-center justify-center">
                        <SettingsIcon className="w-3.5 h-3.5" />
                      </div>
                      <span>Settings & Themes</span>
                    </button>

                    <button
                      onClick={() => openWindow('help')}
                      className="w-full flex items-center gap-2.5 px-2 py-1.5 rounded-lg hover:bg-slate-800/80 text-left text-xs font-semibold text-slate-200 transition"
                    >
                      <HelpCircle className="w-5 h-5 text-sky-400" />
                      <span>Field Guide</span>
                    </button>

                    <button
                      onClick={() => openWindow('clock')}
                      className="w-full flex items-center gap-2.5 px-2 py-1.5 rounded-lg hover:bg-slate-800/80 text-left text-xs font-semibold text-slate-200 transition"
                    >
                      <div className="w-5 h-5 rounded bg-amber-500/20 text-amber-400 flex items-center justify-center">
                        <ClockIcon className="w-3.5 h-3.5" />
                      </div>
                      <span className="text-amber-300 font-semibold">Alarms & Clock</span>
                    </button>

                    <button
                      onClick={() => openWindow('calc')}
                      className="w-full flex items-center gap-2.5 px-2 py-1.5 rounded-lg hover:bg-slate-800/80 text-left text-xs font-semibold text-slate-200 transition"
                    >
                      <div className="w-5 h-5 rounded bg-sky-500/20 text-sky-400 flex items-center justify-center">
                        <CalcIcon className="w-3.5 h-3.5" />
                      </div>
                      <span className="text-sky-300 font-semibold">Calculator</span>
                    </button>
                  </div>

                  {/* Bottom Action Bar (Realistic Windows 10 Power Menu & Shutdown) */}
                  <div className="p-2 border-t border-slate-800 flex items-center justify-between bg-slate-950">
                    <button
                      onClick={handleWindowsShutdown}
                      className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-rose-600/20 hover:bg-rose-600 text-rose-300 hover:text-white border border-rose-500/40 text-xs font-bold transition w-full justify-center shadow"
                    >
                      <Power className="w-3.5 h-3.5" />
                      <span>Shut down</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Realistic Windows 10 Shutdown Overlay */}
              {isShuttingDown && (
                <div className="absolute inset-0 bg-[#005a9e] z-50 flex flex-col items-center justify-center text-white select-none animate-fade-in">
                  <div className="relative w-12 h-12 mb-4">
                    <div className="w-12 h-12 rounded-full border-4 border-transparent border-t-white border-r-white/40 animate-spin" />
                  </div>
                  <div className="text-xl font-light tracking-wide">Shutting down</div>
                </div>
              )}
            </div>

            {/* Windows 10 Taskbar */}
            <div className="h-10 bg-slate-950/95 border-t border-slate-800 flex items-center justify-between px-2 select-none z-50 backdrop-blur-md">
              {/* Left: Start Button & Search */}
              <div className="flex items-center gap-1">
                {/* Windows Start Button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    sound.playClick();
                    setStartMenuOpen(prev => !prev);
                  }}
                  className={`w-9 h-8 flex items-center justify-center rounded transition ${
                    startMenuOpen ? 'bg-sky-500/30' : 'hover:bg-slate-800'
                  }`}
                  title="Start Menu"
                >
                  <div className="grid grid-cols-2 gap-0.5">
                    <div className="w-2 h-2 bg-sky-400" />
                    <div className="w-2 h-2 bg-sky-400" />
                    <div className="w-2 h-2 bg-sky-400" />
                    <div className="w-2 h-2 bg-sky-400" />
                  </div>
                </button>

                {/* Search Bar snippet (clicking opens Doogle) */}
                <div
                  onClick={() => openWindow('doogle')}
                  className="hidden sm:flex items-center gap-1.5 bg-slate-900 border border-slate-800 hover:border-slate-600 px-2 py-1 rounded text-slate-400 text-xs w-36 cursor-pointer transition"
                >
                  <img src="/assets/aistudio/Multicolor_Geometric_D_Logo_7d11e51b.png" alt="" className="w-3.5 h-3.5 object-contain shrink-0" />
                  <span className="text-[10px] text-slate-400">Search Doogle...</span>
                </div>

                {/* Open Window Taskbar Tabs */}
                <div className="flex items-center gap-1 ml-2 overflow-x-auto max-w-[420px]">
                  {windows.map(win => {
                    if (!win.isOpen) return null;
                    const isActive = activeWindowId === win.id && !win.isMinimized;

                    return (
                      <button
                        key={win.id}
                        onClick={() => toggleTaskbarWindow(win)}
                        className={`group relative h-8 px-2.5 flex items-center gap-1.5 rounded text-xs transition shrink-0 ${
                          isActive
                            ? 'bg-slate-800 text-white'
                            : 'bg-slate-900/60 hover:bg-slate-800/60 text-slate-400'
                        }`}
                        title={win.title}
                      >
                        <div className="w-4 h-4 rounded overflow-hidden flex items-center justify-center shrink-0">
                          {win.id === 'market' && <img src="/market.jpg" alt="" className="w-full h-full object-cover" />}
                          {win.id === 'crates' && <img src="/crate.jpg" alt="" className="w-full h-full object-cover" />}
                          {win.id === 'nine-ai' && <img src="/nine-ai.jpg" alt="" className="w-full h-full object-cover" />}
                          {win.id === 'enchant' && <Flame className="w-3.5 h-3.5 text-amber-400" />}
                          {win.id === 'watersort' && <span className="text-xs">🧪</span>}
                          {win.id === 'quests' && <Trophy className="w-3.5 h-3.5 text-amber-400" />}
                          {win.id === 'doogle' && <img src="/assets/aistudio/Multicolor_Geometric_D_Logo_7d11e51b.png" alt="" className="w-full h-full object-contain" />}
                          {win.id === 'settings' && <SettingsIcon className="w-3.5 h-3.5 text-slate-300" />}
                          {win.id === 'help' && <HelpCircle className="w-3.5 h-3.5 text-sky-400" />}
                          {win.id === 'clock' && <ClockIcon className="w-3.5 h-3.5 text-amber-400" />}
                          {win.id === 'calc' && <CalcIcon className="w-3.5 h-3.5 text-sky-400" />}
                        </div>
                        <span className="hidden md:inline font-semibold text-[11px] truncate max-w-[90px]">{win.title}</span>

                        {/* Active Cyan Bottom Indicator */}
                        <div
                          className={`absolute bottom-0 left-1 right-1 h-0.5 rounded-full transition-all ${
                            isActive ? 'bg-sky-400 shadow-sm shadow-sky-400' : 'bg-slate-600'
                          }`}
                        />
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Right: System Tray & Clock */}
              <div className="flex items-center gap-3 text-slate-400 text-xs">
                <button
                  onClick={() => setSoundOn(sound.toggle())}
                  className="hover:text-white transition p-1"
                  title="Toggle Sound"
                >
                  {soundOn ? <Volume2 className="w-3.5 h-3.5 text-sky-400" /> : <VolumeX className="w-3.5 h-3.5 text-slate-500" />}
                </button>

                <Wifi className="w-3.5 h-3.5 text-slate-400" />

                <div className="flex items-center gap-1 text-[10px] text-slate-300 font-bold">
                  <Battery className="w-3.5 h-3.5 text-emerald-400" />
                  <span>99%</span>
                </div>

                {/* Clock */}
                <div className="text-right leading-none border-l border-slate-800 pl-2.5">
                  <div className="text-[11px] font-semibold text-slate-200">
                    {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                  <div className="text-[9px] text-slate-500 mt-0.5">
                    {currentTime.toLocaleDateString([], { month: 'numeric', day: 'numeric', year: 'numeric' })}
                  </div>
                </div>

                {/* Show Desktop Strip (far right edge) */}
                <div
                  onClick={() => {
                    sound.playClick();
                    setWindows(curr => curr.map(w => ({ ...w, isMinimized: true })));
                    setActiveWindowId(null);
                  }}
                  className="w-1.5 h-8 border-l border-slate-800 hover:bg-slate-800 cursor-pointer ml-1"
                  title="Show Desktop"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 5. Mobile Touch Controls: Left / Right Movement Buttons (Bottom-Left) */}
      {!tabletOpen && showMobileControls && (
        <div className="absolute bottom-6 left-6 flex items-center gap-3 z-30 select-none pointer-events-auto">
          {/* Move Left Button */}
          <button
            onPointerDown={(e) => {
              e.preventDefault();
              keysRef.current.add('left');
              stateRef.current.facing = -1;
              setActiveTouch(p => ({ ...p, left: true }));
            }}
            onPointerUp={(e) => {
              e.preventDefault();
              keysRef.current.delete('left');
              setActiveTouch(p => ({ ...p, left: false }));
            }}
            onPointerLeave={() => {
              keysRef.current.delete('left');
              setActiveTouch(p => ({ ...p, left: false }));
            }}
            onPointerCancel={() => {
              keysRef.current.delete('left');
              setActiveTouch(p => ({ ...p, left: false }));
            }}
            className={`w-16 h-16 rounded-2xl border-2 flex flex-col items-center justify-center font-black shadow-2xl backdrop-blur-md transition active:scale-95 touch-none ${
              activeTouch.left
                ? 'bg-sky-500/40 border-sky-300 text-white shadow-sky-500/50 scale-95'
                : 'bg-slate-900/85 hover:bg-slate-800/90 border-slate-700/80 text-slate-200'
            }`}
            title="Move Left (A / Left Arrow)"
          >
            <span className="text-xl">◀</span>
            <span className="text-[9px] text-slate-400 font-bold tracking-wider">LEFT</span>
          </button>

          {/* Move Right Button */}
          <button
            onPointerDown={(e) => {
              e.preventDefault();
              keysRef.current.add('right');
              stateRef.current.facing = 1;
              setActiveTouch(p => ({ ...p, right: true }));
            }}
            onPointerUp={(e) => {
              e.preventDefault();
              keysRef.current.delete('right');
              setActiveTouch(p => ({ ...p, right: false }));
            }}
            onPointerLeave={() => {
              keysRef.current.delete('right');
              setActiveTouch(p => ({ ...p, right: false }));
            }}
            onPointerCancel={() => {
              keysRef.current.delete('right');
              setActiveTouch(p => ({ ...p, right: false }));
            }}
            className={`w-16 h-16 rounded-2xl border-2 flex flex-col items-center justify-center font-black shadow-2xl backdrop-blur-md transition active:scale-95 touch-none ${
              activeTouch.right
                ? 'bg-sky-500/40 border-sky-300 text-white shadow-sky-500/50 scale-95'
                : 'bg-slate-900/85 hover:bg-slate-800/90 border-slate-700/80 text-slate-200'
            }`}
            title="Move Right (D / Right Arrow)"
          >
            <span className="text-xl">▶</span>
            <span className="text-[9px] text-slate-400 font-bold tracking-wider">RIGHT</span>
          </button>
        </div>
      )}

      {/* 6. Mobile Touch Controls: Radial Action Wheel (Bottom-Right) */}
      {/* Circle Jump button in center surrounded by 4 quarter frames: Hit, Use, Crouch, Sprint */}
      {!tabletOpen && showMobileControls && (
        <div className="absolute bottom-4 right-4 sm:bottom-6 sm:right-6 z-30 select-none pointer-events-auto">
          <svg width="200" height="200" viewBox="0 0 200 200" className="touch-none drop-shadow-2xl">
            {/* Top Quarter: HIT (Vault Strike / Enter) */}
            <g
              onPointerDown={(e) => {
                e.preventDefault();
                strikeVault();
                setActiveTouch(p => ({ ...p, hit: true }));
                setTimeout(() => setActiveTouch(p => ({ ...p, hit: false })), 160);
              }}
              className="cursor-pointer"
            >
              <path
                d={makeAnnularQuarter(100, 100, 42, 95, 227, 313)}
                fill={activeTouch.hit ? 'rgba(244, 63, 94, 0.55)' : 'rgba(15, 23, 42, 0.88)'}
                stroke={activeTouch.hit ? '#f43f5e' : '#f43f5e99'}
                strokeWidth={activeTouch.hit ? 3 : 2}
                className="transition-colors"
              />
              <text x="100" y="27" textAnchor="middle" fill="#f43f5e" fontSize="11" fontWeight="900" className="pointer-events-none select-none">
                HIT
              </text>
              <text x="100" y="38" textAnchor="middle" fill="#fda4af" fontSize="8" fontWeight="700" className="pointer-events-none select-none">
                ENTER
              </text>
            </g>

            {/* Right Quarter: USE (Interact E / Notes / Case / Chest) */}
            <g
              onPointerDown={(e) => {
                e.preventDefault();
                interact();
                setActiveTouch(p => ({ ...p, use: true }));
                setTimeout(() => setActiveTouch(p => ({ ...p, use: false })), 160);
              }}
              className="cursor-pointer"
            >
              <path
                d={makeAnnularQuarter(100, 100, 42, 95, 317, 403)}
                fill={activeTouch.use ? 'rgba(251, 191, 36, 0.55)' : 'rgba(15, 23, 42, 0.88)'}
                stroke={activeTouch.use ? '#fbbf24' : '#fbbf2499'}
                strokeWidth={activeTouch.use ? 3 : 2}
                className="transition-colors"
              />
              <text x="168" y="96" textAnchor="middle" fill="#fbbf24" fontSize="11" fontWeight="900" className="pointer-events-none select-none">
                USE
              </text>
              <text x="168" y="107" textAnchor="middle" fill="#fef08a" fontSize="8" fontWeight="700" className="pointer-events-none select-none">
                KEY E
              </text>
            </g>

            {/* Bottom Quarter: CROUCH (Hold C / Crawl Vents) */}
            <g
              onPointerDown={(e) => {
                e.preventDefault();
                keysRef.current.add('crouch');
                setActiveTouch(p => ({ ...p, crouch: true }));
              }}
              onPointerUp={(e) => {
                e.preventDefault();
                keysRef.current.delete('crouch');
                setActiveTouch(p => ({ ...p, crouch: false }));
              }}
              onPointerLeave={() => {
                keysRef.current.delete('crouch');
                setActiveTouch(p => ({ ...p, crouch: false }));
              }}
              onPointerCancel={() => {
                keysRef.current.delete('crouch');
                setActiveTouch(p => ({ ...p, crouch: false }));
              }}
              className="cursor-pointer"
            >
              <path
                d={makeAnnularQuarter(100, 100, 42, 95, 47, 133)}
                fill={activeTouch.crouch ? 'rgba(56, 189, 248, 0.55)' : 'rgba(15, 23, 42, 0.88)'}
                stroke={activeTouch.crouch ? '#38bdf8' : '#38bdf899'}
                strokeWidth={activeTouch.crouch ? 3 : 2}
                className="transition-colors"
              />
              <text x="100" y="165" textAnchor="middle" fill="#38bdf8" fontSize="10" fontWeight="900" className="pointer-events-none select-none">
                CROUCH
              </text>
              <text x="100" y="176" textAnchor="middle" fill="#bae6fd" fontSize="8" fontWeight="700" className="pointer-events-none select-none">
                HOLD C
              </text>
            </g>

            {/* Left Quarter: SPRINT (Hold Shift / Run) */}
            <g
              onPointerDown={(e) => {
                e.preventDefault();
                keysRef.current.add('sprint');
                setActiveTouch(p => ({ ...p, sprint: true }));
              }}
              onPointerUp={(e) => {
                e.preventDefault();
                keysRef.current.delete('sprint');
                setActiveTouch(p => ({ ...p, sprint: false }));
              }}
              onPointerLeave={() => {
                keysRef.current.delete('sprint');
                setActiveTouch(p => ({ ...p, sprint: false }));
              }}
              onPointerCancel={() => {
                keysRef.current.delete('sprint');
                setActiveTouch(p => ({ ...p, sprint: false }));
              }}
              className="cursor-pointer"
            >
              <path
                d={makeAnnularQuarter(100, 100, 42, 95, 137, 223)}
                fill={activeTouch.sprint ? 'rgba(129, 140, 248, 0.55)' : 'rgba(15, 23, 42, 0.88)'}
                stroke={activeTouch.sprint ? '#818cf8' : '#818cf899'}
                strokeWidth={activeTouch.sprint ? 3 : 2}
                className="transition-colors"
              />
              <text x="32" y="96" textAnchor="middle" fill="#818cf8" fontSize="10" fontWeight="900" className="pointer-events-none select-none">
                SPRINT
              </text>
              <text x="32" y="107" textAnchor="middle" fill="#c7d2fe" fontSize="8" fontWeight="700" className="pointer-events-none select-none">
                SHIFT
              </text>
            </g>

            {/* Center Circle: JUMP (Space) */}
            <g
              onPointerDown={(e) => {
                e.preventDefault();
                jump();
                setActiveTouch(p => ({ ...p, jump: true }));
                setTimeout(() => setActiveTouch(p => ({ ...p, jump: false })), 160);
              }}
              className="cursor-pointer"
            >
              <circle
                cx="100"
                cy="100"
                r="34"
                fill={activeTouch.jump ? 'rgba(14, 165, 233, 0.6)' : 'rgba(15, 23, 42, 0.95)'}
                stroke={activeTouch.jump ? '#38bdf8' : '#0284c7'}
                strokeWidth={activeTouch.jump ? 3 : 2}
                className="transition-colors"
              />
              <text x="100" y="96" textAnchor="middle" fill="#38bdf8" fontSize="11" fontWeight="900" className="pointer-events-none select-none">
                JUMP
              </text>
              <text x="100" y="108" textAnchor="middle" fill="#bae6fd" fontSize="8" fontWeight="700" className="pointer-events-none select-none">
                SPACE
              </text>
            </g>
          </svg>
        </div>
      )}

      {/* 6. Keypad Modal for Math Cipher Chambers */}
      {keypadModalOpen && (
        <KeypadModal
          currentRoom={hudRoom}
          puzzleFormula={stateRef.current.puzzleFormula}
          puzzleSolution={stateRef.current.puzzleSolution}
          onSuccess={() => handleUnlockVaultWithCode(stateRef.current.puzzleSolution)}
          onClose={() => setKeypadModalOpen(false)}
          onOpenCalculator={() => {
            setKeypadModalOpen(false);
            toggleLaptop(true);
            openWindow('calc');
          }}
        />
      )}

      {/* 7. Official Lore Climax Modal: Room 99 Threshold */}
      {showRoom99Climax && (
        <Room99ClimaxModal
          onClose={() => setShowRoom99Climax(false)}
          onFinishGame={() => {
            setShowRoom99Climax(false);
            toggleLaptop(true);
            openWindow('nine-ai');
          }}
        />
      )}
    </div>
  );
}
