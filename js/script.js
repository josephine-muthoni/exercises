// ========== APP VERSION ==========
const APP_VERSION = '2.0.2';

// ========== APP STATE ==========
const HABITS = [
  { id: "exercise", label: "🏋️ Exercise (30min+)", emoji: "🏋️" },
  { id: "read", label: "📖 Read 10+ pages", emoji: "📖" },
  { id: "meditate", label: "🧘 Meditate / mindfulness", emoji: "🧘" },
  { id: "hydrate", label: "💧 Hydrate well (2L+)", emoji: "💧" }
];

const MOODS = [
  { emoji: "😊", label: "Great" },
  { emoji: "🙂", label: "Good" },
  { emoji: "😐", label: "Okay" },
  { emoji: "😔", label: "Bad" },
  { emoji: "😡", label: "Awful" }
];

const SUMMARY_EMOJIS = [
  { emoji: "🎉", label: "Amazing" },
  { emoji: "😃", label: "Happy" },
  { emoji: "🙂", label: "Fine" },
  { emoji: "😐", label: "Meh" },
  { emoji: "😞", label: "Rough" },
  { emoji: "😴", label: "Tired" },
  { emoji: "💪", label: "Productive" },
  { emoji: "🌟", label: "Special" }
];

// DOM elements
let currentDate = new Date().toISOString().slice(0,10);
const datePicker = document.getElementById('datePicker');
const prevBtn = document.getElementById('prevDayBtn');
const nextBtn = document.getElementById('nextDayBtn');
const todayBtn = document.getElementById('todayBtn');
const saveBtn = document.getElementById('saveEntryBtn');
const clearBtn = document.getElementById('clearCurrentBtn');
const diaryTextarea = document.getElementById('diaryText');
const habitContainer = document.getElementById('habitContainer');
const moodOptionsDiv = document.getElementById('moodOptions');
const summaryOptionsDiv = document.getElementById('summaryOptions');
const statusMsg = document.getElementById('statusMsg');
const recentDiv = document.getElementById('recentEntriesList');

let currentMood = "😐";
let currentSummaryEmoji = "🙂";
let moodButtons = [];
let summaryButtons = [];

// ========== DARK MODE ==========
function initTheme() {
  const savedTheme = localStorage.getItem('theme');
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const isDark = savedTheme === 'dark' || (savedTheme === null && prefersDark);
  if (isDark) {
    document.body.classList.add('dark');
    const themeBtn = document.getElementById('themeToggle');
    if (themeBtn) themeBtn.innerHTML = '☀️ Light Mode';
  } else {
    document.body.classList.remove('dark');
    const themeBtn = document.getElementById('themeToggle');
    if (themeBtn) themeBtn.innerHTML = '🌙 Dark Mode';
  }
}

function toggleTheme() {
  const isDark = document.body.classList.toggle('dark');
  localStorage.setItem('theme', isDark ? 'dark' : 'light');
  const themeBtn = document.getElementById('themeToggle');
  if (themeBtn) themeBtn.innerHTML = isDark ? '☀️ Light Mode' : '🌙 Dark Mode';
  showStatus(isDark ? '🌙 Dark mode enabled' : '☀️ Light mode enabled', false);
}

// ========== SERVICE WORKER & AUTO-UPDATE ==========
let newWorker = null;
let updateNotification = document.getElementById('updateNotification');

function showUpdateNotification() {
  if (updateNotification) {
    updateNotification.style.display = 'block';
    updateNotification.onclick = () => {
      if (newWorker) {
        newWorker.postMessage({ action: 'skipWaiting' });
        showStatus('🔄 Updating app...', false);
      } else {
        window.location.reload();
      }
    };
  }
}

function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js').then(reg => {
      console.log('✅ Service Worker registered');
      
      setInterval(() => reg.update(), 60000);
      
      reg.addEventListener('updatefound', () => {
        newWorker = reg.installing;
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            showUpdateNotification();
          }
        });
      });
    }).catch(err => console.log('SW registration failed'));
    
    navigator.serviceWorker.addEventListener('message', event => {
      if (event.data && event.data.action === 'reload') {
        setTimeout(() => window.location.reload(), 500);
      }
    });
  }
}

function manualUpdate() {
  if ('serviceWorker' in navigator) {
    showStatus('🔄 Checking for updates...', false);
    navigator.serviceWorker.getRegistration().then(reg => {
      if (reg) {
        reg.update();
        setTimeout(() => showStatus('✅ Check complete!', false), 1500);
      } else {
        showStatus('✅ Latest version', false);
      }
    });
  }
}

function showStatus(msg, isError = false) {
  statusMsg.textContent = msg;
  statusMsg.style.backgroundColor = isError ? "#ffe0db" : "var(--status-msg-bg)";
  statusMsg.style.color = isError ? "#b13e2d" : "var(--status-msg-color)";
  setTimeout(() => {
    if (statusMsg.textContent === msg) {
      statusMsg.style.backgroundColor = "var(--status-msg-bg)";
      statusMsg.style.color = "var(--status-msg-color)";
      statusMsg.textContent = "✨ Ready";
    }
  }, 2200);
}

