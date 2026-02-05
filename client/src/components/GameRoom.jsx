import { useState, useEffect, useRef } from 'react';
import WaitingRoom from './WaitingRoom';
import RoundSelection from './RoundSelection';
import RoundPlaying from './RoundPlaying';
import RoundReview from './RoundReview';
import GameFinished from './GameFinished';
import './GameRoom.css';
import './ErrorToast.css';

function GameRoom({ socket, roomCode, playerId, playerName, gameState, onBackToLobby }) {
  const [currentScreen, setCurrentScreen] = useState('waiting'); // waiting, selection, playing, grading, review, finished
  const [roundData, setRoundData] = useState(null);
  const gradingRoundRef = useRef(null); // Round we're grading - used to ignore stale roundEnded events
  const timerIntervalRef = useRef(null);
  const [timer, setTimer] = useState(0);
  const [error, setError] = useState(null);

  useEffect(() => {
    socket.on('error', ({ message }) => {
      setError(message);
      setTimeout(() => setError(null), 5000);
    });
    socket.on('roundReady', (data) => {
      gradingRoundRef.current = null;
      setCurrentScreen('selection');
      setRoundData(data);
    });

    socket.on('roundStarted', (data) => {
      setCurrentScreen('playing');
      setRoundData(data);

      // Start a local 37-second countdown when the round starts
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
      setTimer(37);
      timerIntervalRef.current = setInterval(() => {
        setTimer(prev => {
          const next = Math.max(0, prev - 1);
          if (next === 0 && timerIntervalRef.current) {
            clearInterval(timerIntervalRef.current);
            timerIntervalRef.current = null;
          }
          return next;
        });
      }, 1000);
    });

    socket.on('roundEnded', (data) => {
      // Ignore stale roundEnded from a previous round (e.g. delayed network) that would overwrite grading UI
      const currentGradingRound = gradingRoundRef.current;
      if (currentGradingRound != null && data.round != null && data.round !== currentGradingRound) {
        return;
      }
      gradingRoundRef.current = null;
      setCurrentScreen('review');
      setRoundData(data);
      setTimer(0);
    });

    socket.on('startGrading', (data) => {
      console.log('startGrading event received:', data);
      gradingRoundRef.current = data.round ?? null;
      setCurrentScreen('review');
      setRoundData(data);
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
      socket.off('startGrading');
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

  const handleSubmitGrades = (grades) => {
    socket.emit('submitGrades', { grades });
  };

  const handleContinueRound = () => {
    socket.emit('pressProceed');
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
        onContinue={handleContinueRound}
        onSubmitGrades={handleSubmitGrades}
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
