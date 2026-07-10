import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';

const app = express();
const httpServer = createServer(app);

// CORS configuration - allow all origins in production, configurable via env
const corsOrigins = process.env.CORS_ORIGINS 
  ? process.env.CORS_ORIGINS.split(',').map(origin => origin.trim())
  : "*";

const io = new Server(httpServer, {
  cors: {
    origin: corsOrigins,
    methods: ["GET", "POST"],
    credentials: true
  }
});

app.use(cors({
  origin: corsOrigins,
  credentials: true
}));
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Game state storage
const rooms = new Map();
const players = new Map();

// Generate unique room code
function generateRoomCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// Initialize game state
function createGameState() {
  return {
    players: [],
    creatorId: null,
    currentRound: 0,
    selectedLetter: null,
    usedLetters: [],
    roundStartTime: null,
    roundDuration: 35000, // 35 seconds
    roundTimerId: null, // Store timer so we can cancel when round ends early
    answers: new Map(), // playerId -> {people, animals, places, things}
    draftAnswers: new Map(), // playerId -> partial answers typed but not yet submitted
    scores: new Map(), // playerId -> totalScore
    gameStatus: 'waiting', // waiting, playing, grading, reviewing, finished
    roundResults: [],
    grades: new Map(), // graderId -> { targetPlayerId -> { category -> points } }
    reviewAssignments: new Map(), // graderId -> targetPlayerId (one-to-one peer review)
    proceed: new Set(), // players who pressed proceed after review
  };
}

// Determine which player may pick the letter this round
function getPickerPlayerId(gameState) {
  if (gameState.players.length === 0) return null;
  // Round 1: only the room creator may pick
  if (gameState.currentRound === 1) {
    const creator = gameState.players.find(p => p.id === gameState.creatorId);
    return creator ? creator.id : gameState.players[0].id;
  }
  // Subsequent rounds: rotate through join order
  const pickerIndex = (gameState.currentRound - 1) % gameState.players.length;
  return gameState.players[pickerIndex].id;
}

