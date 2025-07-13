let scores = {};
let history = [];
let currentPlayer = 1;
let playerNames = {};
let totalPlayers = 2;

const letterScores = {
  A: 1,  B: 3,  C: 3,  D: 2,  E: 1,
  F: 4,  G: 2,  H: 4,  I: 1,  J: 8,
  K: 5,  L: 1,  M: 3,  N: 1,  O: 1,
  P: 3,  Q: 10, R: 1,  S: 1,  T: 1,
  U: 1,  V: 4,  W: 4,  X: 8,  Y: 4,
  Z: 10,
};

let validWords = new Set();
let definitions = {};
let dictionaryReady = false;

// This will hold letter bonus states per letter index: 1=none, 2=double, 3=triple
let letterBonusMap = {};

window.addEventListener("load", () => {
  fetch("words.json")
    .then((res) => res.json())
    .then((data) => {
      initializeWords(data);
      dictionaryReady = true;
      const scoreEl = document.getElementById("word-score");
      if (scoreEl) scoreEl.innerText = "Dictionary loaded.";
    })
    .catch(() => alert("Failed to load dictionary."));

  setupPlayerCountListener();
  showSetupScreen();
  setupInputListener();
});

function initializeWords(data) {
  validWords = new Set(Object.keys(data));
  definitions = data;
}

function setupPlayerCountListener() {
  const playerCountSelect = document.getElementById("playerCount");
  playerCountSelect.addEventListener("change", showNameInputs);
}

function showSetupScreen() {
  document.getElementById("setup-screen").style.display = "block";
  document.getElementById("game-screen").style.display = "none";
  showNameInputs();
}

function showGameScreen() {
  document.getElementById("setup-screen").style.display = "none";
  document.getElementById("game-screen").style.display = "block";
  renderScoreboardAndButtons();
  updateTurnUI();
  updateWordDisplay();  // Show clickable letters above input
  updateWordValidity();
}

function showNameInputs() {
  const count = parseInt(document.getElementById("playerCount").value, 10);
  const nameInputsDiv = document.getElementById("nameInputs");
  nameInputsDiv.innerHTML = "";
  for (let i = 1; i <= count; i++) {
    const input = document.createElement("input");
    input.type = "text";
    input.id = `playerName${i}`;
    input.placeholder = `Player ${i} Name`;
    input.value = `Player ${i}`;
    input.style.margin = "0.3rem auto";
    input.style.display = "block";
    input.style.padding = "0.4rem";
    input.style.width = "80%";
    input.style.borderRadius = "5px";
    nameInputsDiv.appendChild(input);
  }
}

function startGame() {
  totalPlayers = parseInt(document.getElementById("playerCount").value, 10);
  if (totalPlayers < 2) {
    alert("Please select at least 2 players.");
    return;
  }
  scores = {};
  playerNames = {};
  history = [];
  letterBonusMap = {};
  for (let i = 1; i <= totalPlayers; i++) {
    const name =
      document.getElementById(`playerName${i}`).value.trim() || `Player ${i}`;
    playerNames[i] = name;
    scores[i] = 0;
  }
  currentPlayer = 1;
  showGameScreen();
}

function renderScoreboardAndButtons() {
  const scoreboard = document.getElementById("scoreboard");
  const playerButtonsRow = document.getElementById("playerButtons");

  scoreboard.innerHTML = "";
  playerButtonsRow.innerHTML = "";

  for (let i = 1; i <= totalPlayers; i++) {
    const playerDiv = document.createElement("div");
    playerDiv.className = "player";

    const nameH2 = document.createElement("h2");
    nameH2.textContent = playerNames[i];
    playerDiv.appendChild(nameH2);

    const scoreTile = document.createElement("div");
    scoreTile.id = `score${i}`;
    scoreTile.className = "score-tile";
    scoreTile.textContent = scores[i];
    playerDiv.appendChild(scoreTile);

    scoreboard.appendChild(playerDiv);

    const btn = document.createElement("button");
    btn.textContent = `Add to ${playerNames[i]}`;
    btn.onclick = () => addToPlayer(i);
    playerButtonsRow.appendChild(btn);
  }
}

function setupInputListener() {
  const input = document.getElementById("wordInput");
  if (input) {
    input.addEventListener("input", () => {
      letterBonusMap = {}; // reset letter bonuses on input change
      updateWordDisplay();
      updateWordValidity();
    });
  }
}

// NEW: updateWordDisplay shows the entered word as clickable letters
function updateWordDisplay() {
  const wordInput = document.getElementById("wordInput");
  const wordDisplay = document.getElementById("wordDisplay");
  if (!wordInput || !wordDisplay) return;

  const word = wordInput.value.toUpperCase().replace(/[^A-Z]/g, "");

  // Clear current display
  wordDisplay.innerHTML = "";

  for (let i = 0; i < word.length; i++) {
    const letter = word[i];
    const span = document.createElement("span");
    span.className = "letter";
    span.textContent = letter;

    // Set bonus class for styling
    if (letterBonusMap[i] === 2) {
      span.classList.add("bonus-double");
    } else if (letterBonusMap[i] === 3) {
      span.classList.add("bonus-triple");
    }

    // On click, cycle bonus: none(1) -> double(2) -> triple(3) -> none(1)
    span.onclick = () => {
      const current = letterBonusMap[i] || 1;
      const next = current === 3 ? 1 : current + 1;
      letterBonusMap[i] = next;
      updateWordDisplay(); // re-render to update styles
      updateWordValidity(); // update score and feedback
    };

    wordDisplay.appendChild(span);
  }
}

