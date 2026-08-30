/**
 * Test suite for PlayerProfileManager, Active Rooms, and Reconnection
 */
const assert = require('assert');

// Mock localStorage for Node.js environment
const createMockLocalStorage = () => {
  let store = {};
  return {
    getItem: (key) => store[key] || null,
    setItem: (key, val) => { store[key] = String(val); },
    removeItem: (key) => { delete store[key]; },
    clear: () => { store = {}; }
  };
};

global.localStorage = createMockLocalStorage();
global.window = global;

// Load PlayerProfileManager
const PlayerProfileManager = require('../js/profile.js');

console.log('--- Testing PlayerProfileManager ---');

// Test 1: Initialize Profile with Default Values
const profileMgr = new PlayerProfileManager();
const initialProfile = profileMgr.getProfile();

assert(initialProfile.playerId && initialProfile.playerId.startsWith('usr_'), 'PlayerId should start with usr_');
assert.strictEqual(initialProfile.playerName, 'Alquimista', 'Default playerName should be Alquimista');
assert(initialProfile.avatar, 'Profile should have a default avatar');
assert.deepStrictEqual(initialProfile.stats, { wins: 0, losses: 0, draws: 0, totalGames: 0 }, 'Initial stats should be zeroed');
console.log('✅ Test 1 Passed: Initial profile creation & default attributes.');

// Test 2: Update Identity (Name & Avatar)
profileMgr.updateIdentity('GranMaestro', '👑');
const updatedProfile = profileMgr.getProfile();
assert.strictEqual(updatedProfile.playerName, 'GranMaestro', 'Player name should be updated');
assert.strictEqual(updatedProfile.avatar, '👑', 'Avatar should be updated');
console.log('✅ Test 2 Passed: Identity updates.');

// Test 3: Active Rooms Tracking (Upsert, Get, Remove)
profileMgr.saveActiveRoom({
  roomCode: 'K9A2',
  role: 'host',
  assignedColor: 'w',
  opponentName: 'Carlos',
  opponentAvatar: '🦅',
  fen: 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1',
  moveHistory: ['e4'],
  turn: 'b',
  status: 'active'
});

let rooms = profileMgr.getActiveRooms();
assert.strictEqual(rooms.length, 1, 'Should have 1 active room');
assert.strictEqual(rooms[0].roomCode, 'K9A2', 'Room code must match');
assert.strictEqual(rooms[0].opponentName, 'Carlos', 'Opponent name must match');

// Update room state with a new move
profileMgr.saveActiveRoom({
  roomCode: 'K9A2',
  fen: 'rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR w KQkq e6 0 2',
  moveHistory: ['e4', 'e5'],
  turn: 'w'
});

rooms = profileMgr.getActiveRooms();
assert.strictEqual(rooms.length, 1, 'Still 1 active room after update');
assert.strictEqual(rooms[0].moveHistory.length, 2, 'Move history updated to 2 moves');
assert.strictEqual(rooms[0].turn, 'w', 'Turn updated to w');

// Active session verification
const activeSession = profileMgr.getActiveSession();
assert(activeSession !== null, 'Active session should exist');
assert.strictEqual(activeSession.roomCode, 'K9A2', 'Active session room code should be K9A2');

// Remove active room
profileMgr.removeActiveRoom('K9A2');
rooms = profileMgr.getActiveRooms();
assert.strictEqual(rooms.length, 0, 'Rooms should be empty after removal');
assert.strictEqual(profileMgr.getActiveSession(), null, 'Active session should be null after removal');
console.log('✅ Test 3 Passed: Active rooms saving, updating, and removal.');

// Test 4: Record Completed Matches and Stats
profileMgr.recordMatch({
  roomCode: 'M8X1',
  mode: 'online',
  opponentName: 'Rival1',
  opponentAvatar: '♟️',
  myColor: 'w',
  result: 'win',
  reason: 'Jaque mate',
  movesCount: 24,
  fen: '8/8/8/8/8/8/8/8 w - - 0 1'
});

profileMgr.recordMatch({
  roomCode: 'M8X2',
  mode: 'online',
  opponentName: 'Rival2',
  opponentAvatar: '🦁',
  myColor: 'b',
  result: 'loss',
  reason: 'Rendición',
  movesCount: 18,
  fen: '8/8/8/8/8/8/8/8 w - - 0 1'
});

profileMgr.recordMatch({
  roomCode: 'M8X3',
  mode: 'online',
  opponentName: 'Rival3',
  opponentAvatar: '🐺',
  myColor: 'w',
  result: 'draw',
  reason: 'Tablas por acuerdo',
  movesCount: 30,
  fen: '8/8/8/8/8/8/8/8 w - - 0 1'
});

const stats = profileMgr.getProfile().stats;
assert.strictEqual(stats.wins, 1, 'Wins should be 1');
assert.strictEqual(stats.losses, 1, 'Losses should be 1');
assert.strictEqual(stats.draws, 1, 'Draws should be 1');
assert.strictEqual(stats.totalGames, 3, 'Total games should be 3');

const history = profileMgr.getHistory();
assert.strictEqual(history.length, 3, 'History should contain 3 entries');
assert.strictEqual(history[0].result, 'draw', 'Most recent match should be first (draw)');
console.log('✅ Test 4 Passed: Match history and stats calculation.');

console.log('\n🎉 ALL PROFILE & RECONNECTION UNIT TESTS PASSED SUCCESSFULLY!');
process.exit(0);
