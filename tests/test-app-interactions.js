/**
 * Test Suite: ChessApp Unified Movement System
 * Tests Tap-to-move, Drag & Drop, promotion, perspective flips, and event isolation.
 */

const assert = require('assert');
const { ChessGame } = require('../js/chess-core.js');
const ChessPieces = require('../js/pieces.js');
const ChessAudio = require('../js/audio.js');
const { StockfishAI } = require('../js/stockfish-bridge.js');

// Mock DOM elements
function createMockElement(tag = 'div') {
  let _innerHTML = '';
  const el = {
    tagName: tag.toUpperCase(),
    dataset: {},
    classList: {
      _classes: new Set(),
      add(c) {
        if (typeof c === 'string') {
          c.split(' ').forEach(item => { if (item) this._classes.add(item); });
        }
      },
      remove(c) { this._classes.delete(c); },
      contains(c) { return this._classes.has(c); },
      toggle(c, force) {
        if (force === undefined) {
          if (this.contains(c)) this.remove(c); else this.add(c);
        } else if (force) {
          this.add(c);
        } else {
          this.remove(c);
        }
      }
    },
    set className(val) {
      this.classList._classes.clear();
      if (val) {
        val.split(' ').forEach(item => { if (item) this.classList._classes.add(item); });
      }
    },
    get className() {
      return Array.from(this.classList._classes).join(' ');
    },
    style: {},
    get innerHTML() { return _innerHTML; },
    set innerHTML(val) {
      _innerHTML = val;
      if (val === '') {
        this.children = [];
      }
    },
    textContent: '',
    children: [],
    appendChild(child) {
      this.children.push(child);
      child.parentNode = this;
      return child;
    },
    remove() {
      if (this.parentNode && this.parentNode.children) {
        const idx = this.parentNode.children.indexOf(this);
        if (idx !== -1) this.parentNode.children.splice(idx, 1);
      }
      this.parentNode = null;
    },
    contains(node) {
      if (this === node) return true;
      if (!this.children) return false;
      return this.children.some(c => (c === node || (c.contains && c.contains(node))));
    },
    closest(selector) {
      if (selector === '.square' && this.classList.contains('square')) return this;
      if (selector === '.modal-backdrop' && this.classList.contains('modal-backdrop')) return this;
      if (this.parentNode && this.parentNode.closest) return this.parentNode.closest(selector);
      return null;
    },
    querySelector(selector) {
      const match = selector.match(/\.square\[data-x="(\d+)"\]\[data-y="(\d+)"\]/);
      if (match) {
        const targetX = match[1];
        const targetY = match[2];
        const findIn = (node) => {
          if (node.classList && node.classList.contains('square') && node.dataset.x == targetX && node.dataset.y == targetY) {
            return node;
          }
          if (node.children) {
            for (const c of node.children) {
              const res = findIn(c);
              if (res) return res;
            }
          }
          return null;
        };
        return findIn(this);
      }
      return null;
    },
    querySelectorAll(selector) {
      return [];
    },
    setAttribute(k, v) { this[k] = v; },
    getAttribute(k) { return this[k]; },
    addEventListener(event, fn) {
      this._listeners = this._listeners || {};
      this._listeners[event] = this._listeners[event] || [];
      this._listeners[event].push(fn);
    },
    dispatchEvent(event) {
      if (this._listeners && this._listeners[event.type]) {
        for (const fn of this._listeners[event.type]) fn(event);
      }
    },
    getBoundingClientRect() {
      return { left: 0, top: 0, right: 800, bottom: 800, width: 800, height: 800 };
    }
  };
  return el;
}

// Setup Global DOM environment
const domElements = {
  chessboard: createMockElement('div'),
  'chessboard-wrapper': createMockElement('div'),
  'top-player-bar': createMockElement('div'),
  'top-player-name': createMockElement('span'),
  'top-player-avatar': createMockElement('div'),
  'top-player-status': createMockElement('span'),
  'top-captured-list': createMockElement('div'),
  'top-material-diff': createMockElement('span'),
  'bottom-player-bar': createMockElement('div'),
  'bottom-player-name': createMockElement('span'),
  'bottom-player-avatar': createMockElement('div'),
  'bottom-player-status': createMockElement('span'),
  'bottom-captured-list': createMockElement('div'),
  'bottom-material-diff': createMockElement('span'),
  'move-history-list': createMockElement('div'),
  'eval-fill-white': createMockElement('div'),
  'eval-score-text': createMockElement('span'),
  'mode-badge': createMockElement('span'),
  'modal-settings': createMockElement('div'),
  'modal-promotion': createMockElement('div'),
  'promotion-pieces-container': createMockElement('div'),
  'modal-gameover': createMockElement('div'),
  'toast-container': createMockElement('div'),
  'btn-header-settings': createMockElement('button'),
  'btn-header-flip': createMockElement('button'),
  'btn-header-newgame': createMockElement('button'),
  'btn-header-mute': createMockElement('button'),
  'btn-header-theme': createMockElement('button'),
  'btn-create-room': createMockElement('button'),
  'online-reaction-bar': createMockElement('div'),
  'reaction-pill-toggle': createMockElement('button'),
  'reaction-emojis-list': createMockElement('div')
};

