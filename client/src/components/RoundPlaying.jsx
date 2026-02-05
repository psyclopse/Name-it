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
  const submittedRef = useRef(false); // Use ref to track submission to avoid state staling

  const letter = roundData?.letter || '';

  const handleChange = (category, value) => {
    if (submitted) return;
    setAnswers(prev => ({ ...prev, [category]: value }));
  };

  const handleSubmit = () => {
    if (submittedRef.current) return;
    console.log('Submitting answers:', answers);
    submittedRef.current = true;
    onSubmitAnswers(answers);
    setSubmitted(true);
  };

  // Auto-submit when timer reaches 0
  useEffect(() => {
    console.log('Timer update:', timer, 'submitted:', submittedRef.current);
    if (timer === 0 && !submittedRef.current) {
      console.log('Timer reached 0, auto-submitting with answers:', answers);
      handleSubmit();
    }
  }, [timer, answers]);

  // Reset for each new round
  useEffect(() => {
    console.log('New round started with letter:', letter);
    submittedRef.current = false;
    setSubmitted(false);
    setAnswers({
      people: '',
      animals: '',
      places: '',
      things: ''
    });
  }, [letter]);

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
