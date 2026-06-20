import React, { useState, useEffect, useRef, useCallback } from "react";

// ---------------------------------------------------------------------------
// DATA
// ---------------------------------------------------------------------------

const DIRECTIONS = [
  { id: "izq", label: "Dobla a la izquierda y avanza una cuadra.", arrow: "⬅", short: "Izquierda" },
  { id: "der", label: "Dobla a la derecha y avanza una cuadra.", arrow: "➡", short: "Derecha" },
  { id: "rec", label: "Continúa recto una cuadra.", arrow: "⬆", short: "Recto" },
];

const CHALLENGES = [
  "Encuentra una bicicleta",
  "Encuentra un perro",
  "Encuentra una puerta roja",
  "Encuentra una casa con número par",
  "Encuentra un árbol grande",
  "Encuentra un mural o grafiti",
  "Encuentra a alguien con gorro",
  "Encuentra un auto amarillo",
  "Encuentra una ventana con flores",
];

const TRIVIA_BANK = [
  { q: "¿Cuál es el animal terrestre más rápido del mundo?", options: ["Guepardo", "León", "Caballo", "Águila"], correct: 0 },
  { q: "¿Cuántos lados tiene un hexágono?", options: ["5", "6", "7", "8"], correct: 1 },
  { q: "¿Cuál es el planeta más grande del sistema solar?", options: ["Marte", "Saturno", "Júpiter", "Neptuno"], correct: 2 },
  { q: "¿En qué país se inventó el origami?", options: ["China", "Japón", "Corea", "Tailandia"], correct: 1 },
  { q: "¿Cuántos huesos tiene el cuerpo humano adulto?", options: ["186", "206", "226", "246"], correct: 1 },
  { q: "¿Cuál es el océano más grande del mundo?", options: ["Atlántico", "Índico", "Ártico", "Pacífico"], correct: 3 },
  { q: "¿Qué gas necesitan las plantas para hacer fotosíntesis?", options: ["Oxígeno", "Nitrógeno", "Dióxido de carbono", "Hidrógeno"], correct: 2 },
  { q: "¿Cuál es el hueso más largo del cuerpo humano?", options: ["Fémur", "Húmero", "Tibia", "Radio"], correct: 0 },
  { q: "¿Cuántos corazones tiene un pulpo?", options: ["1", "2", "3", "4"], correct: 2 },
  { q: "¿Cuál es la capital de Japón?", options: ["Seúl", "Pekín", "Tokio", "Bangkok"], correct: 2 },
  { q: "¿Qué instrumento mide la temperatura?", options: ["Barómetro", "Termómetro", "Altímetro", "Sismógrafo"], correct: 1 },
  { q: "¿Cuál es el animal más grande del mundo?", options: ["Elefante africano", "Ballena azul", "Tiburón ballena", "Jirafa"], correct: 1 },
  { q: "¿Cuántas patas tiene una araña?", options: ["6", "8", "10", "12"], correct: 1 },
  { q: "¿Cuál es el metal líquido a temperatura ambiente?", options: ["Hierro", "Plomo", "Mercurio", "Aluminio"], correct: 2 },
  { q: "¿En qué continente está Egipto?", options: ["Asia", "África", "Europa", "Oceanía"], correct: 1 },
  { q: "¿Cuál es el río más largo del mundo?", options: ["Nilo", "Amazonas", "Yangtsé", "Misisipi"], correct: 1 },
  { q: "¿Cuántos jugadores tiene un equipo de fútbol en cancha?", options: ["9", "10", "11", "12"], correct: 2 },
  { q: "¿Qué órgano bombea la sangre por el cuerpo?", options: ["Pulmón", "Hígado", "Corazón", "Riñón"], correct: 2 },
  { q: "¿Cuál es la montaña más alta del mundo?", options: ["K2", "Everest", "Aconcagua", "Kilimanjaro"], correct: 1 },
  { q: "¿Cuántos colores tiene el arcoíris?", options: ["5", "6", "7", "8"], correct: 2 },
];

function generateMathChallenge() {
  const ops = ["+", "-", "x"];
  const op = pick(ops);
  let a, b, answer;
  if (op === "+") {
    a = Math.floor(Math.random() * 80) + 10;
    b = Math.floor(Math.random() * 80) + 10;
    answer = a + b;
  } else if (op === "-") {
    a = Math.floor(Math.random() * 80) + 20;
    b = Math.floor(Math.random() * a);
    answer = a - b;
  } else {
    a = Math.floor(Math.random() * 11) + 2;
    b = Math.floor(Math.random() * 11) + 2;
    answer = a * b;
  }
  const wrongOffsets = new Set();
  while (wrongOffsets.size < 3) {
    const offset = (Math.floor(Math.random() * 9) + 1) * (Math.random() < 0.5 ? -1 : 1);
    if (offset !== 0 && answer + offset >= 0) wrongOffsets.add(offset);
  }
  const choices = [answer, ...[...wrongOffsets].map((o) => answer + o)];
  for (let i = choices.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [choices[i], choices[j]] = [choices[j], choices[i]];
  }
  return {
    q: `¿Cuánto es ${a} ${op} ${b}?`,
    options: choices.map(String),
    correct: choices.indexOf(answer),
  };
}

function generateWitChallenge() {
  return Math.random() < 0.5
    ? { kind: "trivia", ...pick(TRIVIA_BANK) }
    : { kind: "math", ...generateMathChallenge() };
}

const TREASURES = [
  { label: "Bicicleta", icon: "🚲" },
  { label: "Perro", icon: "🐕" },
  { label: "Árbol", icon: "🌳" },
  { label: "Auto rojo", icon: "🚗" },
  { label: "Grafiti", icon: "🎨" },
  { label: "Puerta azul", icon: "🚪" },
];

const POSITIVE_CARDS = [
  { id: "atajo", icon: "🍀", title: "Atajo", desc: "Elige libremente la próxima dirección.", kind: "positive" },
  { id: "segunda", icon: "🍀", title: "Segunda Oportunidad", desc: "Lanza dos veces y escoge el resultado.", kind: "positive" },
  { id: "brujula", icon: "🍀", title: "Brújula Mágica", desc: "Ignora el siguiente lanzamiento.", kind: "positive" },
  { id: "salto", icon: "🍀", title: "Salto de Cuadra", desc: "Avanza dos cuadras, cuenta solo un movimiento.", kind: "positive" },
  { id: "monedas", icon: "🍀", title: "Monedas Extra", desc: "Recibes monedas adicionales.", kind: "positive", coins: 3 },
];

const NEUTRAL_CARDS = [
  { id: "niebla", icon: "🎭", title: "Niebla", desc: "No produce efectos.", kind: "neutral" },
  { id: "ruta", icon: "🎭", title: "Ruta Misteriosa", desc: "No modifica el recorrido.", kind: "neutral" },
  { id: "descanso", icon: "🎭", title: "Descanso", desc: "Recibes una moneda adicional.", kind: "neutral", coins: 1 },
];

const CHALLENGING_CARDS = [
  { id: "viento", icon: "🌪", title: "Viento Travieso", desc: "El próximo lanzamiento se cumple obligatoriamente.", kind: "challenging" },
  { id: "desvio", icon: "🌪", title: "Desvío", desc: "Debes avanzar una cuadra adicional.", kind: "challenging" },
  { id: "impuesto", icon: "🌪", title: "Impuesto de Aventurero", desc: "Pierdes monedas acumuladas.", kind: "challenging", coins: -2 },
  { id: "caprichoso", icon: "🌪", title: "Destino Caprichoso", desc: "Repite el lanzamiento y acepta el segundo resultado.", kind: "challenging" },
  { id: "trampa", icon: "🧩", title: "Trampa del Camino", desc: "Responde rápido o retrocedes un movimiento.", kind: "challenging", triggersWit: true },
];

