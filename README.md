# ♟️ Chess HTML (Ultra Responsive & Modernized)

A modern, high-performance HTML5 chess web application powered by **Stockfish AI** and local **2-Player Pass & Play (PvP)** multiplayer. Designed mobile-first with **100% full-screen width** on vertical smartphones, high-resolution vector SVG piece themes, procedural Web Audio sound synthesis, and real-time evaluation.

No heavy frameworks, zero external dependencies – just pure, blazing-fast web standards.

---

## 🚀 Key Features

### 📱 100% Full-Screen Mobile Responsive (Portrait & Landscape)
- **Mobile Portrait (≤ 768px):** Board spans **100% viewport width (`100vw`)** edge-to-edge with zero dead space or horizontal scrolling. Includes tactile touch controls, mobile player cards, captured piece trays, and a bottom floating dock.
- **Desktop & Tablet (> 768px):** Refined 2-column layout with centered board (up to 600px), glassmorphism side panel, live evaluation meter, auto-scrolling move history log with SAN notation, and game action controls.

### 🎨 Customizable Board & Piece Themes
- **Board Themes:**
  - 🌿 **Green:** Classic Chess.com / Lichess style
  - 🪵 **Wood:** Warm Walnut & Maple woodgrain
  - 🌑 **Dark:** Luxury Charcoal & Slate dark mode
  - 🌊 **Blue:** Oceanic Slate Blue
  - ⚡ **Cyber:** Neon Cyberpunk with glow effects
  - 🪸 **Coral:** Warm Coral & Sand
- **Piece Sets (Crisp Vector SVG):**
  - **Standard (Cburnett):** Crisp international standard vector icons
  - **Modern:** Sleek geometric minimalist pieces
  - **Wood:** Stylized warm timber pieces
  - **Neon:** Cyberpunk glowing vector outlines

### 🔊 Procedural Web Audio API Sound Engine
Zero external audio files – 100% offline procedural synthesis with zero latency:
- **Tactile Wood:** Realistic wood piece thuds, clicks, and captures
- **Acoustic Modern:** Soft harmonic tones and crisp snaps
- **Retro 8-Bit Arcade:** Chiptune square-wave arpeggios and victory fanfares
- **Sci-Fi Synth:** Futuristic FM lasers and plasma impacts
- Master volume slider and instant mute toggle with sound test preview.

### 🧠 Stockfish AI Engine & Game Rules
- **Stockfish AI Web Worker:** 6 difficulty levels (*Beginner, Easy, Medium, Hard, Expert, Maximum*) with real-time centipawn evaluation bar.
- **Complete Rules:** Castling (Kingside & Queenside), En Passant, Pawn Promotion dialog (Queen, Rook, Bishop, Knight), Check/Checkmate detection, Stalemate, 50-move rule, 3-fold repetition, and Insufficient Material draw.
- **Visual Move Assists:** Interactive legal move dots, capture target rings, King check glow pulse, and last-move square highlights.
- **Undo & Flip:** Multi-ply move undo (2-ply against AI, 1-ply in PvP) and board flip.
- **Local Persistence:** Automatically saves your favorite theme, piece style, sound pack, difficulty, and volume in `localStorage`.

---

## 🕹️ Game Modes

1. **🤖 Play vs Stockfish AI:** Open [`index.html`](./index.html) or switch from the in-game menu.
2. **⚔️ 2-Player Pass & Play:** Open [`pvp.html`](./pvp.html) or toggle game mode in the Settings menu.

---

## ⌨️ Keyboard Shortcuts

| Key | Action |
| :--- | :--- |
| <kbd>F</kbd> | Flip Board orientation (White / Black view) |
| <kbd>Z</kbd> | Undo last move |
| <kbd>R</kbd> | Restart / New Game |
| <kbd>M</kbd> | Toggle Mute |
| <kbd>S</kbd> | Open Settings Drawer |
| <kbd>Esc</kbd> | Close open modals |

---

## 📂 Project Architecture

```text
chess-html/
├── index.html              # Main application entry point (AI & PvP modes)
├── pvp.html                # Dedicated Pass & Play multiplayer view
├── css/
│   └── style.css           # Mobile-first responsive CSS, themes, & modals
├── js/
│   ├── app.js              # Master UI controller, interactions, & persistence
│   ├── audio.js            # Procedural WebAudio sound engine (4 themes)
│   ├── chess-core.js       # Complete chess rules engine (FEN, SAN, validation)
│   ├── pieces.js           # Scalable Vector SVG piece sets (4 styles)
│   └── stockfish-bridge.js # Web Worker bridge for Stockfish engine
├── tests/
│   ├── test-chess-core.js  # Automated unit tests for rules engine
│   └── test-stockfish-bridge.js # Automated tests for AI worker bridge
├── stockfish.js            # Stockfish chess engine Web Worker
├── stockfish.wasm          # Stockfish WebAssembly binary
└── stockfish.wasm.js       # WASM loader
```

---

## 🧪 Testing

Run the automated test suite using Node.js:

```bash
node tests/test-chess-core.js
node tests/test-stockfish-bridge.js
```

---

## 📦 License

This project is licensed under the **GNU General Public License v3.0 (GPL-3.0)**.  
The embedded Stockfish engine is also GPL-licensed.  
You are free to use, modify, and redistribute under the same terms.

---

## ❤️ Credits
Crafted with 🧠 + ♟️ + [Stockfish Engine](https://stockfishchess.org) & [La Alquimia](https://github.com/LaAlquimia).
  
