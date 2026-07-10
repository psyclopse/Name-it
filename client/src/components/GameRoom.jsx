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
  const [timer, setTimer] = useState(null);
  const [error, setError] = useState(null);
  const [playerLeftNotice, setPlayerLeftNotice] = useState(null);

  useEffect(() => {
    socket.on('error', ({ message }) => {
      setError(message);
      setTimeout(() => setError(null), 5000);
    });
    socket.on('playerLeft', ({ playerName }) => {
      setPlayerLeftNotice(`${playerName} left the room`);
      setTimeout(() => setPlayerLeftNotice(null), 5000);
    });
    socket.on('roundReady', (data) => {
      gradingRoundRef.current = null;
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
      setTimer(null);
      setCurrentScreen('selection');
      setRoundData(data);
    });

    socket.on('roundStarted', (data) => {
      setCurrentScreen('playing');
      setRoundData(data);
      const startTime = data.startTime;
      const duration = data.duration;

      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }

      const updateTimer = () => {
        const elapsed = Date.now() - startTime;
        const remaining = Math.max(0, Math.ceil((duration - elapsed) / 1000));
        setTimer(remaining);
        if (remaining === 0) {
          clearInterval(timerIntervalRef.current);
          timerIntervalRef.current = null;
        }
      };

      updateTimer();
      timerIntervalRef.current = setInterval(updateTimer, 100);
    });

    socket.on('roundEnded', (data) => {
      // Ignore stale roundEnded from a previous round (e.g. delayed network) that would overwrite grading UI
      const currentGradingRound = gradingRoundRef.current;
      if (currentGradingRound != null && data.round != null && data.round !== currentGradingRound) {
        return;
      }
      gradingRoundRef.current = null;
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
      setTimer(null);
      setCurrentScreen('review');
      setRoundData(data);
    });

    socket.on('startGrading', (data) => {
      console.log('startGrading event received:', data);
      gradingRoundRef.current = data.round ?? null;
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
      setTimer(null);
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
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
      socket.off('roundReady');
      socket.off('roundStarted');
      socket.off('roundEnded');
      socket.off('startGrading');
      socket.off('gameFinished');
      socket.off('answerSubmitted');
      socket.off('error');
      socket.off('playerLeft');
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

  const handleUpdateDraftAnswers = (answers) => {
    socket.emit('updateDraftAnswers', answers);
  };

  const handleSubmitGrades = (grades) => {
    socket.emit('submitGrades', { grades });
  };

  const handleContinueRound = () => {
    socket.emit('pressProceed');
  };

  const renderNotice = () => (
    <>
      {error && (
        <div className="error-toast" onClick={() => setError(null)}>
          {error}
        </div>
      )}
      {playerLeftNotice && (
        <div className="player-left-toast" onClick={() => setPlayerLeftNotice(null)}>
          {playerLeftNotice}
        </div>
      )}
    </>
  );

  if (currentScreen === 'waiting') {
    return (
      <>
        {renderNotice()}
        <WaitingRoom
          roomCode={roomCode}
          gameState={gameState}
          playerId={playerId}
          onStartGame={handleStartGame}
          onBackToLobby={onBackToLobby}
        />
      </>
    );
  }

  if (currentScreen === 'selection') {
    return (
      <>
        {renderNotice()}
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
      <>
        {renderNotice()}
        <RoundPlaying
          roundData={roundData}
          timer={timer}
          playerId={playerId}
          playerName={playerName}
          onSubmitAnswers={handleSubmitAnswers}
          onUpdateDraftAnswers={handleUpdateDraftAnswers}
        />
      </>
    );
  }

  if (currentScreen === 'review') {
    return (
      <>
        {renderNotice()}
        <RoundReview
          roundData={roundData}
          playerId={playerId}
          onContinue={handleContinueRound}
          onSubmitGrades={handleSubmitGrades}
        />
      </>
    );
  }

  if (currentScreen === 'finished') {
    return (
      <>
        {renderNotice()}
        <GameFinished
          roundData={roundData}
          onBackToLobby={onBackToLobby}
        />
      </>
    );
  }

  return null;
}

export default GameRoom;