// ========== LOCAL STORAGE ==========
function getStorageKey(dateStr) { return `emojournal_${dateStr}`; }
function loadEntryFromStorage(dateStr) {
  const raw = localStorage.getItem(getStorageKey(dateStr));
  return raw ? JSON.parse(raw) : null;
}
function saveEntryToStorage(dateStr, entry) {
  localStorage.setItem(getStorageKey(dateStr), JSON.stringify(entry));
}
function deleteEntryFromStorage(dateStr) {
  localStorage.removeItem(getStorageKey(dateStr));
}
function getAllEntryDates() {
  return Object.keys(localStorage)
    .filter(key => key.startsWith("emojournal_"))
    .map(key => key.replace("emojournal_", ""))
    .filter(date => /^\d{4}-\d{2}-\d{2}$/.test(date))
    .sort().reverse();
}

// ========== HABIT UI ==========
function buildHabitCheckboxes() {
  habitContainer.innerHTML = "";
  HABITS.forEach(habit => {
    const wrapper = document.createElement('div');
    wrapper.className = 'habit-item';
    const cb = document.createElement('input');
    cb.type = 'checkbox';
    cb.id = `habit_${habit.id}`;
    cb.className = 'habit-check';
    const label = document.createElement('label');
    label.htmlFor = `habit_${habit.id}`;
    label.innerText = habit.label;
    wrapper.appendChild(cb);
    wrapper.appendChild(label);
    habitContainer.appendChild(wrapper);
  });
}

function getCurrentHabitsState() {
  const state = {};
  HABITS.forEach(habit => {
    const cb = document.getElementById(`habit_${habit.id}`);
    state[habit.id] = cb ? cb.checked : false;
  });
  return state;
}

function setHabitsFromState(habitsObj) {
  HABITS.forEach(habit => {
    const cb = document.getElementById(`habit_${habit.id}`);
    if (cb) cb.checked = habitsObj?.[habit.id] === true;
  });
}

// ========== MOOD UI ==========
function buildMoodUI() {
  moodOptionsDiv.innerHTML = "";
  moodButtons = [];
  MOODS.forEach(m => {
    const btn = document.createElement('button');
    btn.className = 'mood-btn';
    btn.innerHTML = `${m.emoji} <span>${m.label}</span>`;
    btn.dataset.emoji = m.emoji;
    btn.addEventListener('click', () => setActiveMood(m.emoji));
    moodOptionsDiv.appendChild(btn);
    moodButtons.push(btn);
  });
}

function setActiveMood(emoji) {
  currentMood = emoji;
  moodButtons.forEach(btn => {
    if (btn.dataset.emoji === emoji) btn.classList.add('active');
    else btn.classList.remove('active');
  });
}

// ========== SUMMARY UI ==========
function buildSummaryUI() {
  summaryOptionsDiv.innerHTML = "";
  summaryButtons = [];
  SUMMARY_EMOJIS.forEach(item => {
    const btn = document.createElement('button');
    btn.className = 'summary-btn';
    btn.innerHTML = `${item.emoji} <span>${item.label}</span>`;
    btn.dataset.emoji = item.emoji;
    btn.addEventListener('click', () => setActiveSummary(item.emoji));
    summaryOptionsDiv.appendChild(btn);
    summaryButtons.push(btn);
  });
}

function setActiveSummary(emoji) {
  currentSummaryEmoji = emoji;
  summaryButtons.forEach(btn => {
    if (btn.dataset.emoji === emoji) btn.classList.add('active');
    else btn.classList.remove('active');
  });
}

// ========== LOAD/SAVE ==========
function loadEntryToUI(dateStr) {
  const entry = loadEntryFromStorage(dateStr);
  if (entry) {
    setActiveMood(entry.moodEmoji || "😐");
    setActiveSummary(entry.summaryEmoji || "🙂");
    diaryTextarea.value = entry.diaryText || "";
    setHabitsFromState(entry.habits || {});
  } else {
    setActiveMood("😐");
    setActiveSummary("🙂");
    diaryTextarea.value = "";
    setHabitsFromState({});
  }
}

function buildCurrentEntryObject() {
  return {
    moodEmoji: currentMood,
    summaryEmoji: currentSummaryEmoji,
    diaryText: diaryTextarea.value.trim(),
    habits: getCurrentHabitsState(),
    lastUpdated: new Date().toISOString()
  };
}

function saveCurrentEntry() {
  const entry = buildCurrentEntryObject();
  saveEntryToStorage(currentDate, entry);
  showStatus(`✅ Saved ${currentDate}`);
  refreshRecentEntriesList();
}

