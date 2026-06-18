import { useState, useEffect } from 'react';
import './RoundPlaying.css';

function RoundPlaying({ roundData, timer, playerId, playerName, onSubmitAnswers, onUpdateDraftAnswers }) {
  const [answers, setAnswers] = useState({
    people: '',
    animals: '',
    places: '',
    things: ''
  });
  const [submitted, setSubmitted] = useState(false);

  const letter = roundData?.letter || '';

  // Reset form when a new round starts
  useEffect(() => {
    setAnswers({ people: '', animals: '', places: '', things: '' });
    setSubmitted(false);
  }, [roundData?.letter, roundData?.startTime]);

  // Auto-submit typed answers when the timer runs out
  useEffect(() => {
    if (timer === 0 && !submitted) {
      onSubmitAnswers(answers);
      setSubmitted(true);
    }
  }, [timer, submitted, answers, onSubmitAnswers]);

  const handleChange = (category, value) => {
    if (submitted) return;
    setAnswers(prev => {
      const next = { ...prev, [category]: value };
      onUpdateDraftAnswers?.(next);
      return next;
    });
  };

  const handleSubmit = () => {
    if (submitted) return;
    onSubmitAnswers(answers);
    setSubmitted(true);
  };

  const timerColor = timer <= 10 ? '#e74c3c' : timer <= 15 ? '#f39c12' : '#667eea';

  return (
    <div className="round-playing">
      <div className="playing-card">
        <div className="timer-container">
          <div className="timer-circle" style={{ borderColor: timerColor }}>
            <span className="timer-value" style={{ color: timerColor }}>
              {timer}
            </span>
          </div>
          <p className="timer-label">seconds remaining</p>
        </div>

        <div className="letter-display">
          <h1 className="letter-text">{letter}</h1>
          <p className="letter-instruction">Name something starting with <strong>{letter}</strong></p>
        </div>

        {submitted ? (
          <div className="submitted-message">
            <p>✓ Answers submitted!</p>
            <p className="submitted-hint">Waiting for other players...</p>
          </div>
        ) : (
          <>
            <div className="answers-form">
              <div className="answer-group">
                <label htmlFor="people">👤 Person</label>
                <input
                  id="people"
                  type="text"
                  value={answers.people}
                  onChange={(e) => handleChange('people', e.target.value)}
                  placeholder="Enter a person's name"
                  autoComplete="off"
                />
              </div>

              <div className="answer-group">
                <label htmlFor="animals">🐾 Animal</label>
                <input
                  id="animals"
                  type="text"
                  value={answers.animals}
                  onChange={(e) => handleChange('animals', e.target.value)}
                  placeholder="Enter an animal"
                  autoComplete="off"
                />
              </div>

              <div className="answer-group">
                <label htmlFor="places">📍 Place</label>
                <input
                  id="places"
                  type="text"
                  value={answers.places}
                  onChange={(e) => handleChange('places', e.target.value)}
                  placeholder="Enter a place"
                  autoComplete="off"
                />
              </div>

              <div className="answer-group">
                <label htmlFor="things">📦 Thing</label>
                <input
                  id="things"
                  type="text"
                  value={answers.things}
                  onChange={(e) => handleChange('things', e.target.value)}
                  placeholder="Enter a thing"
                  autoComplete="off"
                />
              </div>
            </div>

            <button
              className="submit-answers-btn"
              onClick={handleSubmit}
              disabled={submitted}
            >
              Submit Answers
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export default RoundPlaying;
