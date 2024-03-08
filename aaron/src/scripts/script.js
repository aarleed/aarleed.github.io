// import { WORDS } from "./words.js";

// TODO: assume words is populated? might need localStorage
// const WORDS = ["test", "tree", "exam" , "dog", "cat",
//          "book", "bark", "sun", "shine", "pages", "desk", "drawer"];
let WORDS1 = ["sleep", "dream", "inspire", "spark", "cages", "jail", "votes", "election", "above", "under", 
"America", "China", "goal", "target", "farm", "fields"]
let WORDS = ["mince", "slice", "hotel", "inn", "onion", "shallot", "flag", "patriot", "Vegas", "gamble", "nose", "eye"]
const MATCHES = new Map();
for (let i = 0; i<WORDS.length; i+=2) {
  MATCHES.set(WORDS[i], WORDS[i+1])
}
console.log(MATCHES)
// MATCHES.set('tree', 'bark');

// MATCHES.set('dog', 'cat');

// MATCHES.set('test', 'exam');

// MATCHES.set('sun', 'shine');

// MATCHES.set('book', 'pages');

// MATCHES.set('desk', 'drawer');
var seed = 1;
function random() {
    var x = Math.sin(seed++) * 10000;
    return x - Math.floor(x);
}

function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
  }
}

shuffleArray(WORDS)

let explored = Array(WORDS.length).fill(false);
let finished = new Set();




const NUMBER_OF_GUESSES = 3;
let guessesRemaining = NUMBER_OF_GUESSES;
let currentGuess = [];
let nextLetter = 0;
let rightGuessString = WORDS[Math.floor(Math.random() * WORDS.length)];
let eventListeners = [];
let mistakes = 0;
let mistakesHistory = {
  "<6":0,
  "6-8":0,
  "9-11":0,
  "12+":0
}
let guesses = [];

// min game state requires
// TODO: reset board after 12am