domElements.chessboard.id = 'chessboard';
domElements.chessboard.classList.add('chessboard');
domElements.chessboard.parentNode = domElements['chessboard-wrapper'];

// Mock Settings Side Chooser Buttons
const settingsSideWhite = createMockElement('button');
settingsSideWhite.className = 'settings-side-btn side-chooser-btn active';
settingsSideWhite.dataset.side = 'w';

const settingsSideBlack = createMockElement('button');
settingsSideBlack.className = 'settings-side-btn side-chooser-btn';
settingsSideBlack.dataset.side = 'b';

const settingsSideButtons = [settingsSideWhite, settingsSideBlack];

// Mock Online Side Chooser Buttons
const onlineSideRandom = createMockElement('button');
onlineSideRandom.className = 'online-side-btn side-chooser-btn active';
onlineSideRandom.dataset.onlineSide = 'random';

const onlineSideWhite = createMockElement('button');
onlineSideWhite.className = 'online-side-btn side-chooser-btn';
onlineSideWhite.dataset.onlineSide = 'w';

const onlineSideBlack = createMockElement('button');
onlineSideBlack.className = 'online-side-btn side-chooser-btn';
onlineSideBlack.dataset.onlineSide = 'b';

const onlineSideButtons = [onlineSideRandom, onlineSideWhite, onlineSideBlack];

// Mock Reaction Emoji Buttons
const reactionEmojiButtons = ['👏', '🔥', '😮', '♟️', '👑', '💀', '😂', '🤝'].map(emoji => {
  const btn = createMockElement('button');
  btn.className = 'reaction-emoji-btn';
  btn.dataset.emoji = emoji;
  return btn;
});

global.document = {
  getElementById: (id) => domElements[id] || null,
  querySelector: (sel) => {
    if (sel === '#chessboard') return domElements.chessboard;
    if (sel.includes('.online-side-btn.active') || sel.includes('[data-online-side].active')) {
      return onlineSideButtons.find(b => b.classList.contains('active')) || null;
    }
    if (sel.includes('.settings-side-btn.active') || sel.includes('[data-side].active')) {
      return settingsSideButtons.find(b => b.classList.contains('active')) || null;
    }
    return null;
  },
  querySelectorAll: (sel) => {
    if (sel.includes('.square')) return domElements.chessboard.children;
    if (sel.includes('.settings-side-btn') || sel.includes('[data-side]')) {
      return settingsSideButtons;
    }
    if (sel.includes('.online-side-btn') || sel.includes('[data-online-side]')) {
      return onlineSideButtons;
    }
    if (sel.includes('.reaction-emoji-btn')) {
      return reactionEmojiButtons;
    }
    return [];
  },
  createElement: (tag) => createMockElement(tag),
  body: createMockElement('body'),
  addEventListener: (event, fn) => {
    global.document._listeners = global.document._listeners || {};
    global.document._listeners[event] = global.document._listeners[event] || [];
    global.document._listeners[event].push(fn);
  },
  dispatchEvent: (event) => {
    if (global.document._listeners && global.document._listeners[event.type]) {
      for (const fn of global.document._listeners[event.type]) fn(event);
    }
  },
  elementFromPoint: (x, y) => {
    const col = Math.floor(x / 100);
    const row = Math.floor(y / 100);
    if (col >= 0 && col < 8 && row >= 0 && row < 8) {
      const idx = row * 8 + col;
      return domElements.chessboard.children[idx] || null;
    }
    return null;
  }
};

global.window = {
  addEventListener: (event, fn) => {
    global.window._listeners = global.window._listeners || {};
    global.window._listeners[event] = global.window._listeners[event] || [];
    global.window._listeners[event].push(fn);
  },
  removeEventListener: (event, fn) => {
    if (global.window._listeners && global.window._listeners[event]) {
      global.window._listeners[event] = global.window._listeners[event].filter(f => f !== fn);
    }
  },
  _emit(event, data) {
    if (global.window._listeners && global.window._listeners[event]) {
      for (const fn of global.window._listeners[event]) {
        fn(data);
      }
    }
  },
  location: { search: '', pathname: '/' }
};

global.localStorage = {
  getItem: () => null,
  setItem: () => {}
};

global.ChessGame = ChessGame;
global.ChessPieces = ChessPieces;
global.ChessAudio = ChessAudio;
global.StockfishAI = StockfishAI;

// Load App
const ChessApp = require('../js/app.js');

console.log('Testing ChessApp Movement System...');

