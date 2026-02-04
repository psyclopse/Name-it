import { useState, useEffect } from 'react';
import './RoundReview.css';

nfunction RoundReview({ roundData, playerId, socket }) {
  const letter = roundData?.letter || '';
  const reviewState = roundData?.reviewState || { reviewScores: [], readyPlayers: [] };
  const [selectedScore, setSelectedScore] = useState(null);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [isReady, setIsReady] = useState(false);

  // Group results by player (existing round scoring)
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

  // find the other player (for 2-player game)
  const other = (roundData?.scores || []).find(s => s.playerId !== playerId);

  useEffect(() => {
    // Reset local review state whenever a new round review starts
    setSelectedScore(null);
    setHasSubmitted(false);
    setIsReady(false);
  }, [roundData?.letter]);

  useEffect(() => {
    // reflect server state locally
    const myRating = (reviewState.reviewScores || []).find(r => r.raterId === playerId);
    setHasSubmitted(!!myRating);
    setSelectedScore(myRating ? myRating.score : null);
    setIsReady((reviewState.readyPlayers || []).includes(playerId));
  }, [reviewState, playerId]);

  const submitScore = () => {
    if (!other) return;
    if (selectedScore == null) return;
    socket.emit('submitReviewScore', { targetPlayerId: other.playerId, score: selectedScore });
  };

  const markReady = () => {
    socket.emit('playerReady');
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

  const submittedCount = reviewState.reviewScores?.length || 0;
  const readyCount = reviewState.readyPlayers?.length || 0;

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

        <div className="review-actions">
          <h4>Rate the other player</h4>
          {other ? (
            <div className="rating-row">
              <div className="rating-target">{other.playerName}</div>
              <div className="rating-buttons">
                {[1,2,3,4,5].map(n => (
                  <button
                    key={n}
                    className={`rating-btn ${selectedScore === n ? 'selected' : ''}`}
                    onClick={() => setSelectedScore(n)}
                    disabled={hasSubmitted}
                  >{n}</button>
                ))}
              </div>
              <div className="rating-submit">
                <button onClick={submitScore} disabled={hasSubmitted || selectedScore == null}>Submit Score</button>
              </div>
            </div>
          ) : (
            <p>No other player found.</p>
          )}

          <div className="ready-row">
            <button className="ready-btn" onClick={markReady} disabled={!hasSubmitted || isReady}>
              {isReady ? 'Ready (waiting)' : 'Press when ready'}
            </button>
            <div className="ready-info">{submittedCount} submitted • {readyCount} ready</div>
          </div>

          <div className="review-submissions">
            {(reviewState.reviewScores || []).map(r => (
              <div key={r.raterId} className="review-item">
                <span>{r.raterId === playerId ? 'You' : r.raterName}</span>
                <span>→</span>
                <span>{r.targetId === playerId ? 'You' : r.targetName}</span>
                <span className="review-score">{r.score}</span>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}

export default RoundReview;
