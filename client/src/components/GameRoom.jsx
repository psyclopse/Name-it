import { useState, useEffect } from 'react';
import WaitingRoom from './WaitingRoom';
import RoundSelection from './RoundSelection';
import RoundPlaying from './RoundPlaying';
import RoundReview from './RoundReview';
import GameFinished from './GameFinished';
import './GameRoom.css';
import './ErrorToast.css';

function GameRoom({ socket, roomCode, playerId, playerName, gameState, onBackToLobby }) {
  const [currentScreen, setCurrentScreen] = useState('waiting'); // waiting, selection, playing, review, finished
  const [roundData, setRoundData] = useState(null);
  const [timer, setTimer] = useState(0);
  const [error, setError] = useState(null);

  useEffect(() => {
    socket.on('error', ({ message }) => {
      setError(message);
      setTimeout(() => setError(null), 5000);
    });
    socket.on('roundReady', (data) => {
      setCurrentScreen('selection');
      setRoundData(data);
    });

    socket.on('roundStarted', (data) => {
      setCurrentScreen('playing');
      setRoundData(data);
      const startTime = data.startTime;
      const duration = data.duration;
      
      // Update timer every second
      const interval = setInterval(() => {
        const elapsed = Date.now() - startTime;
        const remaining = Math.max(0, Math.ceil((duration - elapsed) / 1000));
        setTimer(remaining);
        
        if (remaining === 0) {
          clearInterval(interval);
        }
      }, 100);

      return () => clearInterval(interval);
    });

    socket.on('roundEnded', (data) => {
      setCurrentScreen('review');
      setRoundData(data);
      setTimer(0);
    });

    // Review updates: who's submitted a review and who's ready
    socket.on('roundReviewUpdate', (data) => {
      setRoundData(prev => ({ ...(prev || {}), reviewState: data }));
    });

    socket.on('gameFinished', (data) => {
      setCurrentScreen('finished');
      setRoundData(data);
    });

    socket.on('answerSubmitted', (data) => {
      // Show notification that a player submitted
    });

    return () => {
      socket.off('roundReady');
      socket.off('roundStarted');
      socket.off('roundEnded');
      socket.off('roundReviewUpdate');
      socket.off('gameFinished');
      socket.off('answerSubmitted');
      socket.off('error');
    };
  }, [socket]);

  const handleStartGame = () => {
    socket.emit('startGame');
  };

  const handleSelectLetter = (letter) => {
    socket.emit('selectLetter', { letter });
  };

  const handleSubmitAnswers = (answers) => {
    socket.emit('submitAnswers', answers);
  };

  const handleContinueRound = () => {
    socket.emit('continueRound');
  };

  if (currentScreen === 'waiting') {
    return (
      <WaitingRoom
        roomCode={roomCode}
        gameState={gameState}
        playerId={playerId}
        onStartGame={handleStartGame}
        onBackToLobby={onBackToLobby}
      />
    );
  }

  if (currentScreen === 'selection') {
    return (
      <>
        {error && (
          <div className="error-toast" onClick={() => setError(null)}>
            {error}
          </div>
        )}
        <RoundSelection
          roundData={roundData}
          playerId={playerId}
          onSelectLetter={handleSelectLetter}
        />
      </>
    );
  }

  if (currentScreen === 'playing') {
    return (
      <RoundPlaying
        roundData={roundData}
        timer={timer}
        playerId={playerId}
        playerName={playerName}
        onSubmitAnswers={handleSubmitAnswers}
      />
    );
  }

  if (currentScreen === 'review') {
    return (
      <RoundReview
        roundData={roundData}
        playerId={playerId}
        socket={socket}
      />
    );
  }

  if (currentScreen === 'finished') {
    return (
      <GameFinished
        roundData={roundData}
        onBackToLobby={onBackToLobby}
      />
    );
  }

  return null;
}

export default GameRoom;