const ALL_CARDS = [...POSITIVE_CARDS, ...NEUTRAL_CARDS, ...CHALLENGING_CARDS];

const SHOP_ITEMS = [
  {
    id: "repetir",
    title: "Reintento",
    desc: "Vuelve a lanzar el dado.",
    cost: 3,
    rarity: "common",
    icon: "🔁",
  },
  {
    id: "elegir",
    title: "Voluntad de Hierro",
    desc: "Escoge tu próxima dirección libremente.",
    cost: 4,
    rarity: "common",
    icon: "🧭",
  },
  {
    id: "cancelar",
    title: "Barrera Espiritual",
    desc: "Anula la próxima carta desafiante.",
    cost: 3,
    rarity: "rare",
    icon: "🛡",
  },
  {
    id: "detector",
    title: "Ojo del Cazador",
    desc: "Revela una pista sobre dónde buscar el Tesoro del Día.",
    cost: 4,
    rarity: "rare",
    icon: "👁",
  },
  {
    id: "dado_ninja",
    title: "Dado del Shinobi",
    desc: "Cambia la apariencia de tu dado por el resto de la partida.",
    cost: 6,
    rarity: "epic",
    icon: "🥷",
    cosmeticSkin: "ninja",
  },
  {
    id: "dado_dragon",
    title: "Dado del Dragón",
    desc: "Skin legendaria para tu dado del destino.",
    cost: 10,
    rarity: "legendary",
    icon: "🐉",
    cosmeticSkin: "dragon",
  },
  {
    id: "doble_nada",
    title: "Doble o Nada",
    desc: "Apuesta la mitad de tus monedas: 50% de duplicarlas, 50% de perderlas.",
    cost: 0,
    rarity: "epic",
    icon: "🎰",
    minCoins: 4,
  },
  {
    id: "mapa_clan",
    title: "Pergamino del Clan",
    desc: "Eliges tú el próximo desafío de observación.",
    cost: 5,
    rarity: "rare",
    icon: "📜",
  },
  {
    id: "cofre",
    title: "Cofre Misterioso",
    desc: "Pagas monedas y revelas una carta de destino al azar al instante.",
    cost: 4,
    rarity: "epic",
    icon: "🎴",
  },
  {
    id: "escudo_combo",
    title: "Escudo del Guerrero",
    desc: "Tu próximo desafío fallido no corta tu racha de combo.",
    cost: 5,
    rarity: "rare",
    icon: "⚔",
  },
];

const RARITY_LABEL = {
  common: "Común",
  rare: "Raro",
  epic: "Épico",
  legendary: "Legendario",
};

const DICE_SKINS = {
  default: { icon: "🎲", bg: "var(--orange)" },
  ninja: { icon: "🥷", bg: "#2B2B3D" },
  dragon: { icon: "🐉", bg: "#7A1F1F" },
};

const CONFIG = {
  minMoves: 10,
  challengeEvery: 3,
  witEvery: 4,
  cardChance: 0.25,
  challengeReward: 2,
  treasureReward: 5,
};

const STORAGE_KEY = "bajon:partida";

// ---------------------------------------------------------------------------
// SOUND ENGINE (Web Audio API, no external assets — arcade/8-bit style)
// ---------------------------------------------------------------------------

let _audioCtx = null;
function getAudioCtx() {
  if (!_audioCtx) {
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      _audioCtx = new AC();
    } catch (e) {
      return null;
    }
  }
  if (_audioCtx.state === "suspended") {
    _audioCtx.resume().catch(() => {});
  }
  return _audioCtx;
}

function playTone(freq, duration, type = "square", startGain = 0.12, delay = 0) {
  const ctx = getAudioCtx();
  if (!ctx) return;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, ctx.currentTime + delay);
  gain.gain.setValueAtTime(startGain, ctx.currentTime + delay);
  gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + delay + duration);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(ctx.currentTime + delay);
  osc.stop(ctx.currentTime + delay + duration);
}

