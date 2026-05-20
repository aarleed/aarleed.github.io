import { VIBRANT, PASTEL, TEXT_LIGHT, TEXT_DARK, DARK_TEXT_VIBRANT_INDEX, GREEN, MAX_MISTAKES } from './config.js';

// Epoch for daily word rotation — all players get the same puzzle on the same day
const WORD_PAIR_EPOCH = new Date(2025, 4, 1); // May 1, 2025

let WORDS = [];
const MATCHES = new Map();

async function loadWords() {
  const res = await fetch('/words.json');
  const allDays = await res.json();
  const today = new Date();
  const msPerDay = 86400000;
  // Days since epoch, wrapped to cycle through available word sets.
  // Uses local time so the puzzle changes at each player's midnight (same as Wordle).
  // The double-modulo handles negative values for dates before the epoch.
  const dayIndex = ((Math.floor((today - WORD_PAIR_EPOCH) / msPerDay) % allDays.length) + allDays.length) % allDays.length;
  WORDS = allDays[dayIndex];
  MATCHES.clear();
  for (let i = 0; i < WORDS.length; i += 2) {
    MATCHES.set(WORDS[i], WORDS[i + 1]);
  }
}
function random(seed) {
    var x = Math.sin(seed++) * 10000;
    return x - Math.floor(x);
}

function shuffleArray(array, seed) {
  for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(random(seed) * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
  }
}


let explored = [];
let finished = new Set();
let moves = 0;

let pairIndexes = [];

function buildPairIndexes() {
  var originalPairs = Array.from(MATCHES.keys());
  pairIndexes = WORDS.map(function(word) {
    for (var p = 0; p < originalPairs.length; p++) {
      var w1 = originalPairs[p];
      if (word === w1 || word === MATCHES.get(w1)) return p;
    }
    return 0;
  });
}

function getPairIndex(wordIndex) {
  return pairIndexes[wordIndex];
}




const NUMBER_OF_GUESSES = 3;
let guessesRemaining = NUMBER_OF_GUESSES;
let currentGuess = [];
let nextLetter = 0;
let eventListeners = [];
let mistakes = 0;
let mistakesHistory = {
  "0:":0,
  "1:":0,
  "2:":0,
  "3:":0,
  "4:":0,
  "5:":0,
  "6:":0,
  "7+:":0
}
let guesses = [];
let isProcessing = false;

function showInstructions() {
  if (!localStorage.getItem('hasSeenInstructions')) {
    const instrModal = document.getElementById('instructions-modal');
    instrModal.style.display = 'flex';
    const closeInstr = function() {
      instrModal.style.display = 'none';
      localStorage.setItem('hasSeenInstructions', 'true');
    };
    document.getElementById('instructions-close').onclick = closeInstr;
    instrModal.onclick = function(event) {
      if (event.target === instrModal) closeInstr();
    };
  }
}

// min game state requires
// TODO: reset board after 12am

function getDateInt(date) {
  const year = date.getFullYear();
  const month = date.getMonth();
  const day = date.getDate();
  date = new Date(year, month, day)
  return date.getTime() / 10000
}

function initBoard() {
  let lastDate = localStorage.getItem('currentDate');
  const currentDate = new Date()
  let currentDateInt = getDateInt(currentDate);
  shuffleArray(WORDS, currentDateInt)
  buildPairIndexes();
  if (lastDate != null) {
    lastDate = new Date(lastDate)
    if (isDiffDay(lastDate, currentDate)) {
      // start new game
      console.log('new date new game')
      newGame(currentDate)
      // TODO: start a new game
    }
    else if (localStorage.getItem('explored') !== null) {
      // init from previous state bc still same date
      console.log('using previous state')
      initState(true)
      localStorage.setItem('currentDate', currentDate.toISOString())
    } else {
      // have history of last date? failsafe
      newGame(currentDate)
    }
  } else {
    newGame(currentDate)
  }
  updateMistakeDots();
  updatePairsCounter();
  updateMovesCounter();
  document.getElementById('total-pairs').textContent = Math.floor(WORDS.length / 2);
  if (WORDS.length == finished.size || mistakes >= MAX_MISTAKES) {
    revealAllCards();
    let dialog = document.getElementById("game-text");
    dialog.textContent = "Nice! You finished with " + mistakes.toString() + " mistakes";
  }
}