function getLetterBonusMap() {
  // Return current letterBonusMap, defaulting to 1 for letters without assigned bonus
  const result = {};
  for (let i = 0; i < 100; i++) {
    // arbitrary large upper bound to avoid keys with no letters
    if (letterBonusMap[i]) {
      result[i] = letterBonusMap[i];
    }
  }
  return result;
}

function calculateScrabbleScoreWithBonuses(word, letterBonusMap, wordBonus) {
  return (
    word
      .toUpperCase()
      .split("")
      .reduce(
        (sum, char, i) =>
          sum + (letterScores[char] || 0) * (letterBonusMap[i] || 1),
        0
      ) * wordBonus
  );
}

function addToPlayer(player) {
  if (!dictionaryReady) {
    alert("Dictionary is still loading.");
    return;
  }

  if (player !== currentPlayer) {
    alert(`It's ${playerNames[currentPlayer]}'s turn.`);
    return;
  }

  const wordInput = document.getElementById("wordInput");
  if (!wordInput) return;
  const word = wordInput.value.trim().toLowerCase();

  if (!word || !validWords.has(word)) {
    document.getElementById("word-score").innerText = "❌ Not a playable word";
    document.getElementById("definition").innerText = "";
    return;
  }

  const bonusMap = getLetterBonusMap();
  const wordBonus = parseInt(document.getElementById("wordBonus").value);
  const score = calculateScrabbleScoreWithBonuses(word, bonusMap, wordBonus);

  scores[player] += score;
  history.push({ player, word, score });

  document.getElementById(`score${player}`).innerText = scores[player];
  document.getElementById("word-score").innerText = `✅ Score: ${score}`;
  document.getElementById("definition").innerText = definitions[word] || "";

  wordInput.value = "";
  letterBonusMap = {};
  updateWordDisplay();
  updateWordValidity();

  currentPlayer = (currentPlayer % totalPlayers) + 1;
  updateTurnUI();
}

function updateTurnUI() {
  for (let i = 1; i <= totalPlayers; i++) {
    const tile = document.getElementById(`score${i}`);
    if (tile?.parentElement) {
      tile.parentElement.style.opacity = i === currentPlayer ? "1" : "0.5";
    }
  }

  document.querySelectorAll("#playerButtons button").forEach((btn, idx) => {
    btn.disabled = idx + 1 !== currentPlayer;
  });

  const wordInput = document.getElementById("wordInput");
  const wordBonus = document.getElementById("wordBonus");
  if (wordInput) wordInput.disabled = false;
  if (wordBonus) wordBonus.disabled = false;
}

function updateWordValidity() {
  const wordInput = document.getElementById("wordInput");
  const scoreEl = document.getElementById("word-score");
  const defEl = document.getElementById("definition");
  if (!wordInput || !scoreEl || !defEl) return;

  const word = wordInput.value.trim().toLowerCase();

  if (!dictionaryReady) {
    scoreEl.innerText = "Loading dictionary...";
    defEl.innerText = "";
    scoreEl.classList.remove("hidden");
    defEl.classList.add("hidden");
    scoreEl.classList.remove("not-playable");
    return;
  }

  if (word.length === 0) {
    scoreEl.classList.add("hidden");
    defEl.classList.add("hidden");
    scoreEl.classList.remove("not-playable");
    return;
  }

  if (validWords.has(word)) {
    const bonusMap = getLetterBonusMap();
    const wordBonus = parseInt(document.getElementById("wordBonus").value);
    const score = calculateScrabbleScoreWithBonuses(word, bonusMap, wordBonus);
    scoreEl.innerText = `✅ Score: ${score}`;
    defEl.innerText = definitions[word] || "";

    scoreEl.classList.remove("hidden", "not-playable");
    defEl.classList.remove("hidden");
  } else {
    scoreEl.innerText = "❌ Not a playable word";
    defEl.innerText = "";

    scoreEl.classList.remove("hidden");
    scoreEl.classList.add("not-playable");
    defEl.classList.add("hidden");
  }
}

function undoLastAction() {
  if (history.length === 0) {
    alert("Nothing to undo.");
    return;
  }
  const last = history.pop();
  scores[last.player] -= last.score;
  if (scores[last.player] < 0) scores[last.player] = 0;
  document.getElementById(`score${last.player}`).innerText =
    scores[last.player];
  document.getElementById("word-score").innerText = `Undo: ${last.word}`;
  document.getElementById("definition").innerText = "";
  currentPlayer = last.player;
  updateTurnUI();
}

function showHistoryLog() {
  const historyList = document.getElementById("historyList");
  historyList.innerHTML = "";

  if (history.length === 0) {
    const li = document.createElement("li");
    li.textContent = "No history yet.";
    historyList.appendChild(li);
  } else {
    history.forEach(({ player, word, score }, index) => {
      const li = document.createElement("li");
      li.textContent = `${index + 1}. ${
        playerNames[player]
      } played "${word.toUpperCase()}" for ${score} points`;
      historyList.appendChild(li);
    });
  }

  document.getElementById("historyModal").style.display = "flex";
}

function closeHistory() {
  document.getElementById("historyModal").style.display = "none";
}
