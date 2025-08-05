// Game page functionality
import { 
    getUrlParams, 
    showError, 
    hideError, 
    getRandomLetter,
    validateAnswer,
    CATEGORIES,
    GAME_STATES,
    ROUND_DURATION
} from './utils.js';

class GameController {
    constructor() {
        this.roomCode = null;
        this.playerName = null;
        this.isHost = false;
        this.roomListener = null;
        this.timer = null;
        this.timeLeft = ROUND_DURATION;
        
        this.initializeFromUrl();
        this.initializeElements();
        this.attachEventListeners();
        this.startListening();
    }

    initializeFromUrl() {
        const params = getUrlParams();
        this.roomCode = params.roomCode;
        this.playerName = params.playerName;
        
        if (!this.roomCode || !this.playerName) {
            showError('Missing room or player information. Redirecting to home...');
            setTimeout(() => window.location.href = 'index.html', 2000);
            return;
        }
    }

    initializeElements() {
        // Header elements
        this.gameRoomCodeSpan = document.getElementById('gameRoomCode');
        this.roundNumberSpan = document.getElementById('roundNumber');
        this.playerNameSpan = document.getElementById('playerName');
        this.playerScoreSpan = document.getElementById('playerScore');
        
        // Game state containers
        this.waitingState = document.getElementById('waitingState');
        this.playingState = document.getElementById('playingState');
        this.reviewState = document.getElementById('reviewState');
        this.resultsState = document.getElementById('resultsState');
        
        // Waiting state elements
        this.playersGrid = document.getElementById('playersGrid');
        this.hostControls = document.getElementById('hostControls');
        this.lettersGrid = document.getElementById('lettersGrid');
        
        // Playing state elements
        this.currentLetterSpan = document.getElementById('currentLetter');
        this.timerDisplay = document.getElementById('timerDisplay');
        this.submitAnswersBtn = document.getElementById('submitAnswersBtn');
        
        // Answer inputs
        this.answerInputs = {
            people: document.getElementById('peopleAnswer'),
            things: document.getElementById('thingsAnswer'),
            animals: document.getElementById('animalsAnswer'),
            places: document.getElementById('placesAnswer')
        };
        
        // Review state elements
        this.reviewGrid = document.getElementById('reviewGrid');
        this.submitReviewBtn = document.getElementById('submitReviewBtn');
        
        // Results state elements
        this.resultsGrid = document.getElementById('resultsGrid');
        this.leaderboardList = document.getElementById('leaderboardList');
        this.nextRoundControls = document.getElementById('nextRoundControls');
        this.nextRoundBtn = document.getElementById('nextRoundBtn');
        
        // Actions
        this.leaveGameBtn = document.getElementById('leaveGameBtn');
    }