function newGame(currentDate) {
  // init from initial state
  console.log('using initial state')
  initState(false)
  localStorage.setItem('statistics', mistakes.toString())
  let finishedArr = Array.from(finished)
  localStorage.setItem('explored', JSON.stringify(explored))
  localStorage.setItem('finished', JSON.stringify(finishedArr))
  localStorage.setItem('currentDate', currentDate.toISOString())
}

function isDiffDay(date1, date2) {
  // Extract year, month, and day from both dates
  const year1 = date1.getFullYear();
  const month1 = date1.getMonth();
  const day1 = date1.getDate();

  const year2 = date2.getFullYear();
  const month2 = date2.getMonth();
  const day2 = date2.getDate();

  // Check if date2 is different than date1
  return year2 != year1 || month2 != month1 || day2 != day1;
}

function fitText(el) {
  let span = el.querySelector('span');
  if (!span) return;
  let fontSize = parseFloat(getComputedStyle(el).fontSize);
  while (span.scrollWidth > el.clientWidth && fontSize > 8) {
    fontSize -= 0.5;
    el.style.fontSize = fontSize + 'px';
  }
}

function initState(previous) {
  if (previous) {
    explored = JSON.parse(localStorage.getItem('explored'));
    const tempArr = JSON.parse(localStorage.getItem('finished'))
    finished = new Set(tempArr);
    mistakes = JSON.parse(localStorage.getItem('statistics'))
    if (localStorage.getItem('history') != null) {mistakesHistory = JSON.parse(localStorage.getItem('history'))}
  }
  let board = document.getElementById("game-board");
  for (let i = 0; i < WORDS.length; i++) {
    let card = document.createElement("div");
    card.className = "card";

    let cardInner = document.createElement("div");
    cardInner.className = "card-inner";
    card.appendChild(cardInner);

    let cardFront = document.createElement("div");
    cardFront.className = "card-front";

    let cardBack = document.createElement("div");
    cardBack.className = "card-back";
    let cardText = document.createElement("span");
    cardText.textContent = WORDS[i];
    cardBack.appendChild(cardText);

    cardInner.appendChild(cardFront);
    cardInner.appendChild(cardBack);

    if (previous && finished.has(i)) {
      var colorIdx = getPairIndex(i) % VIBRANT.length;
      cardBack.style.backgroundColor = VIBRANT[colorIdx];
      cardBack.style.color = (colorIdx === DARK_TEXT_VIBRANT_INDEX) ? TEXT_DARK : TEXT_LIGHT;
      flip(cardInner);
    }
    board.appendChild(card);
  }
  board.querySelectorAll('.card-back').forEach(fitText);
}

/**
 * Displays the end-of-game stats sheet with results, distribution chart, and answer pairs.
 * Slides up from the bottom of the screen.
 * @param {boolean} won - Whether the player won (true) or lost (false).
 */