// Helper to simulate pointer events on square
function getSquareByCoords(app, x, y) {
  return app._getSquareElement(x, y);
}

// 1. Initial State
const app = new ChessApp();
assert.strictEqual(app.game.getTurn(), 'w');
assert.strictEqual(app.selectedSquare, null);
assert.strictEqual(app.legalMovesForSelected.length, 0);
console.log('Passed App initialization.');

// 2. Test Tap-to-Select own piece (White Pawn on e2 -> {x:4, y:6})
const e2Square = getSquareByCoords(app, 4, 6);
assert.ok(e2Square, 'e2 square element must exist');

// Simulate tap on e2
app._onPointerDown({
  button: 0,
  pointerId: 1,
  clientX: 450,
  clientY: 650,
  target: e2Square,
  pointerType: 'touch'
});
// Release without moving (< 6px)
app._onPointerUp({
  pointerId: 1,
  clientX: 450,
  clientY: 650
});

assert.deepStrictEqual(app.selectedSquare, { x: 4, y: 6 }, 'e2 should now be selected');
assert.strictEqual(app.legalMovesForSelected.length, 2, 'e2 pawn should have 2 legal moves (e3, e4)');
console.log('Passed Tap-to-select piece test.');

// 3. Test Tap-to-move destination (e4 -> {x:4, y:4})
const e4Square = getSquareByCoords(app, 4, 4);
assert.ok(e4Square, 'e4 square element must exist');

app._onPointerDown({
  button: 0,
  pointerId: 2,
  clientX: 450,
  clientY: 450,
  target: e4Square,
  pointerType: 'touch'
});
app._onPointerUp({
  pointerId: 2,
  clientX: 450,
  clientY: 450
});

assert.strictEqual(app.selectedSquare, null, 'Selection must be cleared after move');
assert.strictEqual(app.legalMovesForSelected.length, 0);
assert.strictEqual(app.game.getPiece(4, 4), 'P', 'White pawn must now be on e4');
assert.strictEqual(app.game.getPiece(4, 6), null, 'e2 must now be empty');
assert.strictEqual(app.game.getTurn(), 'b', 'Turn should now be Black');
console.log('Passed Tap-to-move execution test.');

// 4. Test Deselect on tapping same piece
// Set mode to PvP so we can move both sides freely
app.setGameMode('pvp');
assert.strictEqual(app.game.getTurn(), 'w');

// Move White e2 -> e4 first
app.executeMove({ x: 4, y: 6 }, { x: 4, y: 4 });
assert.strictEqual(app.game.getTurn(), 'b', 'Turn should now be Black in PvP mode');

// Tap Black pawn on d7 ({x:3, y:1})
const d7Square = getSquareByCoords(app, 3, 1);
app._onPointerDown({ button: 0, pointerId: 3, clientX: 350, clientY: 150, target: d7Square });
app._onPointerUp({ pointerId: 3, clientX: 350, clientY: 150 });
assert.deepStrictEqual(app.selectedSquare, { x: 3, y: 1 }, 'd7 should be selected');

// Tap d7 again to deselect
app._onPointerDown({ button: 0, pointerId: 4, clientX: 350, clientY: 150, target: d7Square });
app._onPointerUp({ pointerId: 4, clientX: 350, clientY: 150 });
assert.strictEqual(app.selectedSquare, null, 'd7 should be deselected on second tap');
assert.strictEqual(app.legalMovesForSelected.length, 0);
console.log('Passed Deselect on second tap test.');

// 5. Test Switch selection to another own piece
// Tap d7 ({x:3, y:1})
app._onPointerDown({ button: 0, pointerId: 5, clientX: 350, clientY: 150, target: d7Square });
app._onPointerUp({ pointerId: 5, clientX: 350, clientY: 150 });
assert.deepStrictEqual(app.selectedSquare, { x: 3, y: 1 });

// Tap e7 ({x:4, y:1})
const e7Square = getSquareByCoords(app, 4, 1);
app._onPointerDown({ button: 0, pointerId: 6, clientX: 450, clientY: 150, target: e7Square });
app._onPointerUp({ pointerId: 6, clientX: 450, clientY: 150 });
assert.deepStrictEqual(app.selectedSquare, { x: 4, y: 1 }, 'Selection should switch to e7');
console.log('Passed Switch piece selection test.');

// 6. Test Drag and Drop Move (e7 to e5 -> {x:4, y:3})
app._onPointerDown({ button: 0, pointerId: 7, clientX: 450, clientY: 150, target: e7Square, pointerType: 'touch' });
// Move > 6px
app._onPointerMove({ pointerId: 7, clientX: 450, clientY: 250 });
assert.strictEqual(app.pointerInteraction.dragInitiated, true, 'Drag should be initiated after moving > 6px');
assert.ok(app.pointerInteraction.ghostEl, 'Drag ghost should be created');

