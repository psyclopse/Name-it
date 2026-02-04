import './GameFinished.css';

function GameFinished({ roundData, onBackToLobby }) {
  const winner = roundData?.winner;
  const scores = roundData?.scores || [];

  // Sort scores descending
  const sortedScores = [...scores].sort((a, b) => b.score - a.score);

  return (
    <div className="game-finished">
      <div className="finished-card">
        <h1 className="finished-title">🎉 Game Finished!</h1>

        <div className="winner-section">
          <h2 className="winner-label">Winner</h2>
          <div className="winner-name">{winner?.playerName}</div>
          <div className="winner-score">{winner?.score} points</div>
        </div>

        <div className="final-scores">
          <h3>Final Scores</h3>
          <div className="scores-list-final">
            {sortedScores.map((score, index) => (
              <div
                key={score.playerId}
                className={`score-item-final ${score.playerId === winner?.playerId ? 'winner' : ''}`}
              >
                <div className="score-rank">#{index + 1}</div>
                <div className="score-info">
                  <span className="score-player-name">{score.playerName}</span>
                  <span className="score-player-score">{score.score} pts</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <button className="back-lobby-btn" onClick={onBackToLobby}>
          Back to Lobby
        </button>
      </div>
    </div>
  );
}

export default GameFinished;