function showStatsSheet(won) {
  var sheet = document.getElementById('stats-sheet');
  var content = document.getElementById('stats-sheet-card');
  var pairColors = VIBRANT;
  var pairTextColors = VIBRANT.map(function(_, i) { return i === DARK_TEXT_VIBRANT_INDEX ? TEXT_DARK : TEXT_LIGHT; });

  // Header
  var header = document.getElementById('stats-header');
  header.innerHTML = '';
  if (won) {
    header.innerHTML = '<img class="stats-logo" src="/wordpair-logo-win.svg" alt="WordPair" /><h2 class="stats-title">Congrats!</h2>';
  } else {
    header.innerHTML = '<img class="stats-logo" src="/wordpair-logo-loss.svg" alt="WordPair" /><h2 class="stats-title">Game Over!</h2>';
  }

  // Stats grid
  var totalPlayed = Object.values(mistakesHistory).reduce(function(a, b) { return a + b; }, 0);
  var winPerc = totalPlayed > 0 ? Math.round(calculateWinPerc(mistakesHistory)) : 0;
  var currentStreak = parseInt(localStorage.getItem('streakCurrent')) || 0;
  var maxStreak = parseInt(localStorage.getItem('streakMax')) || 0;
  var grid = document.getElementById('stats-grid');
  grid.innerHTML = '';
  var statsData = [
    { value: totalPlayed, label: 'played' },
    { value: winPerc + '%', label: 'wins' },
    { value: currentStreak, label: 'current streak' },
    { value: maxStreak, label: 'max streak' }
  ];
  statsData.forEach(function(s) {
    var card = document.createElement('div');
    card.className = 'stats-card';
    card.innerHTML = '<span class="stats-card-value">' + s.value + '</span><span class="stats-card-label">' + s.label + '</span>';
    grid.appendChild(card);
  });

  // Distribution bars
  var barsContainer = document.getElementById('stats-bars');
  barsContainer.innerHTML = '';
  var maxVal = Math.max.apply(null, Object.values(mistakesHistory).concat([1]));
  for (var i = 0; i <= 6; i++) {
    var key = i + ':';
    var val = mistakesHistory[key] || 0;
    var row = document.createElement('div');
    row.className = 'stats-bar-row';
    // Highlight current game's mistake count
    var highlightThis = (i === mistakes);
    var barWidth = Math.max(8, (val / maxVal) * 100);
    var countColor = highlightThis ? '#ffffff' : '#1f2025';
    row.innerHTML = '<span class="stats-bar-label">' + i + '</span>' +
      '<div class="stats-bar' + (highlightThis ? ' highlight' : '') + '" style="width:' + barWidth + '%">' +
      '<span class="stats-bar-count" style="color:' + countColor + '">' + val + '</span>' +
      '</div>';
    barsContainer.appendChild(row);
  }

  // Answers pairs
  var pairsContainer = document.getElementById('stats-pairs');
  pairsContainer.innerHTML = '';
  var originalWords = [];
  for (var key2 of MATCHES.keys()) {
    originalWords.push([key2, MATCHES.get(key2)]);
  }
  originalWords.forEach(function(pair, idx) {
    var color = pairColors[idx % pairColors.length];
    var textColor = pairTextColors[idx % pairTextColors.length];
    var row = document.createElement('div');
    row.className = 'stats-pair-row';
    row.innerHTML =
      '<div class="stats-pair-meta">' +
        '<span class="stats-pair-label">Pair</span>' +
        '<span class="stats-pair-badge" style="background:' + color + ';color:' + textColor + '">' + (idx + 1) + '</span>' +
      '</div>' +
      '<div class="stats-pair-words">' +
        '<span class="stats-pair-word">' + pair[0] + '</span>' +
        '<div class="stats-pair-line" style="color:' + color + '"></div>' +
        '<span class="stats-pair-word">' + pair[1] + '</span>' +
      '</div>';
    pairsContainer.appendChild(row);
    if (idx < originalWords.length - 1) {
      var divider = document.createElement('div');
      divider.className = 'stats-pair-divider';
      pairsContainer.appendChild(divider);
    }
  });

  // Show sheet
  content.classList.remove('stats-closing');
  sheet.classList.add('open');

  // Close handler
  document.getElementById('stats-close').onclick = closeStatsSheet;
  sheet.onclick = function(e) { if (e.target === sheet) closeStatsSheet(); };
}

function closeStatsSheet() {
  var sheet = document.getElementById('stats-sheet');
  var content = document.getElementById('stats-sheet-card');
  content.classList.add('stats-closing');
  content.addEventListener('animationend', function() {
    sheet.classList.remove('open');
    content.classList.remove('stats-closing');
  }, { once: true });
}