// Drop at e5 ({x:4, y:3}): clientX: 450, clientY: 350 maps to col=4, row=3 -> {x:4, y:3}
app._onPointerUp({ pointerId: 7, clientX: 450, clientY: 350 });

assert.strictEqual(app.selectedSquare, null);
assert.strictEqual(app.game.getPiece(4, 3), 'p', 'Black pawn must now be on e5');
assert.strictEqual(app.game.getPiece(4, 1), null, 'e7 must now be empty');
assert.strictEqual(app.game.getTurn(), 'w', 'Turn should now be White');
console.log('Passed Drag-and-Drop move test.');

// 7. Test Drag and Drop on Illegal square (cancels drag, keeps piece selected)
const g1Knight = getSquareByCoords(app, 6, 7); // White Knight at g1
app._onPointerDown({ button: 0, pointerId: 8, clientX: 650, clientY: 750, target: g1Knight, pointerType: 'touch' });
app._onPointerMove({ pointerId: 8, clientX: 650, clientY: 600 });
assert.strictEqual(app.pointerInteraction.dragInitiated, true);

// Drop on e4 ({x:4, y:4}, clientX: 450, clientY: 450, illegal for knight from g1)
app._onPointerUp({ pointerId: 8, clientX: 450, clientY: 450 });
assert.deepStrictEqual(app.selectedSquare, { x: 6, y: 7 }, 'Knight at g1 should remain selected after invalid drop');
assert.strictEqual(app.game.getPiece(6, 7), 'N', 'Knight should still be on g1');
console.log('Passed Invalid drag release test (piece stays selected).');

// 8. Test Board Flipped (Black perspective)
app.flipBoard();
assert.strictEqual(app.boardFlipped, true);

// Knight moves from g1 ({x:6, y:7}) to f3 ({x:5, y:5})
// When board is flipped: col = 7 - 5 = 2, row = 7 - 5 = 2 -> clientX: 250, clientY: 250
const f3Square = getSquareByCoords(app, 5, 5);
app._onPointerDown({ button: 0, pointerId: 9, clientX: 250, clientY: 250, target: f3Square, pointerType: 'touch' });
app._onPointerUp({ pointerId: 9, clientX: 250, clientY: 250 });

assert.strictEqual(app.game.getPiece(5, 5), 'N', 'Knight should move to f3 even when board is flipped');
assert.strictEqual(app.game.getTurn(), 'b');
console.log('Passed Board flipped perspective test.');

// 9. Test Synthetic Click Suppression
assert.strictEqual(app._ignoreNextClick, true);
let clickHandled = false;
const dummyEvt = {
  preventDefault: () => {},
  stopPropagation: () => { clickHandled = true; },
  target: f3Square
};
app._handleBoardClick(dummyEvt);
assert.strictEqual(clickHandled, true, 'Synthetic click must be ignored after pointerup');
console.log('Passed Synthetic click suppression test.');

// 10. Test Micro-movement (< 6px) treated as clean tap
app.flipBoard(); // back to normal orientation
assert.strictEqual(app.game.getTurn(), 'b');
const b8Knight = getSquareByCoords(app, 1, 0); // Black Knight at b8
app._onPointerDown({ button: 0, pointerId: 10, clientX: 150, clientY: 50, target: b8Knight, pointerType: 'touch' });
// Move 3px (< 6px)
app._onPointerMove({ pointerId: 10, clientX: 152, clientY: 52 });
assert.strictEqual(app.pointerInteraction.dragInitiated, false, 'Drag must not initiate on < 6px movement');
app._onPointerUp({ pointerId: 10, clientX: 152, clientY: 52 });
assert.deepStrictEqual(app.selectedSquare, { x: 1, y: 0 }, 'b8 Knight should be selected cleanly after micro-movement');
assert.ok(app.legalMovesForSelected.length > 0, 'Legal moves must be computed');
console.log('Passed Micro-movement as clean tap test.');

// 11. Test Capture Enemy Piece (e.g. Knight takes White pawn or Bishop capture)
// Move Black Knight to c6 ({x:2, y:2})
const c6Square = getSquareByCoords(app, 2, 2);
app._onPointerDown({ button: 0, pointerId: 11, clientX: 250, clientY: 250, target: c6Square });
app._onPointerUp({ pointerId: 11, clientX: 250, clientY: 250 });
assert.strictEqual(app.game.getPiece(2, 2), 'n');
assert.strictEqual(app.game.getTurn(), 'w');

// White Bishop f1 to c4 ({x:2, y:4})
const f1Bishop = getSquareByCoords(app, 5, 7);
app.executeMove({ x: 5, y: 7 }, { x: 2, y: 4 });
assert.strictEqual(app.game.getTurn(), 'b');

