import { useState, useEffect } from 'react';
import './RoundReview.css';

function RoundReview({ roundData, playerId, onContinue }) {
  const [autoContinue, setAutoContinue] = useState(true);
  const letter = roundData?.letter || '';
  
  // Group results by player
  const playerResults = {};
  if (roundData?.results) {
    roundData.results.forEach(result => {
      if (!playerResults[result.playerId]) {
        playerResults[result.playerId] = {
          playerName: result.playerName,
          categories: {}
        };
      }
      if (!playerResults[result.playerId].categories[result.category]) {
        playerResults[result.playerId].categories[result.category] = [];
      }
      playerResults[result.playerId].categories[result.category].push(result);
    });
  }

  // Auto-continue after 5 seconds
  useEffect(() => {
    if (autoContinue) {
      const timer = setTimeout(() => {
        onContinue();
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [autoContinue, onContinue]);

  const getScoreColor = (points) => {
    if (points === 5) return '#27ae60';
    if (points === 2) return '#f39c12';
    return '#e74c3c';
  };

  const getScoreIcon = (points, isShared) => {
    if (points === 5) return '✅';
    if (points === 2) return '🔄';
    return '❌';
  };

  return (
    <div className="round-review">
      <div className="review-card">
        <h2 className="review-title">Round Review - Letter: {letter}</h2>

        <div className="scores-summary">
          <h3>Round Scores</h3>
          <div className="scores-grid">
            {roundData?.scores?.map((score) => (
              <div key={score.playerId} className="score-summary-item">
                <span className="score-name">{score.playerName}</span>
                <span className="score-total">{score.score} pts</span>
              </div>
            ))}
          </div>
        </div>

        <div className="results-section">
          {Object.entries(playerResults).map(([pid, playerData]) => (
            <div key={pid} className="player-results">
              <h4 className="player-results-name">
                {playerData.playerName}
                {pid === playerId && <span className="you-badge">You</span>}
              </h4>
              
              <div className="categories-results">
                {['people', 'animals', 'places', 'things'].map(category => {
                  const results = playerData.categories[category] || [];
                  const result = results[0]; // Get first result for this category
                  
                  return (
                    <div key={category} className="category-result">
                      <div className="category-label">
                        {category === 'people' && '👤 Person'}
                        {category === 'animals' && '🐾 Animal'}
                        {category === 'places' && '📍 Place'}
                        {category === 'things' && '📦 Thing'}
                      </div>
                      {result ? (
                        <div className="result-details">
                          <span className="result-answer">{result.answer}</span>
                          <span
                            className="result-score"
                            style={{ color: getScoreColor(result.points) }}
                          >
                            {getScoreIcon(result.points, result.isShared)} {result.points} pts
                          </span>
                        </div>
                      ) : (
                        <div className="result-details">
                          <span className="result-answer empty">No answer</span>
                          <span className="result-score" style={{ color: '#e74c3c' }}>
                            ❌ 0 pts
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        <div className="continue-section">
          {autoContinue ? (
            <p className="auto-continue-text">Next round starting in 5 seconds...</p>
          ) : (
            <button className="continue-btn" onClick={onContinue}>
              Continue to Next Round
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default RoundReview;