function calculateWinPerc(mistakesHistory) {
  // Calculate the sum of keys 1-6
  let sumKeys1To6 = 0;
  for (let key in mistakesHistory) {
    if (parseInt(key) >= 0 && parseInt(key) <= 6) {
      sumKeys1To6 += mistakesHistory[key];
    }
  }

  // Calculate the total sum of all keys
  let totalSum = 0;
  for (let key in mistakesHistory) {
    totalSum += mistakesHistory[key];
  }

  // Calculate the win percentage
  let winPercentage = sumKeys1To6 / totalSum * 100;
  return winPercentage
}

function formatStartDateOrdinal(date) {
  var month = date.toLocaleString('en-US', { month: 'long' });
  var day = date.getDate();
  var year = date.getFullYear();
  var suffixes = { one: 'st', two: 'nd', few: 'rd', other: 'th' };
  var suffix = suffixes[new Intl.PluralRules('en-US', { type: 'ordinal' }).select(day)];
  return month + ' ' + day + suffix + ', ' + year;
}

function detectStartScreenState() {
  var lastDate = localStorage.getItem('currentDate');
  if (!lastDate) return 'start';
  var stored = new Date(lastDate);
  var today = new Date();
  if (isDiffDay(stored, today)) return 'start';
  var exploredData = localStorage.getItem('explored');
  var finishedData = localStorage.getItem('finished');
  var stats = localStorage.getItem('statistics');
  var finishedSet = finishedData ? new Set(JSON.parse(finishedData)) : new Set();
  var storedMistakes = stats ? parseInt(stats) : 0;
  // Need to know WORDS.length — use finishedSet size check against 12 (standard game size)
  // Actually we check if game is over: finished covers all cards or mistakes >= 6
  var exploredArr = exploredData ? JSON.parse(exploredData) : [];
  if (storedMistakes >= MAX_MISTAKES) return 'lost';
  if (finishedSet.size >= 12) return 'won';
  if (finishedSet.size > 0 || exploredArr.some(Boolean)) return 'resume';
  return 'start';
}

function initStartScreen() {
  var state = detectStartScreenState();
  var subtitle = document.getElementById('start-subtitle');
  var primaryBtn = document.getElementById('start-primary-btn');
  var dateEl = document.getElementById('start-date');
  var today = new Date();
  dateEl.textContent = formatStartDateOrdinal(today);
  dateEl.setAttribute('datetime', today.toISOString().slice(0, 10));

  switch (state) {
    case 'start':
      subtitle.textContent = 'Flip over cards and match related words into pairs';
      primaryBtn.textContent = 'Play';
      break;
    case 'resume':
      subtitle.textContent = 'Welcome back! Continue matching words.';
      primaryBtn.textContent = 'Resume Game';
      break;
    case 'won':
      subtitle.textContent = 'Nice job! You completed today\'s game already.';
      primaryBtn.textContent = 'Admire Puzzle';
      break;
    case 'lost':
      subtitle.textContent = 'You completed today\'s game already. Try again tomorrow!';
      primaryBtn.textContent = 'Admire Puzzle';
      break;
  }
}

initStartScreen();

