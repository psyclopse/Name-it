import { useState } from 'react';
import './RoundSelection.css';

function RoundSelection({ roundData, playerId, onSelectLetter }) {
  const [selectedLetter, setSelectedLetter] = useState(null);
  
  // Any player can select a letter
  const canSelect = true;

  const handleLetterClick = (letter) => {
    if (!canSelect || roundData.usedLetters.includes(letter)) return;
    setSelectedLetter(letter);
    onSelectLetter(letter);
  };

  const allLetters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

  return (
    <div className="round-selection">
      <div className="selection-card">
        <h2 className="round-title">Round {roundData?.round || 1}</h2>
        
        {roundData?.scores && (
          <div className="scoreboard-mini">
            <h3>Current Scores</h3>
            <div className="scores-list">
              {roundData.scores.map((score) => (
                <div key={score.playerId} className="score-item">
                  <span>{score.playerName}</span>
                  <span className="score-value">{score.score}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="selection-content">
          {canSelect ? (
            <>
              <p className="selection-instruction">Select a letter for this round:</p>
              <div className="letters-grid">
                {allLetters.map((letter) => {
                  const isUsed = roundData?.usedLetters?.includes(letter);
                  const isSelected = selectedLetter === letter;
                  
                  return (
                    <button
                      key={letter}
                      className={`letter-btn ${isUsed ? 'used' : ''} ${isSelected ? 'selected' : ''}`}
                      onClick={() => handleLetterClick(letter)}
                      disabled={isUsed || isSelected}
                    >
                      {letter}
                    </button>
                  );
                })}
              </div>
            </>
          ) : (
            <div className="waiting-selection">
              <p>Waiting for a player to select a letter...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default RoundSelection;