// Black d7 pawn to d5 ({x:3, y:3})
app.executeMove({ x: 3, y: 1 }, { x: 3, y: 3 });
assert.strictEqual(app.game.getTurn(), 'w');

// White Bishop c4 ({x:2, y:4}) captures Black pawn d5 ({x:3, y:3})
const c4BishopSq = getSquareByCoords(app, 2, 4);
app._onPointerDown({ button: 0, pointerId: 12, clientX: 250, clientY: 450, target: c4BishopSq });
app._onPointerUp({ pointerId: 12, clientX: 250, clientY: 450 });
assert.deepStrictEqual(app.selectedSquare, { x: 2, y: 4 });

const d5EnemyPawnSq = getSquareByCoords(app, 3, 3);
app._onPointerDown({ button: 0, pointerId: 13, clientX: 350, clientY: 350, target: d5EnemyPawnSq });
app._onPointerUp({ pointerId: 13, clientX: 350, clientY: 350 });

assert.strictEqual(app.game.getPiece(3, 3), 'B', 'Bishop must have captured pawn on d5');
assert.strictEqual(app.selectedSquare, null);
assert.strictEqual(app.game.getTurn(), 'b');
console.log('Passed Enemy piece capture via Tap-to-move test.');

// 12. Test Pawn Promotion Flow
app.game.loadFEN('8/4P3/8/8/8/8/8/4K2k w - - 0 1');
app.render();
assert.strictEqual(app.game.getPiece(4, 1), 'P'); // Pawn on e7

// Drag e7 pawn to e8
const promoPawnSq = getSquareByCoords(app, 4, 1);
app._onPointerDown({ button: 0, pointerId: 14, clientX: 450, clientY: 150, target: promoPawnSq, pointerType: 'touch' });
app._onPointerMove({ pointerId: 14, clientX: 450, clientY: 80 });
assert.strictEqual(app.pointerInteraction.dragInitiated, true);

// Drop at e8 ({x:4, y:0})
const e8Square = getSquareByCoords(app, 4, 0);
app._onPointerUp({ pointerId: 14, clientX: 450, clientY: 50 });

assert.ok(app.pendingPromotionMove, 'Promotion modal must be pending');
assert.deepStrictEqual(app.pendingPromotionMove, { from: { x: 4, y: 1 }, to: { x: 4, y: 0 } });

// Simulate user choosing Queen in promotion dialog
app.executeMove(app.pendingPromotionMove.from, app.pendingPromotionMove.to, 'Q');
assert.strictEqual(app.game.getPiece(4, 0), 'Q', 'Pawn must be promoted to Queen');
console.log('Passed Pawn Promotion flow test.');

// 13. Test AI Mode Turn Restrictions & Opponent Piece Drag/Click Prevention
app.setGameMode('ai');
app.setPlayerColor('w');
app.game.resetGame();
app.render();

// When it is White's turn, clicking Black pieces when no piece selected should be ignored completely
const blackPawnOnWhiteTurn = getSquareByCoords(app, 4, 1); // e7 Black pawn
app._onPointerDown({ button: 0, pointerId: 15, clientX: 450, clientY: 150, target: blackPawnOnWhiteTurn });
assert.strictEqual(app.pointerInteraction, null, 'pointerInteraction must NOT be created when clicking enemy piece without selection');
app._onPointerUp({ pointerId: 15, clientX: 450, clientY: 150 });
assert.strictEqual(app.selectedSquare, null, 'Cannot select enemy piece on user turn');

// Dragging enemy piece on user turn should not create ghost or initiate drag
app._onPointerDown({ button: 0, pointerId: 151, clientX: 450, clientY: 150, target: blackPawnOnWhiteTurn, pointerType: 'touch' });
assert.strictEqual(app.pointerInteraction, null, 'No pointerInteraction on enemy piece drag start');
app._onPointerMove({ pointerId: 151, clientX: 450, clientY: 250 });
app._onPointerUp({ pointerId: 151, clientX: 450, clientY: 250 });
assert.strictEqual(app.selectedSquare, null);
assert.strictEqual(app.game.getPiece(4, 1), 'p', 'Black pawn must remain on e7');

// User moves White e2 to e4 -> now turn is Black (AI's turn)
app.executeMove({ x: 4, y: 6 }, { x: 4, y: 4 });
assert.strictEqual(app.game.getTurn(), 'b', 'Turn should now be Black (AI turn)');

// On AI's turn, human cannot interact with White pieces
const whitePawnOnAITurn = getSquareByCoords(app, 4, 4);
app._onPointerDown({ button: 0, pointerId: 152, clientX: 450, clientY: 450, target: whitePawnOnAITurn });
assert.strictEqual(app.pointerInteraction, null, 'Cannot start pointer interaction on White piece during AI turn');
app._onPointerUp({ pointerId: 152, clientX: 450, clientY: 450 });
assert.strictEqual(app.selectedSquare, null);

