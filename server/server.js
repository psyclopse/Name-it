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
    currentRound: 0,
    selectedLetter: null,
    usedLetters: [],
    roundStartTime: null,
    roundDuration: 35000, // 35 seconds
    answers: new Map(), // playerId -> {people, animals, places, things}
    scores: new Map(), // playerId -> totalScore
    gameStatus: 'waiting', // waiting, playing, reviewing, finished
    roundResults: []
  };
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
    
    if (gameState.gameStatus === 'playing' || gameState.gameStatus === 'reviewing') {
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
    
    gameState.selectedLetter = letter;
    gameState.usedLetters.push(letter);
    gameState.roundStartTime = Date.now();
    gameState.answers.clear();
    
    io.to(playerData.roomCode).emit('roundStarted', {
      letter,
      startTime: gameState.roundStartTime,
      duration: gameState.roundDuration
    });
    
    // Auto-advance to review after timer
    setTimeout(() => {
      if (gameState.selectedLetter === letter) {
        endRound(gameState, playerData.roomCode);
      }
    }, gameState.roundDuration);
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

  // End round and calculate scores
  function endRound(gameState, roomCode) {
    if (gameState.gameStatus !== 'playing') return;
    
    gameState.gameStatus = 'reviewing';
    const roundResults = calculateScores(gameState);
    gameState.roundResults = roundResults;
    
    // Convert scores map to array for transmission
    const scoresArray = Array.from(gameState.scores.entries()).map(([id, score]) => ({
      playerId: id,
      playerName: gameState.players.find(p => p.id === id)?.name,
      score
    }));
    
    io.to(roomCode).emit('roundEnded', {
      results: roundResults,
      scores: scoresArray,
      letter: gameState.selectedLetter
    });
    
    // Auto-start next round after 5 seconds
    setTimeout(() => {
      if (gameState.gameStatus === 'reviewing') {
        startNewRound(gameState, roomCode);
      }
    }, 5000);
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
    
    io.to(roomCode).emit('roundReady', {
      round: gameState.currentRound,
      usedLetters: gameState.usedLetters,
      availableLetters,
      scores: Array.from(gameState.scores.entries()).map(([id, score]) => ({
        playerId: id,
        playerName: gameState.players.find(p => p.id === id)?.name,
        score
      }))
    });
  }

  // Continue to next round
  socket.on('continueRound', () => {
    const playerData = players.get(socket.id);
    if (!playerData) return;
    
    const gameState = rooms.get(playerData.roomCode);
    if (!gameState || gameState.gameStatus !== 'reviewing') return;
    
    startNewRound(gameState, playerData.roomCode);
  });

  // Disconnect handling
  socket.on('disconnect', () => {
    const playerData = players.get(socket.id);
    if (playerData) {
      const gameState = rooms.get(playerData.roomCode);
      if (gameState) {
        gameState.players = gameState.players.filter(p => p.id !== socket.id);
        gameState.scores.delete(socket.id);
        players.delete(socket.id);
        
        if (gameState.players.length === 0) {
          rooms.delete(playerData.roomCode);
        } else {
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
