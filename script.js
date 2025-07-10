const scores = { 1: 0, 2: 0 };
let history = [];
let currentPlayer = 1;

const letterScores = {
  A: 1,
  B: 3,
  C: 3,
  D: 2,
  E: 1,
  F: 4,
  G: 2,
  H: 4,
  I: 1,
  J: 8,
  K: 5,
  L: 1,
  M: 3,
  N: 1,
  O: 1,
  P: 3,
  Q: 10,
  R: 1,
  S: 1,
  T: 1,
  U: 1,
  V: 4,
  W: 4,
  X: 8,
  Y: 4,
  Z: 10,
};

let validWords = new Set();
let definitions = {};
let dictionaryReady = false;

window.addEventListener("load", () => {
  setupInputListener();
  updateTurnUI();

  fetch("words.json")
    .then((res) => res.json())
    .then((data) => {
      initializeWords(data);
      dictionaryReady = true;
      document.getElementById("word-score").innerText =
        "Dictionary loaded. You can start playing!";
      document.getElementById("wordInput").disabled = false;
      document.getElementById("wordBonus").disabled = false;

      const buttons = document.querySelectorAll(".buttons button");
      buttons.forEach((button) => {
        if (
          button.textContent.includes("Dictionary Lookup") ||
          button.textContent.includes("Undo")
        ) {
          button.disabled = false;
        } else {
          button.disabled = false;
        }
      });
    })
    .catch((err) => {
      console.error("Failed to load words.json", err);
      alert("Failed to load word list. The app won’t work properly.");
    });

  document.getElementById("wordInput").disabled = true;
  document.getElementById("wordBonus").disabled = true;

  const buttons = document.querySelectorAll(".buttons button");
  buttons.forEach((button) => {
    if (
      button.textContent.includes("Dictionary Lookup") ||
      button.textContent.includes("Undo")
    ) {
      button.disabled = false;
    } else {
      button.disabled = true;
    }
  });
});

function initializeWords(data) {
  validWords = new Set(Object.keys(data));
  definitions = data;
}

function setupInputListener() {
  const input = document.getElementById("wordInput");
  input.addEventListener("input", updateLetterBonuses);
  updateLetterBonuses();
}

function updateLetterBonuses() {
  const word = document
    .getElementById("wordInput")
    .value.toUpperCase()
    .replace(/[^A-Z]/g, "");
  const container = document.getElementById("letterBonuses");
  container.innerHTML = "";

  for (let i = 0; i < word.length; i++) {
    const letter = word[i];
    const div = document.createElement("div");
    div.className = "letter-bonus";

    const span = document.createElement("span");
    span.textContent = letter;
    div.appendChild(span);

    const select = document.createElement("select");
    select.dataset.index = i;
    select.title = `Select bonus for letter ${letter}`;

    const options = [
      { val: 1, text: "None" },
      { val: 2, text: "Double Letter" },
      { val: 3, text: "Triple Letter" },
    ];

    options.forEach((opt) => {
      const option = document.createElement("option");
      option.value = opt.val;
      option.text = opt.text;
      select.appendChild(option);
    });

    div.appendChild(select);
    container.appendChild(div);
  }
}

function calculateScrabbleScoreWithBonuses(word, letterBonusMap, wordBonus) {
  let baseScore = 0;
  for (let i = 0; i < word.length; i++) {
    const letter = word[i].toUpperCase();
    const letterScore = letterScores[letter] || 0;
    const bonus = letterBonusMap[i] || 1;
    baseScore += letterScore * bonus;
  }
  return baseScore * wordBonus;
}

function getLetterBonusMap() {
  const letterBonusElements = [
    ...document.querySelectorAll("#letterBonuses select"),
  ];
  const letterBonusMap = {};
  letterBonusElements.forEach((sel) => {
    const idx = parseInt(sel.dataset.index, 10);
    letterBonusMap[idx] = parseInt(sel.value, 10);
  });
  return letterBonusMap;
}

function addToPlayer(player) {
  if (!dictionaryReady) {
    alert("Dictionary is still loading, please wait...");
    return;
  }

  if (player !== currentPlayer) {
    alert(`It's Player ${currentPlayer}'s turn!`);
    return;
  }

  const wordInput = document.getElementById("wordInput");
  const wordRaw = wordInput.value.trim().toLowerCase();

  if (!wordRaw) return;

  if (!validWords.has(wordRaw)) {
    document.getElementById("word-score").innerText = "❌ Not a playable word";
    document.getElementById("definition").innerText = "";
    return;
  }

  const letterBonusMap = getLetterBonusMap();
  const wordBonus = parseInt(document.getElementById("wordBonus").value, 10);

  const score = calculateScrabbleScoreWithBonuses(
    wordRaw,
    letterBonusMap,
    wordBonus
  );
  scores[player] += score;

  history.push({ player, word: wordRaw, score });

  document.getElementById(`score${player}`).innerText = scores[player];
  document.getElementById("word-score").innerText = `✅ Score: ${score}`;
  document.getElementById("definition").innerText = definitions[wordRaw] || "";

  wordInput.value = "";
  updateLetterBonuses();

  currentPlayer = currentPlayer === 1 ? 2 : 1;
  updateTurnUI();
}

function checkWordPlayable() {
  const word = document.getElementById("wordInput").value.trim().toLowerCase();
  if (!word) return;

  if (definitions[word]) {
    document.getElementById("word-score").innerText = "✅ Playable word";
    document.getElementById("definition").innerText = definitions[word];
  } else {
    document.getElementById("word-score").innerText = "❌ Not a playable word";
    document.getElementById("definition").innerText = "";
  }
}

function undoLastAction() {
  if (history.length === 0) {
    alert("No actions to undo.");
    return;
  }
  const lastAction = history.pop();
  scores[lastAction.player] -= lastAction.score;
  if (scores[lastAction.player] < 0) scores[lastAction.player] = 0;

  document.getElementById(`score${lastAction.player}`).innerText =
    scores[lastAction.player];
  document.getElementById(
    "word-score"
  ).innerText = `Undo last word "${lastAction.word}".`;
  document.getElementById("definition").innerText = "";

  currentPlayer = lastAction.player;
  updateTurnUI();
}

function updateTurnUI() {
  for (let p = 1; p <= 2; p++) {
    const playerDiv = document.getElementById(`score${p}`).parentElement;
    playerDiv.style.opacity = p === currentPlayer ? "1" : "0.5";
  }

  const buttons = document.querySelectorAll(".buttons button");
  buttons.forEach((button) => {
    if (
      button.textContent.includes(`Player ${currentPlayer}`) ||
      button.textContent.includes("Dictionary Lookup") ||
      button.textContent.includes("Undo")
    ) {
      button.disabled = false;
    } else {
      button.disabled = true;
    }
  });

  document.getElementById("wordInput").disabled = false;
  document.getElementById("wordBonus").disabled = false;
}