// On AI's turn, human cannot interact with or drag Black pieces
app._onPointerDown({ button: 0, pointerId: 153, clientX: 450, clientY: 150, target: blackPawnOnWhiteTurn, pointerType: 'touch' });
assert.strictEqual(app.pointerInteraction, null, 'Cannot start pointer interaction on Black piece during AI turn');
app._onPointerMove({ pointerId: 153, clientX: 450, clientY: 250 });
app._onPointerUp({ pointerId: 153, clientX: 450, clientY: 250 });
assert.strictEqual(app.selectedSquare, null);

// Calling handleSquareSelect during AI turn should be rejected
app.handleSquareSelect(4, 1);
assert.strictEqual(app.selectedSquare, null, 'handleSquareSelect must return early during AI turn');
console.log('Passed AI Mode Turn Restrictions & Opponent Piece Drag/Click Prevention test.');

// 14. Test Face-to-Face Tabletop Piece Rotation in PvP Mode
app.setGameMode('pvp');
app.setFaceToFace(true);
app.game.resetGame();
app.render();

// Verify top pieces (Black on rank 0 and 1) have .rotated-piece class
const blackKingSq = getSquareByCoords(app, 4, 0); // e8 King
const blackKingWrapper = blackKingSq.children.find(c => c.classList && c.classList.contains('piece-svg'));
assert.ok(blackKingWrapper, 'Must have piece-svg wrapper');
assert.strictEqual(blackKingWrapper.classList.contains('rotated-piece'), true, 'Black pieces on top must be rotated 180deg for opponent in face-to-face mode');

// Verify bottom pieces (White on rank 6 and 7) do NOT have .rotated-piece class
const whiteKingSq = getSquareByCoords(app, 4, 7); // e1 King
const whiteKingWrapper = whiteKingSq.children.find(c => c.classList && c.classList.contains('piece-svg'));
assert.ok(whiteKingWrapper, 'Must have piece-svg wrapper');
assert.strictEqual(whiteKingWrapper.classList.contains('rotated-piece'), false, 'White pieces on bottom must NOT be rotated');

// Verify top player bar has .face-to-face-top class
assert.strictEqual(app.dom.topPlayerBar.classList.contains('face-to-face-top'), true, 'Top player bar must have face-to-face-top class');
console.log('Passed Face-to-Face Tabletop Piece Rotation test.');

// 15. Test Online Multiplayer Mode P2P Connection & Move Sync
app.setGameMode('online');
app.playerColor = 'w';
app.peerClient = {
  isConnected: () => true,
  sendMove: (move) => { app._lastSentPeerMove = move; },
  sendEmoji: (emoji) => { app._lastSentPeerEmoji = emoji; },
  opponentName: 'OnlineRival'
};
app.game.resetGame();
app.render();

// Verify online player names
assert.strictEqual(app.dom.topPlayerName.textContent, 'OnlineRival');
assert.strictEqual(app.dom.bottomPlayerName.textContent, 'Tú (Local)');

// Execute local White move e2 to e4
const e2Sq = getSquareByCoords(app, 4, 6);
app._onPointerDown({ button: 0, pointerId: 16, clientX: 450, clientY: 650, target: e2Sq });
app._onPointerUp({ pointerId: 16, clientX: 450, clientY: 650 });

const e4Sq = getSquareByCoords(app, 4, 4);
app._onPointerDown({ button: 0, pointerId: 17, clientX: 450, clientY: 450, target: e4Sq });
app._onPointerUp({ pointerId: 17, clientX: 450, clientY: 450 });

assert.strictEqual(app.game.getPiece(4, 4), 'P');
assert.ok(app._lastSentPeerMove, 'Move must be sent over WebRTC');
assert.strictEqual(app._lastSentPeerMove.san, 'e4');

// Now it is Black's turn. Local user (White) cannot move opponent's pieces
const e7Sq = getSquareByCoords(app, 4, 1);
app._onPointerDown({ button: 0, pointerId: 18, clientX: 450, clientY: 150, target: e7Sq });
assert.strictEqual(app.pointerInteraction, null, 'No pointer interaction allowed during rival turn');
app._onPointerUp({ pointerId: 18, clientX: 450, clientY: 150 });
assert.strictEqual(app.selectedSquare, null, 'User cannot move opponent piece in online mode');

// Simulate incoming remote Black move e7 to e5 ({x:4, y:1} to {x:4, y:3})
app._onRemoteMove({ from: { x: 4, y: 1 }, to: { x: 4, y: 3 }, promotion: 'Q', san: 'e5' });
assert.strictEqual(app.game.getPiece(4, 3), 'p', 'Remote move must be applied to board');
assert.strictEqual(app.game.getTurn(), 'w', 'Turn must revert to local White player');
console.log('Passed Online Multiplayer Mode P2P Connection & Move Sync test.');

