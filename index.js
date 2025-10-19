// Initial Setup
// =============

// gereral element
const application = document.getElementById("app");
const body = document.getElementById("body");
const screen = document.getElementById("screen");
const clickSound = new Audio('sound/click-sound.wav');

// display elements
const display = document.getElementById('display');
const result = document.getElementById('result');

// buttons
const keys = document.querySelectorAll('.key');
const equalsBtn = document.getElementById('equals');
const clearBtn = document.getElementById('clear');
const delBtn = document.getElementById('del');

// panels
const settingsPanel = document.getElementById('settings');
const openSettingsBtn = document.getElementById('open-settings');
const applySettingsBtn = document.getElementById('apply-settings')
const closeSettingsBtn = document.getElementById('close-settings');

const historyPanel = document.getElementById('history');
const historyContainer = document.getElementById('history-container');
const openHistoryBtn = document.getElementById('open-history');
const clearHistoryBtn = document.getElementById ('clear-history');

// settings controls
const themeSelect = document.getElementById('theme');
const languageSelect = document.getElementById('language');
const soundToggle = document.getElementById('sound-toggle');

// Global State
let currentInput = '';
let lastAnswer = 0;
// load history
let history = JSON.parse(localStorage.getItem('calcHistory')) || [];
updateHistory();

// Helper function to toggle panels
function togglePanel(panelToToggle, otherPanel) {
  const isHidden = panelToToggle.classList.contains('hidden');
  panelToToggle.classList.toggle('hidden', !isHidden);
  otherPanel.classList.add('hidden');
}

// Event listeners for settings and history buttons
openSettingsBtn.addEventListener('click', () => togglePanel(settingsPanel, historyPanel));
openHistoryBtn.addEventListener('click', () => togglePanel(historyPanel, settingsPanel));


// dictionary
let translation = {
  en: {
    settings: "Settings",
    history: "History",
    clearHistory: "Clear History",
    theme: "Theme",
    language: "Language",
    sound: "Sound",
    apply: "Apply",
    dark: "Dark",
    light: "Light"
  },
  ar: {
    settings: "الإعدادات",
    history: "السجل",
    clearHistory: "مسح السجل",
    theme: "النمط",
    language: "اللغة",
    sound: "الصوت",
    apply: "تطبيق",
    dark: "داكن",
    light: "فاتح"
  }
};

//------------------------------------------------

// Handel number and operation buttons (adding event listeners)
//=====================================

// add click listeners to all keys
keys.forEach(key => {
  const value = key.dataset.value;
  const fn = key.dataset.fn;

  key.addEventListener('click', () => {

    playClickSound();
    if (display.textContent === 'Error' || result.textContent === 'Error') {
      currentInput = '';
      updateDisplay();
      updateResult();
    }

    if (value) {
      const lastChar = currentInput.slice(-1);

      if (
        ['+', '-', '*', '/'].includes(value) &&
        ['+', '-', '*', '/'].includes(lastChar)
      ) {
        currentInput = currentInput.slice(0, -1) + value;
      } else {
        currentInput += value;
      }

      updateResult();
      updateDisplay();

    } else if (fn) {
      handleFunction(fn);
    }
  });
});

// Equals button
equalsBtn.addEventListener('click', () => {
  if (!currentInput) return;

  const evalResult = calculateExpression(currentInput);
    
  result.textContent = currentInput;
  display.textContent = evalResult;

  if (evalResult !== 'Error') lastAnswer = evalResult;

  history.unshift({ expression: currentInput, value: evalResult }); // make sure the new calculation are added at the top of history container
  currentInput = String(evalResult);
  
  updateHistory();
});


// clear all input
clearBtn.addEventListener('click', () => {
  currentInput = '';
  result.textContent = '0';
  updateDisplay();
});

// delete last character
delBtn.addEventListener('click', () => {
  currentInput = currentInput.slice(0, -1);
  updateDisplay();
  updateResult();
});

// apply settings button
applySettingsBtn.addEventListener('click', () => {
  updateHistory();
  changeTheme();
  changeLanguage(languageSelect.value);
});

// Clear History
clearHistoryBtn.addEventListener('click', () => {
  history = [];
  localStorage.removeItem('calcHistory');
  historyContainer.innerHTML = '';
});

//------------------------------------------

// Functions
//=====================

// Function to update display
function updateDisplay() {
  display.textContent = currentInput || '0';

  // Auto-scroll to the right (end)
  display.scrollLeft = display.scrollWidth;
}