(async function() {
  await loadWords();
  explored = Array(WORDS.length).fill(false);

  var startScreen = document.getElementById('start-screen');
  var primaryBtn = document.getElementById('start-primary-btn');
  var secondaryBtn = document.getElementById('start-secondary-btn');

  function startGameplay() {
    localStorage.setItem('hasSeenInstructions', 'true');
    // Briefly show all tiles after start screen is dismissed for new games
    if (finished.size === 0 && mistakes === 0 && !explored.some(Boolean)) {
      const allInners = document.querySelectorAll('#game-board .card-inner');
      allInners.forEach(function(inner) { inner.classList.add('flipCard'); });
      removeAllListeners();
      setTimeout(function() {
        allInners.forEach(function(inner) { inner.classList.remove('flipCard'); });
        addEventListeners();
      }, 1500);
    }
    // Show stats sheet for completed games
    if (finished.size >= WORDS.length || mistakes >= MAX_MISTAKES) {
      setTimeout(function() { showStatsSheet(finished.size >= WORDS.length); }, 500);
    }
  }

  function showOnboardingModal(onStart) {
    var modal = document.getElementById('onboarding-modal');
    var card = document.getElementById('onboarding-card');
    var btn = document.getElementById('onboarding-start-btn');
    modal.style.display = 'flex';
    btn.onclick = function() {
      card.classList.add('closing');
      card.addEventListener('animationend', function() {
        modal.style.display = 'none';
        card.classList.remove('closing');
        onStart();
      }, { once: true });
    };
  }

  function dismissStartScreen() {
    startScreen.classList.add('hidden');
    if (!localStorage.getItem('hasSeenInstructions')) {
      showOnboardingModal(startGameplay);
    } else {
      startGameplay();
    }
  }

  primaryBtn.addEventListener('click', function() {
    dismissStartScreen();
  });

  secondaryBtn.addEventListener('click', function() {
    openInstructions();
  });

  initBoard();

  function openInstructions() {
    var instrModal = document.getElementById('instructions-modal');
    instrModal.style.display = 'flex';
    var closeInstr = function() {
      var content = document.getElementById('instructions-content');
      content.classList.add('instructions-closing');
      content.addEventListener('animationend', function() {
        instrModal.style.display = 'none';
        content.classList.remove('instructions-closing');
      }, { once: true });
    };
    document.getElementById('instructions-close').onclick = closeInstr;
    instrModal.onclick = function(event) {
      if (event.target === instrModal) closeInstr();
    };
  }

  document.getElementById('game-back-btn').addEventListener('click', function() {
    closeStatsSheet();
    document.getElementById('start-screen').classList.remove('hidden');
  });

  document.getElementById('game-stats-btn').addEventListener('click', function() {
    showStatsSheet(finished.size >= WORDS.length);
  });

  document.getElementById('game-help-btn').addEventListener('click', function() {
    openInstructions();
  });

  if (localStorage.getItem('noIntro')) {
    // skip intro
  } else {
    // openModal();
    localStorage.setItem('noIntro', 'true')
  }

  var cardELS = document.querySelectorAll('.card');
  console.log(cardELS)

const handleClick = (el, index) => {
  if (isProcessing) return;
  // Defense-in-depth: ignore clicks on already-matched cards. The listener
  // for a finished card is detached on match, but `finished` is the
  // authoritative state so we guard here too in case any rebind path slips.
  if (finished.has(index)) return;
  if (guesses.length === 1 && guesses[0][1] === index) return;
  var cardInnerDiv = el.querySelector('.card-inner');
  flip(cardInnerDiv)
  explore(el, index)
}

  function addEventListeners() {
    cardELS.forEach(function (el, index) {
      // If this card already has a listener stored from a previous call
      // (e.g. the new-game preview-flip cycle re-runs addEventListeners()),
      // detach it before assigning the new one. Otherwise we'd accumulate
      // handlers on the DOM and the array would grow past its index space,
      // making `eventListeners[index]` no longer match what's actually bound.
      var prev = eventListeners[index];
      if (prev) {
        el.removeEventListener('click', prev);
      }
      var listenerFct = function () { handleClick(el, index); };
      eventListeners[index] = listenerFct;
      if (!finished.has(index) && mistakes < MAX_MISTAKES) {
        el.addEventListener('click', listenerFct);
      }
    });
  }

  // add eventListeners after board initialization
  addEventListeners()
})();


function check(guesses) {
    moves += 1;
    updateMovesCounter();
    let card1 = guesses[0][0]
    let idx1 = guesses[0][1]
    let card2 = guesses[1][0]
    let idx2 = guesses[1][1]
    // TODO: check explored
    if (MATCHES.get(WORDS[idx1]) === WORDS[idx2] || MATCHES.get(WORDS[idx2]) === WORDS[idx1]) {
      console.log('correct')
      updateBoard(card1, card2, idx1, idx2, true)
    } else {
      // both need to be explored for mistake
      if (explored[idx1] && explored[idx2]) {
        mistakes += 1
        localStorage.setItem('statistics', mistakes.toString())
      }
      updateBoard(card1, card2, idx1, idx2, false)
    }
   
}