    attachEventListeners() {
        this.submitAnswersBtn.addEventListener('click', () => this.submitAnswers());
        this.submitReviewBtn.addEventListener('click', () => this.submitReview());
        this.nextRoundBtn.addEventListener('click', () => this.startNextRound());
        this.leaveGameBtn.addEventListener('click', () => this.leaveGame());
        
        // Enter key for answer inputs
        Object.values(this.answerInputs).forEach(input => {
            input.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') this.submitAnswers();
            });
        });
    }

    async startListening() {
        if (!this.roomCode) return;
        
        const roomRef = db.collection('rooms').doc(this.roomCode);
        
        // Check if room exists first
        const roomSnap = await roomRef.get();
        if (!roomSnap.exists) {
            showError('Room not found. Redirecting to home...');
            setTimeout(() => window.location.href = 'index.html', 2000);
            return;
        }
        
        const roomData = roomSnap.data();
        this.isHost = roomData.host === this.playerName;
        
        // Update header
        this.gameRoomCodeSpan.textContent = this.roomCode;
        this.playerNameSpan.textContent = this.playerName;
        
        // Start listening for changes
        this.roomListener = roomRef.onSnapshot((doc) => {
            if (doc.exists) {
                this.handleRoomUpdate(doc.data());
            } else {
                showError('Room no longer exists. Redirecting to home...');
                setTimeout(() => window.location.href = 'index.html', 2000);
            }
        });
    }

    handleRoomUpdate(roomData) {
        // Update round number and score
        this.roundNumberSpan.textContent = roomData.currentRound || 1;
        this.playerScoreSpan.textContent = roomData.scores[this.playerName] || 0;
        
        // Handle different game states
        switch (roomData.gameState) {
            case GAME_STATES.WAITING:
                this.showWaitingState(roomData);
                break;
            case GAME_STATES.PLAYING:
                this.showPlayingState(roomData);
                break;
            case GAME_STATES.REVIEWING:
                this.showReviewState(roomData);
                break;
            case GAME_STATES.RESULTS:
                this.showResultsState(roomData);
                break;
            case GAME_STATES.FINISHED:
                this.showFinalResults(roomData);
                break;
        }
    }

    showWaitingState(roomData) {
        this.hideAllStates();
        this.waitingState.style.display = 'block';
        
        // Update players grid
        this.updatePlayersGrid(roomData.players, roomData.host);
        
        // Show host controls if user is host
        if (this.isHost) {
            this.hostControls.style.display = 'block';
            this.generateLettersGrid(roomData.usedLetters || []);
        } else {
            this.hostControls.style.display = 'none';
        }
    }

    showPlayingState(roomData) {
        this.hideAllStates();
        this.playingState.style.display = 'block';
        
        // Update current letter
        this.currentLetterSpan.textContent = roomData.currentLetter || 'A';
        
        // Start timer if round just started
        if (roomData.roundStartTime && !this.timer) {
            const startTime = roomData.roundStartTime.toDate();
            const elapsed = Math.floor((new Date() - startTime) / 1000);
            this.timeLeft = Math.max(0, ROUND_DURATION - elapsed);
            this.startTimer();
        }
        
        // Check if player has already submitted
        if (roomData.answers && roomData.answers[this.playerName]) {
            this.submitAnswersBtn.textContent = 'Answers Submitted';
            this.submitAnswersBtn.disabled = true;
        }
    }

    showReviewState(roomData) {
        this.hideAllStates();
        this.reviewState.style.display = 'block';
        
        this.generateReviewGrid(roomData);
    }

    showResultsState(roomData) {
        this.hideAllStates();
        this.resultsState.style.display = 'block';
        
        this.generateResultsGrid(roomData);
        this.updateLeaderboard(roomData.scores);
        
        // Show next round button for host
        if (this.isHost) {
            this.nextRoundControls.style.display = 'block';
        }
    }

    hideAllStates() {
        this.waitingState.style.display = 'none';
        this.playingState.style.display = 'none';
        this.reviewState.style.display = 'none';
        this.resultsState.style.display = 'none';
        
        // Clear timer
        if (this.timer) {
            clearInterval(this.timer);
            this.timer = null;
        }
    }

    updatePlayersGrid(players, host) {
        this.playersGrid.innerHTML = '';
        
        players.forEach(player => {
            const playerCard = document.createElement('div');
            playerCard.className = 'player-card';
            if (player === host) playerCard.classList.add('host');
            
            playerCard.innerHTML = `
                <h4>${player}</h4>
                <p>${player === host ? 'Host' : 'Player'}</p>
            `;
            
            this.playersGrid.appendChild(playerCard);
        });
    }

    generateLettersGrid(usedLetters) {
        this.lettersGrid.innerHTML = '';
        
        const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
        
        alphabet.forEach(letter => {
            const letterBtn = document.createElement('button');
            letterBtn.className = 'letter-btn';
            letterBtn.textContent = letter;
            letterBtn.disabled = usedLetters.includes(letter);
            
            letterBtn.addEventListener('click', () => this.selectLetter(letter));
            
            this.lettersGrid.appendChild(letterBtn);
        });
    }

    async selectLetter(letter) {
        if (!this.isHost) return;
        
        try {
            const roomRef = db.collection('rooms').doc(this.roomCode);
            await roomRef.update({
                gameState: GAME_STATES.PLAYING,
                currentLetter: letter,
                roundStartTime: new Date(),
                usedLetters: firebase.firestore.FieldValue.arrayUnion(letter),
                answers: {} // Reset answers for new round
            });
        } catch (error) {
            console.error('Error selecting letter:', error);
            showError('Failed to start round. Please try again.');
        }
    }

    startTimer() {
        this.timer = setInterval(() => {
            this.timeLeft--;
            this.timerDisplay.textContent = this.timeLeft;
            
            // Update timer circle styling
            const timerCircle = document.querySelector('.timer-circle');
            if (this.timeLeft <= 10) {
                timerCircle.classList.add('danger');
            } else if (this.timeLeft <= 20) {
                timerCircle.classList.add('warning');
            }
            
            if (this.timeLeft <= 0) {
                clearInterval(this.timer);
                this.timer = null;
                this.submitAnswers(); // Auto-submit when time runs out
            }
        }, 1000);
    }

    async submitAnswers() {
        const answers = {};
        const currentLetter = this.currentLetterSpan.textContent;
        
        // Collect answers
        Object.keys(this.answerInputs).forEach(category => {
            const input = this.answerInputs[category];
            const answer = input.value.trim();
            if (answer) {
                answers[category] = answer;
            }
        });
        
        try {
            const roomRef = db.collection('rooms').doc(this.roomCode);
            await roomRef.update({
                [`answers.${this.playerName}`]: answers
            });
            
            this.submitAnswersBtn.textContent = 'Answers Submitted';
            this.submitAnswersBtn.disabled = true;
            
            // Disable inputs
            Object.values(this.answerInputs).forEach(input => {
                input.disabled = true;
            });
            
        } catch (error) {
            console.error('Error submitting answers:', error);
            showError('Failed to submit answers. Please try again.');
        }
    }

    generateReviewGrid(roomData) {
        this.reviewGrid.innerHTML = '';
        
        Object.keys(roomData.answers).forEach(player => {
            const playerAnswers = roomData.answers[player];
            const playerDiv = document.createElement('div');
            playerDiv.className = 'player-answers';
            playerDiv.innerHTML = `<h4>${player}'s Answers</h4>`;
            
            Object.keys(CATEGORIES).forEach(category => {
                if (playerAnswers[category]) {
                    const answerDiv = document.createElement('div');
                    answerDiv.className = 'answer-review';
                    answerDiv.innerHTML = `
                        <div class="answer-text">
                            <strong>${CATEGORIES[category].label}:</strong> ${playerAnswers[category]}
                        </div>
                        <div class="answer-votes">
                            <button class="vote-btn" data-player="${player}" data-category="${category}" data-vote="correct">✓</button>
                            <button class="vote-btn" data-player="${player}" data-category="${category}" data-vote="incorrect">✗</button>