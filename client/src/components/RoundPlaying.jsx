import { useState, useEffect, useRef } from 'react';
import './RoundPlaying.css';

function RoundPlaying({ roundData, timer, playerId, playerName, onSubmitAnswers }) {
  const [answers, setAnswers] = useState({
    people: '',
    animals: '',
    places: '',
    things: ''
  });
  const [submitted, setSubmitted] = useState(false);
  const autoSubmittedRef = useRef(false); // Track if we've already auto-submitted
  const maxTimerRef = useRef(null); // Track the max timer value seen to detect if timer is counting down

  const letter = roundData?.letter || '';

  const handleChange = (category, value) => {
    if (submitted) return;
    setAnswers(prev => ({ ...prev, [category]: value }));
  };

  const handleSubmit = () => {
    if (submitted) return;
    onSubmitAnswers(answers);
    setSubmitted(true);
  };

  // Auto-submit when timer reaches 0 (only once, and only after timer has actually counted down)
  useEffect(() => {
    // Track the max timer value to detect if we're in an active round
    if (timer > 0) {
      if (maxTimerRef.current === null || timer > maxTimerRef.current) {
        maxTimerRef.current = timer;
      }
    }
    
    // Only auto-submit if timer is 0 AND we've seen a higher value (timer was counting down)
    if (timer === 0 && !submitted && !autoSubmittedRef.current && maxTimerRef.current !== null && maxTimerRef.current > 0) {
      autoSubmittedRef.current = true;
      handleSubmit();
    }
  }, [timer]);

  // Reset auto-submit flag and timer tracker when a new round starts
  useEffect(() => {
    autoSubmittedRef.current = false;
    maxTimerRef.current = null;
    setSubmitted(false);
  }, [roundData?.letter]);

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