function explore(el, index) {
  guesses.push([el, index]);
  if (guesses.length == 2) {
    isProcessing = true;
    check(guesses)
    guesses = []
  }

  if (explored[index] || finished.has(index)) { // alr been explored
    console.log('already explored')
    console.log(explored[index])
    console.log(finished.has(index))
  } else {
    explored[index] = true;
  }
  localStorage.setItem('explored', JSON.stringify(explored))
}

function flip(card) {
  // console.log(card.classList)
  card.classList.toggle("flipCard");
}

function updateBoard(card1, card2, i1, i2, correct) {
  if (correct) {
    console.log('update with green, animation, removeEventListener')
    card1.removeEventListener('click', eventListeners[i1])
    card2.removeEventListener('click', eventListeners[i2])
    setTimeout( function () {
      var colorIdx = getPairIndex(i1) % VIBRANT.length;
      var color = VIBRANT[colorIdx];
      var textColor = (colorIdx === DARK_TEXT_VIBRANT_INDEX) ? TEXT_DARK : TEXT_LIGHT;
      var card1back = card1.querySelector('.card-back')
      var card2back = card2.querySelector('.card-back')
      card1back.style.backgroundColor = color;
      card2back.style.backgroundColor = color;
      card1back.style.color = textColor;
      card2back.style.color = textColor;
      animateCSS(card1, "flipInX"); animateCSS(card2, "flipInX");
      isProcessing = false;
    }, 1000)
    finished.add(i1); finished.add(i2);
    let finishedArr = Array.from(finished)
    localStorage.setItem('finished', JSON.stringify(finishedArr))
    if (WORDS.length == finished.size) {
        mistakesHistory = updateHistory(mistakesHistory)
        localStorage.setItem('history', JSON.stringify(mistakesHistory))
        updateStreaks(true);
        endGame(true, mistakes);
        
        return;
    }
  } else {
    setTimeout(function () {
      animateCSS(card1, "headShake"); animateCSS(card2, "headShake")
    }, 300)
    // add locking
    removeAllListeners()
    var flipBackTimeout = setTimeout( function () {
      var card1InnerDiv = card1.querySelector('.card-inner');
      var card2InnerDiv = card2.querySelector('.card-inner');
      flip(card1InnerDiv); flip(card2InnerDiv);
      // add back event listeners
      var cardELS = document.querySelectorAll('.card');
      cardELS.forEach(function (el, index) {
        if (!finished.has(index) && mistakes < MAX_MISTAKES) {
          el.addEventListener('click', eventListeners[index])
        }
      })
      isProcessing = false;
    } , 1000)
    if (mistakes >= MAX_MISTAKES) {
      clearTimeout(flipBackTimeout);
      isProcessing = false;
      updateMistakeDots();
      mistakesHistory = updateHistory(mistakesHistory)
      localStorage.setItem('history', JSON.stringify(mistakesHistory))
      updateStreaks(false);
      endGame(false, mistakes);
      return;
    }
    console.log('animate, update with cards flipped back')
  }
  updateDialog(i1, i2, correct)

}

function revealAllCards() {
  var won = (WORDS.length === finished.size);

  var cardInners = document.querySelectorAll('#game-board .card-inner');
  cardInners.forEach(function(inner, i) {
    inner.classList.add('flipCard');
    if (!finished.has(i)) {
      var back = inner.querySelector('.card-back');
      var colorIdx = getPairIndex(i) % PASTEL.length;
      back.style.backgroundColor = PASTEL[colorIdx];
      back.style.color = TEXT_DARK;
    } else if (won) {
      // Won: all cards already have vibrant from matching, nothing to do
    }
  });
}

function endGame(animate, mistakes) {
  console.log('End Game')
  var won = animate; // animate=true means won

  if (animate) {
    revealAllCards();
    setTimeout(function () {
      document.querySelectorAll('.card').forEach(function (el) {
        animateCSS(el, "flipInX");
      })
      let dialog = document.getElementById("game-text");
      dialog.textContent = "Nice! You finished with " + mistakes.toString() + " mistakes";
      setTimeout(function () { showStatsSheet(won); }, 1000)
    }, 1000)

  } else {
    revealAllCards();
    let dialog = document.getElementById("game-text");
    dialog.textContent = "Nice! You finished with " + mistakes.toString() + " mistakes";
    setTimeout(function () { showStatsSheet(won); }, 2000)
  }
  removeAllListeners()
}

