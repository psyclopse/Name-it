import { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import Lobby from './components/Lobby';
import GameRoom from './components/GameRoom';
import './App.css';
import './components/ErrorToast.css';

// Use environment variable for backend URL, fallback to localhost for development
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';
const socket = io(BACKEND_URL);

function App() {
  const [screen, setScreen] = useState('lobby'); // lobby, game
  const [roomCode, setRoomCode] = useState(null);
  const [playerId, setPlayerId] = useState(null);
  const [playerName, setPlayerName] = useState('');
  const [gameState, setGameState] = useState(null);
  const [error, setError] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

  useEffect(() => {
    socket.on('roomCreated', ({ roomCode, playerId }) => {
      setRoomCode(roomCode);
      setPlayerId(playerId);
      setScreen('game');
      setError(null);
    });

    socket.on('roomJoined', ({ roomCode, playerId }) => {
      setRoomCode(roomCode);
      setPlayerId(playerId);
      setScreen('game');
      setError(null);
    });

    socket.on('joinError', ({ message }) => {
      setError(message);
    });

    socket.on('gameStateUpdate', (state) => {
      setGameState(state);
    });

    socket.on('error', ({ message }) => {
      setError(message);
    });

    socket.on('playerLeft', ({ playerName }) => {
      const message = `${playerName} left the room`;
      setToastMessage(message);
      window.setTimeout(() => setToastMessage(null), 5000);
    });

    return () => {
      socket.off('roomCreated');
      socket.off('roomJoined');
      socket.off('joinError');
      socket.off('gameStateUpdate');
      socket.off('error');
      socket.off('playerLeft');
    };
  }, []);

  const handleCreateRoom = (name) => {
    setPlayerName(name);
    socket.emit('createRoom', name);
  };

  const handleJoinRoom = (code, name) => {
    setPlayerName(name);
    socket.emit('joinRoom', { roomCode: code, playerName: name });
  };

  const handleBackToLobby = () => {
    setScreen('lobby');
    setRoomCode(null);
    setPlayerId(null);
    setGameState(null);
    if (roomCode) {
      socket.emit('leaveRoom');
    }
    socket.disconnect();
    socket.connect();
  };

  return (
    <div className="app">
      {toastMessage && (
        <div className="player-left-toast">
          {toastMessage}
        </div>
      )}
      {screen === 'lobby' ? (
        <Lobby
          onCreateRoom={handleCreateRoom}
          onJoinRoom={handleJoinRoom}
          error={error}
        />
      ) : (
        <GameRoom
          socket={socket}
          roomCode={roomCode}
          playerId={playerId}
          playerName={playerName}
          gameState={gameState}
          onBackToLobby={handleBackToLobby}
        />
      )}
    </div>
  );
}

export default App;
