import { useState, useEffect } from 'react';
import './RoundReview.css';

function RoundReview({ roundData, playerId, onContinue, onSubmitGrades }) {
  const [grades, setGrades] = useState({});
  const [gradesSubmitted, setGradesSubmitted] = useState(false);
  const [proceedPressed, setProceedPressed] = useState(false);
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

  // Initialize grading structure when answers for grading are provided
  useEffect(() => {
    const allAnswers = roundData?.allAnswers || {};
    const initial = {};
    Object.entries(allAnswers).forEach(([targetId, data]) => {
      if (targetId === playerId) return; // don't grade yourself
      initial[targetId] = {
        people: null,
        animals: null,
        places: null,
        things: null
      };
    });
    setGrades(initial);
    setGradesSubmitted(false);
    setProceedPressed(false);
  }, [roundData, playerId]);

  const handleGrade = (targetId, category, points) => {
    setGrades(prev => ({
      ...prev,
      [targetId]: {
        ...prev[targetId],
        [category]: points
      }
    }));
  };

  const submitGrades = () => {
    // ensure all graded
    const allGraded = Object.values(grades).every(pg => Object.values(pg).every(v => v !== null));
    if (!allGraded) {
      alert('Please grade all answers before submitting');
      return;
    }
    onSubmitGrades && onSubmitGrades(grades);
    setGradesSubmitted(true);
  };

  const handleProceed = () => {
    setProceedPressed(true);
    onContinue && onContinue();
  };

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
          {/* If we're in grading phase, `roundData.allAnswers` will be present */}
          {roundData?.allAnswers ? (
            Object.entries(roundData.allAnswers).map(([targetId, pdata]) => {
              if (targetId === playerId) return null;
              return (
                <div key={targetId} className="player-results">
                  <h4 className="player-results-name">{pdata.playerName}</h4>
                  <div className="categories-results">
                    {['people', 'animals', 'places', 'things'].map(category => (
                      <div key={category} className="category-result">
                        <div className="category-label">
                          {category === 'people' && '👤 Person'}
                          {category === 'animals' && '🐾 Animal'}
                          {category === 'places' && '📍 Place'}
                          {category === 'things' && '📦 Thing'}
                        </div>
                        <div className="result-details grading">
                          <span className="result-answer">{pdata.answers[category] || '(no answer)'}</span>
                          <div className="grading-controls">
                            <button className={`grade-btn ${grades[targetId]?.[category] === 0 ? 'selected' : ''}`} onClick={() => handleGrade(targetId, category, 0)} disabled={gradesSubmitted}>❌ 0</button>
                            <button className={`grade-btn ${grades[targetId]?.[category] === 2 ? 'selected' : ''}`} onClick={() => handleGrade(targetId, category, 2)} disabled={gradesSubmitted}>🔄 2</button>
                            <button className={`grade-btn ${grades[targetId]?.[category] === 5 ? 'selected' : ''}`} onClick={() => handleGrade(targetId, category, 5)} disabled={gradesSubmitted}>✅ 5</button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })
          ) : (
            Object.entries(playerResults).map(([pid, playerData]) => (
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
            ))
          )}
        </div>

        <div className="continue-section">
          {roundData?.allAnswers ? (
            // grading phase controls
            gradesSubmitted ? (
              <p className="grading-submitted-text">✓ Grades submitted — waiting for other players</p>
            ) : (
              <button className="submit-grades-btn" onClick={submitGrades}>Submit Grades</button>
            )
          ) : (
            // post-review proceed control
            proceedPressed ? (
              <p className="grading-submitted-text">✓ Proceed pressed — waiting for other players</p>
            ) : (
              <button className="continue-btn" onClick={handleProceed}>Proceed</button>
            )
          )}
        </div>
      </div>
    </div>
  );
}

export default RoundReview;
