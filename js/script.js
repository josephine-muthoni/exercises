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

// Helper: show status message
function showStatus(msg, isError = false) {
  statusMsg.textContent = msg;
  statusMsg.style.backgroundColor = isError ? "#ffe0db" : "#eef3e3";
  statusMsg.style.color = isError ? "#b13e2d" : "#2c6e2f";
  setTimeout(() => {
    if (statusMsg.textContent === msg) {
      statusMsg.style.backgroundColor = "#eef3e3";
      statusMsg.style.color = "#5f7c4b";
      statusMsg.textContent = "✨ Ready";
    }
  }, 2200);
}

// localStorage functions
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
    .sort()
    .reverse();
}

// Habit UI functions
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

// Mood UI functions
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

// Summary Emoji UI functions
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

// Load entry into UI
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
  showStatus(`✅ Saved ${currentDate} with summary ${currentSummaryEmoji}`);
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

// Refresh recent entries list
function refreshRecentEntriesList() {
  const allDates = getAllEntryDates();
  if (allDates.length === 0) {
    recentDiv.innerHTML = `<div style="color: #ad8e6e; text-align: center;">✨ No entries yet — start journaling!</div>`;
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
      <span class="recent-summary" title="day summary">${summaryEmoji}</span>
      <span class="recent-mood" title="mood">${moodEmoji}</span>
      <span style="font-size:0.7rem; color:#9b7b5c;">📝 ${diaryPreview}</span>
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
      showStatus(`Loaded ${date} · summary: ${summaryEmoji}`);
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
        showStatus(`Deleted ${date}`, false);
        if (currentDate === date) loadEntryToUI(currentDate);
      }
    });
    actionsDiv.appendChild(loadBtn);
    actionsDiv.appendChild(delBtn);
    card.appendChild(infoDiv);
    card.appendChild(actionsDiv);
    recentDiv.appendChild(card);
  }
  if (allDates.length > 12) {
    const more = document.createElement('div');
    more.style.textAlign = "center";
    more.style.fontSize = "0.7rem";
    more.style.color = "#a98c6d";
    more.innerText = `+ ${allDates.length - 12} more days (keep journaling)`;
    recentDiv.appendChild(more);
  }
}

// Date navigation
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

// PWA Install prompt
let deferredPrompt;
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
  const installPrompt = document.getElementById('installPrompt');
  if (installPrompt) installPrompt.style.display = 'block';
});

document.getElementById('installBtn')?.addEventListener('click', async () => {
  if (deferredPrompt) {
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      document.getElementById('installPrompt').style.display = 'none';
    }
    deferredPrompt = null;
  }
});

document.getElementById('closeInstallBtn')?.addEventListener('click', () => {
  document.getElementById('installPrompt').style.display = 'none';
});

// Offline detection
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

// Initialize app
function init() {
  buildHabitCheckboxes();
  buildMoodUI();
  buildSummaryUI();
  setActiveMood("😐");
  setActiveSummary("🙂");
  datePicker.value = currentDate;
  loadEntryToUI(currentDate);
  refreshRecentEntriesList();

  prevBtn.addEventListener('click', () => changeDateBy(-1));
  nextBtn.addEventListener('click', () => changeDateBy(1));
  todayBtn.addEventListener('click', () => setCurrentDate(new Date().toISOString().slice(0,10)));
  datePicker.addEventListener('change', (e) => setCurrentDate(e.target.value));
  saveBtn.addEventListener('click', () => { saveCurrentEntry(); refreshRecentEntriesList(); });
  clearBtn.addEventListener('click', () => {
    if (confirm(`Reset all data for ${currentDate}? This will delete the entry.`)) resetCurrentDateEntry();
  });
  showStatus("📔 Ready! Pick mood, habits, diary & summary emoji", false);
}

init();