// Create a random one-to-one review assignment (derangement: no self-review)
function createReviewAssignments(playerIds) {
  const n = playerIds.length;
  if (n < 2) return new Map();

  const targets = [...playerIds];

  // Fisher-Yates shuffle
  for (let i = n - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [targets[i], targets[j]] = [targets[j], targets[i]];
  }

  // Fix any fixed points (grader reviewing themselves)
  for (let i = 0; i < n; i++) {
    if (targets[i] === playerIds[i]) {
      const j = (i + 1) % n;
      [targets[i], targets[j]] = [targets[j], targets[i]];
      if (targets[i] === playerIds[i] || targets[j] === playerIds[j]) {
        const k = (i + 2) % n;
        [targets[i], targets[k]] = [targets[k], targets[i]];
      }
    }
  }

  const assignments = new Map();
  for (let i = 0; i < n; i++) {
    assignments.set(playerIds[i], targets[i]);
  }
  return assignments;
}

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // Create a new room
  socket.on('createRoom', (playerName) => {
    const roomCode = generateRoomCode();
    const gameState = createGameState();
    
    const player = {
      id: socket.id,
      name: playerName,
      score: 0
    };
    
    gameState.players.push(player);
    gameState.creatorId = socket.id;
    gameState.scores.set(socket.id, 0);
    rooms.set(roomCode, gameState);
    players.set(socket.id, { roomCode, playerName });
    
    socket.join(roomCode);
    socket.emit('roomCreated', { roomCode, playerId: socket.id });
    io.to(roomCode).emit('gameStateUpdate', gameState);
    
    console.log(`Room created: ${roomCode} by ${playerName}`);
  });

  // Join an existing room
  socket.on('joinRoom', ({ roomCode, playerName }) => {
    const gameState = rooms.get(roomCode);
    
    if (!gameState) {
      socket.emit('joinError', { message: 'Room not found' });
      return;
    }
    
    if (gameState.gameStatus === 'playing' || gameState.gameStatus === 'grading' || gameState.gameStatus === 'reviewing') {
      socket.emit('joinError', { message: 'Game already in progress' });
      return;
    }
    
    const player = {
      id: socket.id,
      name: playerName,
      score: 0
    };
    
    gameState.players.push(player);
    gameState.scores.set(socket.id, 0);
    players.set(socket.id, { roomCode, playerName });
    
    socket.join(roomCode);
    socket.emit('roomJoined', { roomCode, playerId: socket.id });
    io.to(roomCode).emit('gameStateUpdate', gameState);
    
    console.log(`${playerName} joined room ${roomCode}`);
  });

  // Start the game
  socket.on('startGame', () => {
    const playerData = players.get(socket.id);
    if (!playerData) return;
    
    const gameState = rooms.get(playerData.roomCode);
    if (!gameState || gameState.players.length < 2) {
      socket.emit('error', { message: 'Need at least 2 players to start' });
      return;
    }
    
    if (gameState.gameStatus !== 'waiting') return;
    
    gameState.gameStatus = 'playing';
    startNewRound(gameState, playerData.roomCode);
  });

  // Select a letter for the round
  socket.on('selectLetter', ({ letter }) => {
    const playerData = players.get(socket.id);
    if (!playerData) return;
    
    const gameState = rooms.get(playerData.roomCode);
    if (!gameState || gameState.gameStatus !== 'playing') return;
    
    // Check if a letter is already selected for this round
    if (gameState.selectedLetter) {
      socket.emit('error', { message: 'A letter has already been selected for this round' });
      return;
    }
    
    // Check if letter is already used
    if (gameState.usedLetters.includes(letter)) {
      socket.emit('error', { message: 'Letter already used' });
      return;
    }

    // Only the designated picker may select a letter this round
    const pickerId = getPickerPlayerId(gameState);
    if (socket.id !== pickerId) {
      const picker = gameState.players.find(p => p.id === pickerId);
      socket.emit('error', { message: `It's ${picker?.name || 'another player'}'s turn to pick a letter` });
      return;
    }
    
    gameState.selectedLetter = letter;
    gameState.usedLetters.push(letter);
    gameState.roundStartTime = Date.now();
    gameState.answers.clear();
    gameState.draftAnswers.clear();
    
    // Clear any existing round timer (e.g. from previous round)
    if (gameState.roundTimerId) {
      clearTimeout(gameState.roundTimerId);
    }
    
    io.to(playerData.roomCode).emit('roundStarted', {
      letter,
      startTime: gameState.roundStartTime,
      duration: gameState.roundDuration
    });
    
    // Auto-advance to grading after timer
    gameState.roundTimerId = setTimeout(() => {
      gameState.roundTimerId = null;
      if (gameState.gameStatus === 'playing' && gameState.selectedLetter === letter) {
        endRound(gameState, playerData.roomCode);
      }
    }, gameState.roundDuration);
  });

  // Save draft answers as the player types (used if timer expires before explicit submit)
  socket.on('updateDraftAnswers', ({ people, animals, places, things }) => {
    const playerData = players.get(socket.id);
    if (!playerData) return;

    const gameState = rooms.get(playerData.roomCode);
    if (!gameState || gameState.gameStatus !== 'playing') return;
    if (gameState.answers.has(socket.id)) return;

    gameState.draftAnswers.set(socket.id, {
      people: (people || '').trim(),
      animals: (animals || '').trim(),
      places: (places || '').trim(),
      things: (things || '').trim(),
    });
  });

  // Submit answers
  socket.on('submitAnswers', ({ people, animals, places, things }) => {
    const playerData = players.get(socket.id);
    if (!playerData) return;
    
    const gameState = rooms.get(playerData.roomCode);
    if (!gameState || gameState.gameStatus !== 'playing') return;
    
    gameState.answers.set(socket.id, {
      people: people.trim(),
      animals: animals.trim(),
      places: places.trim(),
      things: things.trim()
    });
    
    // Check if all players have submitted
    const allSubmitted = gameState.players.every(p => gameState.answers.has(p.id));
    
    if (allSubmitted) {
      endRound(gameState, playerData.roomCode);
    } else {
      io.to(playerData.roomCode).emit('answerSubmitted', {
        playerId: socket.id,
        playerName: playerData.playerName
      });
    }
  });

  // Calculate scores for a round
  function calculateScores(gameState) {
    const results = [];
    const categories = ['people', 'animals', 'places', 'things'];
    
    for (const category of categories) {
      const categoryResults = new Map();
      
      // Collect all answers for this category
      for (const [playerId, answers] of gameState.answers.entries()) {
        const answer = answers[category].toLowerCase().trim();
        if (!answer) continue;
        
        if (!categoryResults.has(answer)) {
          categoryResults.set(answer, []);
        }
        categoryResults.get(answer).push(playerId);
      }
      
      // Score each answer
      for (const [answer, playerIds] of categoryResults.entries()) {
        const isValid = answer.length > 0 && answer.charAt(0).toLowerCase() === gameState.selectedLetter.toLowerCase();
        
        for (const playerId of playerIds) {
          let points = 0;
          if (!isValid) {
            points = 0; // Wrong answer
          } else if (playerIds.length === 1) {
            points = 5; // Unique correct answer
          } else {
            points = 2; // Shared answer
          }
          
          const currentScore = gameState.scores.get(playerId) || 0;
          gameState.scores.set(playerId, currentScore + points);
          
          const player = gameState.players.find(p => p.id === playerId);
          if (player) {
            player.score = gameState.scores.get(playerId);
          }
          
          results.push({
            playerId,
            playerName: gameState.players.find(p => p.id === playerId)?.name,
            category,
            answer,
            points,
            isShared: playerIds.length > 1
          });
        }
      }
    }
    
    return results;
  }

  // End round and transition to grading phase
  function endRound(gameState, roomCode) {
    if (gameState.gameStatus !== 'playing') return;
    
    // Cancel the round timer (round may have ended early when all submitted)
    if (gameState.roundTimerId) {
      clearTimeout(gameState.roundTimerId);
      gameState.roundTimerId = null;
    }

    // Auto-submit typed drafts or empty answers for players who did not submit
    for (const player of gameState.players) {
      if (!gameState.answers.has(player.id)) {
        const draft = gameState.draftAnswers.get(player.id);
        gameState.answers.set(player.id, draft || {
          people: '',
          animals: '',
          places: '',
          things: '',
        });
      }
    }
    gameState.draftAnswers.clear();
    
    console.log('endRound called, transitioning to grading phase');
    gameState.gameStatus = 'grading';
    gameState.grades.clear();
    gameState.proceed.clear(); // Ensure proceed set is fresh for when we reach reviewing

    // Create random one-to-one peer review assignments (no self-review)
    const playerIds = gameState.players.map(p => p.id);
    gameState.reviewAssignments = createReviewAssignments(playerIds);
    
    console.log('Review assignments:', Object.fromEntries(gameState.reviewAssignments));

    // Send each player only their assigned answer sheet to review
    for (const player of gameState.players) {
      const targetId = gameState.reviewAssignments.get(player.id);
      const targetAnswers = gameState.answers.get(targetId);
      const targetPlayer = gameState.players.find(p => p.id === targetId);

      io.to(player.id).emit('startGrading', {
        round: gameState.currentRound,
        letter: gameState.selectedLetter,
        assignedTarget: {
          playerId: targetId,
          playerName: targetPlayer?.name,
          answers: targetAnswers,
        },
      });
    }
  }

  // Start a new round
  function startNewRound(gameState, roomCode) {
    const availableLetters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')
      .filter(letter => !gameState.usedLetters.includes(letter));
    
    if (availableLetters.length === 0) {
      // Game finished
      gameState.gameStatus = 'finished';
      const scoresArray = Array.from(gameState.scores.entries()).map(([id, score]) => ({
        playerId: id,
        playerName: gameState.players.find(p => p.id === id)?.name,
        score
      }));
      
      const winner = scoresArray.reduce((max, p) => p.score > max.score ? p : max, scoresArray[0]);
      
      io.to(roomCode).emit('gameFinished', {
        scores: scoresArray,
        winner
      });
      return;
    }
    
    gameState.gameStatus = 'playing';
    gameState.currentRound++;
    gameState.selectedLetter = null;
    gameState.roundStartTime = null;
    gameState.answers.clear();
    gameState.draftAnswers.clear();
    gameState.grades.clear();
    if (gameState.proceed && typeof gameState.proceed.clear === 'function') {
      gameState.proceed.clear();
    }
    
    const pickerPlayerId = getPickerPlayerId(gameState);
    const pickerPlayer = gameState.players.find(p => p.id === pickerPlayerId);

    io.to(roomCode).emit('roundReady', {
      round: gameState.currentRound,
      usedLetters: gameState.usedLetters,
      availableLetters,
      pickerPlayerId,
      pickerPlayerName: pickerPlayer?.name,
      scores: Array.from(gameState.scores.entries()).map(([id, score]) => ({
        playerId: id,
        playerName: gameState.players.find(p => p.id === id)?.name,
        score
      }))
    });
  }

  // Submit grades for opponent's answers
  socket.on('submitGrades', ({ grades }) => {
    const playerData = players.get(socket.id);
    if (!playerData) return;
    
    const gameState = rooms.get(playerData.roomCode);
    if (!gameState || gameState.gameStatus !== 'grading') return;
    
    console.log('submitGrades received from player:', socket.id, 'grades:', grades);
    
    // Only accept grades for the assigned review target
    const assignedTargetId = gameState.reviewAssignments.get(socket.id);
    if (!assignedTargetId) return;

    const targetGrades = grades[assignedTargetId];
    if (!targetGrades) return;

    gameState.grades.set(socket.id, { [assignedTargetId]: targetGrades });
    
    // Check if all players have submitted grades
    const allGraded = gameState.players.every(p => gameState.grades.has(p.id));
    
    console.log('Grades submitted by:', socket.id, 'All graded:', allGraded, 'Total players:', gameState.players.length, 'Grades count:', gameState.grades.size);
    
    if (allGraded) {
      // Calculate final scores based on all submitted grades
      console.log('All players have graded, calculating scores...');
      calculateScoresFromGrades(gameState);
      finishRound(gameState, playerData.roomCode);
    }
  });

  // Calculate scores based on submitted grades
  function calculateScoresFromGrades(gameState) {
    const results = [];
    const categories = ['people', 'animals', 'places', 'things'];
    
    for (const category of categories) {
      // Get all unique answers for this category
      const categoryAnswers = new Map();
      
      for (const [playerId, answers] of gameState.answers.entries()) {
        const answer = answers[category].toLowerCase().trim();
        if (!answer) continue;
        
        if (!categoryAnswers.has(answer)) {
          categoryAnswers.set(answer, []);
        }
        categoryAnswers.get(answer).push(playerId);
      }
      
      // Calculate points for each answer based on grades
      for (const [answer, playerIds] of categoryAnswers.entries()) {
        for (const playerId of playerIds) {
          let totalPoints = 0;
          let graderCount = 0;
          
          // Sum up grades from the assigned reviewer
          for (const [graderId, playerGrades] of gameState.grades.entries()) {
            if (gameState.reviewAssignments.get(graderId) === playerId && playerGrades[playerId] && playerGrades[playerId][category] != null) {
              totalPoints += playerGrades[playerId][category];
              graderCount++;
            }
          }
          
          let points = graderCount > 0 ? totalPoints : 0;
          
          const currentScore = gameState.scores.get(playerId) || 0;
          gameState.scores.set(playerId, currentScore + points);
          
          const player = gameState.players.find(p => p.id === playerId);
          if (player) {
            player.score = gameState.scores.get(playerId);
          }
          
          results.push({
            playerId,
            playerName: gameState.players.find(p => p.id === playerId)?.name,
            category,
            answer,
            points,
            isShared: playerIds.length > 1
          });
        }
      }
    }
    
    gameState.roundResults = results;
  }

  // Finish round and show review
  function finishRound(gameState, roomCode) {
    gameState.gameStatus = 'reviewing';
    
    // Convert scores map to array for transmission
    const scoresArray = Array.from(gameState.scores.entries()).map(([id, score]) => ({
      playerId: id,
      playerName: gameState.players.find(p => p.id === id)?.name,
      score
    }));
    
    io.to(roomCode).emit('roundEnded', {
      round: gameState.currentRound,
      results: gameState.roundResults,
      scores: scoresArray,
      letter: gameState.selectedLetter
    });
  }

  // Continue handling: wait for all players to press proceed
  socket.on('pressProceed', () => {
    const playerData = players.get(socket.id);
    if (!playerData) return;

    const gameState = rooms.get(playerData.roomCode);
    if (!gameState || gameState.gameStatus !== 'reviewing') return;

    gameState.proceed.add(socket.id);
    const allProceed = gameState.players.every(p => gameState.proceed.has(p.id));
    if (allProceed) {
      // clear proceed flags and start next round
      gameState.proceed.clear();
      startNewRound(gameState, playerData.roomCode);
    }
  });

  // Disconnect handling
  socket.on('disconnect', () => {
    const playerData = players.get(socket.id);
    if (playerData) {
      const gameState = rooms.get(playerData.roomCode);
      if (gameState) {
        const leftPlayerName = playerData.playerName;
        gameState.players = gameState.players.filter(p => p.id !== socket.id);
        gameState.scores.delete(socket.id);
        gameState.answers.delete(socket.id);
        gameState.draftAnswers.delete(socket.id);
        gameState.grades.delete(socket.id);
        gameState.proceed.delete(socket.id);
        gameState.reviewAssignments.delete(socket.id);
        players.delete(socket.id);
        
        if (gameState.players.length === 0) {
          rooms.delete(playerData.roomCode);
        } else {
          io.to(playerData.roomCode).emit('playerLeft', { playerName: leftPlayerName });
          io.to(playerData.roomCode).emit('gameStateUpdate', gameState);
        }
      }
    }
    console.log('User disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});
