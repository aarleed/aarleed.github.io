import { VIBRANT, PASTEL, PASTEL_DARK, TEXT_LIGHT, TEXT_DARK, DARK_TEXT_VIBRANT_INDEX, GREEN, MAX_MISTAKES } from './config.js';
import { shouldCountMistake, getDayIndex, shuffleArray } from './utils.js';

// Epoch for daily word rotation — all players get the same puzzle on the same day
const WORD_PAIR_EPOCH = new Date(2025, 4, 1); // May 1, 2025

let WORDS = [];
const MATCHES = new Map();

async function loadWords() {
  const res = await fetch('/words.json');
  const allDays = await res.json();
  const today = new Date();
  // Days since epoch, wrapped to cycle through available word sets.
  // Uses local time so the puzzle changes at each player's midnight (same as Wordle).
  const dayIndex = getDayIndex(today.getTime(), WORD_PAIR_EPOCH.getTime(), allDays.length);
  WORDS = allDays[dayIndex];
  MATCHES.clear();
  for (let i = 0; i < WORDS.length; i += 2) {
    MATCHES.set(WORDS[i], WORDS[i + 1]);
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
let currentPair = [];
let isProcessing = false;
// True once revealAllCards() has run, so a later theme toggle can re-apply the
// loss-state card-back colors (which differ between light and dark modes).
let cardsRevealed = false;

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

/**
 * Reveals the top/bottom edge gradients on a scrollable sheet only when there
 * is scrolled-away content on that edge, so a fully-visible sheet shows no
 * fade. Wires every [data-sheet-scroll] container; the fade elements are the
 * container's siblings and the toggle classes live on the shared parent card.
 */
function initSheetFades() {
  document.querySelectorAll('[data-sheet-scroll]').forEach(function(el) {
    var card = el.parentElement;
    if (!card) return;
    function update() {
      var scrollable = el.scrollHeight - el.clientHeight > 1;
      var atTop = el.scrollTop <= 1;
      var atBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 1;
      card.classList.toggle('show-fade-top', scrollable && !atTop);
      card.classList.toggle('show-fade-bottom', scrollable && !atBottom);
    }
    el.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    // Fires when the sheet goes from display:none to visible (and when its
    // content changes size), so we don't have to hook every open() path.
    if (window.ResizeObserver) new ResizeObserver(update).observe(el);
    update();
  });
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

    attachCardTilt(card, cardInner);

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
 * Builds an element with a class and (optionally) text content.
 * Using textContent (not innerHTML) means user-controllable values from
 * localStorage or words.json can never be interpreted as HTML — keeps the
 * stats sheet's DOM construction XSS-proof by default.
 */
function el(tag, className, text) {
  var node = document.createElement(tag);
  if (className) node.className = className;
  if (text != null) node.textContent = text;
  return node;
}

/**
 * Renders the "Answers" pair list at the bottom of the stats sheet.
 * Extracted from showStatsSheet so the post-game-only branch reads as a
 * single delegation rather than a 30-line nested block.
 *
 * @param {HTMLElement} pairsContainer - element to populate
 * @param {string[]}    pairColors     - per-pair vibrant colors (one per pair)
 * @param {string[]}    pairTextColors - per-pair text colors (paired with above)
 */
function renderStatsAnswers(pairsContainer, pairColors, pairTextColors) {
  pairsContainer.replaceChildren();
  var originalWords = [];
  for (var key of MATCHES.keys()) {
    originalWords.push([key, MATCHES.get(key)]);
  }
  originalWords.forEach(function(pair, idx) {
    var color = pairColors[idx % pairColors.length];
    var textColor = pairTextColors[idx % pairTextColors.length];
    var row = el('div', 'stats-pair-row');

    var meta = el('div', 'stats-pair-meta');
    meta.appendChild(el('span', 'stats-pair-label', 'Pair'));
    var badge = el('span', 'stats-pair-badge', idx + 1);
    badge.style.background = color;
    badge.style.color = textColor;
    meta.appendChild(badge);
    row.appendChild(meta);

    var words = el('div', 'stats-pair-words');
    words.appendChild(el('span', 'stats-pair-word', pair[0]));
    var line = el('div', 'stats-pair-line');
    line.style.color = color;
    words.appendChild(line);
    words.appendChild(el('span', 'stats-pair-word', pair[1]));
    row.appendChild(words);

    pairsContainer.appendChild(row);
    if (idx < originalWords.length - 1) {
      pairsContainer.appendChild(el('div', 'stats-pair-divider'));
    }
  });
}

/**
 * Displays the end-of-game stats sheet with results, distribution chart, and answer pairs.
 * Slides up from the bottom of the screen.
 * @param {boolean} won - Whether the player won (true) or lost (false).
 */
// streakInfo (optional): { prev, next } — when provided, the streak animation
// plays first and the stats content is revealed only after "Done" is pressed.
function showStatsSheet(won, streakInfo) {
  var sheet = document.getElementById('stats-sheet');
  var content = document.getElementById('stats-sheet-card');
  var gameIsOver = finished.size >= WORDS.length || mistakes >= MAX_MISTAKES;
  var pairColors = VIBRANT;
  var pairTextColors = VIBRANT.map(function(_, i) { return i === DARK_TEXT_VIBRANT_INDEX ? TEXT_DARK : TEXT_LIGHT; });

  // Header — pre-game shows "Your Statistics" title only; post-game shows
  // logo + result.
  var header = document.getElementById('stats-header');
  header.replaceChildren();
  if (!gameIsOver) {
    header.appendChild(el('p', 'stats-pregame-title', 'Your Statistics'));
  } else {
    var logo = document.createElement('img');
    logo.className = 'stats-logo';
    var darkTheme = document.body.classList.contains('theme-dark');
    logo.src = won
      ? (darkTheme ? '/wordpair-logo-win-dark.svg' : '/wordpair-logo-win.svg')
      : (darkTheme ? '/wordpair-logo-loss-dark.svg' : '/wordpair-logo-loss.svg');
    logo.alt = 'WordPair';
    header.appendChild(logo);
    header.appendChild(el('h2', 'stats-title', won ? 'Congrats!' : 'Game Over!'));
  }

  // Stats grid
  var totalPlayed = Object.values(mistakesHistory).reduce(function(a, b) { return a + b; }, 0);
  var winPerc = totalPlayed > 0 ? Math.round(calculateWinPerc(mistakesHistory)) : 0;
  var currentStreak = parseInt(localStorage.getItem('streakCurrent')) || 0;
  var maxStreak = parseInt(localStorage.getItem('streakMax')) || 0;
  var grid = document.getElementById('stats-grid');
  grid.replaceChildren();
  var statsData = [
    { value: totalPlayed, label: 'played' },
    { value: winPerc + '%', label: 'wins' },
    { value: currentStreak, label: 'current streak' },
    { value: maxStreak, label: 'max streak' }
  ];
  statsData.forEach(function(s) {
    var card = el('div', 'stats-card');
    card.appendChild(el('span', 'stats-card-value', s.value));
    card.appendChild(el('span', 'stats-card-label', s.label));
    grid.appendChild(card);
  });

  // Distribution bars — only highlight the current game's row after the
  // game ends.
  var barsContainer = document.getElementById('stats-bars');
  barsContainer.replaceChildren();
  var maxVal = Math.max.apply(null, Object.values(mistakesHistory).concat([1]));
  for (var i = 0; i <= 6; i++) {
    var key = i + ':';
    var val = mistakesHistory[key] || 0;
    // Highlight the bar for the user's just-played mistake count, but only
    // once the game is actually over — pre-game stats sheet shouldn't pick
    // out a "current" row since there isn't one yet.
    var isCurrentGameBar = gameIsOver && (i === mistakes);
    var barWidth = Math.max(8, (val / maxVal) * 100);
    // In dark mode the bar track is dark, so every count reads light.
    var darkTheme = document.body.classList.contains('theme-dark');
    var row = el('div', 'stats-bar-row');
    row.appendChild(el('span', 'stats-bar-label', i));
    var bar = el('div', 'stats-bar' + (isCurrentGameBar ? ' highlight' : ''));
    bar.style.width = barWidth + '%';
    var count = el('span', 'stats-bar-count', val);
    count.style.color = (isCurrentGameBar || darkTheme) ? TEXT_LIGHT : TEXT_DARK;
    bar.appendChild(count);
    row.appendChild(bar);
    barsContainer.appendChild(row);
  }

  // Answers section — only visible after the game ends.
  var answersSection = document.getElementById('stats-answers');
  answersSection.style.display = gameIsOver ? '' : 'none';
  if (gameIsOver) {
    renderStatsAnswers(
      document.getElementById('stats-pairs'),
      pairColors,
      pairTextColors,
    );
  }

  // Streak phase: when a fresh win supplies streakInfo, play the streak
  // animation first as an opaque overlay ON TOP of the stats content. The
  // stats content stays in normal flow so the sheet keeps its usual size —
  // the modal doesn't resize during or after the animation. The overlay
  // auto-fades to reveal the stats already sitting underneath.
  var streakMain = document.getElementById('streak-main');
  if (streakInfo) {
    streakMain.classList.remove('streak-fading-out');
    streakMain.style.display = 'flex';
    // The overlay auto-fades into the stats content once the streak animation
    // finishes (see playStreakAnimation) — no manual "Done" button needed.
  } else {
    streakMain.style.display = 'none';
  }

  // Show sheet
  content.classList.remove('stats-closing');
  sheet.classList.add('open');

  if (streakInfo) {
    playStreakAnimation(streakInfo.prev, streakInfo.next);
  }

  // Close handler
  document.getElementById('stats-close').onclick = closeStatsSheet;
  sheet.onclick = function(e) { if (e.target === sheet) closeStatsSheet(); };
}

function closeStatsSheet() {
  var sheet = document.getElementById('stats-sheet');
  // Bail out if the sheet isn't actually open. Otherwise we'd add a
  // 'stats-closing' class and an animationend listener to a display:none
  // element. The slide-down animation would never run (so the listener
  // never fires for it), but the listener stays attached and waits for
  // ANY subsequent animation on this element. Next time the sheet opens,
  // the slide-up animationend triggers the stale listener, which then
  // immediately strips the 'open' class and the sheet flashes shut.
  if (!sheet.classList.contains('open')) return;
  var content = document.getElementById('stats-sheet-card');
  content.classList.add('stats-closing');
  content.addEventListener('animationend', function() {
    sheet.classList.remove('open');
    content.classList.remove('stats-closing');
  }, { once: true });
}

// Map a streak number to a card color so consecutive streaks always differ
// and cycle through the same palette as the flipped game cards.
function streakColor(streakNum) {
  var idx = ((streakNum - 1) % VIBRANT.length + VIBRANT.length) % VIBRANT.length;
  return {
    bg: VIBRANT[idx],
    text: idx === DARK_TEXT_VIBRANT_INDEX ? TEXT_DARK : TEXT_LIGHT,
  };
}

function playStreakAnimation(prevStreak, newStreak) {
  var track = document.getElementById('streak-track');
  var trainContainer = document.getElementById('streak-train-container');
  var firstNum = track.querySelector('.streak-circ-first .streak-circ-num');
  var secondNum = track.querySelector('.streak-circ-second .streak-circ-num');

  firstNum.textContent = prevStreak;
  secondNum.textContent = newStreak;

  // When starting from a streak of 0 there's no prior streak, so hide the
  // connector line to the right of the "0" circle.
  track.classList.toggle('first-streak-zero', Number(prevStreak) === 0);

  var c1 = streakColor(prevStreak);
  var c2 = streakColor(newStreak);
  track.style.setProperty('--streak-color-1', c1.bg);
  track.style.setProperty('--streak-color-2', c2.bg);
  track.style.setProperty('--streak-text-1', c1.text);
  track.style.setProperty('--streak-text-2', c2.text);

  // Reset animation by removing class, forcing reflow, then re-adding
  track.classList.remove('sliding');
  trainContainer.classList.remove('chugging');
  void track.offsetWidth;

  setTimeout(function() {
    track.classList.add('sliding');
    trainContainer.classList.add('chugging');
  }, 600);

  // Once the full animation has played out, fade the overlay out to reveal the
  // stats content sitting underneath, then hide it so it stops capturing
  // clicks. Timed to the longest running animation: the sliding classes are
  // added at 600ms and the gray line finishes growing 3.2s later (2.2s delay +
  // 1s), so the whole sequence ends at ~3.8s.
  var streakMain = document.getElementById('streak-main');
  setTimeout(function() {
    streakMain.classList.add('streak-fading-out');
    streakMain.addEventListener('transitionend', function hideAfterFade() {
      streakMain.style.display = 'none';
      streakMain.classList.remove('streak-fading-out');
      streakMain.removeEventListener('transitionend', hideAfterFade);
    }, { once: true });
  }, 4000);
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
initSheetFades();

// Dynamic 3D tilt: the MTA card leans based on where the pointer is over it.
// Applied to #card-flip-container; the front face is backface-hidden, so only
// the card's back (the face shown after the flip) visibly tilts.
function initCardTilt() {
  var container = document.getElementById('card-flip-container');
  if (!container) return;

  var MAX_TILT = 12; // max degrees of tilt at the card's edges

  container.addEventListener('mousemove', function(e) {
    var rect = container.getBoundingClientRect();
    var px = (e.clientX - rect.left) / rect.width;   // 0 (left) .. 1 (right)
    var py = (e.clientY - rect.top) / rect.height;   // 0 (top) .. 1 (bottom)
    var rotX = (0.5 - py) * 2 * MAX_TILT;
    var rotY = (px - 0.5) * 2 * MAX_TILT;
    container.style.transition = 'transform 0.1s ease-out';
    container.style.transform =
      'perspective(1200px) rotateX(' + rotX.toFixed(2) + 'deg) rotateY(' + rotY.toFixed(2) + 'deg) scale(1.03)';
  });

  container.addEventListener('mouseleave', function() {
    container.style.transition = 'transform 0.4s ease';
    container.style.transform = '';
  });
}

initCardTilt();

// Dynamic 3D tilt for a single game card, leaning based on pointer position.
// Only the wordless side tilts: when the card is flipped to show the word
// (.card-inner has .flipCard) the tilt is skipped. The tilt lives on .card so
// it composes with the flip that lives on .card-inner.
function attachCardTilt(card, cardInner) {
  var MAX_TILT = 28; // max degrees at the card's edges
  var baseRect = null;

  card.addEventListener('mouseenter', function() {
    // Capture the untransformed rect (no transition, no transform) so the tilt
    // math reads a stable box and doesn't feed back on itself.
    card.style.transition = 'none';
    card.style.transform = '';
    baseRect = card.getBoundingClientRect();
  });

  card.addEventListener('mousemove', function(e) {
    if (cardInner.classList.contains('flipCard')) {
      card.style.transform = '';
      return;
    }
    if (!baseRect) baseRect = card.getBoundingClientRect();
    var px = (e.clientX - baseRect.left) / baseRect.width;   // 0 (left) .. 1 (right)
    var py = (e.clientY - baseRect.top) / baseRect.height;   // 0 (top) .. 1 (bottom)
    var rotX = (0.5 - py) * 2 * MAX_TILT;
    var rotY = (px - 0.5) * 2 * MAX_TILT;
    card.style.transition = 'transform 0.1s ease-out';
    card.style.transform =
      'perspective(500px) rotateX(' + rotX.toFixed(2) + 'deg) rotateY(' + rotY.toFixed(2) + 'deg)';
  });

  card.addEventListener('mouseleave', function() {
    card.style.transition = 'transform 0.3s ease';
    card.style.transform = '';
    baseRect = null;
  });
}

(async function() {
  await loadWords();
  explored = Array(WORDS.length).fill(false);

  var startScreen = document.getElementById('start-screen');
  var primaryBtn = document.getElementById('start-primary-btn');
  var secondaryBtn = document.getElementById('start-secondary-btn');

  function disableCardAnimation() {
    var container = document.getElementById('card-flip-container');
    var flipper = document.getElementById('card-flipper');
    if (container) container.style.animation = 'none';
    if (flipper) {
      flipper.style.animation = 'none';
      flipper.style.transform = 'rotateY(180deg)';
    }
  }

  var animTodayStr = toLocalDateStr(new Date());
  if (localStorage.getItem('mtaCardAnimatedDate') === animTodayStr) {
    disableCardAnimation();
  } else {
    localStorage.setItem('mtaCardAnimatedDate', animTodayStr);
  }

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
    disableCardAnimation();
    document.getElementById('start-screen').classList.remove('hidden');
  });

  document.getElementById('game-stats-btn').addEventListener('click', function() {
    showStatsSheet(finished.size >= WORDS.length);
  });

  document.getElementById('game-help-btn').addEventListener('click', function() {
    openInstructions();
  });

  // Theme toggle buttons — animate the sun/moon icon swap and apply the
  // dark color scheme. Both buttons stay visually in sync, and `theme-dark`
  // on <body> drives the dark-mode color overrides in the stylesheet.
  var themeButtons = document.querySelectorAll('.theme-toggle-btn');
  themeButtons.forEach(function(btn) {
    btn.addEventListener('click', function() {
      var toDark = !btn.classList.contains('is-dark');
      themeButtons.forEach(function(b) { b.classList.toggle('is-dark', toDark); });
      document.body.classList.toggle('theme-dark', toDark);
      // Re-color already-revealed cards so their backs match the new theme.
      if (cardsRevealed) applyRevealedCardColors();
    });
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
  if (currentPair.length === 1 && currentPair[0].index === index) return;
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


function check(currentPair) {
    moves += 1;
    updateMovesCounter();
    const [first, second] = currentPair;
    const matched = MATCHES.get(WORDS[first.index]) === WORDS[second.index] || MATCHES.get(WORDS[second.index]) === WORDS[first.index];
    // Mistake counting lives outside the match branch so the rule's full
    // truth table (matched × wasExplored1 × wasExplored2) is exercised by
    // shouldCountMistake() in a single place. See utils.js.
    if (shouldCountMistake(matched, first.wasExplored, second.wasExplored)) {
      mistakes += 1
      localStorage.setItem('statistics', mistakes.toString())
    }
    if (matched) {
      console.log('correct')
      updateBoard(first.el, second.el, first.index, second.index, true)
    } else {
      updateBoard(first.el, second.el, first.index, second.index, false)
    }
   
}

function explore(el, index) {
  // Capture whether this card was explored BEFORE this click, so check()
  // can use the pre-turn state instead of the now-mutated explored array.
  // Without this, click 1 of a turn always sets explored[idx1]=true before
  // click 2's check() runs, making explored[idx1] indistinguishable from
  // a card that was actually seen in a prior turn.
  var wasAlreadyExplored = !!explored[index];
  currentPair.push({ el: el, index: index, wasExplored: wasAlreadyExplored });
  if (currentPair.length == 2) {
    isProcessing = true;
    check(currentPair)
    currentPair = []
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
        var prevStreak = parseInt(localStorage.getItem('streakCurrent')) || 0;
        var newStreak = recordDailyStreak().currentStreak;
        endGame(true, mistakes, prevStreak, newStreak);
        // Fall through to updateDialog so pairs-found gets bumped to 6 on the
        // winning move. Previously this branch returned early, leaving the
        // counter stuck at "5 of 6" until the user reopened the page.
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
      recordDailyStreak();
      endGame(false, mistakes);
      return;
    }
    console.log('animate, update with cards flipped back')
  }
  updateDialog(i1, i2, correct)

}

// Apply the loss-state (pastel) colors to every unmatched card back, picking the
// palette for the active theme. Safe to re-run — used both on reveal and when the
// theme is toggled afterwards so the revealed cards switch light/dark colors.
function applyRevealedCardColors() {
  var darkTheme = document.body.classList.contains('theme-dark');
  var palette = darkTheme ? PASTEL_DARK : PASTEL;
  var cardInners = document.querySelectorAll('#game-board .card-inner');
  cardInners.forEach(function(inner, i) {
    if (finished.has(i)) return; // matched cards keep their vibrant color
    var back = inner.querySelector('.card-back');
    var colorIdx = getPairIndex(i) % palette.length;
    back.style.backgroundColor = palette[colorIdx];
    back.style.color = darkTheme ? TEXT_LIGHT : TEXT_DARK;
  });
}

function revealAllCards() {
  var cardInners = document.querySelectorAll('#game-board .card-inner');
  cardInners.forEach(function(inner) {
    inner.classList.add('flipCard');
  });
  applyRevealedCardColors();
  cardsRevealed = true;
}

function endGame(animate, mistakes, prevStreak, newStreak) {
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
      // Open the stats sheet with the streak animation playing first; the stats
      // content is revealed when the user presses "Done" (see showStatsSheet).
      setTimeout(function () {
        showStatsSheet(won, { prev: prevStreak, next: newStreak });
      }, 1000)
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

function recordDailyStreak() {
  let currentStreak = parseInt(localStorage.getItem('streakCurrent')) || 0;
  let maxStreak = parseInt(localStorage.getItem('streakMax')) || 0;
  let lastPlayDate = localStorage.getItem('lastWinDate'); // legacy key name kept for backward compat

  let today = new Date();
  let todayStr = toLocalDateStr(today);
  let yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  let yesterdayStr = toLocalDateStr(yesterday);

  if (lastPlayDate === todayStr) {
    // Already counted today — don't double-increment.
  } else if (lastPlayDate === yesterdayStr) {
    // Played yesterday AND today → streak continues.
    currentStreak += 1;
  } else {
    // Gap of 2+ days (or first ever game) → start fresh.
    currentStreak = 1;
  }

  maxStreak = Math.max(maxStreak, currentStreak);
  localStorage.setItem('lastWinDate', todayStr); // legacy key name
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