function playSlide(fromFreq, toFreq, duration, type = "square", startGain = 0.1) {
  const ctx = getAudioCtx();
  if (!ctx) return;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(fromFreq, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(toFreq, ctx.currentTime + duration);
  gain.gain.setValueAtTime(startGain, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start();
  osc.stop(ctx.currentTime + duration);
}

const SFX = {
  rollTick: () => playTone(330, 0.04, "square", 0.05),
  rollLand: () => playSlide(180, 440, 0.18, "square", 0.13),
  coinGain: () => {
    playTone(988, 0.09, "square", 0.1);
    playTone(1318, 0.12, "square", 0.1, 0.07);
  },
  coinLose: () => playSlide(440, 220, 0.22, "sawtooth", 0.08),
  cardPositive: () => {
    playTone(523, 0.08, "triangle", 0.1);
    playTone(659, 0.08, "triangle", 0.1, 0.08);
    playTone(784, 0.14, "triangle", 0.1, 0.16);
  },
  cardChallenging: () => {
    playTone(220, 0.12, "sawtooth", 0.1);
    playTone(174, 0.18, "sawtooth", 0.1, 0.1);
  },
  cardNeutral: () => playTone(440, 0.1, "sine", 0.08),
  challengeWin: () => {
    playTone(659, 0.07, "square", 0.1);
    playTone(880, 0.07, "square", 0.1, 0.06);
    playTone(1046, 0.14, "square", 0.1, 0.12);
  },
  challengeMiss: () => playTone(196, 0.16, "triangle", 0.07),
  treasure: () => {
    playTone(523, 0.1, "square", 0.12);
    playTone(659, 0.1, "square", 0.12, 0.09);
    playTone(784, 0.1, "square", 0.12, 0.18);
    playTone(1046, 0.22, "square", 0.12, 0.27);
  },
  shopBuy: () => playSlide(300, 600, 0.12, "square", 0.1),
  shopDeny: () => playTone(150, 0.12, "sawtooth", 0.08),
  witCorrect: () => {
    playTone(740, 0.07, "square", 0.1);
    playTone(988, 0.07, "square", 0.1, 0.07);
    playTone(1318, 0.16, "square", 0.1, 0.14);
  },
  witWrong: () => playSlide(300, 120, 0.3, "sawtooth", 0.1),
  setback: () => {
    playTone(220, 0.1, "sawtooth", 0.09);
    playTone(174, 0.16, "sawtooth", 0.09, 0.1);
  },
  finish: () => {
    playTone(392, 0.1, "triangle", 0.1);
    playTone(523, 0.1, "triangle", 0.1, 0.1);
    playTone(659, 0.1, "triangle", 0.1, 0.2);
    playTone(784, 0.28, "triangle", 0.12, 0.3);
  },
  uiTap: () => playTone(700, 0.03, "square", 0.04),
};

// ---------------------------------------------------------------------------
// HELPERS
// ---------------------------------------------------------------------------

const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

function freshGame() {
  return {
    started: true,
    moves: 0,
    coins: 0,
    treasure: pick(TREASURES),
    treasureFound: false,
    treasureHint: null,
    history: [],
    currentDirection: null,
    pendingCard: null,
    activeChallenge: null,
    activeWit: null,
    cancelNextChallenging: false,
    skipNextRoll: false,
    forcedNextChallenge: null,
    diceSkin: "default",
    combo: 0,
    comboShield: false,
    finished: false,
    log: [],
  };
}

// ---------------------------------------------------------------------------
// SMALL UI PRIMITIVES
// ---------------------------------------------------------------------------

function Ticket({ children, className = "" }) {
  return (
    <div className={`ticket ${className}`}>
      <div className="ticket-notch ticket-notch-left" />
      <div className="ticket-notch ticket-notch-right" />
      {children}
    </div>
  );
}

function CoinPill({ coins, pulse }) {
  return (
    <div className={`coin-pill ${pulse ? "coin-pulse" : ""}`}>
      <span className="coin-icon">●</span>
      <span className="coin-count">{coins}</span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// MAIN APP
// ---------------------------------------------------------------------------

export default function App() {
  const [game, setGame] = useState(null);
  const [loaded, setLoaded] = useState(false);
  const [rolling, setRolling] = useState(false);
  const [rollFace, setRollFace] = useState(null);
  const [coinPulse, setCoinPulse] = useState(false);
  const [cardVisible, setCardVisible] = useState(false);
  const [toast, setToast] = useState(null);
  const [shopOpen, setShopOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const toastTimer = useRef(null);

  // Load saved game on mount
  useEffect(() => {
    let saved = null;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) saved = JSON.parse(raw);
    } catch (e) {
      saved = null;
    }
    if (saved && saved.started) {
      setGame(saved);
    }
    setLoaded(true);
  }, []);

  // Persist on change
  useEffect(() => {
    if (!loaded) return;
    try {
      if (game) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(game));
      }
    } catch (e) {
      // ignore storage errors silently, game still works in-memory
    }
  }, [game, loaded]);

  const showToast = useCallback((text) => {
    setToast(text);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 2600);
  }, []);

  const startGame = () => {
    setGame(freshGame());
  };

  const restartGame = () => {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (e) {}
    setGame(null);
    setShopOpen(false);
    setHistoryOpen(false);
  };

  const addCoins = (n) => {
    setGame((g) => ({ ...g, coins: Math.max(0, g.coins + n) }));
    if (n > 0) {
      setCoinPulse(true);
      setTimeout(() => setCoinPulse(false), 500);
    }
  };

  const logEntry = (entry) => {
    setGame((g) => ({ ...g, log: [...g.log, entry] }));
  };

  const maybeSpawnChallenge = (moveCount) => {
    if (moveCount > 0 && moveCount % CONFIG.challengeEvery === 0) {
      setGame((g) => {
        const challenge = g.forcedNextChallenge || pick(CHALLENGES);
        return { ...g, activeChallenge: challenge, forcedNextChallenge: null };
      });
      return true;
    }
    return false;
  };

  const maybeSpawnWit = (moveCount, skipBecauseChallenge) => {
    if (skipBecauseChallenge) return;
    if (moveCount > 0 && moveCount % CONFIG.witEvery === 0) {
      setGame((g) => ({ ...g, activeWit: generateWitChallenge() }));
    }
  };

  const maybeSpawnCard = () => {
    if (Math.random() < CONFIG.cardChance) {
      let card = pick(ALL_CARDS);
      setGame((g) => {
        if (card.kind === "challenging" && g.cancelNextChallenging) {
          showToast("Carta desafiante anulada con tu ventaja 🛡");
          return { ...g, cancelNextChallenging: false };
        }
        return { ...g, pendingCard: card };
      });
      setTimeout(() => {
        setCardVisible(true);
        if (card.kind === "positive") SFX.cardPositive();
        else if (card.kind === "challenging") SFX.cardChallenging();
        else SFX.cardNeutral();
      }, 50);
    }
  };

  const performRoll = (forcedDir) => {
    if (!game || game.activeChallenge || game.pendingCard || game.activeWit) return;
    if (game.skipNextRoll) {
      setGame((g) => ({ ...g, skipNextRoll: false }));
      showToast("Brújula Mágica: lanzamiento ignorado ✨");
      return;
    }
    setRolling(true);
    let ticks = 0;
    const interval = setInterval(() => {
      setRollFace(pick(DIRECTIONS));
      SFX.rollTick();
      ticks++;
      if (ticks > 8) {
        clearInterval(interval);
        const result = forcedDir || pick(DIRECTIONS);
        setRollFace(result);
        setRolling(false);
        SFX.rollLand();
        applyMove(result);
      }
    }, 70);
  };

  const applyMove = (direction, extraMoves = 0) => {
    let resultMoves = 0;
    setGame((g) => {
      const newMoves = g.moves + 1;
      resultMoves = newMoves;
      const newHistory = [
        ...g.history,
        { n: newMoves, type: "move", direction: direction.short },
      ];
      return {
        ...g,
        moves: newMoves,
        currentDirection: direction,
        history: newHistory,
      };
    });
    setTimeout(() => {
      const spawnedChallenge = maybeSpawnChallenge(resultMoves);
      maybeSpawnWit(resultMoves, spawnedChallenge);
      maybeSpawnCard();
    }, 250);
  };

  const completeChallenge = (found) => {
    let resultCombo = 0;
    let resultBonus = 0;
    setGame((g) => {
      const usedShield = !found && g.comboShield;
      const newCombo = found ? g.combo + 1 : usedShield ? g.combo : 0;
      const comboBonus = found && newCombo > 0 && newCombo % 3 === 0 ? 2 : 0;
      const totalCoins = found ? CONFIG.challengeReward + comboBonus : 0;
      resultCombo = newCombo;
      resultBonus = comboBonus;
      const entry = {
        n: g.moves,
        type: "challenge",
        text: g.activeChallenge,
        found,
        coins: totalCoins,
        combo: comboBonus > 0 ? newCombo : null,
      };
      return {
        ...g,
        activeChallenge: null,
        history: [...g.history, entry],
        coins: found ? g.coins + totalCoins : g.coins,
        combo: newCombo,
        comboShield: usedShield ? false : g.comboShield,
      };
    });
    if (found) {
      setCoinPulse(true);
      setTimeout(() => setCoinPulse(false), 500);
      SFX.challengeWin();
      if (resultBonus > 0) {
        showToast(`¡Combo x${resultCombo}! +${CONFIG.challengeReward + resultBonus} monedas 🔥`);
      } else {
        showToast(`+${CONFIG.challengeReward} monedas 🪙`);
      }
    } else {
      SFX.challengeMiss();
    }
  };

  const resolveWit = (chosenIndex) => {
    if (!game || !game.activeWit) return;
    const correct = chosenIndex === game.activeWit.correct;
    const usedShield = !correct && game.comboShield;
    const newMoves = correct ? game.moves : usedShield ? game.moves : Math.max(0, game.moves - 1);
    const newCombo = correct ? game.combo : usedShield ? game.combo : 0;
    const witKind = game.activeWit.kind;
    const witQuestion = game.activeWit.q;

    setGame((g) => {
      const entry = {
        n: newMoves,
        type: "wit",
        kind: witKind,
        text: witQuestion,
        found: correct,
        setback: !correct && !usedShield,
      };
      return {
        ...g,
        activeWit: null,
        moves: newMoves,
        combo: newCombo,
        comboShield: usedShield ? false : g.comboShield,
        history: [...g.history, entry],
      };
    });

    if (correct) {
      SFX.witCorrect();
      showToast("¡Correcto! Sigues firme en el camino 🧠");
    } else if (usedShield) {
      SFX.cardChallenging();
      showToast("Tu escudo absorbió el tropiezo ⚔");
    } else {
      SFX.witWrong();
      setTimeout(() => SFX.setback(), 200);
      showToast(`Respuesta incorrecta — retrocedes a ${newMoves} de ${CONFIG.minMoves} 📉`);
    }
  };

  const resolveCard = (card) => {
    setCardVisible(false);
    setTimeout(() => {
      setGame((g) => {
        let updates = { pendingCard: null };
        let coinDelta = 0;
        if (typeof card.coins === "number") coinDelta = card.coins;

        if (card.id === "brujula") updates.skipNextRoll = true;
        if (card.id === "cancelar") updates.cancelNextChallenging = true;
        if (card.triggersWit) updates.activeWit = generateWitChallenge();

        const entry = {
          n: g.moves,
          type: "card",
          title: card.title,
          cardKind: card.kind,
          coins: coinDelta,
        };

        return {
          ...g,
          ...updates,
          coins: Math.max(0, g.coins + coinDelta),
          history: [...g.history, entry],
        };
      });
      if (typeof card.coins === "number" && card.coins !== 0) {
        setCoinPulse(true);
        setTimeout(() => setCoinPulse(false), 500);
        if (card.coins > 0) SFX.coinGain();
        else SFX.coinLose();
      }
      if (card.id === "atajo") {
        showToast("Elige tu próxima dirección libremente 🍀");
      } else if (card.id === "salto") {
        showToast("Próximo avance cuenta doble cuadra 🍀");
      } else if (card.id === "desvio") {
        showToast("Debes avanzar una cuadra adicional 🌪");
      } else if (card.triggersWit) {
        SFX.cardChallenging();
      }
    }, 280);
  };

  const checkTreasure = (found) => {
    if (!game || game.treasureFound) return;
    setGame((g) => ({
      ...g,
      treasureFound: true,
      coins: found ? g.coins + CONFIG.treasureReward : g.coins,
      history: [
        ...g.history,
        { n: g.moves, type: "treasure", text: g.treasure.label, found, coins: found ? CONFIG.treasureReward : 0 },
      ],
    }));
    if (found) {
      setCoinPulse(true);
      setTimeout(() => setCoinPulse(false), 500);
      SFX.treasure();
      showToast(`¡Tesoro encontrado! +${CONFIG.treasureReward} monedas 🏆`);
    }
  };

  const treasureHintFor = (treasure) => {
    const hints = {
      Bicicleta: "Suele estar apoyada cerca de una puerta o reja.",
      Perro: "Anda paseando, no muy lejos de un parque.",
      Árbol: "Busca el más alto de la cuadra.",
      "Auto rojo": "Podría estar estacionado frente a una casa.",
      Grafiti: "Revisa los muros cerca de una esquina.",
      "Puerta azul": "Está en una fachada que ya pasaste o pasarás pronto.",
    };
    return hints[treasure.label] || "Sigue explorando con atención.";
  };

  const useShopItem = (item) => {
    if (!game) return;
    const effectiveCost = item.id === "doble_nada" ? 0 : item.cost;
    if (game.coins < effectiveCost) {
      SFX.shopDeny();
      return;
    }
    if (item.id === "doble_nada" && game.coins < (item.minCoins || 1)) {
      SFX.shopDeny();
      showToast("Necesitas más monedas para apostar 🎰");
      return;
    }

    SFX.shopBuy();

    if (item.id === "doble_nada") {
      const win = Math.random() < 0.5;
      setGame((g) => {
        const stake = Math.ceil(g.coins / 2);
        const newCoins = win ? g.coins + stake : g.coins - stake;
        const entry = {
          n: g.moves,
          type: "shop",
          title: win ? "Doble o Nada (ganaste)" : "Doble o Nada (perdiste)",
          coins: win ? stake : -stake,
        };
        return { ...g, coins: Math.max(0, newCoins), history: [...g.history, entry] };
      });
      setTimeout(() => {
        showToast(win ? "¡Duplicaste tu apuesta! 🎰" : "Perdiste la apuesta… 🎰");
        if (win) SFX.coinGain();
        else SFX.coinLose();
      }, 50);
      setShopOpen(false);
      return;
    }

    setGame((g) => {
      let updates = { coins: g.coins - item.cost };
      if (item.id === "cancelar") updates.cancelNextChallenging = true;
      if (item.id === "escudo_combo") updates.comboShield = true;
      if (item.id === "dado_ninja") updates.diceSkin = "ninja";
      if (item.id === "dado_dragon") updates.diceSkin = "dragon";
      if (item.id === "detector") updates.treasureHint = treasureHintFor(g.treasure);
      if (item.id === "mapa_clan") updates.forcedNextChallenge = pick(CHALLENGES);
      const entry = { n: g.moves, type: "shop", title: item.title, coins: -item.cost };
      return { ...g, ...updates, history: [...g.history, entry] };
    });
    setShopOpen(false);

    if (item.id === "repetir") {
      setTimeout(() => performRoll(), 200);
      showToast("Reintento listo 🔁");
    } else if (item.id === "elegir") {
      showToast("Elige libremente tu próxima dirección 🧭");
    } else if (item.id === "cancelar") {
      showToast("Próxima carta desafiante será anulada 🛡");
    } else if (item.id === "detector") {
      showToast("Pista revelada — revisa el Tesoro del Día 👁");
    } else if (item.id === "dado_ninja" || item.id === "dado_dragon") {
      showToast(`¡Skin equipada: ${item.title}! ${item.icon}`);
    } else if (item.id === "mapa_clan") {
      showToast("Elegiste tu próximo desafío 📜");
    } else if (item.id === "escudo_combo") {
      showToast("Tu próxima racha está protegida ⚔");
    } else if (item.id === "cofre") {
      const card = pick(ALL_CARDS);
      setTimeout(() => {
        setGame((g) => ({ ...g, pendingCard: card }));
        setCardVisible(true);
        if (card.kind === "positive") SFX.cardPositive();
        else if (card.kind === "challenging") SFX.cardChallenging();
        else SFX.cardNeutral();
      }, 250);
    }
  };

  const finishAdventure = () => {
    SFX.finish();
    setGame((g) => ({ ...g, finished: true }));
  };

  if (!loaded) {
    return (
      <div className="screen center">
        <div className="loader-stamp">Encontrando el Bajón</div>
      </div>
    );
  }

  if (!game || !game.started) {
    return <IntroScreen onStart={startGame} />;
  }

  if (game.finished) {
    return <EndScreen game={game} onRestart={restartGame} />;
  }

  const canFinish = game.moves >= CONFIG.minMoves;

  return (
    <div className="screen">
      <style>{STYLES}</style>
      <header className="topbar">
        <div className="topbar-title">EL BAJÓN</div>
        <div className="topbar-actions">
          <button className="icon-btn" onClick={() => { SFX.uiTap(); setHistoryOpen(true); }} aria-label="Ver historial">
            📜
          </button>
          <button
            className="icon-btn"
            disabled={!!game.activeChallenge || !!game.activeWit}
            onClick={() => { SFX.uiTap(); setShopOpen(true); }}
            aria-label="Abrir tienda"
          >
            🏪
          </button>
        </div>
      </header>

      <div className="status-row">
        <div className="moves-badge">
          Movimiento <strong>{Math.min(game.moves, 99)}</strong>
          <span className="moves-of"> de {CONFIG.minMoves}</span>
        </div>
        <CoinPill coins={game.coins} pulse={coinPulse} />
      </div>

      <div className="moves-track">
        <div
          className="moves-track-fill"
          style={{ width: `${Math.min(100, (game.moves / CONFIG.minMoves) * 100)}%` }}
        />
      </div>

      <Ticket className="treasure-ticket">
        <div className="treasure-row">
          <span className="treasure-icon">{game.treasure.icon}</span>
          <div className="treasure-text">
            <div className="treasure-label">Tesoro del Día</div>
            <div className="treasure-name">
              {game.treasure.label}
              {game.treasureFound && <span className="treasure-found"> · ¡Encontrado!</span>}
            </div>
            {game.treasureHint && !game.treasureFound && (
              <div className="treasure-hint">👁 {game.treasureHint}</div>
            )}
          </div>
          {!game.treasureFound && (
            <button
              className="treasure-btn"
              onClick={() => {
                SFX.uiTap();
                checkTreasure(true);
              }}
            >
              Lo vi
            </button>
          )}
        </div>
      </Ticket>

      {game.combo > 0 && (
        <div className="combo-badge">🔥 Combo x{game.combo}</div>
      )}

      <div className="stamp-zone">
        <div
          className={`stamp ${rolling ? "stamp-rolling" : ""} ${game.currentDirection && !rolling ? "stamp-landed" : ""}`}
          style={{ background: DICE_SKINS[game.diceSkin || "default"].bg }}
        >
          <div className="stamp-arrow">
            {rollFace ? rollFace.arrow : DICE_SKINS[game.diceSkin || "default"].icon}
          </div>
        </div>
        <p className="stamp-caption">
          {rolling
            ? "Girando el destino…"
            : game.currentDirection
            ? game.currentDirection.label
            : "Presiona el dado para comenzar a caminar."}
        </p>

        {!game.activeChallenge && !game.pendingCard && !game.activeWit && (
          <button
            className="roll-btn"
            disabled={rolling}
            onClick={() => performRoll()}
          >
            {rolling ? "…" : "Lanzar dado"}
          </button>
        )}

        {canFinish && !game.activeChallenge && !game.pendingCard && !game.activeWit && !rolling && (
          <div className="finish-row">
            <p className="finish-callout">¡Ya puedes encontrar el bajón!</p>
            <div className="finish-buttons">
              <button className="secondary-btn" onClick={() => SFX.uiTap()}>
                Seguir explorando
              </button>
              <button className="primary-btn" onClick={finishAdventure}>
                Terminar aventura
              </button>
            </div>
          </div>
        )}
      </div>

      {game.activeChallenge && (
        <div className="overlay">
          <Ticket className="challenge-ticket pop-in">
            <div className="challenge-eyebrow">Desafío de observación</div>
            <div className="challenge-text">{game.activeChallenge}</div>
            <div className="challenge-buttons">
              <button className="secondary-btn" onClick={() => completeChallenge(false)}>
                No lo encontramos
              </button>
              <button className="primary-btn" onClick={() => completeChallenge(true)}>
                Lo encontramos
              </button>
            </div>
          </Ticket>
        </div>
      )}

      {game.activeWit && (
        <div className="overlay">
          <Ticket className="wit-ticket pop-in">
            <div className="challenge-eyebrow">
              {game.activeWit.kind === "math" ? "🧮 Desafío matemático" : "🧠 Trivia del camino"}
            </div>
            <div className="wit-question">{game.activeWit.q}</div>
            <div className="wit-options">
              {game.activeWit.options.map((opt, i) => (
                <button key={i} className="wit-option-btn" onClick={() => resolveWit(i)}>
                  {opt}
                </button>
              ))}
            </div>
            <div className="wit-warning">Si fallas, retrocedes un movimiento.</div>
          </Ticket>
        </div>
      )}

      {game.pendingCard && (
        <div className="overlay">
          <div className={`card-ticket card-${game.pendingCard.kind} ${cardVisible ? "card-in" : "card-out"}`}>
            <div className="card-icon">{game.pendingCard.icon}</div>
            <div className="card-kind">{kindLabel(game.pendingCard.kind)}</div>
            <div className="card-title">{game.pendingCard.title}</div>
            <div className="card-desc">{game.pendingCard.desc}</div>
            <button className="card-btn" onClick={() => { SFX.uiTap(); resolveCard(game.pendingCard); }}>
              Continuar
            </button>
          </div>
        </div>
      )}

      {shopOpen && (
        <div className="overlay" onClick={() => setShopOpen(false)}>
          <Ticket className="shop-ticket pop-in" >
            <div onClick={(e) => e.stopPropagation()}>
              <div className="shop-header">
                <div>
                  <div className="challenge-eyebrow">Tienda del Cazador</div>
                  <div className="shop-subtitle">Equipa ventajas para tu aventura</div>
                </div>
                <CoinPill coins={game.coins} pulse={false} />
              </div>
              <div className="shop-list">
                {SHOP_ITEMS.map((item) => {
                  const isDoubleOrNothing = item.id === "doble_nada";
                  const owned =
                    (item.id === "dado_ninja" && game.diceSkin === "ninja") ||
                    (item.id === "dado_dragon" && game.diceSkin === "dragon");
                  const canAfford = isDoubleOrNothing
                    ? game.coins >= (item.minCoins || 1)
                    : game.coins >= item.cost;
                  return (
                    <div className={`shop-item rarity-${item.rarity}`} key={item.id}>
                      <div className="shop-item-icon">{item.icon}</div>
                      <div className="shop-item-body">
                        <div className="shop-item-top">
                          <span className="shop-item-title">{item.title}</span>
                          <span className={`rarity-badge rarity-badge-${item.rarity}`}>
                            {RARITY_LABEL[item.rarity]}
                          </span>
                        </div>
                        <div className="shop-item-desc">{item.desc}</div>
                      </div>
                      <button
                        className="shop-buy-btn"
                        disabled={!canAfford || owned}
                        onClick={() => useShopItem(item)}
                      >
                        {owned ? "Equipado" : isDoubleOrNothing ? "Apostar" : `${item.cost} ●`}
                      </button>
                    </div>
                  );
                })}
              </div>
              <button className="secondary-btn shop-close" onClick={() => setShopOpen(false)}>
                Cerrar
              </button>
            </div>
          </Ticket>
        </div>
      )}

      {historyOpen && (
        <div className="overlay" onClick={() => setHistoryOpen(false)}>
          <Ticket className="history-ticket pop-in">
            <div onClick={(e) => e.stopPropagation()}>
              <div className="challenge-eyebrow">Historial de ruta</div>
              <div className="history-list">
                {game.history.length === 0 && (
                  <p className="history-empty">Aún no hay movimientos registrados.</p>
                )}
                {game.history.slice().reverse().map((h, i) => (
                  <HistoryRow key={i} entry={h} />
                ))}
              </div>
              <button className="secondary-btn shop-close" onClick={() => setHistoryOpen(false)}>
                Cerrar
              </button>
            </div>
          </Ticket>
        </div>
      )}

      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}

function kindLabel(kind) {
  if (kind === "positive") return "Carta positiva";
  if (kind === "neutral") return "Carta neutra";
  return "Carta desafiante";
}

function HistoryRow({ entry }) {
  if (entry.type === "move") {
    return (
      <div className="history-row">
        <span className="history-n">#{entry.n}</span>
        <span className="history-text">{entry.direction}</span>
      </div>
    );
  }
  if (entry.type === "challenge") {
    return (
      <div className="history-row">
        <span className="history-n">#{entry.n}</span>
        <span className="history-text">
          Desafío: {entry.text}{" "}
          {entry.found
            ? `(+${entry.coins} 🪙${entry.combo ? ` · Combo x${entry.combo} 🔥` : ""})`
            : "(no encontrado)"}
        </span>
      </div>
    );
  }
  if (entry.type === "wit") {
    return (
      <div className={`history-row ${entry.setback ? "history-row-setback" : ""}`}>
        <span className="history-n">#{entry.n}</span>
        <span className="history-text">
          {entry.kind === "math" ? "Matemáticas" : "Trivia"}:{" "}
          {entry.found ? "¡correcto! 🧠" : entry.setback ? "incorrecto — retrocede 1 movimiento 📉" : "incorrecto (escudo absorbió el golpe ⚔)"}
        </span>
      </div>
    );
  }
  if (entry.type === "card") {
    return (
      <div className="history-row">
        <span className="history-n">#{entry.n}</span>
        <span className="history-text">
          Carta: {entry.title} {entry.coins ? `(${entry.coins > 0 ? "+" : ""}${entry.coins} 🪙)` : ""}
        </span>
      </div>
    );
  }
  if (entry.type === "treasure") {
    return (
      <div className="history-row">
        <span className="history-n">#{entry.n}</span>
        <span className="history-text">
          Tesoro {entry.text}: {entry.found ? `¡encontrado! (+${entry.coins} 🪙)` : "no encontrado"}
        </span>
      </div>
    );
  }
  if (entry.type === "shop") {
    return (
      <div className="history-row">
        <span className="history-n">#{entry.n}</span>
        <span className="history-text">
          Tienda: {entry.title} ({entry.coins} 🪙)
        </span>
      </div>
    );
  }
  return null;
}

function IntroScreen({ onStart }) {
  return (
    <div className="screen intro-screen">
      <style>{STYLES}</style>
      <div className="intro-bg-pattern" />
      <div className="intro-content">
        <div className="intro-eyebrow">Una aventura para encontrar comida</div>
        <h1 className="intro-title">
          Encontrando
          <br />
          el Bajón
        </h1>
        <p className="intro-tagline">
          "No salimos a buscar comida. Salimos a encontrar el bajón."
        </p>
        <p className="intro-desc">
          Lanza el dado del destino, sigue las cuadras que te indique, junta monedas,
          resuelve desafíos de observación y descubre dónde termina hoy tu aventura.
        </p>
        <button className="start-btn" onClick={() => { SFX.uiTap(); onStart(); }}>
          Comenzar aventura
        </button>
        <div className="intro-footer">10 movimientos mínimos · cartas y desafíos aleatorios</div>
      </div>
    </div>
  );
}

function EndScreen({ game, onRestart }) {
  const challengesCompleted = game.history.filter((h) => h.type === "challenge" && h.found).length;
  const cardsUsed = game.history.filter((h) => h.type === "card").length;
  const bestCombo = game.history.reduce((max, h) => (h.combo && h.combo > max ? h.combo : max), 0);

  return (
    <div className="screen intro-screen">
      <style>{STYLES}</style>
      <div className="intro-bg-pattern" />
      <div className="intro-content">
        <div className="intro-eyebrow">Aventura completada</div>
        <h1 className="intro-title end-title">¡A encontrar
          <br />
          el bajón!</h1>
        <Ticket className="end-ticket">
          <div className="end-stat-row">
            <span>Movimientos</span>
            <strong>{game.moves}</strong>
          </div>
          <div className="end-stat-row">
            <span>Monedas obtenidas</span>
            <strong>{game.coins} ●</strong>
          </div>
          <div className="end-stat-row">
            <span>Desafíos completados</span>
            <strong>{challengesCompleted}</strong>
          </div>
          {bestCombo >= 3 && (
            <div className="end-stat-row">
              <span>Mejor combo</span>
              <strong>🔥 x{bestCombo}</strong>
            </div>
          )}
          <div className="end-stat-row">
            <span>Cartas utilizadas</span>
            <strong>{cardsUsed}</strong>
          </div>
          <div className="end-stat-row">
            <span>Tesoro del día</span>
            <strong>
              {game.treasure.icon} {game.treasureFound ? "Encontrado" : "No encontrado"}
            </strong>
          </div>
        </Ticket>
        <button className="start-btn" onClick={() => { SFX.uiTap(); onRestart(); }}>
          Nueva aventura
        </button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// STYLES
// ---------------------------------------------------------------------------

const STYLES = `
@import url('https://fonts.googleapis.com/css2?family=Anton&family=Space+Mono:wght@400;700&family=Inter:wght@400;500;600;700&display=swap');

:root {
  --ink: #1A1410;
  --paper: #F2E8D5;
  --paper-dim: #E6D9BD;
  --orange: #E8542A;
  --green: #3D7A5C;
  --yellow: #F4C430;
  --red: #D63B3B;
}

* { box-sizing: border-box; }

.screen {
  font-family: 'Inter', sans-serif;
  background: var(--ink);
  background-image:
    radial-gradient(circle at 15% 20%, rgba(232,84,42,0.10) 0%, transparent 45%),
    radial-gradient(circle at 85% 80%, rgba(61,122,92,0.12) 0%, transparent 50%);
  color: var(--paper);
  min-height: 100vh;
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 18px 16px 40px;
  position: relative;
  overflow-x: hidden;
}

.screen.center { justify-content: center; align-items: center; }

.loader-stamp {
  font-family: 'Anton', sans-serif;
  letter-spacing: 0.03em;
  color: var(--paper);
  font-size: 22px;
  opacity: 0.7;
  animation: pulseOpacity 1.4s ease-in-out infinite;
}
@keyframes pulseOpacity { 0%,100% { opacity: 0.35; } 50% { opacity: 0.85; } }

/* ---------- Topbar ---------- */
.topbar {
  width: 100%;
  max-width: 420px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 14px;
}
.topbar-title {
  font-family: 'Anton', sans-serif;
  font-size: 22px;
  letter-spacing: 0.06em;
  color: var(--yellow);
  text-shadow: 2px 2px 0 rgba(0,0,0,0.4);
}
.topbar-actions { display: flex; gap: 8px; }
.icon-btn {
  background: var(--paper);
  border: 2px solid var(--ink);
  border-radius: 10px;
  font-size: 18px;
  width: 40px; height: 40px;
  display: flex; align-items: center; justify-content: center;
  cursor: pointer;
  box-shadow: 3px 3px 0 rgba(0,0,0,0.35);
  transition: transform 0.12s ease;
}
.icon-btn:active { transform: translate(2px, 2px); box-shadow: 1px 1px 0 rgba(0,0,0,0.35); }
.icon-btn:disabled { opacity: 0.35; cursor: default; }

/* ---------- Status row ---------- */
.status-row {
  width: 100%;
  max-width: 420px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}
.moves-badge {
  font-family: 'Space Mono', monospace;
  font-size: 15px;
  background: rgba(242,232,213,0.08);
  border: 1px solid rgba(242,232,213,0.25);
  padding: 6px 12px;
  border-radius: 8px;
}
.moves-badge strong { color: var(--yellow); font-size: 17px; }
.moves-of { opacity: 0.65; }

.coin-pill {
  display: flex; align-items: center; gap: 6px;
  background: var(--yellow);
  color: var(--ink);
  font-family: 'Space Mono', monospace;
  font-weight: 700;
  padding: 6px 12px;
  border-radius: 999px;
  border: 2px solid var(--ink);
  box-shadow: 2px 2px 0 rgba(0,0,0,0.35);
}
.coin-icon { font-size: 12px; }
.coin-pulse { animation: coinBounce 0.5s ease; }
@keyframes coinBounce {
  0% { transform: scale(1); }
  40% { transform: scale(1.18); }
  100% { transform: scale(1); }
}

.moves-track {
  width: 100%;
  max-width: 420px;
  height: 6px;
  background: rgba(242,232,213,0.15);
  border-radius: 999px;
  overflow: hidden;
  margin-bottom: 16px;
}
.moves-track-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--orange), var(--yellow));
  transition: width 0.4s ease;
}

/* ---------- Ticket primitive ---------- */
.ticket {
  position: relative;
  background: var(--paper);
  color: var(--ink);
  border-radius: 14px;
  border: 2px solid var(--ink);
  box-shadow: 4px 4px 0 rgba(0,0,0,0.4);
  width: 100%;
  max-width: 420px;
}
.ticket-notch {
  position: absolute;
  top: 50%;
  width: 18px; height: 18px;
  background: var(--ink);
  border-radius: 50%;
  transform: translateY(-50%);
}
.ticket-notch-left { left: -10px; }
.ticket-notch-right { right: -10px; }

.treasure-ticket { margin-bottom: 18px; padding: 14px 16px; }
.treasure-row { display: flex; align-items: center; gap: 12px; }
.treasure-icon { font-size: 30px; }
.treasure-text { flex: 1; }
.treasure-label {
  font-family: 'Space Mono', monospace;
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  opacity: 0.6;
}
.treasure-name { font-weight: 700; font-size: 16px; }
.treasure-found { color: var(--green); }
.treasure-hint {
  font-size: 12px;
  font-style: italic;
  opacity: 0.7;
  margin-top: 4px;
}
.treasure-btn {
  background: var(--green);
  color: var(--paper);
  border: none;
  border-radius: 8px;
  padding: 8px 12px;
  font-weight: 700;
  font-size: 13px;
  cursor: pointer;
}

.combo-badge {
  font-family: 'Anton', sans-serif;
  font-size: 14px;
  letter-spacing: 0.04em;
  color: var(--ink);
  background: linear-gradient(90deg, var(--yellow), var(--orange));
  border: 2px solid var(--ink);
  border-radius: 999px;
  padding: 5px 16px;
  margin-bottom: 14px;
  box-shadow: 2px 2px 0 rgba(0,0,0,0.35);
  animation: comboPop 0.3s ease;
}
@keyframes comboPop {
  0% { transform: scale(0.7); opacity: 0; }
  100% { transform: scale(1); opacity: 1; }
}

/* ---------- Stamp / dice zone ---------- */
.stamp-zone {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  max-width: 420px;
  margin-top: 6px;
}
.stamp {
  width: 150px; height: 150px;
  border-radius: 50%;
  background: var(--orange);
  border: 6px solid var(--paper);
  display: flex; align-items: center; justify-content: center;
  font-size: 58px;
  box-shadow: 0 0 0 4px var(--ink), 6px 6px 0 rgba(0,0,0,0.4);
  margin-bottom: 18px;
  transform: rotate(-4deg);
}
.stamp-rolling { animation: spinFace 0.07s linear infinite; }
@keyframes spinFace {
  0% { transform: rotate(-4deg) scale(1); }
  50% { transform: rotate(4deg) scale(1.05); }
  100% { transform: rotate(-4deg) scale(1); }
}
.stamp-landed { animation: stampDown 0.3s ease; }
@keyframes stampDown {
  0% { transform: rotate(-4deg) scale(1.3); opacity: 0.6; }
  60% { transform: rotate(-6deg) scale(0.95); opacity: 1; }
  100% { transform: rotate(-4deg) scale(1); }
}
.stamp-arrow { color: var(--ink); }

.stamp-caption {
  font-size: 16px;
  text-align: center;
  min-height: 44px;
  max-width: 320px;
  font-weight: 500;
  margin-bottom: 16px;
}

.roll-btn {
  font-family: 'Anton', sans-serif;
  letter-spacing: 0.04em;
  font-size: 20px;
  background: var(--yellow);
  color: var(--ink);
  border: 3px solid var(--ink);
  border-radius: 14px;
  padding: 14px 38px;
  cursor: pointer;
  box-shadow: 4px 4px 0 rgba(0,0,0,0.4);
  transition: transform 0.1s ease, box-shadow 0.1s ease;
}
.roll-btn:active {
  transform: translate(3px, 3px);
  box-shadow: 1px 1px 0 rgba(0,0,0,0.4);
}
.roll-btn:disabled { opacity: 0.6; cursor: default; }

.finish-row {
  margin-top: 22px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
}
.finish-callout {
  font-family: 'Space Mono', monospace;
  color: var(--green);
  font-weight: 700;
  font-size: 14px;
  background: rgba(61,122,92,0.15);
  border: 1px solid var(--green);
  padding: 6px 14px;
  border-radius: 999px;
}
.finish-buttons { display: flex; gap: 10px; }

.primary-btn, .secondary-btn {
  font-family: 'Inter', sans-serif;
  font-weight: 700;
  font-size: 14px;
  padding: 10px 18px;
  border-radius: 10px;
  cursor: pointer;
  border: 2px solid var(--ink);
}
.primary-btn {
  background: var(--orange);
  color: var(--paper);
  box-shadow: 3px 3px 0 rgba(0,0,0,0.3);
}
.secondary-btn {
  background: transparent;
  color: var(--paper);
  border-color: rgba(242,232,213,0.4);
}

/* ---------- Overlay & popups ---------- */
.overlay {
  position: fixed;
  inset: 0;
  background: rgba(10,8,6,0.78);
  display: flex;
  align-items: flex-end;
  justify-content: center;
  z-index: 50;
  padding: 0 16px 24px;
}
@media (min-width: 480px) {
  .overlay { align-items: center; }
}

.pop-in { animation: popIn 0.25s ease; }
@keyframes popIn {
  0% { transform: translateY(30px); opacity: 0; }
  100% { transform: translateY(0); opacity: 1; }
}

.challenge-ticket, .shop-ticket, .history-ticket, .wit-ticket {
  padding: 22px 20px;
}
.challenge-eyebrow {
  font-family: 'Space Mono', monospace;
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  opacity: 0.55;
  margin-bottom: 8px;
}
.challenge-text {
  font-family: 'Anton', sans-serif;
  font-size: 24px;
  letter-spacing: 0.01em;
  margin-bottom: 18px;
}
.challenge-buttons { display: flex; gap: 10px; justify-content: flex-end; }

/* ---------- Wit challenge (trivia / math) ---------- */
.wit-question {
  font-family: 'Anton', sans-serif;
  font-size: 20px;
  line-height: 1.25;
  margin-bottom: 16px;
}
.wit-options {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  margin-bottom: 14px;
}
.wit-option-btn {
  font-family: 'Inter', sans-serif;
  font-weight: 700;
  font-size: 14px;
  background: var(--paper-dim);
  border: 2px solid var(--ink);
  border-radius: 10px;
  padding: 12px 10px;
  cursor: pointer;
  transition: transform 0.1s ease, background 0.15s ease;
}
.wit-option-btn:active { transform: translate(2px, 2px); background: var(--yellow); }
.wit-warning {
  font-size: 12px;
  text-align: center;
  color: var(--red);
  font-weight: 600;
  opacity: 0.85;
}

/* ---------- Destiny cards ---------- */
.card-ticket {
  width: 100%;
  max-width: 340px;
  border-radius: 16px;
  padding: 26px 22px 22px;
  text-align: center;
  border: 3px solid var(--ink);
  box-shadow: 6px 6px 0 rgba(0,0,0,0.45);
  transition: transform 0.28s cubic-bezier(.2,.9,.3,1.2), opacity 0.28s ease;
}
.card-in { transform: translateY(0) scale(1); opacity: 1; }
.card-out { transform: translateY(60px) scale(0.9); opacity: 0; }

.card-positive { background: var(--paper); color: var(--ink); }
.card-neutral { background: #DCD3C0; color: var(--ink); }
.card-challenging { background: var(--red); color: var(--paper); }

.card-icon { font-size: 38px; margin-bottom: 4px; }
.card-kind {
  font-family: 'Space Mono', monospace;
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  opacity: 0.7;
  margin-bottom: 8px;
}
.card-title {
  font-family: 'Anton', sans-serif;
  font-size: 22px;
  margin-bottom: 8px;
}
.card-desc { font-size: 14px; margin-bottom: 18px; line-height: 1.4; }
.card-btn {
  font-weight: 700;
  background: var(--ink);
  color: var(--paper);
  border: none;
  border-radius: 10px;
  padding: 10px 24px;
  cursor: pointer;
}
.card-challenging .card-btn { background: var(--paper); color: var(--ink); }

/* ---------- Shop ---------- */
.shop-header { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 12px; gap: 10px; }
.shop-subtitle { font-size: 12px; opacity: 0.6; margin-top: 2px; }
.shop-list {
  max-height: 56vh;
  overflow-y: auto;
  margin: 0 -4px;
  padding: 0 4px;
}
.shop-item {
  display: flex; align-items: center; gap: 12px;
  padding: 12px 8px;
  border-top: 1px dashed rgba(26,20,16,0.25);
}
.shop-item:first-child { border-top: none; }
.shop-item-icon {
  font-size: 26px;
  width: 44px; height: 44px;
  min-width: 44px;
  display: flex; align-items: center; justify-content: center;
  border-radius: 10px;
  background: rgba(26,20,16,0.06);
  border: 2px solid rgba(26,20,16,0.15);
}
.shop-item-body { flex: 1; min-width: 0; }
.shop-item-top {
  display: flex; align-items: center; gap: 8px; flex-wrap: wrap;
  margin-bottom: 2px;
}
.shop-item-title { font-weight: 800; font-size: 14px; }
.shop-item-desc { font-size: 12px; opacity: 0.65; line-height: 1.35; }

.rarity-badge {
  font-family: 'Space Mono', monospace;
  font-size: 9px;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  padding: 2px 7px;
  border-radius: 999px;
  font-weight: 700;
}
.rarity-badge-common { background: #D9D2C4; color: #5A5347; }
.rarity-badge-rare { background: #CFE3F7; color: #1F4E79; }
.rarity-badge-epic { background: #E3CFF7; color: #5B1F8A; }
.rarity-badge-legendary { background: var(--yellow); color: var(--ink); }

.rarity-epic .shop-item-icon { border-color: #B07CE0; }
.rarity-legendary .shop-item-icon {
  border-color: var(--orange);
  background: linear-gradient(135deg, rgba(244,196,48,0.25), rgba(232,84,42,0.2));
  box-shadow: 0 0 10px rgba(244,196,48,0.5);
}

.shop-buy-btn {
  font-family: 'Space Mono', monospace;
  font-weight: 700;
  font-size: 12px;
  background: var(--yellow);
  border: 2px solid var(--ink);
  border-radius: 8px;
  padding: 8px 10px;
  cursor: pointer;
  white-space: nowrap;
}
.shop-buy-btn:disabled { opacity: 0.4; cursor: default; }
.shop-close { width: 100%; justify-content: center; margin-top: 16px; text-align: center; }

/* ---------- History ---------- */
.history-list { max-height: 50vh; overflow-y: auto; margin-bottom: 6px; }
.history-row {
  display: flex; gap: 10px;
  padding: 7px 0;
  border-top: 1px dashed rgba(26,20,16,0.2);
  font-size: 13px;
}
.history-n {
  font-family: 'Space Mono', monospace;
  font-weight: 700;
  opacity: 0.5;
  min-width: 30px;
}
.history-row-setback .history-text { color: var(--red); font-weight: 600; }
.history-empty { font-size: 13px; opacity: 0.6; padding: 10px 0; }

/* ---------- Toast ---------- */
.toast {
  position: fixed;
  bottom: 22px;
  left: 50%;
  transform: translateX(-50%);
  background: var(--ink);
  color: var(--paper);
  border: 2px solid var(--yellow);
  padding: 10px 18px;
  border-radius: 999px;
  font-size: 13px;
  font-weight: 600;
  z-index: 60;
  box-shadow: 3px 3px 0 rgba(0,0,0,0.4);
  animation: toastIn 0.25s ease;
}
@keyframes toastIn {
  0% { transform: translate(-50%, 20px); opacity: 0; }
  100% { transform: translate(-50%, 0); opacity: 1; }
}

/* ---------- Intro / End screen ---------- */
.intro-screen { justify-content: center; align-items: center; text-align: center; }
.intro-bg-pattern {
  position: absolute; inset: 0;
  background-image: radial-gradient(rgba(242,232,213,0.06) 1.5px, transparent 1.5px);
  background-size: 22px 22px;
  pointer-events: none;
}
.intro-content {
  position: relative;
  z-index: 1;
  max-width: 380px;
  display: flex;
  flex-direction: column;
  align-items: center;
}
.intro-eyebrow {
  font-family: 'Space Mono', monospace;
  font-size: 12px;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--green);
  margin-bottom: 10px;
}
.intro-title {
  font-family: 'Anton', sans-serif;
  font-size: 48px;
  line-height: 0.98;
  color: var(--yellow);
  text-shadow: 3px 3px 0 var(--orange);
  margin: 0 0 18px;
}
.end-title { font-size: 38px; margin-bottom: 22px; }
.intro-tagline {
  font-style: italic;
  font-size: 16px;
  color: var(--paper);
  opacity: 0.85;
  margin-bottom: 14px;
}
.intro-desc {
  font-size: 14px;
  line-height: 1.6;
  opacity: 0.75;
  margin-bottom: 28px;
}
.start-btn {
  font-family: 'Anton', sans-serif;
  font-size: 20px;
  letter-spacing: 0.03em;
  background: var(--orange);
  color: var(--paper);
  border: 3px solid var(--paper);
  border-radius: 16px;
  padding: 16px 44px;
  cursor: pointer;
  box-shadow: 5px 5px 0 rgba(0,0,0,0.4);
  transition: transform 0.12s ease, box-shadow 0.12s ease;
}
.start-btn:active { transform: translate(3px,3px); box-shadow: 2px 2px 0 rgba(0,0,0,0.4); }
.intro-footer {
  margin-top: 18px;
  font-family: 'Space Mono', monospace;
  font-size: 11px;
  opacity: 0.5;
}

.end-ticket { padding: 18px 20px; margin-bottom: 26px; text-align: left; }
.end-stat-row {
  display: flex; justify-content: space-between;
  padding: 8px 0;
  border-top: 1px dashed rgba(26,20,16,0.2);
  font-size: 14px;
}
.end-stat-row:first-child { border-top: none; }
.end-stat-row strong { font-family: 'Space Mono', monospace; }

@media (prefers-reduced-motion: reduce) {
  .stamp-rolling, .stamp-landed, .coin-pulse, .pop-in, .card-in, .card-out, .toast {
    animation: none !important;
    transition: none !important;
  }
}
`;