// Function to update result
function updateResult() {
  result.textContent = currentInput || '0';
  result.scrollLeft = result.scrollWidth;
}

// Function to update history
function updateHistory() {
  historyContainer.innerHTML = ''; // clear display (not the history array)
  history.forEach(item => {
    let div = document.createElement('div');
    div.textContent = `${item.expression} = ${item.value}`;
    if (themeSelect.value === "light") {
      div.classList.add('history-item');
      div.classList.add('history-item-light');
    } else if (themeSelect.value === "dark") {
      div.classList.add('history-item');
      div.classList.add('history-item-dark');
    }
    
    // Click to reuse
    div.addEventListener('click', () => {
      currentInput = item.expression;
      updateDisplay();
    });

    historyContainer.appendChild(div);
  });

  // Save updated history to localStorage
  localStorage.setItem('calcHistory', JSON.stringify(history));
}

// evaluate function
function calculateExpression(expr) {
  try {
    // auto-close any unbalanced '('
    const openCount = (expr.match(/\(/g) || []).length;
    const closeCount = (expr.match(/\)/g) || []).length;
    expr += ')'.repeat(openCount - closeCount);


    expr = expr
    .replace(/÷/g, '/')
    .replace(/×/g, '*')
    .replace(/sin\(/g, 'Math.sin(')
    .replace(/cos\(/g, 'Math.cos(')
    .replace(/tan\(/g, 'Math.tan(')
    .replace(/log\(/g, 'Math.log10(')
    .replace(/ln\(/g, 'Math.log(')
    .replace(/sqrt\(/g, 'Math.sqrt(')
    .replace(/abs\(/g, 'Math.abs(')
    .replace(/exp\(/g, 'Math.exp(')
    .replace(/(\d+)!/g, (_, n) => factorial(Number(n)));

    const resultValue = Function('"use strict"; return (' + expr + ')')();
    return resultValue;
  } catch (error) {
    return 'Error';
  }
}

// factorial helper
function factorial(n) {
  if (n < 0) return NaN;
  if (n === 0 || n === 1) return 1;
  let res = 1;
  for (let i = 2; i <= n; i++) res *= i;
  return res;
}

// function to handle fn
function handleFunction(fn) {
  const lastChar = currentInput.slice(-1);

  // Add '*' only before math functions that take arguments
  const functionsNeedingMultiplication = ['sin', 'cos', 'tan', 'log', 'sqrt'];
  if (/[0-9)]/.test(lastChar) && functionsNeedingMultiplication.includes(fn)) {
    currentInput += '*';
  }

  switch (fn) {
    case 'sqrt':
    case 'sin':
    case 'cos':
    case 'tan':
    case 'log':
    case 'ln':
    case 'abs':
    case 'exp':
      // Insert the function name followed by (
      currentInput += fn + '(';
      break;

    case 'pow':
      currentInput += '**';
      break;

    case 'pi':
      currentInput += Math.PI.toString();
      break;

    case 'e':
      currentInput += Math.E.toString();
      break;

    case 'rand':
      currentInput += Math.random().toString();
      break;

    case 'inv':
      currentInput = '1/(' + currentInput + ')';
      break;

    case 'fact':
      currentInput = currentInput + '!';
      break;

    case 'ans':
      currentInput += String(lastAnswer || 0);
      break;

    case 'toggle-sign':
      currentInput = currentInput.startsWith('-')
        ? currentInput.slice(1)
        : '-' + currentInput;
      break;
  }

  updateResult();
  updateDisplay();
}

// changing theme
function changeTheme() {
  if (theme.value === "dark") {
    application.classList.add('dark-theme');
    body.classList.add('dark-theme');
    screen.classList.add('dark-theme-screen');
  }
  else {
    application.classList.remove('dark-theme');
    body.classList.remove('dark-theme');
    screen.classList.remove('dark-theme-screen');
  }
}

// changing language
function changeLanguage(lang) {
  document.documentElement.lang = lang;
  document.body.dir = (lang === "ar") ? "rtl" : "ltr";

  document.querySelectorAll("[data-key]").forEach(el => {
    const key = el.getAttribute("data-key");
    el.textContent = translation[lang][key] || key;
  });

  localStorage.setItem("language", lang)
}

function playClickSound() {
  if (soundToggle.checked) {
    clickSound.currentTime = 0;
    clickSound.play();
  }
}