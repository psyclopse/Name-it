import { useState, useEffect } from 'react';
import './GradingPhase.css';

function GradingPhase({ roundData, playerId, onSubmitGrades }) {
  const [grades, setGrades] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const letter = roundData?.letter || '';
  const allAnswers = roundData?.allAnswers || {};

  // Initialize grades structure
  useEffect(() => {
    const initialGrades = {};
    Object.entries(allAnswers).forEach(([targetPlayerId, playerData]) => {
      if (targetPlayerId !== playerId) {
        initialGrades[targetPlayerId] = {
          people: null,
          animals: null,
          places: null,
          things: null
        };
      }
    });
    setGrades(initialGrades);
  }, [allAnswers, playerId]);

  const handleGrade = (targetPlayerId, category, points) => {
    if (submitted) return;
    setGrades(prev => ({
      ...prev,
      [targetPlayerId]: {
        ...prev[targetPlayerId],
        [category]: points
      }
    }));
  };

  const handleSubmit = () => {
    // Check if all answers are graded
    const allGraded = Object.values(grades).every(playerGrades =>
      Object.values(playerGrades).every(points => points !== null)
    );

    if (!allGraded) {
      alert('Please grade all answers before submitting');
      return;
    }

    onSubmitGrades(grades);
    setSubmitted(true);
  };

  const getCategoryLabel = (category) => {
    switch(category) {
      case 'people': return '👤 Person';
      case 'animals': return '🐾 Animal';
      case 'places': return '📍 Place';
      case 'things': return '📦 Thing';
      default: return category;
    }
  };

  return (
    <div className="grading-phase">
      <div className="grading-card">
        <h2 className="grading-title">Grade Answers - Letter: {letter}</h2>
        <p className="grading-instruction">Review and grade each player's answers. Award 5 points for correct/unique, 2 points for correct but shared, 0 for incorrect.</p>

        {Object.entries(allAnswers).map(([targetPlayerId, playerData]) => {
          if (targetPlayerId === playerId) return null;

          return (
            <div key={targetPlayerId} className="grading-player-section">
              <h3 className="grading-player-name">{playerData.playerName}'s Answers</h3>

              <div className="grading-grid">
                {['people', 'animals', 'places', 'things'].map(category => (
                  <div key={category} className="grading-item">
                    <div className="grading-category-label">
                      {getCategoryLabel(category)}
                    </div>
                    <div className="grading-answer">
                      {playerData.answers[category] || '(no answer)'}
                    </div>
                    <div className="grading-buttons">
                      <button
                        className={`grade-btn ${grades[targetPlayerId]?.[category] === 0 ? 'selected' : ''}`}
                        onClick={() => handleGrade(targetPlayerId, category, 0)}
                        disabled={submitted}
                      >
                        ❌ 0
                      </button>
                      <button
                        className={`grade-btn ${grades[targetPlayerId]?.[category] === 2 ? 'selected' : ''}`}
                        onClick={() => handleGrade(targetPlayerId, category, 2)}
                        disabled={submitted}
                      >
                        🔄 2
                      </button>
                      <button
                        className={`grade-btn ${grades[targetPlayerId]?.[category] === 5 ? 'selected' : ''}`}
                        onClick={() => handleGrade(targetPlayerId, category, 5)}
                        disabled={submitted}
                      >
                        ✅ 5
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}

        <div className="grading-submit-section">
          {submitted ? (
            <p className="grading-submitted-text">✓ Grades submitted! Waiting for other players...</p>
          ) : (
            <button
              className="submit-grades-btn"
              onClick={handleSubmit}
              disabled={submitted}
            >
              Submit Grades
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default GradingPhase;