// 16. Test Online Mode Disconnected & Rival Turn Pointer / Toast Guard
app.setGameMode('online');
app.playerColor = 'w';
let lastToast = null;
const originalShowToast = app.showToast.bind(app);
app.showToast = (msg, type) => {
  lastToast = { msg, type };
  originalShowToast(msg, type);
};

// 16a. Disconnected check
app.peerClient = { isConnected: () => false };
app._onPointerDown({ button: 0, pointerId: 19, clientX: 450, clientY: 650, target: e2Sq });
assert.strictEqual(app.pointerInteraction, null, 'Must reject pointer when disconnected');
assert.strictEqual(lastToast.msg, 'Conéctate a una sala online para jugar.');

app.handleSquareSelect(4, 6);
assert.strictEqual(lastToast.msg, 'Conéctate a una sala online para jugar.');
assert.strictEqual(app.selectedSquare, null);

// 16b. Connected but rival turn
app.peerClient = { isConnected: () => true, sendMove: () => {} };
app.game.resetGame();
app.executeMove({ x: 4, y: 6 }, { x: 4, y: 4 }); // White moves, turn becomes Black
assert.strictEqual(app.game.getTurn(), 'b');

lastToast = null;
app._onPointerDown({ button: 0, pointerId: 20, clientX: 450, clientY: 150, target: e7Sq });
assert.strictEqual(app.pointerInteraction, null, 'Must reject pointer on rival turn');
assert.strictEqual(lastToast.msg, 'Es el turno de tu rival.');

lastToast = null;
app.handleSquareSelect(4, 1);
assert.strictEqual(lastToast.msg, 'Es el turno de tu rival.');
assert.strictEqual(app.selectedSquare, null);

// Restore toast method
app.showToast = originalShowToast;
console.log('Passed Online Mode Disconnected & Rival Turn Pointer / Toast Guard test.');

// 17. Test PvP Mode Turn Enforcement (No selecting/dragging opponent pieces)
app.setGameMode('pvp');
app.game.resetGame();
app.render();
assert.strictEqual(app.game.getTurn(), 'w');

// White's turn: clicking Black piece e7 when no piece is selected should be ignored
app._onPointerDown({ button: 0, pointerId: 21, clientX: 450, clientY: 150, target: e7Sq });
assert.strictEqual(app.pointerInteraction, null, 'PvP White turn: clicking Black piece must not create pointerInteraction');
app._onPointerUp({ pointerId: 21, clientX: 450, clientY: 150 });
assert.strictEqual(app.selectedSquare, null, 'PvP White turn: Black piece not selected');

// White makes move e2 to e4
app.executeMove({ x: 4, y: 6 }, { x: 4, y: 4 });
assert.strictEqual(app.game.getTurn(), 'b');

// Black's turn: clicking White piece e4 when no piece is selected should be ignored
app._onPointerDown({ button: 0, pointerId: 22, clientX: 450, clientY: 450, target: e4Sq });
assert.strictEqual(app.pointerInteraction, null, 'PvP Black turn: clicking White piece must not create pointerInteraction');
app._onPointerUp({ pointerId: 22, clientX: 450, clientY: 450 });
assert.strictEqual(app.selectedSquare, null, 'PvP Black turn: White piece not selected');
console.log('Passed PvP Mode Turn Enforcement test.');

// 18. Test Side Chooser Button Isolation & Online / Settings Selection
// 18a. Settings Modal Side Chooser: Play As White / Black
app.setPlayerColor('w');
assert.strictEqual(app.playerColor, 'w');
assert.strictEqual(settingsSideWhite.classList.contains('active'), true, 'Settings White must be active');
assert.strictEqual(settingsSideBlack.classList.contains('active'), false, 'Settings Black must NOT be active');

// Click Black in Settings Modal
settingsSideBlack.dispatchEvent({ type: 'click' });
assert.strictEqual(app.playerColor, 'b', 'Clicking Black settings button sets playerColor to b');
assert.strictEqual(app.boardFlipped, true, 'Board flipped when playing as Black');
assert.strictEqual(settingsSideBlack.classList.contains('active'), true, 'Settings Black is now active');
assert.strictEqual(settingsSideWhite.classList.contains('active'), false, 'Settings White is now inactive');

// Click White in Settings Modal
settingsSideWhite.dispatchEvent({ type: 'click' });
assert.strictEqual(app.playerColor, 'w', 'Clicking White settings button sets playerColor to w');
assert.strictEqual(app.boardFlipped, false, 'Board not flipped when playing as White');
assert.strictEqual(settingsSideWhite.classList.contains('active'), true, 'Settings White is now active');
assert.strictEqual(settingsSideBlack.classList.contains('active'), false, 'Settings Black is now inactive');