function removeAllListeners () {
  // remove all event listeners
  var cardELS = document.querySelectorAll('.card');
  cardELS.forEach(function(card, i) {
    card.removeEventListener('click', eventListeners[i])
    console.log('remove card event listener')
  });
}

function toLocalDateStr(d) {
  return d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0');
}

function updateStreaks(won) {
  let currentStreak = parseInt(localStorage.getItem('streakCurrent')) || 0;
  let maxStreak = parseInt(localStorage.getItem('streakMax')) || 0;
  let lastWinDate = localStorage.getItem('lastWinDate');
  if (won) {
    let today = new Date();
    let todayStr = toLocalDateStr(today);
    let lastStr = lastWinDate || null;
    let yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    let yesterdayStr = toLocalDateStr(yesterday);
    if (lastStr === todayStr) {
      // already counted today
    } else if (lastStr === yesterdayStr) {
      currentStreak += 1;
    } else {
      currentStreak = 1;
    }
    maxStreak = Math.max(maxStreak, currentStreak);
    localStorage.setItem('lastWinDate', todayStr);
  } else {
    currentStreak = 0;
  }
  localStorage.setItem('streakCurrent', currentStreak);
  localStorage.setItem('streakMax', maxStreak);
  return { currentStreak, maxStreak };
}

function updateHistory(mistakesHistory) {
  let storedItem = localStorage.getItem("history");
  if (storedItem != null) {
    mistakesHistory = JSON.parse(storedItem)
  } 

  switch (true) {
    case mistakes < 7:
      let key = mistakes.toString() + ":"
      mistakesHistory[key] += 1
      break
    default:
      mistakesHistory['7+:'] += 1
      console.log("More than 6");
  }
  return mistakesHistory
}

function updateDialog(i1, i2, correct) {
  let dialog = document.getElementById("game-text");
  if (correct) {
    dialog.textContent = "Nice! You found a pair!";
    updatePairsCounter();
  } else {
    dialog.textContent = "Oops... that's not a pair.";
    updateMistakeDots();
  }
}

function updateMistakeDots() {
  const dots = document.querySelectorAll('.mistake-dot');
  dots.forEach(function(dot, i) {
    dot.classList.toggle('used', i >= MAX_MISTAKES - mistakes);
  });
}

function updatePairsCounter() {
  document.getElementById('pairs-found').textContent = Math.floor(finished.size / 2);
}

function updateMovesCounter() {
  document.getElementById('moves-count').textContent = moves;
}

// turn card green when you get it right
function shadeKeyBoard(letter, color) {
  for (const elem of document.getElementsByClassName("keyboard-button")) {
    if (elem.textContent === letter) {
      let oldColor = elem.style.backgroundColor;
      if (oldColor === "green") {
        return;
      }

      if (oldColor === "yellow" && color !== "green") {
        return;
      }

      elem.style.backgroundColor = color;
      break;
    }
  }
}

function deleteLetter() {
  let row = document.getElementsByClassName("letter-row")[6 - guessesRemaining];
  let box = row.children[nextLetter - 1];
  box.textContent = "";
  box.classList.remove("filled-box");
  currentGuess.pop();
  nextLetter -= 1;
}

const animateCSS = (element, animation, prefix = "animate__") =>
  // We create a Promise and return it
  new Promise((resolve, reject) => {
    const animationName = `${prefix}${animation}`;
    // const node = document.querySelector(element);
    const node = element;
    node.style.setProperty("--animate-duration", "0.3s");

    node.classList.add(`${prefix}animated`, animationName);

    // When the animation ends, we clean the classes and resolve the Promise
    function handleAnimationEnd(event) {
      event.stopPropagation();
      node.classList.remove(`${prefix}animated`, animationName);
      resolve("Animation ended");
    }

    node.addEventListener("animationend", handleAnimationEnd, { once: true });
  });


