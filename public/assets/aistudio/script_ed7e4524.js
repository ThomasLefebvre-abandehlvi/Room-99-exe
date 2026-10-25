    (() => {
      "use strict";

      const canvas = document.getElementById("game");
      const ctx = canvas.getContext("2d", { alpha: false });
      const laptopWallpaper = new Image();
      laptopWallpaper.src = "windows-wallpaper.jpg";

      const marketIcon = new Image();
      marketIcon.src = "market.jpg";

      const crateIcon = new Image();
      crateIcon.src = "crate.jpg";
      const W = 960, H = 600;
      const keys = new Set();
      const tools = [
        { name: "Starter Hammer", cost: 10, power: 2, note: "A little weight. A first way out." },
        { name: "Old Hammer", cost: 50, power: 4, note: "A stubborn relic with a harder swing." },
        { name: "Stone Hammer", cost: 150, power: 7, note: "Carved from something that remembers." },
        { name: "Copper Hammer", cost: 500, power: 12, note: "Conducts the room's hidden current." },
        { name: "Iron Hammer", cost: 750, power: 17, note: "Built for doors that should not exist." },
        { name: "BlackStone Hammer", cost: 1000, power: 22, note: "Made In Japan." },
        { name: "Malachite Hammer", cost: 1200, power: 28, note: "Green Crystalized heaven." },
        { name: "Emerald Hammer", cost: 1500, power: 38, note: "By the Shiny Father of Malachite." },
        { name: "Red Gold Hammer", cost: 1750, power: 50, note: "A cheap alternative for real gold." },
        { name: "Deepslate Hammer", cost: 2250, power: 72, note: "Best When Mining Deep, Not for breaking doors." }
      ];
      function vaultDurability(room) { return Math.min(120, 24 + Math.min(room, 16) * 6); }
      const state = {
        room: 0, coins: 0, tool: -1, inspected: false, caseOpen: false,
        doorHp: 24, doorMax: 24, tablet: false, strike: 0, flash: 0,
        fade: 0, transition: false, nextRoomAt: 0, shake: 0,
        message: "", messageUntil: 0, playerX: 176, facing: 1, bought: Array(tools.length).fill(false),
        laptopApp: "home", appScroll: 0, laptopPointer: null,
        lastClickedApp: null, lastClickTime: 0, // Added for double-click app launching
        layout: null, doorX: 0, terrain: null, terrainDetails: [], chestX: 0, chestActive: false,
        stamina: 100, jumpHeight: 0, jumpVelocity: 0, landing: 0, crouched: false, sprinting: false
      };
      const layouts = [
        { id: "chamber", name: "STONE CHAMBER", minLength: 1200, maxLength: 1550, stairs: 0 },
        { id: "hallway", name: "LONG HALLWAY", minLength: 2100, maxLength: 2850, stairs: 0 },
        { id: "stairs-up", name: "STAIRS UP TO THE VAULT", minLength: 1800, maxLength: 2350, stairs: -1 },
        { id: "stairs-down", name: "STAIRS DOWN TO THE VAULT", minLength: 1800, maxLength: 2350, stairs: 1 },
        { id: "long-stairs", name: "THE ENDLESS STAIR", minLength: 2500, maxLength: 3200, stairs: -1 },
        { id: "vent", name: "THE SERVICE VENT", minLength: 2200, maxLength: 2800, stairs: 0, vent: true }
      ];
      const terrainTypes = [
        { name: "STONE", surface: "rgba(148,163,184,.14)", accent: "rgba(148,163,184,.35)" },
        { name: "MOSS", surface: "rgba(74,222,128,.13)", accent: "rgba(74,222,128,.32)" },
        { name: "SAND", surface: "rgba(251,191,36,.13)", accent: "rgba(251,191,36,.31)" },
        { name: "CRYSTAL", surface: "rgba(56,189,248,.14)", accent: "rgba(56,189,248,.36)" },
        { name: "RUST", surface: "rgba(251,146,60,.13)", accent: "rgba(251,146,60,.32)" }
      ];
      function generateRoom() {
        const previousLayout = state.layout ? state.layout.id : null;
        let choices;
        if (state.room === 0) choices = layouts.filter(layout => layout.id === "chamber");
        else if (state.room === 1) choices = layouts.filter(layout => layout.id === "hallway");
        else if (state.room === 2) choices = layouts.filter(layout =>
          layout.id === "stairs-up" || layout.id === "stairs-down" || layout.id === "long-stairs");
        else choices = layouts.filter(layout => layout.id !== previousLayout);
        const selected = choices[Math.floor(Math.random() * choices.length)];
        state.layout = {
          ...selected,
          length: selected.minLength + Math.random() * (selected.maxLength - selected.minLength)
        };
        state.doorX = state.layout.length - 155;
        state.layout.ventStart = state.layout.vent ? 480 : 0;
        state.layout.ventEnd = state.layout.vent ? state.doorX - 300 : 0;
        state.terrain = terrainTypes[Math.floor(Math.random() * terrainTypes.length)];
        state.terrainDetails = Array.from({ length: Math.ceil(state.layout.length / 75) }, () => ({
          x: Math.random() * state.layout.length,
          y: Math.random(),
          size: 2 + Math.random() * 5
        }));
        state.chestActive = Math.random() < .05;
        state.chestX = 260 + Math.random() * Math.max(1, state.doorX - 500);
        state.playerX = 176;
      }
      generateRoom();
      const SAVE_KEY = "room99-progress-v1";
      let lastSavedAt = 0;
      let saveErrorReported = false;
      function saveProgress() {
        try {
          const saved = {
            version: 1,
            room: state.room,
            coins: state.coins,
            tool: state.tool,
            inspected: state.inspected,
            caseOpen: state.caseOpen,
            bought: state.bought,
            doorHp: state.doorHp,
            doorMax: state.doorMax,
            playerX: state.playerX,
            layoutId: state.layout.id,
            layoutLength: state.layout.length,
            stamina: state.stamina,
            terrainName: state.terrain.name,
            terrainDetails: state.terrainDetails,
            chestX: state.chestX,
            chestActive: state.chestActive
          };
          localStorage.setItem(SAVE_KEY, JSON.stringify(saved));
          lastSavedAt = now();
          saveErrorReported = false;
        } catch (error) {
          console.error("Room 99 could not save progress.", error);
          if (!saveErrorReported) notify("Progress could not be saved in this browser.");
          saveErrorReported = true;
        }
      }
      function loadProgress() {
        try {
          const raw = localStorage.getItem(SAVE_KEY);
          if (!raw) return;
          const saved = JSON.parse(raw);
          const layout = layouts.find(item => item.id === saved.layoutId);
          const terrain = terrainTypes.find(item => item.name === saved.terrainName);
          const valid = saved.version === 1
            && Number.isSafeInteger(saved.room) && saved.room >= 0
            && Number.isFinite(saved.coins) && saved.coins >= 0
            && Number.isInteger(saved.tool) && saved.tool >= -1 && saved.tool < tools.length
            && Number.isInteger(saved.doorMax) && saved.doorMax >= 1
            && Number.isInteger(saved.doorHp) && saved.doorHp >= 0 && saved.doorHp <= saved.doorMax
            && Number.isFinite(saved.playerX)
            && typeof saved.inspected === "boolean" && typeof saved.caseOpen === "boolean"
            && Array.isArray(saved.bought) && saved.bought.length <= tools.length
            && saved.bought.every(value => typeof value === "boolean")
            && layout && Number.isFinite(saved.layoutLength)
            && saved.layoutLength >= layout.minLength && saved.layoutLength <= layout.maxLength
            && (saved.stamina === undefined || (Number.isFinite(saved.stamina) && saved.stamina >= 0 && saved.stamina <= 100))
            && terrain && Array.isArray(saved.terrainDetails)
            && saved.terrainDetails.length <= 100
            && saved.terrainDetails.every(detail => Number.isFinite(detail.x) && detail.x >= 0
              && detail.x <= saved.layoutLength && Number.isFinite(detail.y) && detail.y >= 0
              && detail.y <= 1 && Number.isFinite(detail.size) && detail.size >= 2 && detail.size <= 7)
            && Number.isFinite(saved.chestX) && saved.chestX >= 0
            && saved.chestX <= saved.layoutLength && typeof saved.chestActive === "boolean";
          if (!valid) throw new Error("Saved progress has an invalid format.");
          state.room = saved.room;
          state.coins = saved.coins;
          state.tool = saved.tool;
          state.inspected = saved.inspected;
          state.caseOpen = saved.caseOpen;
          state.bought = saved.bought.concat(Array(tools.length - saved.bought.length).fill(false));
          state.doorMax = Math.max(saved.doorMax, vaultDurability(state.room));
          state.doorHp = Math.max(1, Math.ceil(saved.doorHp / saved.doorMax * state.doorMax));
          state.layout = {
            ...layout,
            length: saved.layoutLength,
            ventStart: layout.vent ? 480 : 0,
            ventEnd: layout.vent ? saved.layoutLength - 455 : 0
          };
          state.doorX = state.layout.length - 155;
          state.playerX = Math.max(35, Math.min(state.layout.length - 35, saved.playerX));
          state.terrain = terrain;
          state.terrainDetails = saved.terrainDetails;
          state.chestX = saved.chestX;
          state.chestActive = saved.chestActive;
          state.stamina = saved.stamina === undefined ? 100 : saved.stamina;
          notify("Progress restored from your last save.", 3000);
        } catch (error) {
          console.error("Room 99 could not load saved progress.", error);
          notify("Saved progress could not be loaded.", 3000);
        }
      }
      const roomLabel = () => String(state.room).padStart(3, "0");
      const multiplier = () => state.tool < 0 ? 1 : tools[state.tool].power;
      const now = () => performance.now();
      loadProgress();

      function resize() {
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        canvas.width = Math.floor(window.innerWidth * dpr);
        canvas.height = Math.floor(window.innerHeight * dpr);
      }
      window.addEventListener("resize", resize);
      resize();

      function roundedRect(x, y, w, h, r, fill, stroke, lineWidth = 1) {
        ctx.beginPath();
        ctx.roundRect(x, y, w, h, r);
        if (fill) { ctx.fillStyle = fill; ctx.fill(); }
        if (stroke) { ctx.lineWidth = lineWidth; ctx.strokeStyle = stroke; ctx.stroke(); }
      }
      function text(value, x, y, size, color = "#e2e8f0", weight = 500, align = "left") {
        ctx.fillStyle = color;
        ctx.font = `${weight} ${size}px "Segoe UI", Inter, system-ui, sans-serif`;
        ctx.textAlign = align;
        ctx.textBaseline = "middle";
        ctx.fillText(value, x, y);
      }
      function line(x1, y1, x2, y2, color, width = 1) {
        ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2);
        ctx.strokeStyle = color; ctx.lineWidth = width; ctx.stroke();
      }
      function glow(color, blur) { ctx.shadowColor = color; ctx.shadowBlur = blur; }
      function noGlow() { ctx.shadowBlur = 0; ctx.shadowColor = "transparent"; }
      function coin(x, y, size = 20) {
        ctx.save();
        glow("#fbbf24", 14);
        ctx.fillStyle = "#fbbf24"; ctx.fillRect(x, y, size, size);
        noGlow();
        ctx.strokeStyle = "#fff2b2"; ctx.lineWidth = 1; ctx.strokeRect(x + 2, y + 2, size - 4, size - 4);
        text("9", x + size / 2, y + size / 2 + .5, size * .72, "#5b3500", 900, "center");
        ctx.restore();
      }
      function background() {
        const grad = ctx.createLinearGradient(0, 0, 0, H);
        grad.addColorStop(0, "#0b1329"); grad.addColorStop(.72, "#080f22"); grad.addColorStop(1, "#020617");
        ctx.fillStyle = grad; ctx.fillRect(0, 0, W, H);
        const ambient = ctx.createRadialGradient(480, 280, 0, 480, 280, 520);
        ambient.addColorStop(0, "rgba(30,64,112,.18)");
        ambient.addColorStop(.4, "rgba(30,64,112,.14)");
        ambient.addColorStop(.72, "rgba(30,64,112,.07)");
        ambient.addColorStop(.92, "rgba(30,64,112,.015)");
        ambient.addColorStop(1, "rgba(30,64,112,0)");
        ctx.fillStyle = ambient; ctx.fillRect(0, 0, W, H);
        ctx.fillStyle = "#0a1226"; ctx.fillRect(0, 488, W, 112);
        const floor = ctx.createLinearGradient(0, 488, 0, 600);
        floor.addColorStop(0, "rgba(56,189,248,0)");
        floor.addColorStop(.16, "rgba(56,189,248,.035)");
        floor.addColorStop(.42, "rgba(56,189,248,.02)");
        floor.addColorStop(.78, "rgba(56,189,248,0)");
        floor.addColorStop(1, "rgba(2,6,23,.4)");
        ctx.fillStyle = floor; ctx.fillRect(0, 488, W, 112);
        const floorGlow = ctx.createRadialGradient(480, 490, 0, 480, 490, 520);
        floorGlow.addColorStop(0, "rgba(56,189,248,.18)");
        floorGlow.addColorStop(.45, "rgba(56,189,248,.12)");
        floorGlow.addColorStop(.75, "rgba(56,189,248,.055)");
        floorGlow.addColorStop(.93, "rgba(56,189,248,.01)");
        floorGlow.addColorStop(1, "rgba(56,189,248,0)");
        ctx.fillStyle = floorGlow; ctx.fillRect(0, 488, W, 112);
        line(0, 489, W, 489, "rgba(56,189,248,.04)");
        for (let x = -150; x < W + 150; x += 90) line(480, 490, x, 600, "rgba(56,189,248,.07)");
        const edgeFade = ctx.createRadialGradient(480, 300, 180, 480, 300, 660);
        edgeFade.addColorStop(0, "rgba(2,6,23,0)");
        edgeFade.addColorStop(.72, "rgba(2,6,23,0)");
        edgeFade.addColorStop(.9, "rgba(2,6,23,.18)");
        edgeFade.addColorStop(1, "rgba(2,6,23,.42)");
        ctx.fillStyle = edgeFade; ctx.fillRect(0, 0, W, H);
      }
      function drawHud() {
        roundedRect(24, 20, 912, 52, 12, "rgba(3,9,24,.8)", "rgba(148,163,184,.13)");
        ctx.fillStyle = "#38bdf8"; ctx.fillRect(42, 37, 2, 18);
        text("ROOM", 56, 36, 9, "#8193ad", 700); text(roomLabel(), 56, 54, 17, "#eaf7ff", 700);
        line(126, 32, 126, 60, "rgba(148,163,184,.15)");
        text("EFFICIENCY", 145, 36, 9, "#8193ad", 700); text(`×${multiplier()}`, 145, 54, 16, "#38bdf8", 700);
        line(229, 32, 229, 60, "rgba(148,163,184,.15)");
        coin(249, 37, 19); text(String(state.coins), 276, 47, 16, "#f8e6ad", 700);
        text("NENO COINS", 311, 47, 9, "#9ba8bd", 650);
        text("THE QUIET WARD", 480, 46, 10, "#65748d", 700, "center");
        drawStamina();
        text("TAB", 824, 47, 9, "#8495ae", 700, "center");
        roundedRect(844, 34, 72, 25, 6, "rgba(56,189,248,.08)", "rgba(56,189,248,.25)");
        text("LAPTOP", 880, 47, 9, "#7dd3fc", 750, "center");
      }
      function floorAt(x) {
        const stairsStart = 300, stairsEnd = state.doorX - 210;
        if (!state.layout.stairs || x <= stairsStart) return 488;
        const stepWidth = 55, steps = Math.max(1, Math.floor((stairsEnd - stairsStart) / stepWidth));
        const step = Math.min(steps, Math.floor((x - stairsStart) / stepWidth));
        return 488 + state.layout.stairs * step * (96 / steps);
      }
      function inVent(x) {
        return state.layout.vent && x >= state.layout.ventStart - 18 && x <= state.layout.ventEnd + 18;
      }
      function jump() {
        if (state.tablet || state.fade > 0 || state.crouched || inVent(state.playerX)
            || state.jumpHeight > 0 || state.jumpVelocity > 0) return;
        state.landing = 0;
        state.jumpVelocity = 560;
      }
      function drawStamina() {
        text("STAMINA", 615, 37, 8, "#9ba8bd", 650);
        roundedRect(615, 43, 145, 8, 4, "rgba(148,163,184,.18)");
        if (state.stamina > 0) {
          roundedRect(615, 43, 145 * state.stamina / 100, 8, 4,
            state.stamina < 25 ? "#f97316" : "#38bdf8");
        }
        if (keys.has("sprint")) text("RUN", 769, 50, 8, "#7dd3fc", 750);
      }
      function viewportWorldWidth() {
        return W;
      }
      function cameraX() {
        const viewWidth = viewportWorldWidth();
        return Math.max(0, Math.min(state.layout.length - viewWidth, state.playerX - viewWidth / 2));
      }
      function cameraY() {
        return floorAt(state.playerX) - 488;
      }
      function drawRoomEnvironment() {
        const visibleLeft = Math.max(0, cameraX() - 100);
        const visibleRight = Math.min(state.layout.length, cameraX() + viewportWorldWidth() + 100);
        const floorY = 488;
        ctx.fillStyle = state.terrain.surface;
        ctx.fillRect(visibleLeft, floorY, visibleRight - visibleLeft, H - floorY);
        for (const detail of state.terrainDetails) {
          if (detail.x < visibleLeft || detail.x > visibleRight) continue;
          const y = floorY + 8 + detail.y * (H - floorY - 12);
          ctx.fillStyle = state.terrain.accent;
          ctx.fillRect(detail.x, y, detail.size * 1.7, Math.max(1, detail.size * .45));
        }
        if (state.layout.stairs) {
          const stairsStart = 300, stairsEnd = state.doorX - 210, stepWidth = 55;
          const steps = Math.max(1, Math.floor((stairsEnd - stairsStart) / stepWidth));
          const stepRise = 96 / steps;
          for (let i = 0; i <= steps; i++) {
            const x = stairsStart + i * stepWidth;
            if (x < visibleLeft - stepWidth || x > visibleRight) continue;
            const y = floorY + state.layout.stairs * i * stepRise;
            ctx.fillStyle = "#101d31";
            ctx.fillRect(x, y, stepWidth + 1, H - y);
            line(x, y, x + stepWidth, y, state.terrain.accent, 3);
            line(x + stepWidth, y, x + stepWidth, y + state.layout.stairs * stepRise, "rgba(2,6,23,.7)", 2);
          }
          const landingY = floorAt(stairsEnd);
          ctx.fillStyle = "#101d31";
          ctx.fillRect(stairsEnd, landingY, state.layout.length - stairsEnd, H - landingY);
          line(stairsEnd, landingY, state.layout.length, landingY, state.terrain.accent, 3);
          line(stairsStart, 190, stairsEnd, 190 + state.layout.stairs * 96, "rgba(56,189,248,.24)", 3);
        } else {
          line(visibleLeft, floorY, visibleRight, floorY, "rgba(56,189,248,.05)", 2);
        }
        if (state.layout.id === "hallway" || state.layout.id === "long-stairs") {
          for (let x = 180; x < state.layout.length; x += 280) {
            if (x < visibleLeft - 100 || x > visibleRight) continue;
            const base = floorAt(x);
            line(x, base, x, 177, "rgba(56,189,248,.22)", 5);
            line(x + 94, base, x + 94, 177, "rgba(56,189,248,.22)", 5);
            line(x, 177, x + 94, 177, "rgba(56,189,248,.22)", 5);
          }
        } else {
          for (const detail of state.terrainDetails) {
            if (detail.x < visibleLeft || detail.x > visibleRight || detail.y > .28) continue;
            const height = 30 + detail.size * 12;
            ctx.fillStyle = state.terrain.accent;
            ctx.globalAlpha = .55;
            ctx.fillRect(detail.x, 330 - height, 5 + detail.size, height);
            ctx.globalAlpha = 1;
          }
        }
        if (state.layout.vent) {
          for (let x = state.layout.ventStart; x < state.layout.ventEnd; x += 120) {
            if (x + 120 < visibleLeft || x > visibleRight) continue;
            const base = floorAt(x);
            ctx.fillStyle = "rgba(4,12,26,.94)";
            ctx.fillRect(x, base - 62, Math.min(120, state.layout.ventEnd - x), 52);
            line(x, base - 62, Math.min(x + 120, state.layout.ventEnd), base - 62, "#526a83", 3);
            if (Math.round(x) % 120 === 0) line(x, base - 60, x, base - 12, "rgba(125,160,207,.22)", 2);
          }
          const entranceY = floorAt(state.layout.ventStart);
          line(state.layout.ventStart, entranceY - 62, state.layout.ventStart, entranceY, "#6b8196", 4);
          line(state.layout.ventEnd, floorAt(state.layout.ventEnd) - 62,
            state.layout.ventEnd, floorAt(state.layout.ventEnd), "#6b8196", 4);
          text("LOW VENT  /  HOLD C TO CRAWL", state.layout.ventStart + 180,
            entranceY - 76, 9, "#fbbf24", 700, "center");
        }
      }
      function drawDoor() {
        const w = 226, h = 324, x = state.doorX - w / 2, y = floorAt(state.doorX) - h;
        ctx.save();
        glow(state.flash > 0 ? "#f43f5e" : "#38bdf8", state.flash > 0 ? 22 : 10);
        roundedRect(x, y, w, h, 8, "#0b1428", "rgba(56,189,248,.55)", 2);
        noGlow();
        const doorGrad = ctx.createLinearGradient(x, y, x + w, y);
        doorGrad.addColorStop(0, "#121e32"); doorGrad.addColorStop(.18, "#18253b");
        doorGrad.addColorStop(.5, "#101a2c"); doorGrad.addColorStop(1, "#0a1325");
        roundedRect(x + 8, y + 8, w - 16, h - 16, 5, doorGrad, "rgba(148,163,184,.16)");
        const healthSegments = Math.ceil(state.doorHp / state.doorMax * 12);
        for (let i = 0; i < 12; i++) {
          ctx.fillStyle = i < healthSegments ? "#f43f5e" : "rgba(244,63,94,.15)";
          ctx.fillRect(x + 18 + i * 16, y + 25, 10, 3);
        }
        text("VAULT  /  99", x + w / 2, y + 53, 11, "#c5d4e8", 700, "center");
        line(x + 28, y + 75, x + w - 28, y + 75, "rgba(148,163,184,.2)");
        const dialX = x + w / 2, dialY = y + 171;
        ctx.beginPath(); ctx.arc(dialX, dialY, 39, 0, Math.PI * 2);
        ctx.fillStyle = "#0b1325"; ctx.fill(); ctx.strokeStyle = "rgba(148,163,184,.27)"; ctx.lineWidth = 2; ctx.stroke();
        ctx.beginPath(); ctx.arc(dialX, dialY, 28, 0, Math.PI * 2);
        ctx.strokeStyle = "rgba(56,189,248,.24)"; ctx.lineWidth = 1; ctx.stroke();
        const vaultNumber = String(state.room + 1);
        const dialFontSize = vaultNumber.length === 1 ? 35 : vaultNumber.length === 2 ? 28 : vaultNumber.length === 3 ? 22 : 16;
        ctx.save(); glow("#38bdf8", 12); text(vaultNumber, dialX, dialY + 2, dialFontSize, "#bae6fd", 300, "center"); noGlow(); ctx.restore();
        for (const py of [y + 18, y + h - 18]) for (const px of [x + 18, x + w - 18]) {
          ctx.beginPath(); ctx.arc(px, py, 3, 0, Math.PI * 2); ctx.fillStyle = "#64748b"; ctx.fill();
        }
        text("SEALED", x + w / 2, y + 255, 9, "#8393a8", 700, "center");
        ctx.restore();
      }
      function drawPaper() {
        const x = 770, y = floorAt(x) - 86;
        ctx.save(); ctx.translate(x, y); ctx.rotate(-.12);
        glow(state.inspected ? "#38bdf8" : "#fbbf24", state.inspected ? 8 : 14);
        ctx.fillStyle = "#d8d0b9"; ctx.fillRect(-18, -13, 38, 28); noGlow();
        ctx.fillStyle = "#737367"; ctx.fillRect(-11, -7, 23, 1); ctx.fillRect(-11, -2, 18, 1); ctx.fillRect(-11, 3, 14, 1);
        ctx.restore();
        text(state.inspected ? "READ" : "NOTE", x, y - 34, 9, state.inspected ? "#7dd3fc" : "#fbbf24", 700, "center");
        if (!state.inspected) text("E / TAP TO INSPECT", x, y + 31, 8, "#b8c5d7", 600, "center");
      }
      function drawCase() {
        const x = 254, y = floorAt(x) - 67;
        roundedRect(x - 43, y - 34, 86, 52, 5, state.caseOpen ? "#101827" : "#151f32",
          state.inspected ? "rgba(56,189,248,.6)" : "rgba(148,163,184,.35)", 1.5);
        roundedRect(x - 37, y - 29, 74, 33, 3, state.caseOpen ? "#08101d" : "#1b2940", "rgba(148,163,184,.18)");
        if (state.caseOpen) {
          ctx.save(); glow("#38bdf8", 12); line(x - 23, y - 25, x + 23, y - 25, "#38bdf8", 2); noGlow(); ctx.restore();
          text("EMPTY", x, y - 12, 8, "#66768d", 700, "center");
        } else {
          roundedRect(x - 6, y - 19, 12, 14, 2, "#101a2b", "#fbbf24", 1);
          ctx.beginPath(); ctx.arc(x, y - 20, 5, Math.PI, Math.PI * 2); ctx.strokeStyle = "#fbbf24"; ctx.lineWidth = 1.5; ctx.stroke();
        }
        text(state.caseOpen ? "CASE / OPEN" : "LOCKED CASE", x, y + 34, 9, state.inspected ? "#7dd3fc" : "#8c9ab0", 700, "center");
        if (state.inspected && !state.caseOpen) text("E / TAP", x, y + 49, 8, "#c2d3e5", 600, "center");
      }
      function drawPlayer(time, horizontalScale = 1) {
        const moving = state.strike <= 0 && (keys.has("left") || keys.has("right")) && !state.crouched;
        const bob = moving && !state.sprinting && state.jumpHeight === 0 ? Math.sin(time / 80) * 2 : 0;
        const attackProgress = state.strike > 0 ? 1 - state.strike : -1;
        const attackJumpHeight = attackProgress < 0 ? 0 : attackProgress < .42
          ? 56 * Math.sin(attackProgress / .42 * Math.PI / 2)
          : attackProgress < .67 ? 56 * (1 - (attackProgress - .42) / .25) : 0;
        const slamLean = attackProgress >= .48 && attackProgress <= .88
          ? Math.sin((attackProgress - .48) / .4 * Math.PI) * .5 : 0;
        const crouch = state.crouched && attackProgress < 0;
        const landingImpact = state.landing > 0 ? Math.sin((1 - state.landing / .28) * Math.PI) : 0;
        ctx.save();
        ctx.translate(state.playerX, floorAt(state.playerX) + bob - state.jumpHeight - attackJumpHeight);
        ctx.fillStyle = `rgba(56,189,248,${.18 + landingImpact * .15})`;
        ctx.beginPath(); ctx.ellipse(0, 0, 17 + landingImpact * 9, 4 + landingImpact * 2, 0, 0, Math.PI * 2); ctx.fill();
        if (landingImpact > 0) {
          ctx.save(); ctx.globalAlpha = landingImpact * .5; ctx.fillStyle = "#cbd5e1";
          ctx.beginPath();
          ctx.ellipse(-22 - landingImpact * 8, -2, 3 + landingImpact * 3, 2, 0, 0, Math.PI * 2);
          ctx.ellipse(22 + landingImpact * 8, -2, 3 + landingImpact * 3, 2, 0, 0, Math.PI * 2);
          ctx.fill(); ctx.restore();
        }
        ctx.scale(state.facing * horizontalScale, 1 - landingImpact * .18);
        if (slamLean > 0) ctx.rotate(slamLean);
        ctx.lineCap = "round";
        const skin = "#d6a783";
        const walk = moving ? Math.sin(time / 80) : 0;
        if (crouch) {
          const crawl = Math.sin(time / 95) * 2;
          roundedRect(-13, -29, 29, 13, 5, "#1c5672", "#5da1b8", 1);
          line(-7, -24, 7, -24, "rgba(210,235,245,.5)", 1);
          ctx.strokeStyle = "#26374d"; ctx.lineWidth = 7;
          ctx.beginPath();
          ctx.moveTo(-9, -20); ctx.lineTo(-14 - crawl, -10); ctx.lineTo(-16 - crawl, -3);
          ctx.moveTo(-2, -19); ctx.lineTo(-4 + crawl, -9); ctx.lineTo(-4 + crawl, -2);
          ctx.stroke();
          ctx.fillStyle = "#101827";
          ctx.beginPath(); ctx.ellipse(-16 - crawl, -2, 6, 3, 0, 0, Math.PI * 2); ctx.fill();
          ctx.beginPath(); ctx.ellipse(-4 + crawl, -2, 6, 3, 0, 0, Math.PI * 2); ctx.fill();
          ctx.strokeStyle = "#23718c"; ctx.lineWidth = 7;
          ctx.beginPath();
          ctx.moveTo(7, -25); ctx.lineTo(12 + crawl, -14); ctx.lineTo(18 + crawl, -4);
          ctx.moveTo(13, -25); ctx.lineTo(16 - crawl, -14); ctx.lineTo(22 - crawl, -4);
          ctx.stroke();
          ctx.strokeStyle = skin; ctx.lineWidth = 4;
          ctx.beginPath();
          ctx.moveTo(18 + crawl, -4); ctx.lineTo(20 + crawl, -1);
          ctx.moveTo(22 - crawl, -4); ctx.lineTo(24 - crawl, -1);
          ctx.stroke();
          ctx.fillStyle = skin;
          ctx.beginPath(); ctx.ellipse(18, -37, 8, 9, .12, 0, Math.PI * 2); ctx.fill();
        } else {
          ctx.strokeStyle = "#26374d"; ctx.lineWidth = 8;
          ctx.beginPath();
          if (state.jumpHeight > 0 || attackJumpHeight > 0) {
            ctx.moveTo(-5, -27); ctx.lineTo(-13, -14); ctx.lineTo(-8, -9);
            ctx.moveTo(5, -27); ctx.lineTo(13, -15); ctx.lineTo(19, -19);
          } else if (state.sprinting) {
            ctx.moveTo(-5, -29); ctx.lineTo(-9 + walk * 8, -15); ctx.lineTo(-15 + walk * 12, -3);
            ctx.moveTo(5, -29); ctx.lineTo(10 - walk * 8, -16); ctx.lineTo(16 - walk * 12, -3);
          } else {
            ctx.moveTo(-5, -29); ctx.lineTo(-6 + walk * 5, -14); ctx.lineTo(-7 + walk * 5, -3);
            ctx.moveTo(5, -29); ctx.lineTo(6 - walk * 5, -14); ctx.lineTo(7 - walk * 5, -3);
          }
          ctx.stroke();
          ctx.fillStyle = "#101827";
          ctx.beginPath(); ctx.ellipse(state.sprinting ? -15 + walk * 12 : -7 + walk * 5, -2, 6, 3, 0, 0, Math.PI * 2); ctx.fill();
          ctx.beginPath(); ctx.ellipse(state.sprinting ? 16 - walk * 12 : 7 - walk * 5, -2, 6, 3, 0, 0, Math.PI * 2); ctx.fill();
          ctx.save();
          if (state.sprinting) {
            ctx.translate(0, -29); ctx.rotate(.18); ctx.translate(0, 29);
          }
          roundedRect(-11, -57, 22, 30, 5, "#1c5672", "#5da1b8", 1);
          line(0, -53, 0, -30, "rgba(210,235,245,.55)", 1);
          ctx.fillStyle = "#dbe6ed"; ctx.fillRect(-2, -50, 4, 2);
          ctx.fillStyle = skin; ctx.fillRect(-3, -61, 6, 5);
          if (state.sprinting) {
            ctx.strokeStyle = "#23718c"; ctx.lineWidth = 7;
            ctx.beginPath();
            ctx.moveTo(-8, -51); ctx.lineTo(-20, -47); ctx.lineTo(-33, -53);
            ctx.moveTo(8, -51); ctx.lineTo(-4, -47); ctx.lineTo(-25, -51);
            ctx.stroke();
            ctx.strokeStyle = skin; ctx.lineWidth = 5;
            ctx.beginPath();
            ctx.moveTo(-33, -53); ctx.lineTo(-38, -55);
            ctx.moveTo(-25, -51); ctx.lineTo(-31, -53);
            ctx.stroke();
          } else if (attackProgress >= 0) {
            const pivotY = attackProgress < .42 ? -70
              : -70 + Math.min(1, (attackProgress - .42) / .25) * 17;
            ctx.strokeStyle = "#23718c"; ctx.lineWidth = 7;
            ctx.beginPath();
            ctx.moveTo(-8, -51); ctx.lineTo(-9, -61); ctx.lineTo(-4, pivotY);
            ctx.moveTo(8, -51); ctx.lineTo(9, -61); ctx.lineTo(4, pivotY);
            ctx.stroke();
            ctx.strokeStyle = skin; ctx.lineWidth = 5;
            ctx.beginPath();
            ctx.moveTo(-4, pivotY); ctx.lineTo(-1, pivotY + 2);
            ctx.moveTo(4, pivotY); ctx.lineTo(1, pivotY + 2);
            ctx.stroke();
          } else {
            ctx.strokeStyle = "#23718c"; ctx.lineWidth = 7;
            ctx.beginPath();
            ctx.moveTo(-8, -51); ctx.lineTo(-13, -38); ctx.lineTo(-10, -32);
            ctx.moveTo(8, -51); ctx.lineTo(13, -39); ctx.lineTo(12, -33);
            ctx.stroke();
            ctx.strokeStyle = skin; ctx.lineWidth = 5;
            ctx.beginPath();
            ctx.moveTo(-10, -32); ctx.lineTo(-9, -28);
            ctx.moveTo(12, -33); ctx.lineTo(12, -29);
            ctx.stroke();
          }
          ctx.fillStyle = skin;
          ctx.beginPath(); ctx.ellipse(0, -70, 9, 11, 0, 0, Math.PI * 2); ctx.fill();
        }
        ctx.fillStyle = "#252126";
        if (crouch) {
          ctx.beginPath(); ctx.ellipse(17, -43, 8, 4, .15, Math.PI, Math.PI * 2); ctx.fill();
          ctx.fillRect(20, -39, 2, 2);
        } else {
          ctx.beginPath(); ctx.ellipse(-1, -76, 9, 5, -.1, Math.PI, Math.PI * 2); ctx.fill();
          ctx.fillRect(-9, -77, 4, 9);
          ctx.fillStyle = "#252126"; ctx.fillRect(4, -72, 2, 2);
          ctx.fillStyle = "#a66b53"; ctx.fillRect(8, -70, 2, 4);
        }
        if (state.tool >= 0) {
          ctx.save();
          if (attackProgress >= 0) {
            const swingAngle = attackProgress < .42 ? -1.5
              : attackProgress < .68 ? -1.5 + (attackProgress - .42) / .26 * 3
                : 1.5 - (attackProgress - .68) / .32 * 1.9;
            const pivotY = attackProgress < .42 ? -70
              : -70 + Math.min(1, (attackProgress - .42) / .25) * 17;
            ctx.translate(0, pivotY);
            ctx.rotate(swingAngle);
            ctx.fillStyle = "#765b3d"; ctx.fillRect(0, -2, 42, 4);
            ctx.fillStyle = ["#9ca3af", "#9a8062", "#a9a28e", "#c47b43", "#bec8d5",
              "#252a34", "#39a779", "#4ade80", "#d97732", "#64748b"][state.tool];
            ctx.fillRect(36, -10, 15, 20);
            ctx.strokeStyle = "rgba(255,255,255,.3)"; ctx.strokeRect(36, -10, 15, 20);
          } else {
            ctx.translate(crouch ? 24 : state.sprinting ? -31 : 12,
              crouch ? -2 : state.sprinting ? -53 : -29);
            ctx.rotate(state.sprinting ? -.12 : -.48);
            ctx.fillStyle = "#765b3d"; ctx.fillRect(0, -2, 26, 4);
            ctx.fillStyle = ["#9ca3af", "#9a8062", "#a9a28e", "#c47b43", "#bec8d5",
              "#252a34", "#39a779", "#4ade80", "#d97732", "#64748b"][state.tool];
            ctx.fillRect(21, -9, 13, 18);
            ctx.strokeStyle = "rgba(255,255,255,.3)"; ctx.strokeRect(21, -9, 13, 18);
          }
          ctx.restore();
        }
        if (!crouch) ctx.restore();
        ctx.restore();
      }
      function drawChest() {
        if (!state.chestActive) return;
        const y = floorAt(state.chestX);
        ctx.save();
        glow("#fbbf24", 10);
        roundedRect(state.chestX - 24, y - 24, 48, 25, 4, "#704923", "#fbbf24", 1.5);
        roundedRect(state.chestX - 21, y - 21, 42, 10, 2, "#96632e", "rgba(255,221,132,.65)");
        ctx.fillStyle = "#fbbf24"; ctx.fillRect(state.chestX - 3, y - 19, 6, 8);
        noGlow(); ctx.restore();
        text("CHEST", state.chestX, y - 34, 8, "#fcd34d", 750, "center");
      }
      function drawScene(time) {
        background(); drawHud();
        ctx.save(); ctx.translate(-cameraX(), -cameraY());
        drawRoomEnvironment();
        drawDoor();
        if (state.room === 0) { drawCase(); drawPaper(); }
        drawChest(); drawPlayer(time);
        ctx.restore();
        text("ROOM 99  /  A ROOM WITH NO WINDOWS", 42, 111, 10, "#667994", 700);
        text(state.room === 0 ? "CHAMBER 000" : state.layout.name, 42, 136, 18, "#dce9f7", 500);
        line(42, 153, 252, 153, "rgba(56,189,248,.25)");
        text(`${state.terrain.name} TERRAIN`, 42, 170, 8, "#8499b3", 650);
        const objective = state.tool < 0
          ? (state.inspected ? (state.caseOpen ? "STARTER HAMMER ACQUIRED" : "THE CASE IS WAITING") : "SOMEONE LEFT A NOTE")
          : Math.abs(state.playerX - state.doorX) <= 130 ? "PRESS ENTER TO HIT THE VAULT" : "WALK TO THE VAULT";
        roundedRect(333, 519, 294, 34, 8, "rgba(3,9,24,.78)", "rgba(148,163,184,.13)");
        ctx.fillStyle = state.tool >= 0 ? "#38bdf8" : "#fbbf24";
        ctx.beginPath(); ctx.arc(350, 536, 3, 0, Math.PI * 2); ctx.fill();
        text(objective, 362, 536, 9, "#b7c6d8", 700);
        if (state.message && now() < state.messageUntil) {
          roundedRect(295, 82, 370, 34, 8, "rgba(2,6,23,.92)", "rgba(56,189,248,.3)");
          text(state.message, 480, 99, 11, "#d9f4ff", 600, "center");
        }
        if (state.strike > 0) {
          ctx.save(); ctx.globalAlpha = Math.min(state.strike * 2, .45);
          ctx.fillStyle = "#f43f5e"; ctx.fillRect(515, 160, 248, 330); ctx.restore();
        }
        if (state.shake > 0) {
          ctx.save(); ctx.globalAlpha = Math.min(state.shake, .22);
          ctx.fillStyle = "#f43f5e"; ctx.fillRect(0, 0, W, H); ctx.restore();
        }
      }
      function laptopGeometry() {
        return {
          frame: { x: 110, y: 34, w: 740, h: 500 },
          titleY: 44, titleH: 38,
          viewport: { x: 145, y: 150, w: 660, h: 300 },
          cardH: 56, pitch: 64, statusY: 470,
          // Explicitly matched to your icon draw layout inside the 740x500 frame
          homeMarket: { x: 150, y: 110, w: 160, h: 140 },
          homeCrates: { x: 330, y: 110, w: 160, h: 140 },
          homeHelp:   { x: 510, y: 110, w: 160, h: 140 },
          portrait: false
        };
      }

      function helpEntries() {
        return [
          { heading: "THE STORY", text: "You wake in a sealed chamber called the Quiet Ward." },
          { text: "A note points to a case. Inside is the Starter Hammer." },
          { text: "Break each vault, descend through Room 99, and discover who built it." },
          { heading: "CONTROLS", text: "Move: A / D or Left / Right arrows." },
          { text: "Sprint: hold Shift. Jump: Space. Crouch: hold C." },
          { text: "Interact: E. Strike the nearby vault: Enter." },
          { text: "Open / close laptop: Tab or T. Press ESC to close." },
          { heading: "SQUARE 9 MARKET", text: "Earn Neno Coins by clearing rooms and finding chests." },
          { text: "Buy the next hammer in order; stronger hammers break vaults faster." },
          { heading: "LUCKY CRATES", text: "Spend 1000 Neno Coins to open a mystery crate." },
          { text: "Automatically compares your pulled hammer with your current one and equips the stronger option!" }
        ];
      }

      function isOutsideLaptop(p) {
        const g = laptopGeometry();
        const f = g.frame;
        return p.x < f.x || p.x > f.x + f.w || p.y < f.y || p.y > f.y + f.h;
      }

      function openLuckyCrate() {
        const cost = 1000;
        if (state.coins < cost) {
          notify(`Not enough Neno Coins. Need ${cost - state.coins} more for a crate.`);
          return;
        }
        state.coins -= cost;

        // Roll a random hammer from tools list
        const wonIndex = Math.floor(Math.random() * tools.length);
        const wonHammer = tools[wonIndex];
        const currentEquippedPower = state.tool < 0 ? 0 : tools[state.tool].power;

        state.bought[wonIndex] = true;

        // Compare power: keep whichever is stronger
        if (wonHammer.power > currentEquippedPower) {
          state.tool = wonIndex;
          saveProgress();
          notify(`CRATE JACKPOT! Won ${wonHammer.name} (Power ${wonHammer.power}) and equipped it!`);
        } else {
          saveProgress();
          notify(`Lucky Crate: Won ${wonHammer.name} (Power ${wonHammer.power}), but kept your stronger equipped hammer.`);
        }
      }

      function drawDesktopShortcut(box, label, imgObj, accent, isSelected) {
        const bg = isSelected ? "rgba(56,189,248,.25)" : "rgba(10,22,42,.94)";
        const border = isSelected ? "#38bdf8" : `${accent}44`;
        roundedRect(box.x, box.y, box.w, box.h, 14, bg, border, 1.5);
        
        const iconSize = 75;
        const iconX = box.x + (box.w - iconSize) / 2;
        const iconY = box.y + 16;

        if (imgObj && imgObj.complete && imgObj.naturalWidth) {
          ctx.drawImage(imgObj, iconX, iconY, iconSize, iconSize);
        } else {
          roundedRect(iconX, iconY, iconSize, iconSize, 12, `${accent}22`, `${accent}88`, 1.5);
        }
        
        text(label, box.x + box.w / 2, box.y + 112, 11, "#e4f3ff", 700, "center");
      }

      function drawLaptop() {
        const g = laptopGeometry();
        if (laptopWallpaper.complete && laptopWallpaper.naturalWidth) {
          const scale = Math.max(W / laptopWallpaper.naturalWidth, H / laptopWallpaper.naturalHeight);
          const sourceW = W / scale, sourceH = H / scale;
          ctx.drawImage(laptopWallpaper, (laptopWallpaper.naturalWidth - sourceW) / 2,
            (laptopWallpaper.naturalHeight - sourceH) / 2, sourceW, sourceH, 0, 0, W, H);
        } else {
          ctx.fillStyle = "#071326"; ctx.fillRect(0, 0, W, H);
        }
        ctx.fillStyle = "rgba(2,6,23,.2)"; ctx.fillRect(0, 0, W, H);

        if (state.laptopApp === "home") {
          drawDesktopShortcut(g.homeMarket, "SQUARE 9 MARKET", marketIcon, "#38bdf8", state.lastClickedApp === "market");
          drawDesktopShortcut(g.homeCrates, "LUCKY CRATES", crateIcon, "#f43f5e", state.lastClickedApp === "crates");
          
          const hBox = g.homeHelp;
          const isHelpSelected = state.lastClickedApp === "help";
          roundedRect(hBox.x, hBox.y, hBox.w, hBox.h, 14, isHelpSelected ? "rgba(56,189,248,.2)" : "rgba(10,22,42,.94)", isHelpSelected ? "#38bdf8" : "#fbbf2444", 1.5);
          const iconSize = 75;
          const iconX = hBox.x + (hBox.w - iconSize) / 2;
          const iconY = hBox.y + 16;
          roundedRect(iconX, iconY, iconSize, iconSize, 12, "#fbbf2422", "#fbbf2488", 1.5);
          text("?", hBox.x + hBox.w / 2, iconY + iconSize / 2, 28, "#fbbf24", 800, "center");
          text("HELP", hBox.x + hBox.w / 2, hBox.y + 112, 11, "#e4f3ff", 700, "center");

          text("Double-click an app icon to open. Press ESC or click outside to close.",
            480, 530, 10, "#cbd5e1", 600, "center");
          return;
        }

        roundedRect(g.frame.x, g.frame.y, g.frame.w, g.frame.h, 16, "#10192a", "rgba(56,189,248,.52)", 2);
        roundedRect(g.frame.x + 8, g.frame.y + 8, g.frame.w - 16, g.frame.h - 16, 11,
          "#070d1c", "rgba(148,163,184,.12)");
        ctx.fillStyle = "#111d30";
        ctx.fillRect(g.frame.x + 9, g.titleY, g.frame.w - 18, g.titleH);
        text(state.laptopApp === "market" ? "Square 9 Market" : state.laptopApp === "crates" ? "Lucky Crates" : "Room 99 Help",
          g.frame.x + 28, g.titleY + 20, 11, "#d7e9fa", 750);
        text("−", 778, g.titleY + 20, 14, "#71839c", 650, "center");
        text("□", 803, g.titleY + 20, 11, "#71839c", 650, "center");
        roundedRect(814, g.titleY + 5, 25, 27, 6, "rgba(248,113,113,.1)", "rgba(248,113,113,.28)");
        text("×", 826.5, g.titleY + 19, 15, "#fca5a5", 600, "center");

        if (state.laptopApp === "market") {
          text("ONE GOOD HIT AT A TIME", g.viewport.x, 117, 9, "#71839c", 700);
          roundedRect(650, 98, 141, 31, 8, "rgba(56,189,248,.07)", "rgba(56,189,248,.2)");
          text(`CURRENT  ×${multiplier()}`, 720, 114, 9, "#7dd3fc", 700, "center");
        } else if (state.laptopApp === "crates") {
          text("MYSTERY REWARD SYSTEM", g.viewport.x, 117, 9, "#f43f5e", 700);
          text(`COINS: ${state.coins}`, 790, 117, 9, "#f8e6ad", 700, "right");
        } else {
          text("FIELD GUIDE  /  ROOM 99", g.viewport.x, 117, 9, "#71839c", 700);
          text("A note, a hammer, and a way forward.", 790, 117, 8, "#8292a8", 600, "right");
        }

        const contentX = g.viewport.x, contentY = g.viewport.y;
        const contentW = g.viewport.w, contentH = g.viewport.h;
        ctx.save();
        ctx.beginPath(); ctx.rect(contentX, contentY, contentW, contentH); ctx.clip();
        
        if (state.laptopApp === "market") {
          for (let i = 0; i < tools.length; i++) {
            const y = contentY + i * g.pitch - state.appScroll;
            const owned = i <= state.tool, available = i === state.tool + 1;
            roundedRect(contentX, y, contentW - 14, g.cardH, 8,
              owned ? "rgba(15,32,52,.94)" : available ? "rgba(17,35,53,.96)" : "rgba(9,16,30,.9)",
              available ? "rgba(56,189,248,.42)" : "rgba(148,163,184,.13)");
            if (available) { ctx.fillStyle = "#38bdf8"; ctx.fillRect(contentX, y + 10, 2, g.cardH - 20); }
            text(String(i + 1).padStart(2, "0"), contentX + 14, y + 18, 8,
              owned ? "#7dd3fc" : "#61728b", 700);
            text(tools[i].name, contentX + 45, y + 19, 11,
              owned ? "#d8ebfb" : available ? "#e4f1fa" : "#8190a4", 700);
            text(tools[i].note, contentX + 45, y + 39, 8, "#78889d", 500);
            if (owned) text(i === state.tool ? "EQUIPPED" : "OWNED", contentX + contentW - 28,
              y + 31, 8, i === state.tool ? "#7dd3fc" : "#68809a", 750, "right");
            else if (available) {
              const buttonX = contentX + contentW - 116;
              roundedRect(buttonX, y + 13, 100, 30, 6,
                state.coins >= tools[i].cost ? "rgba(56,189,248,.16)" : "rgba(148,163,184,.06)",
                state.coins >= tools[i].cost ? "rgba(56,189,248,.4)" : "rgba(148,163,184,.14)");
              if (tools[i].cost === 0) text("FREE", buttonX + 50, y + 29, 9, "#7dd3fc", 800, "center");
              else {
                coin(buttonX + 13, y + 21, 14);
                text(String(tools[i].cost), buttonX + 58, y + 29, 9,
                  state.coins >= tools[i].cost ? "#f8e6ad" : "#8592a6", 700, "center");
              }
            } else text("LOCKED", contentX + contentW - 28, y + 31, 8, "#55647a", 700, "right");
          }
        } else if (state.laptopApp === "crates") {
          // Lucky Crates App UI
          const imgSize = 100;
          const imgX = contentX + (contentW - imgSize) / 2;
          const imgY = contentY + 20;
          if (crateIcon && crateIcon.complete && crateIcon.naturalWidth) {
            ctx.drawImage(crateIcon, imgX, imgY, imgSize, imgSize);
          } else {
            roundedRect(imgX, imgY, imgSize, imgSize, 10, "rgba(244,63,94,.2)", "#f43f5e", 2);
          }

          const btnX = contentX + contentW / 2 - 110, btnY = contentY + 135;
          roundedRect(btnX, btnY, 220, 44, 8, state.coins >= 1000 ? "rgba(244,63,94,.2)" : "rgba(148,163,184,.06)", state.coins >= 1000 ? "#f43f5e" : "#64748b", 2);
          coin(btnX + 18, btnY + 12, 18);
          text("Crack Open", btnX + 125, btnY + 22, 11, state.coins >= 1000 ? "#fff" : "#94a3b8", 750, "center");
          
          text("Cost: 1000 Neno Coins", contentX + contentW / 2, contentY + 200, 9, "#8292a8", 600, "center");
        } else {
          const entries = helpEntries(), pitch = 34;
          entries.forEach((entry, index) => {
            const y = contentY + index * pitch - state.appScroll;
            if (entry.heading) {
              text(entry.heading, contentX + 12, y + 14, 9, "#38bdf8", 800);
              text(entry.text, contentX + 12, y + 29, 9, "#d3dfed", 550);
            } else text(entry.text, contentX + 12, y + 20, 9, "#a9b8ca", 500);
          });
        }
        ctx.restore();
        const limit = appScrollLimit(g), trackX = contentX + contentW - 8;
        roundedRect(trackX, contentY, 5, contentH, 3, "rgba(148,163,184,.12)");
        const thumbH = Math.max(28, contentH * contentH / (contentH + limit));
        const thumbY = contentY + (contentH - thumbH) * (limit ? state.appScroll / limit : 0);
        roundedRect(trackX, thumbY, 5, thumbH, 3, "#38bdf8");
        text("Scroll with wheel / drag bar", contentX, g.statusY, 8, "#8292a8", 600);
      }

      function activateLaptopTarget(p) {
        const g = laptopGeometry();
        const f = g.frame;

        // 1. If clicking completely outside the laptop outer frame, close the laptop
        if (p.x < f.x || p.x > f.x + f.w || p.y < f.y || p.y > f.y + f.h) {
          toggleTablet();
          return;
        }

        // 2. Desktop Home Screen: Check icon clicks
        if (state.laptopApp === "home") {
          // Check Market Icon
          if (p.x >= g.homeMarket.x && p.x <= g.homeMarket.x + g.homeMarket.w
              && p.y >= g.homeMarket.y && p.y <= g.homeMarket.y + g.homeMarket.h) {
            state.laptopApp = "market";
            state.appScroll = 0;
            return;
          }
          // Check Crates Icon
          if (p.x >= g.homeCrates.x && p.x <= g.homeCrates.x + g.homeCrates.w
              && p.y >= g.homeCrates.y && p.y <= g.homeCrates.y + g.homeCrates.h) {
            state.laptopApp = "crates";
            state.appScroll = 0;
            return;
          }
          // Check Help Icon
          if (p.x >= g.homeHelp.x && p.x <= g.homeHelp.x + g.homeHelp.w
              && p.y >= g.homeHelp.y && p.y <= g.homeHelp.y + g.homeHelp.h) {
            state.laptopApp = "help";
            state.appScroll = 0;
            return;
          }
          
          // Clicking empty desktop space does nothing (prevents accidental closing)
          return;
        }

        // 3. Window Close Button (Red ×) -> Return to home desktop
        if (p.x >= 814 && p.x <= 839 && p.y >= g.titleY + 5 && p.y <= g.titleY + 32) {
          state.laptopApp = "home";
          state.appScroll = 0;
          return;
        }

        // 4. Inside Lucky Crates app: Click "Crack Open" button
        const v = g.viewport;
        if (state.laptopApp === "crates") {
          const btnX = v.x + v.w / 2 - 110, btnY = v.y + 135;
          if (p.x >= btnX && p.x <= btnX + 220 && p.y >= btnY && p.y <= btnY + 44) {
            openLuckyCrate();
          }
          return;
        }

        // 5. Inside Market app: Buying/Equipping hammers
        if (p.x < v.x || p.x > v.x + v.w - 10 || p.y < v.y || p.y > v.y + v.h) {
          // Clicking outside the app viewport returns to home desktop
          state.laptopApp = "home";
          state.appScroll = 0;
          return;
        }

        if (state.laptopApp !== "market") return;
        
        const index = Math.floor((p.y - v.y + state.appScroll) / g.pitch);
        if (index < 0 || index >= tools.length) return;
        const rowTop = v.y + index * g.pitch - state.appScroll;
        const available = index === state.tool + 1;
        const buttonX = v.x + v.w - 116;
        if (available && p.x >= buttonX && p.x <= buttonX + 100
            && p.y >= rowTop + 13 && p.y <= rowTop + 43) buyOrEquip(index);
        else if (index <= state.tool && p.x >= v.x && p.x <= v.x + v.w - 14
            && p.y <= rowTop + g.cardH) buyOrEquip(index);
      }

      function laptopPointerDown(p, event) {
        if (isOutsideLaptop(p)) { toggleTablet(); return true; }
        const g = laptopGeometry(), v = g.viewport;
        
        if (state.laptopApp === "home") {
          activateLaptopTarget(p);
          return true;
        }
        if (p.x >= 814 && p.x <= 839 && p.y >= g.titleY + 5 && p.y <= g.titleY + 32) {
          activateLaptopTarget(p);
          return true;
        }
        if (p.x >= 756 && p.x <= 812 && p.y >= g.titleY + 5 && p.y <= g.titleY + 32) return true;
        
        if (p.x >= v.x && p.x <= v.x + v.w && p.y >= v.y && p.y <= v.y + v.h) {
          if (state.laptopApp === "crates") {
            activateLaptopTarget(p);
            return true;
          }
          const limit = appScrollLimit(g);
          const thumbH = Math.max(28, v.h * v.h / (v.h + limit));
          state.laptopPointer = {
            id: event.pointerId, x: p.x, y: p.y, scroll: state.appScroll,
            moved: false, bar: p.x >= v.x + v.w - 11,
            thumbH, limit, trackH: v.h
          };
          canvas.setPointerCapture(event.pointerId);
          return true;
        }
        return true;
      }
      function render(time) {
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        const scale = Math.min(canvas.width / dpr / W, canvas.height / dpr / H);
        const offsetX = (canvas.width / dpr - W * scale) / 2, offsetY = (canvas.height / dpr - H * scale) / 2;
        ctx.setTransform(dpr * scale, 0, 0, dpr * scale, dpr * offsetX, dpr * offsetY);
        ctx.fillStyle = "#020617";
        ctx.fillRect(-offsetX / scale, -offsetY / scale, canvas.width / (dpr * scale), canvas.height / (dpr * scale));
        if (state.shake > 0) ctx.translate((Math.random() - .5) * state.shake * 7, (Math.random() - .5) * state.shake * 4);
        drawScene(time);
        if (state.tablet) drawLaptop();
        if (state.fade > 0) {
          ctx.fillStyle = `rgba(2,6,23,${Math.min(state.fade, 1)})`; ctx.fillRect(0, 0, W, H);
          if (state.transition && state.fade >= 1) completeRoom();
        }
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        requestAnimationFrame(render);
      }
      function notify(message, duration = 2300) {
        state.message = message; state.messageUntil = now() + duration;
      }
      function inspectPaper() {
        if (state.room !== 0 || state.inspected) return false;
        if (!nearObject("paper")) { notify("Walk closer to the note, then press E."); return false; }
        state.inspected = true;
        saveProgress();
        notify("The note reads: inspect the case. The hammer opens the vault.");
        return true;
      }
      function openCase() {
        if (!state.inspected || state.caseOpen || state.tool >= 0) return false;
        if (!nearObject("case")) { notify("Walk back to the case, then press E."); return false; }
        state.caseOpen = true; state.tool = 0; state.bought[0] = true;
        saveProgress();
        notify("Starter Hammer acquired. The vault is listening.");
        return true;
      }
      function nearObject(object) {
        const x = object === "paper" ? 770 : 254;
        return Math.abs(state.playerX - x) <= (object === "paper" ? 105 : 95);
      }
      function nearDoor() {
        return Math.abs(state.playerX - state.doorX) <= 130;
      }
      function collectChest() {
        if (!state.chestActive || Math.abs(state.playerX - state.chestX) > 55) return false;
        state.chestActive = false;
        state.coins += 250;
        saveProgress();
        notify("CHEST FOUND  /  +250 NENO COINS", 3000);
        return true;
      }
      function strike() {
        if (state.tablet || state.fade > 0) return;
        if (state.tool < 0) { notify(state.inspected ? "The case is still locked." : "The note might explain this room."); return; }
        if (!nearDoor()) { notify("Walk all the way to the vault before swinging."); return; }
        if (state.strike > 0) return;
        state.sprinting = false;
        state.strike = 1; state.shake = .8; state.doorHp -= multiplier();
        saveProgress();
        if (state.doorHp <= 0) {
          state.doorHp = 0; state.transition = true; state.fade = 0; state.nextRoomAt = now() + 850;
        } else notify(`Vault integrity: ${state.doorHp}/${state.doorMax}.`);
      }
      function completeRoom() {
        if (!state.transition || now() < state.nextRoomAt) return;
        state.transition = false; state.room++;
        keys.clear();
        state.jumpHeight = 0; state.jumpVelocity = 0; state.landing = 0; state.crouched = false; state.sprinting = false;
        state.doorMax = vaultDurability(state.room);
        state.doorHp = state.doorMax;
        const payout = (12 + Math.floor(Math.random() * 10) + state.room * 2) * multiplier();
        state.coins += payout; generateRoom(); state.fade = 1; state.flash = 0;
        saveProgress();
        notify(`ROOM ${roomLabel()} CLEARED  /  +${payout} NENO COINS`, 3000);
      }
      function buyOrEquip(index) {
        if (index <= state.tool) {
          if (index === state.tool) return;
          state.tool = index; saveProgress(); notify(`${tools[index].name} equipped.`); return;
        }
        if (index !== state.tool + 1) { notify("The next tool is the only one available."); return; }
        const item = tools[index];
        if (state.coins < item.cost) {
          notify(`Not enough Neno Coins. ${item.cost - state.coins} more needed.`); return;
        }
        state.coins -= item.cost; state.tool = index; state.bought[index] = true;
        saveProgress();
        notify(`${item.name} ordered and equipped. Efficiency ×${item.power}.`);
      }
      function interact() {
        if (state.tablet || state.fade > 0) return;
        if (state.room === 0 && !state.inspected) { inspectPaper(); return; }
        if (state.inspected && !state.caseOpen && state.tool < 0) { openCase(); return; }
        if (collectChest()) return;
        if (state.tool < 0) notify("Nothing else responds.");
        else if (nearDoor()) notify("Press Enter to hit the vault.");
        else notify("Nothing else responds.");
      }
      function toggleTablet() {
        state.tablet = !state.tablet;
        state.laptopApp = "home";
        state.appScroll = 0;
        state.laptopPointer = null;
        if (state.tablet) notify("");
      }
      function clampAppScroll(geometry) {
        state.appScroll = Math.max(0, Math.min(appScrollLimit(geometry), state.appScroll));
      }
      function activateLaptopTarget(p) {
        const g = laptopGeometry();

        // If on the home desktop screen
        if (state.laptopApp === "home") {
          // If clicking outside the laptop frame entirely, close the laptop
          if (isOutsideLaptop(p)) {
            toggleTablet();
            return;
          }
          // Check Market icon
          if (p.x >= g.homeMarket.x && p.x <= g.homeMarket.x + g.homeMarket.w
              && p.y >= g.homeMarket.y && p.y <= g.homeMarket.y + g.homeMarket.h) {
            state.laptopApp = "market";
            state.appScroll = 0;
            return;
          }
          // Check Crates icon
          if (p.x >= g.homeCrates.x && p.x <= g.homeCrates.x + g.homeCrates.w
              && p.y >= g.homeCrates.y && p.y <= g.homeCrates.y + g.homeCrates.h) {
            state.laptopApp = "crates";
            state.appScroll = 0;
            return;
          }
          // Check Help icon
          if (p.x >= g.homeHelp.x && p.x <= g.homeHelp.x + g.homeHelp.w
              && p.y >= g.homeHelp.y && p.y <= g.homeHelp.y + g.homeHelp.h) {
            state.laptopApp = "help";
            state.appScroll = 0;
            return;
          }
          // Clicking empty desktop space does nothing (keeps laptop open)
          return;
        }

        // If inside an app window, check if clicking outside the laptop frame -> close laptop
        if (isOutsideLaptop(p)) {
          toggleTablet();
          return;
        }

        // Check Window Close Button (×) -> return to home desktop
        if (p.x >= 814 && p.x <= 839 && p.y >= g.titleY + 5 && p.y <= g.titleY + 32) {
          state.laptopApp = "home";
          state.appScroll = 0;
          return;
        }

        // Inside Lucky Crates app: Click "Crack Open" button
        const v = g.viewport;
        if (state.laptopApp === "crates") {
          const btnX = v.x + v.w / 2 - 110, btnY = v.y + 135;
          if (p.x >= btnX && p.x <= btnX + 220 && p.y >= btnY && p.y <= btnY + 44) {
            openLuckyCrate();
          }
          return;
        }

        // Inside Market app: Buying/Equipping hammers
        if (p.x < v.x || p.x > v.x + v.w - 10 || p.y < v.y || p.y > v.y + v.h) {
          state.laptopApp = "home";
          state.appScroll = 0;
          return;
        }

        if (state.laptopApp !== "market") return;
        const index = Math.floor((p.y - v.y + state.appScroll) / g.pitch);
        if (index < 0 || index >= tools.length) return;
        const rowTop = v.y + index * g.pitch - state.appScroll;
        const available = index === state.tool + 1;
        const buttonX = v.x + v.w - 116;
        if (available && p.x >= buttonX && p.x <= buttonX + 100
            && p.y >= rowTop + 13 && p.y <= rowTop + 43) buyOrEquip(index);
        else if (index <= state.tool && p.x >= v.x && p.x <= v.x + v.w - 14
            && p.y <= rowTop + g.cardH) buyOrEquip(index);
      }

      function laptopPointerDown(p, event) {
        // If clicking outside, close laptop/app immediately
        if (isOutsideLaptop(p)) {
          if (state.laptopApp !== "home") {
            state.laptopApp = "home";
          } else {
            toggleTablet();
          }
          return true;
        }

        const g = laptopGeometry(), v = g.viewport;
        
        if (state.laptopApp === "home") {
          activateLaptopTarget(p);
          return true;
        }

        // Title bar close button click check
        if (p.x >= 814 && p.x <= 839 && p.y >= g.titleY + 5 && p.y <= g.titleY + 32) {
          activateLaptopTarget(p);
          return true;
        }
        if (p.x >= 756 && p.x <= 812 && p.y >= g.titleY + 5 && p.y <= g.titleY + 32) return true;
        
        if (p.x >= v.x && p.x <= v.x + v.w && p.y >= v.y && p.y <= v.y + v.h) {
          if (state.laptopApp === "crates") {
            activateLaptopTarget(p);
            return true;
          }
          const limit = appScrollLimit(g);
          const thumbH = Math.max(28, v.h * v.h / (v.h + limit));
          state.laptopPointer = {
            id: event.pointerId, x: p.x, y: p.y, scroll: state.appScroll,
            moved: false, bar: p.x >= v.x + v.w - 11,
            thumbH, limit, trackH: v.h
          };
          canvas.setPointerCapture(event.pointerId);
          return true;
        }
        return true;
      }
      function laptopPointerMove(event) {
        const pointer = state.laptopPointer;
        if (!pointer || pointer.id !== event.pointerId) return;
        const p = pointToWorld(event), dy = p.y - pointer.y;
        if (Math.abs(dy) > 5) pointer.moved = true;
        if (!pointer.moved) return;
        const travel = Math.max(1, pointer.trackH - pointer.thumbH);
        state.appScroll = pointer.scroll + dy * (pointer.bar ? pointer.limit / travel : -1);
        clampAppScroll(laptopGeometry());
      }
      function laptopPointerUp(event) {
        const pointer = state.laptopPointer;
        if (!pointer || pointer.id !== event.pointerId) return;
        const p = pointToWorld(event);
        if (!pointer.moved) activateLaptopTarget(p);
        state.laptopPointer = null;
      }
      function pointToWorld(event) {
        const rect = canvas.getBoundingClientRect(), cssW = rect.width, cssH = rect.height;
        const scale = Math.min(cssW / W, cssH / H);
        return { x: (event.clientX - rect.left - (cssW - W * scale) / 2) / scale,
          y: (event.clientY - rect.top - (cssH - H * scale) / 2) / scale };
      }
      function pointerDown(event) {
        event.preventDefault();
        
        // If the laptop/tablet is open, we want screen-relative coordinates (event.offsetX / offsetY),
        // not world-relative coordinates, because the laptop is fixed on the screen!
        if (state.tablet) {
          const rect = canvas.getBoundingClientRect();
          const scaleX = canvas.width / rect.width;
          const scaleY = canvas.height / rect.height;
          const p = {
            x: (event.clientX - rect.left) * scaleX,
            y: (event.clientY - rect.top) * scaleY
          };
          laptopPointerDown(p, event);
          return;
        }

        const p = pointToWorld(event);
        const worldX = cameraX() + p.x;
        const worldY = cameraY() + p.y;

        if (p.x > 810 && p.y < 78) { toggleTablet(); return; }
        if (state.room === 0 && Math.abs(worldX - 770) < 45 &&
            Math.abs(worldY - (floorAt(770) - 86)) < 55) {
          if (!state.inspected) inspectPaper();
          return;
        }
        if (state.room === 0 && Math.abs(worldX - 254) < 55 &&
            Math.abs(worldY - (floorAt(254) - 67)) < 50 && state.inspected) {
          openCase(); return;
        }
        if (state.chestActive && Math.abs(worldX - state.chestX) < 35) { collectChest(); return; }
        interact();
        if (state.chestActive && Math.abs(worldX - state.chestX) < 35) { collectChest(); return; }
        interact();
      }
      canvas.addEventListener("pointerdown", pointerDown);
      canvas.addEventListener("pointermove", laptopPointerMove);
      canvas.addEventListener("pointerup", event => {
        laptopPointerUp(event); keys.delete("left"); keys.delete("right");
      });
      canvas.addEventListener("pointercancel", event => {
        if (state.laptopPointer && state.laptopPointer.id === event.pointerId) state.laptopPointer = null;
        keys.delete("left"); keys.delete("right");
      });
      canvas.addEventListener("wheel", event => {
        if (!state.tablet || state.laptopApp === "home") return;
        const p = pointToWorld(event), v = laptopGeometry().viewport;
        if (p.x < v.x || p.x > v.x + v.w || p.y < v.y || p.y > v.y + v.h) return;
        event.preventDefault();
        state.appScroll += event.deltaY;
        clampAppScroll(laptopGeometry());
      }, { passive: false });
      window.addEventListener("pagehide", saveProgress);
      document.addEventListener("visibilitychange", () => {
        if (document.visibilityState === "hidden") saveProgress();
      });
      function movePlayer(direction) {
        if (state.tablet || state.fade > 0) return;
        keys.add(direction < 0 ? "left" : "right");
        state.facing = direction;
      }
      window.addEventListener("keydown", event => {
        const key = event.key;
        if ([" ", "ArrowLeft", "ArrowRight", "Tab"].includes(key)) event.preventDefault();
        if (key === "Tab" || key.toLowerCase() === "t") { if (!event.repeat) toggleTablet(); return; }
        if (key === "Escape" && state.tablet) { toggleTablet(); return; }
        if (state.tablet) {
          const n = Number(key);
          if (state.laptopApp === "market" && n >= 1 && n <= tools.length) buyOrEquip(n - 1);
          return;
        }
        if (key === " ") { if (!event.repeat) jump(); return; }
        if (key === "Enter") { if (!event.repeat) strike(); return; }
        if (key === "Shift") { keys.add("sprint"); return; }
        if (key.toLowerCase() === "c") { keys.add("crouch"); return; }
        if (key.toLowerCase() === "e") { if (!event.repeat) interact(); return; }
        if (key === "ArrowLeft" || key.toLowerCase() === "a") { keys.add("left"); state.facing = -1; }
        if (key === "ArrowRight" || key.toLowerCase() === "d") { keys.add("right"); state.facing = 1; }
        if (key === "ArrowUp" || key.toLowerCase() === "w") { if (!event.repeat) interact(); }
      });
      window.addEventListener("keyup", event => {
        keys.delete(event.key); keys.delete(event.key.toLowerCase());
        if (event.key === "Shift") keys.delete("sprint");
        if (event.key.toLowerCase() === "c") keys.delete("crouch");
        if (event.key === "ArrowLeft" || event.key.toLowerCase() === "a") keys.delete("left");
        if (event.key === "ArrowRight" || event.key.toLowerCase() === "d") keys.delete("right");
      });
      window.addEventListener("blur", () => keys.clear());
      let previous = performance.now();
      function update(time) {
        const dt = Math.min((time - previous) / 1000, .05); previous = time;
        const horizontal = (keys.has("right") ? 1 : 0) - (keys.has("left") ? 1 : 0);
        state.crouched = keys.has("crouch") || inVent(state.playerX);
        const sprinting = horizontal && keys.has("sprint") && state.strike <= 0 && !state.crouched
          && state.stamina > 0 && !state.tablet && state.fade <= 0;
        state.sprinting = !!(sprinting && !state.tablet && state.fade <= 0);
        if (sprinting) state.stamina = Math.max(0, state.stamina - 34 * dt);
        else state.stamina = Math.min(100, state.stamina + 22 * dt);
        if (horizontal && state.strike <= 0 && !state.tablet && state.fade <= 0) {
          const speed = state.crouched ? 155 : sprinting ? 420 : 260;
          const nextX = Math.max(35, Math.min(state.layout.length - 35,
            state.playerX + horizontal * speed * dt));
          if (!inVent(nextX) || keys.has("crouch")) state.playerX = nextX;
          else if (!state.message || now() >= state.messageUntil || !state.message.includes("Hold C")) {
            notify("Hold C to crouch and enter the vent.");
          }
          state.facing = horizontal;
        }
        const wasAirborne = state.jumpHeight > 0 || state.jumpVelocity > 0;
        if (wasAirborne) {
          state.jumpHeight = Math.max(0, state.jumpHeight + state.jumpVelocity * dt);
          state.jumpVelocity -= 1450 * dt;
          if (state.jumpHeight === 0) {
            state.jumpVelocity = 0;
            state.landing = .28;
          }
        } else if (state.landing > 0) state.landing = Math.max(0, state.landing - dt);
        if (!state.tablet && state.fade <= 0) collectChest();
        if (horizontal && time - lastSavedAt >= 250) saveProgress();
        if (state.strike > 0) state.strike = Math.max(0, state.strike - dt / .85);
        if (state.shake > 0) state.shake = Math.max(0, state.shake - dt * 2);
        if (state.flash > 0) state.flash = Math.max(0, state.flash - dt * 3);
        if (state.transition && now() >= state.nextRoomAt) state.fade = Math.min(1, state.fade + dt * 1.8);
        else if (state.fade > 0) state.fade = Math.max(0, state.fade - dt * 1.35);
        requestAnimationFrame(update);
      }
      saveProgress();
      requestAnimationFrame(update);
      requestAnimationFrame(render);
    })();