// 18b. Online Modal Side Chooser: Random / White / Black
// Default state: Random is active
assert.strictEqual(onlineSideRandom.classList.contains('active'), true, 'Online random active initially');
assert.strictEqual(onlineSideWhite.classList.contains('active'), false);
assert.strictEqual(onlineSideBlack.classList.contains('active'), false);

let createdRoomSide = null;
app.createOnlineRoom = (side) => { createdRoomSide = side; };

// Click Online White button
onlineSideWhite.dispatchEvent({ type: 'click' });
assert.strictEqual(onlineSideWhite.classList.contains('active'), true, 'Online White button is active');
assert.strictEqual(onlineSideRandom.classList.contains('active'), false, 'Online Random button is inactive');
assert.strictEqual(onlineSideBlack.classList.contains('active'), false, 'Online Black button is inactive');
assert.strictEqual(app.playerColor, 'w', 'Online selection must not trigger setPlayerColor(undefined)');

// Create room with White selected
domElements['btn-create-room'].dispatchEvent({ type: 'click' });
assert.strictEqual(createdRoomSide, 'w', 'Create room should pass selected side "w"');

// Click Online Black button
onlineSideBlack.dispatchEvent({ type: 'click' });
assert.strictEqual(onlineSideBlack.classList.contains('active'), true, 'Online Black button is active');
assert.strictEqual(onlineSideWhite.classList.contains('active'), false);
assert.strictEqual(onlineSideRandom.classList.contains('active'), false);
assert.strictEqual(app.playerColor, 'w', 'Online selection must not trigger setPlayerColor');

// Create room with Black selected
domElements['btn-create-room'].dispatchEvent({ type: 'click' });
assert.strictEqual(createdRoomSide, 'b', 'Create room should pass selected side "b"');

// Click Online Random button
onlineSideRandom.dispatchEvent({ type: 'click' });
assert.strictEqual(onlineSideRandom.classList.contains('active'), true, 'Online Random button is active');
assert.strictEqual(onlineSideWhite.classList.contains('active'), false);
assert.strictEqual(onlineSideBlack.classList.contains('active'), false);

// Create room with Random selected
domElements['btn-create-room'].dispatchEvent({ type: 'click' });
assert.strictEqual(createdRoomSide, 'random', 'Create room should pass selected side "random"');

// 18c. Cross-Modal Isolation: Sync Settings does NOT alter Online side buttons
app._syncSettingsFormControls();
assert.strictEqual(onlineSideRandom.classList.contains('active'), true, 'Sync settings must not clear online side button active state');
assert.strictEqual(settingsSideWhite.classList.contains('active'), true, 'Settings White remains active');
assert.strictEqual(settingsSideBlack.classList.contains('active'), false);

console.log('Passed Side Chooser Button Isolation & Online / Settings Selection test.');

// 19. Test Expandable Emoji Reaction Pill & Interactive Broadcasts
app.setGameMode('ai');
assert.strictEqual(app.dom.onlineReactionBar.classList.contains('visible'), false, 'Reaction bar hidden in AI mode');

app.setGameMode('online');
app.peerClient = {
  isConnected: () => true,
  sendEmoji: (emoji) => { app._lastSentPeerEmoji = emoji; }
};
assert.strictEqual(app.dom.onlineReactionBar.classList.contains('visible'), true, 'Reaction bar visible in Online mode');
assert.strictEqual(app.dom.onlineReactionBar.classList.contains('expanded'), false, 'Reaction bar initially collapsed');

// Toggle pill expanded state
domElements['reaction-pill-toggle'].dispatchEvent({ type: 'click', stopPropagation: () => {} });
assert.strictEqual(app.dom.onlineReactionBar.classList.contains('expanded'), true, 'Clicking pill toggle expands the emoji bar');

// Click an emoji (🔥)
app._lastSentPeerEmoji = null;
const fireEmojiBtn = reactionEmojiButtons.find(b => b.dataset.emoji === '🔥');
fireEmojiBtn.dispatchEvent({ type: 'click', stopPropagation: () => {} });
assert.strictEqual(app._lastSentPeerEmoji, '🔥', 'Emoji 🔥 should be broadcasted over WebRTC');
assert.strictEqual(fireEmojiBtn.classList.contains('clicked'), true, 'Clicked emoji button should have clicked animation class');

// Click outside to collapse
const outsideElem = createMockElement('div');
global.document.dispatchEvent({ type: 'click', target: outsideElem });
assert.strictEqual(app.dom.onlineReactionBar.classList.contains('expanded'), false, 'Clicking outside collapses the reaction bar');

// Switch mode away from online
app.setGameMode('pvp');
assert.strictEqual(app.dom.onlineReactionBar.classList.contains('visible'), false, 'Reaction bar hidden in PvP mode');
console.log('Passed Expandable Emoji Reaction Pill & Peer Broadcast test.');

console.log('\nALL CHESSAPP MOVEMENT & INTERACTION TESTS PASSED SUCCESSFULLY! 🎉');

