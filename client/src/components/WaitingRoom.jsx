import './WaitingRoom.css';

function WaitingRoom({ roomCode, gameState, playerId, onStartGame, onBackToLobby }) {
  const isHost = gameState?.players[0]?.id === playerId;
  const playerCount = gameState?.players?.length || 0;

  return (
    <div className="waiting-room">
      <div className="waiting-card">
        <button className="back-btn" onClick={onBackToLobby}>
          ← Back to Lobby
        </button>

        <h1 className="waiting-title">Room: {roomCode}</h1>
        
        <div className="players-list">
          <h2>Players ({playerCount})</h2>
          <div className="players">
            {gameState?.players?.map((player) => (
              <div key={player.id} className="player-item">
                <span className="player-name">{player.name}</span>
                {player.id === playerId && <span className="you-badge">You</span>}
              </div>
            ))}
          </div>
        </div>

        {playerCount < 2 && (
          <div className="waiting-message">
            <p>Waiting for more players...</p>
            <p className="waiting-hint">Share the room code: <strong>{roomCode}</strong></p>
          </div>
        )}

        {isHost && playerCount >= 2 && (
          <button className="start-btn" onClick={onStartGame}>
            Start Game
          </button>
        )}

        {!isHost && playerCount >= 2 && (
          <div className="waiting-message">
            <p>Waiting for host to start the game...</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default WaitingRoom;
