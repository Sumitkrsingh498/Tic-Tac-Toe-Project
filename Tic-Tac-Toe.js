const board = document.getElementById("board"),
      statusText = document.getElementById("statusText"),
      playerWinsDisplay = document.getElementById("playerWins"),
      aiWinsDisplay = document.getElementById("aiWins"),
      drawsDisplay = document.getElementById("draws"),
      modeSelect = document.getElementById("modeSelect"),
      aiDifficulty = document.getElementById("aiDifficulty"),
      player1Input = document.getElementById("player1Name"),
      player2Input = document.getElementById("player2Name");

const startScreen = document.getElementById("startScreen"),
      nameEntryScreen = document.getElementById("nameEntryScreen"),
      gamePlayScreen = document.getElementById("gamePlayScreen");

const playAiBtn = document.getElementById("playAiBtn"),
      playFriendBtn = document.getElementById("playFriendBtn"),
      startGameBtn = document.getElementById("startGameBtn");

let boardState = Array(9).fill(""),
    currentPlayer = "X",
    gameActive = true;

// Helps for localStorage score management
const scoreManager = {
    get: key => +localStorage.getItem(key) || 0,
    increment: key => localStorage.setItem(key, scoreManager.get(key) + 1)
};


const showScreen = screenId => {
    [startScreen, nameEntryScreen, gamePlayScreen].forEach(screen => {
        screen.id === screenId + "Screen" ? screen.classList.remove("hidden") : screen.classList.add("hidden");
    });
    if (screenId !== 'gamePlay') {
        gameActive = false;
        statusText.textContent = "";
    }
};

const showNameEntryScreen = mode => {
    showScreen('nameEntry');
    modeSelect.value = mode;
    loadNames();
    checkModeSettings();
};

const startGamePlay = () => {
    showScreen('gamePlay');
    resetGame();
};

// Game board rendering
const renderBoard = () => {
    board.innerHTML = "";
    boardState.forEach((value, i) => {
        const cell = document.createElement("div");
        cell.className = "cell";
        if (value) {
            cell.textContent = value;
            cell.classList.add(value.toLowerCase());
        }
        cell.addEventListener("click", () => makeMove(i));
        board.appendChild(cell);
    });
};

// Game move logic
const makeMove = index => {
    if (!gameActive || boardState[index]) return;

    boardState[index] = currentPlayer;
    renderBoard();

    if (checkWin(currentPlayer)) {
        endGame(currentPlayer);
    } else if (boardState.every(Boolean)) {
        endGame("draw");
    } else {
        currentPlayer = currentPlayer === "X" ? "O" : "X";
        updateStatusText();
        if (modeSelect.value === "ai" && currentPlayer === "O") {
            aiMove();
        }
    }
};

// AI move logic
const aiMove = () => setTimeout(() => makeMove(aiDifficulty.value === "easy" ? getRandomMove() : getBestMove()), 500);

const getRandomMove = () => {
    const empty = boardState.map((v, i) => v === "" ? i : null).filter(v => v !== null);
    return empty[Math.floor(Math.random() * empty.length)];
};

const getBestMove = () => {
    let bestScore = -Infinity;
    let move;
    boardState.forEach((cell, i) => {
        if (!cell) {
            boardState[i] = "O";
            let score = minimax([...boardState], 0, false); // Pass a copy
            boardState[i] = "";
            if (score > bestScore) {
                bestScore = score;
                move = i;
            }
        }
    });
    return move;
};

// Minimax algorithm
const minimax = (state, depth, isMaximizingPlayer) => {
    if (checkWin("O")) return 10 - depth;
    if (checkWin("X")) return depth - 10;
    if (state.every(Boolean)) return 0;

    let bestEval = isMaximizingPlayer ? -Infinity : Infinity;
    state.forEach((cell, i) => {
        if (!cell) {
            state[i] = isMaximizingPlayer ? "O" : "X";
            const evalScore = minimax(state, depth + 1, !isMaximizingPlayer);
            state[i] = ""; // Undo move
            bestEval = isMaximizingPlayer ? Math.max(bestEval, evalScore) : Math.min(bestEval, evalScore);
        }
    });
    return bestEval;
};

// Win checking
const winningCombos = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
    [0, 3, 6], [1, 4, 7], [2, 5, 8], // Columns
    [0, 4, 8], [2, 4, 6]             // Diagonals
];
const checkWin = player => winningCombos.some(combo => combo.every(i => boardState[i] === player));

const getWinningCombination = player => {
    for (const combo of winningCombos) {
        if (combo.every(i => boardState[i] === player)) return combo;
    }
    return null;
};

// End game logic
const endGame = outcome => {
    gameActive = false;

    if (outcome === "X" || outcome === "O") {
        const winningCombo = getWinningCombination(outcome);
        if (winningCombo) {
            winningCombo.forEach(index => board.children[index]?.classList.add('winning-glow'));
            setTimeout(() => winningCombo.forEach(index => board.children[index]?.classList.remove('winning-glow')), 2000);
        }
    }

    outcome === "X" ? scoreManager.increment("playerWins") :
    outcome === "O" ? scoreManager.increment("aiWins") :
                      scoreManager.increment("draws");
    
    statusText.textContent = outcome === "X" ? `🏆 ${player1Input.value} wins!` :
                             outcome === "O" ? `🤖 ${player2Input.value} wins!` :
                                               "🤝 It's a draw!";
    updateScores();
};

const updateScores = () => {
    playerWinsDisplay.textContent = `${player1Input.value}: ${scoreManager.get("playerWins")}`;
    aiWinsDisplay.textContent = `${player2Input.value}: ${scoreManager.get("aiWins")}`;
    drawsDisplay.textContent = `Draws: ${scoreManager.get("draws")}`;
};

const updateStatusText = () => {
    if (gameActive) {
        statusText.textContent = `${currentPlayer === "X" ? player1Input.value : player2Input.value}'s turn (${currentPlayer})`;
    }
};

// Game control functions
const resetGame = () => {
    boardState.fill("");
    currentPlayer = "X";
    gameActive = true;
    loadNames();
    renderBoard();
    updateScores();
    updateStatusText();
    checkModeSettings();
};

const saveNames = () => {
    localStorage.setItem("player1Name", player1Input.value);
    localStorage.setItem("player2Name", player2Input.value);
    updateScores();
};

const loadNames = () => {
    player1Input.value = localStorage.getItem("player1Name") || "Player X";
    player2Input.value = localStorage.getItem("player2Name") || (modeSelect.value === "ai" ? "AI" : "Player O");
};

const clearAll = () => {
    localStorage.clear();
    resetGame();
};

const toggleTheme = () => document.body.classList.toggle("dark");

const checkModeSettings = () => {
    const isAiMode = modeSelect.value === "ai";
    aiDifficulty.disabled = !isAiMode;
    aiDifficulty.style.display = isAiMode ? "block" : "none";
    player2Input.placeholder = isAiMode ? "AI Name" : "Player O Name";

    if ((isAiMode && (player2Input.value === "Player O" || player2Input.value === "")) ||
        (!isAiMode && (player2Input.value === "AI" || player2Input.value === ""))) {
        player2Input.value = isAiMode ? "AI" : "Player O";
        saveNames();
    }
    updateScores();
    updateStatusText();
};

// Event Listeners
playAiBtn.addEventListener("click", () => showNameEntryScreen("ai"));
playFriendBtn.addEventListener("click", () => showNameEntryScreen("2p"));
startGameBtn.addEventListener("click", startGamePlay);

window.onload = () => {
    showScreen('start');
    loadNames();
};