function initBoard() {
  let lastDate = localStorage.getItem('currentDate');
  const currentDate = new Date()
  if (lastDate != null) {
    lastDate = new Date(lastDate)
    if (isNextDay(lastDate, currentDate)) {
      // start new game
      console.log('new date new game')
      // TODO: start a new game
    }
    else if (localStorage.key('explored') != null) {
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
  if (WORDS.length == finished.size) {
    endGame(false);
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

function isNextDay(date1, date2) {
  // Extract year, month, and day from both dates
  const year1 = date1.getFullYear();
  const month1 = date1.getMonth();
  const day1 = date1.getDate();

  const year2 = date2.getFullYear();
  const month2 = date2.getMonth();
  const day2 = date2.getDate();

  // Check if date2 is exactly one day after date1
  return year2 === year1 && month2 === month1 && day2 === day1 + 1;
}

function initState(previous) {
  // TODO: give design to tiles?
  if (previous) {
    explored = JSON.parse(localStorage.getItem('explored'));
    const tempArr = JSON.parse(localStorage.getItem('finished'))
    finished = new Set(tempArr);
    mistakes = JSON.parse(localStorage.getItem('statistics'))
  }
  let board = document.getElementById("game-board");
  for (let i = 0; i < NUMBER_OF_GUESSES; i++) {
    let row = document.createElement("div");
    row.className = "letter-row";

    for (let j = 0; j < 4; j++) {
      let card = document.createElement("div");
      card.className = "card";
      
      let cardInner = document.createElement("div")
      cardInner.className = "card-inner"
      card.appendChild(cardInner)
      let cardFront = document.createElement("div")
      cardFront.className = "card-front"
      cardFront.textContent = WORDS[i*4 + j]
      let cardBack = document.createElement("div")
      cardBack.className = "card-back"
      cardBack.textContent = WORDS[i*4 + j]
      cardInner.appendChild(cardFront)
      cardInner.appendChild(cardBack)
      if (previous) {
        if (finished.has(i*4 + j)) {
          cardBack.style.backgroundColor = "#6ca965"
          flip(cardInner)
        }
      }
      row.appendChild(card);
    }
    board.appendChild(row);
  }
}

function openModal(content=null) {
  var model = document.getElementById('modal')
  var span = document.getElementById('close')
  model.style.display = "block"
  span.onclick = function () {
    modal.style.display = "none";
  }
  window.onclick = function(event) {
    if (event.target == modal) {
      modal.style.display = "none";
    }
  }
  localStorage.setItem('noIntro', 'true')
}

initBoard();

if (localStorage.getItem('noIntro')) {
  // skip intro
} else {
  openModal();
}

var cardELS = document.querySelectorAll('.card');
console.log(cardELS)

const handleClick = (el, index) => {
  var cardInnerDiv = el.querySelector('.card-inner');
  flip(cardInnerDiv)
  explore(el, index)
}

cardELS.forEach(function (el, index) {
  if (!finished.has(index)) {
    var listenerFct = function () {handleClick(el, index)}
    eventListeners.push(listenerFct)
    el.addEventListener('click', listenerFct)
  }
})

function check(guesses) {
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
      var card1back = card1.querySelector('.card-back')
      var card2back = card2.querySelector('.card-back')
      card1back.style.backgroundColor = "#6ca965 "
      card2back.style.backgroundColor = "#6ca965"
      animateCSS(card1, "flipInX"); animateCSS(card2, "flipInX");
    }, 1000)
    finished.add(i1); finished.add(i2);
    let finishedArr = Array.from(finished)
    localStorage.setItem('finished', JSON.stringify(finishedArr))
    if (WORDS.length == finished.size) {
        endGame(true);
    }
  } else {
    setTimeout(function () {
      animateCSS(card1, "headShake"); animateCSS(card2, "headShake")
    }, 300)
    
    setTimeout( function () {
      var card1InnerDiv = card1.querySelector('.card-inner');
      var card2InnerDiv = card2.querySelector('.card-inner');
      flip(card1InnerDiv); flip(card2InnerDiv);
    } , 1700)
    console.log('animate, update with cards flipped back')
  }
  updateDialog(i1, i2, correct)

}

function endGame(animate) {
    if (animate) {
      setTimeout(function () {
        cardELS.forEach(function (el) {
          animateCSS(el, "flipInX");
        })
        let dialog = document.getElementById("game-dialog");
        dialog.textContent = "Nice! You finished with " + mistakes.toString() + " mistakes";
      }, 1500) 
      // TODO: have history display
      mistakesHistory = updateHistory(mistakesHistory)
      localStorage.setItem('history', JSON.stringify(mistakesHistory))
    } else {
      let dialog = document.getElementById("game-dialog");
      dialog.textContent = "Nice! You finished with " + mistakes.toString() + " mistakes";
    }
}

function updateHistory(mistakesHistory) {
  let storedItem = localStorage.getItem("history");
  if (storedItem != null) {
    mistakesHistory = JSON.parse(storedItem)
  } 
  console.log(mistakesHistory)

  switch (true) {
    case mistakes < 6:
      mistakesHistory['<6'] += 1
      break;
    case mistakes >= 6 && mistakes <= 8:
      mistakesHistory['6-8'] += 1
      break;
    case mistakes >= 9 && mistakes <= 12:
      mistakesHistory['9=11'] += 1
      break;
    default:
      console.log("Mistakes is greater than 12");
  }
  return mistakesHistory
}

function updateDialog(i1, i2, correct) {
  // TODO: save dialog somewhere?
    let dialog = document.getElementById("game-dialog")
    if (correct) {
      dialog.textContent = WORDS[i1] + " and " + WORDS[i2] + " are a pair! Nice job!"
    } else {
      dialog.textContent = WORDS[i1] + " and " + WORDS[i2] + " are not a pair.. try again!"
    }
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