function resetCurrentDateEntry() {
  deleteEntryFromStorage(currentDate);
  setActiveMood("😐");
  setActiveSummary("🙂");
  diaryTextarea.value = "";
  setHabitsFromState({});
  showStatus(`🗑️ Reset ${currentDate}`, false);
  refreshRecentEntriesList();
}

// ========== RECENT ENTRIES ==========
function refreshRecentEntriesList() {
  const allDates = getAllEntryDates();
  if (allDates.length === 0) {
    recentDiv.innerHTML = `<div style="color: var(--text-light); text-align: center;">✨ No entries yet — start journaling!</div>`;
    return;
  }
  recentDiv.innerHTML = "";
  for (let date of allDates.slice(0, 12)) {
    const entry = loadEntryFromStorage(date);
    if (!entry) continue;
    const summaryEmoji = entry.summaryEmoji || "📅";
    const moodEmoji = entry.moodEmoji || "😐";
    const card = document.createElement('div');
    card.className = 'recent-card';
    const infoDiv = document.createElement('div');
    infoDiv.className = 'recent-info';
    const diaryPreview = entry.diaryText ? (entry.diaryText.length > 20 ? entry.diaryText.slice(0,20)+"…" : entry.diaryText) : "—";
    infoDiv.innerHTML = `
      <span class="recent-date">${date}</span>
      <span class="recent-summary">${summaryEmoji}</span>
      <span class="recent-mood">${moodEmoji}</span>
      <span style="font-size:0.7rem;">📝 ${diaryPreview}</span>
    `;
    const actionsDiv = document.createElement('div');
    const loadBtn = document.createElement('button');
    loadBtn.textContent = "📂 Load";
    loadBtn.className = "load-recent";
    loadBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      currentDate = date;
      datePicker.value = currentDate;
      loadEntryToUI(currentDate);
      showStatus(`Loaded ${date}`);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
    const delBtn = document.createElement('button');
    delBtn.textContent = "🗑️";
    delBtn.className = "del-recent";
    delBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (confirm(`Delete entry for ${date}?`)) {
        deleteEntryFromStorage(date);
        if (currentDate === date) resetCurrentDateEntry();
        refreshRecentEntriesList();
        if (currentDate === date) loadEntryToUI(currentDate);
      }
    });
    actionsDiv.appendChild(loadBtn);
    actionsDiv.appendChild(delBtn);
    card.appendChild(infoDiv);
    card.appendChild(actionsDiv);
    recentDiv.appendChild(card);
  }
}

// ========== DATE NAVIGATION ==========
function setCurrentDate(newDateStr) {
  currentDate = newDateStr;
  datePicker.value = currentDate;
  loadEntryToUI(currentDate);
  refreshRecentEntriesList();
}

function changeDateBy(delta) {
  const dateObj = new Date(currentDate);
  dateObj.setDate(dateObj.getDate() + delta);
  setCurrentDate(dateObj.toISOString().slice(0,10));
}

// ========== OFFLINE DETECTION ==========
window.addEventListener('load', () => {
  if (!navigator.onLine) {
    document.getElementById('offlineIndicator').style.display = 'block';
  }
});
window.addEventListener('online', () => {
  document.getElementById('offlineIndicator').style.display = 'none';
});
window.addEventListener('offline', () => {
  document.getElementById('offlineIndicator').style.display = 'block';
});

// ========== VERSION BADGE ==========
function addVersionBadge() {
  const badge = document.createElement('div');
  badge.className = 'version-badge';
  badge.innerHTML = `v${APP_VERSION}`;
  badge.title = 'Tap to check for updates';
  badge.onclick = () => manualUpdate();
  document.body.appendChild(badge);
}

// ========== INITIALIZE ==========
function init() {
  initTheme();
  buildHabitCheckboxes();
  buildMoodUI();
  buildSummaryUI();
  setActiveMood("😐");
  setActiveSummary("🙂");
  datePicker.value = currentDate;
  loadEntryToUI(currentDate);
  refreshRecentEntriesList();
  registerServiceWorker();
  addVersionBadge();

  document.getElementById('themeToggle')?.addEventListener('click', toggleTheme);
  document.getElementById('updateBtn')?.addEventListener('click', manualUpdate);
  prevBtn.addEventListener('click', () => changeDateBy(-1));
  nextBtn.addEventListener('click', () => changeDateBy(1));
  todayBtn.addEventListener('click', () => setCurrentDate(new Date().toISOString().slice(0,10)));
  datePicker.addEventListener('change', (e) => setCurrentDate(e.target.value));
  saveBtn.addEventListener('click', () => { saveCurrentEntry(); refreshRecentEntriesList(); });
  clearBtn.addEventListener('click', () => {
    if (confirm(`Reset all data for ${currentDate}?`)) resetCurrentDateEntry();
  });
  
  showStatus(`📔 Ready!`, false);
}

init();