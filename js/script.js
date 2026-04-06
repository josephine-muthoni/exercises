// ========== ONLY 5 DEFAULT MOODS (NO LONELY, NO LOVELY) ==========
const DEFAULT_MOODS = [
  { emoji: "😊", label: "Happy", custom: false },
  { emoji: "😢", label: "Sad", custom: false },
  { emoji: "😠", label: "Angry", custom: false },
  { emoji: "😰", label: "Anxious", custom: false },
  { emoji: "😌", label: "Calm", custom: false }
];

const DEFAULT_SUMMARIES = [
  { emoji: "🎉", label: "Amazing", custom: false },
  { emoji: "😊", label: "Good", custom: false },
  { emoji: "😐", label: "Okay", custom: false },
  { emoji: "😔", label: "Bad", custom: false },
  { emoji: "💪", label: "Productive", custom: false },
  { emoji: "🌟", label: "Special", custom: false }
];

const DEFAULT_HABITS = [
  { id: "exercise", label: "🏋️ Exercise", custom: false },
  { id: "read", label: "📖 Reading", custom: false },
  { id: "meditate", label: "🧘 Meditate", custom: false },
  { id: "hydrate", label: "💧 Hydration", custom: false }
];

// ========== APP STATE ==========
let habits = [];
let moods = [];
let summaries = [];
let currentDate = new Date().toISOString().slice(0, 10);
let selectedMood = "😊";
let selectedSummary = "🎉";
let selectedCustomEmoji = "😊";
let selectedHabitEmoji = "🏃";

// DOM Elements
const moodGrid = document.getElementById('moodGrid');
const summaryGrid = document.getElementById('summaryGrid');
const habitList = document.getElementById('habitList');
const diaryText = document.getElementById('diaryText');
const statusMsg = document.getElementById('statusMsg');
const recentList = document.getElementById('recentList');
const datePicker = document.getElementById('datePicker');
const currentStreakEl = document.getElementById('currentStreak');
const bestStreakEl = document.getElementById('bestStreak');
const totalEntriesEl = document.getElementById('totalEntries');
const streakDaysEl = document.getElementById('streakDays');

// ========== STORAGE FUNCTIONS ==========
function saveToLocalStorage() {
  localStorage.setItem('emoji_journal_habits', JSON.stringify(habits));
  localStorage.setItem('emoji_journal_moods', JSON.stringify(moods));
  localStorage.setItem('emoji_journal_summaries', JSON.stringify(summaries));
}

function loadFromLocalStorage() {
  const savedHabits = localStorage.getItem('emoji_journal_habits');
  const savedMoods = localStorage.getItem('emoji_journal_moods');
  const savedSummaries = localStorage.getItem('emoji_journal_summaries');
  
  habits = savedHabits ? JSON.parse(savedHabits) : [...DEFAULT_HABITS];
  moods = savedMoods ? JSON.parse(savedMoods) : [...DEFAULT_MOODS];
  summaries = savedSummaries ? JSON.parse(savedSummaries) : [...DEFAULT_SUMMARIES];
}

function getEntryKey(date) { return `entry_${date}`; }

function saveEntry(date, entry) {
  localStorage.setItem(getEntryKey(date), JSON.stringify(entry));
  updateStreakDisplay();
  renderRecentEntries();
}

function getEntry(date) {
  const entry = localStorage.getItem(getEntryKey(date));
  return entry ? JSON.parse(entry) : null;
}

function deleteEntry(date) {
  localStorage.removeItem(getEntryKey(date));
  updateStreakDisplay();
  renderRecentEntries();
}

function getAllEntryDates() {
  const dates = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith('entry_')) {
      dates.push(key.replace('entry_', ''));
    }
  }
  return dates.sort().reverse();
}

// ========== STREAK CALCULATION ==========
function calculateStreak() {
  const allDates = getAllEntryDates();
  totalEntriesEl.textContent = allDates.length;
  
  if (allDates.length === 0) return { current: 0, best: 0 };
  
  let currentStreak = 1;
  let bestStreak = 1;
  
  for (let i = 0; i < allDates.length - 1; i++) {
    const current = new Date(allDates[i]);
    const next = new Date(allDates[i + 1]);
    const diffDays = Math.floor((current - next) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) {
      currentStreak++;
      bestStreak = Math.max(bestStreak, currentStreak);
    } else if (diffDays > 1) {
      currentStreak = 1;
    }
  }
  
  const todayStr = new Date().toISOString().slice(0, 10);
  const hasToday = allDates.includes(todayStr);
  const lastDate = new Date(allDates[0]);
  const today = new Date(todayStr);
  const daysSinceLast = Math.floor((today - lastDate) / (1000 * 60 * 60 * 24));
  
  if (!hasToday && daysSinceLast > 1) {
    currentStreak = 0;
  }
  
  return { current: currentStreak, best: bestStreak };
}

function updateStreakDisplay() {
  const streak = calculateStreak();
  currentStreakEl.textContent = streak.current;
  bestStreakEl.textContent = streak.best;
  renderStreakCalendar();
}

function renderStreakCalendar() {
  const allDates = getAllEntryDates();
  streakDaysEl.innerHTML = '';
  const today = new Date();
  
  for (let i = 6; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(today.getDate() - i);
    const dateStr = date.toISOString().slice(0, 10);
    const hasEntry = allDates.includes(dateStr);
    const isToday = i === 6;
    
    const dayDiv = document.createElement('div');
    dayDiv.className = `day-badge ${hasEntry ? 'active' : ''} ${isToday ? 'today' : ''}`;
    dayDiv.textContent = date.getDate();
    dayDiv.title = dateStr;
    streakDaysEl.appendChild(dayDiv);
  }
}

// ========== RENDER FUNCTIONS ==========
function renderMoods() {
  moodGrid.innerHTML = '';
  moods.forEach(mood => {
    const btn = document.createElement('button');
    btn.className = `mood-btn ${selectedMood === mood.emoji ? 'active' : ''}`;
    btn.innerHTML = `${mood.emoji} ${mood.label}`;
    btn.onclick = () => {
      selectedMood = mood.emoji;
      renderMoods();
      showStatus(`Mood set to ${mood.label}`, false);
    };
    moodGrid.appendChild(btn);
  });
}

function renderSummaries() {
  summaryGrid.innerHTML = '';
  summaries.forEach(summary => {
    const btn = document.createElement('button');
    btn.className = `summary-btn ${selectedSummary === summary.emoji ? 'active' : ''}`;
    btn.innerHTML = `${summary.emoji} ${summary.label}`;
    btn.onclick = () => {
      selectedSummary = summary.emoji;
      renderSummaries();
      showStatus(`Summary set to ${summary.label}`, false);
    };
    summaryGrid.appendChild(btn);
  });
}

function renderHabits() {
  habitList.innerHTML = '';
  const savedEntry = getEntry(currentDate);
  const savedHabits = savedEntry?.habits || {};
  
  habits.forEach((habit, index) => {
    const div = document.createElement('div');
    div.className = 'habit-item';
    const cb = document.createElement('input');
    cb.type = 'checkbox';
    cb.className = 'habit-check';
    cb.id = `habit_${index}`;
    cb.checked = savedHabits[habit.label] || false;
    const label = document.createElement('label');
    label.htmlFor = `habit_${index}`;
    label.textContent = habit.label;
    div.appendChild(cb);
    div.appendChild(label);
    
    if (habit.custom) {
      const delBtn = document.createElement('button');
      delBtn.textContent = '✕';
      delBtn.className = 'delete-custom';
      delBtn.onclick = () => {
        habits = habits.filter(h => h.id !== habit.id);
        saveToLocalStorage();
        renderHabits();
        showStatus('Habit deleted', false);
      };
      div.appendChild(delBtn);
    }
    habitList.appendChild(div);
  });
}

function getCurrentHabits() {
  const habitsState = {};
  habits.forEach((habit, index) => {
    const cb = document.getElementById(`habit_${index}`);
    if (cb) habitsState[habit.label] = cb.checked;
  });
  return habitsState;
}

function loadEntryToUI() {
  const entry = getEntry(currentDate);
  if (entry) {
    selectedMood = entry.mood || "😊";
    selectedSummary = entry.summary || "🎉";
    diaryText.value = entry.diary || "";
    renderMoods();
    renderSummaries();
    renderHabits();
  } else {
    selectedMood = "😊";
    selectedSummary = "🎉";
    diaryText.value = "";
    renderMoods();
    renderSummaries();
    renderHabits();
  }
}

function saveCurrentEntry() {
  const entry = {
    mood: selectedMood,
    summary: selectedSummary,
    diary: diaryText.value.trim(),
    habits: getCurrentHabits(),
    date: currentDate,
    updatedAt: new Date().toISOString()
  };
  saveEntry(currentDate, entry);
  showStatus(`✅ Saved ${currentDate}`, false);
  loadEntryToUI();
}

function resetCurrentEntry() {
  if (confirm(`Delete entry for ${currentDate}?`)) {
    deleteEntry(currentDate);
    loadEntryToUI();
    showStatus(`🗑️ Reset ${currentDate}`, false);
  }
}

// ========== EMOJI PICKER FOR MOODS ==========
function setupEmojiPicker() {
  const pickerBtn = document.getElementById('emojiPickerBtn');
  const dropdown = document.getElementById('emojiPickerDropdown');
  
  if (pickerBtn && dropdown) {
    pickerBtn.onclick = (e) => {
      e.stopPropagation();
      dropdown.style.display = dropdown.style.display === 'none' ? 'block' : 'none';
    };
    
    document.addEventListener('click', (e) => {
      if (!pickerBtn.contains(e.target) && !dropdown.contains(e.target)) {
        dropdown.style.display = 'none';
      }
    });
    
    document.querySelectorAll('.emoji-option').forEach(emojiSpan => {
      emojiSpan.onclick = () => {
        selectedCustomEmoji = emojiSpan.textContent;
        pickerBtn.textContent = selectedCustomEmoji + ' ▼';
        dropdown.style.display = 'none';
        showStatus(`Selected emoji: ${selectedCustomEmoji}`, false);
      };
    });
  }
}

// ========== EMOJI PICKER FOR HABITS ==========
function setupHabitEmojiPicker() {
  const pickerBtn = document.getElementById('habitEmojiPickerBtn');
  const dropdown = document.getElementById('habitEmojiPickerDropdown');
  
  if (pickerBtn && dropdown) {
    pickerBtn.onclick = (e) => {
      e.stopPropagation();
      dropdown.style.display = dropdown.style.display === 'none' ? 'block' : 'none';
    };
    
    document.addEventListener('click', (e) => {
      if (!pickerBtn.contains(e.target) && !dropdown.contains(e.target)) {
        dropdown.style.display = 'none';
      }
    });
    
    document.querySelectorAll('.habit-emoji-option').forEach(emojiSpan => {
      emojiSpan.onclick = () => {
        selectedHabitEmoji = emojiSpan.textContent;
        pickerBtn.textContent = selectedHabitEmoji + ' ▼';
        dropdown.style.display = 'none';
        showStatus(`Selected habit emoji: ${selectedHabitEmoji}`, false);
      };
    });
  }
}

// ========== ADD CUSTOM MOOD ==========
function addCustomMood() {
  const nameInput = document.getElementById('newMoodName');
  const name = nameInput.value.trim();
  
  if (!name) {
    showStatus('⚠️ Please enter a mood name', true);
    return;
  }
  
  // Check if mood already exists
  const exists = moods.some(m => m.label.toLowerCase() === name.toLowerCase());
  if (exists) {
    showStatus(`⚠️ "${name}" mood already exists`, true);
    return;
  }
  
  moods.push({ 
    emoji: selectedCustomEmoji, 
    label: name.charAt(0).toUpperCase() + name.slice(1), 
    custom: true 
  });
  
  saveToLocalStorage();
  renderMoods();
  
  nameInput.value = '';
  const pickerBtn = document.getElementById('emojiPickerBtn');
  if (pickerBtn) pickerBtn.textContent = '😊 ▼';
  selectedCustomEmoji = '😊';
  
  showStatus(`✅ Added "${name}" mood with ${selectedCustomEmoji}`, false);
}

// ========== ADD CUSTOM HABIT ==========
function addCustomHabit() {
  const nameInput = document.getElementById('newHabitName');
  const name = nameInput.value.trim();
  
  if (!name) {
    showStatus('⚠️ Enter a habit name', true);
    return;
  }
  
  habits.push({ 
    id: `custom_${Date.now()}`, 
    label: `${selectedHabitEmoji} ${name.charAt(0).toUpperCase() + name.slice(1)}`, 
    custom: true 
  });
  
  saveToLocalStorage();
  renderHabits();
  
  nameInput.value = '';
  const pickerBtn = document.getElementById('habitEmojiPickerBtn');
  if (pickerBtn) pickerBtn.textContent = '🏃 ▼';
  selectedHabitEmoji = '🏃';
  
  showStatus(`✅ Added "${name}" habit with ${selectedHabitEmoji}`, false);
}

// ========== ADD CUSTOM SUMMARY ==========
function addCustomSummary() {
  const nameInput = document.getElementById('newSummaryName');
  const emojiInput = document.getElementById('newSummaryEmoji');
  const name = nameInput.value.trim();
  const emoji = emojiInput.value.trim() || '🌟';
  
  if (!name) {
    showStatus('⚠️ Enter a summary name', true);
    return;
  }
  
  summaries.push({ emoji: emoji, label: name.charAt(0).toUpperCase() + name.slice(1), custom: true });
  saveToLocalStorage();
  renderSummaries();
  nameInput.value = '';
  emojiInput.value = '';
  showStatus(`✅ Added "${name}" summary`, false);
}

// ========== RECENT ENTRIES ==========
function renderRecentEntries() {
  const dates = getAllEntryDates();
  if (dates.length === 0) {
    recentList.innerHTML = '<div style="text-align: center; color: var(--text-light);">✨ No entries yet</div>';
    return;
  }
  
  recentList.innerHTML = '';
  dates.slice(0, 10).forEach(date => {
    const entry = getEntry(date);
    if (!entry) return;
    
    const div = document.createElement('div');
    div.className = 'recent-card';
    div.innerHTML = `
      <div class="recent-info">
        <span class="recent-date">${date}</span>
        <span>${entry.mood || '😊'}</span>
        <span>${entry.summary || '🎉'}</span>
        <span style="font-size:0.7rem;">${entry.diary ? entry.diary.slice(0, 20) + (entry.diary.length > 20 ? '…' : '') : '—'}</span>
      </div>
      <div>
        <button class="load-recent" data-date="${date}">📂 Load</button>
        <button class="del-recent" data-date="${date}">🗑️</button>
      </div>
    `;
    
    div.querySelector('.load-recent').onclick = () => {
      currentDate = date;
      datePicker.value = currentDate;
      loadEntryToUI();
      renderRecentEntries();
      showStatus(`Loaded ${date}`, false);
      window.scrollTo({ top: 0 });
    };
    
    div.querySelector('.del-recent').onclick = () => {
      if (confirm(`Delete entry for ${date}?`)) {
        deleteEntry(date);
        if (currentDate === date) loadEntryToUI();
        renderRecentEntries();
        updateStreakDisplay();
      }
    };
    
    recentList.appendChild(div);
  });
}

// ========== DATE NAVIGATION ==========
function setCurrentDate(date) {
  currentDate = date;
  datePicker.value = currentDate;
  loadEntryToUI();
}

function changeDate(delta) {
  const date = new Date(currentDate);
  date.setDate(date.getDate() + delta);
  setCurrentDate(date.toISOString().slice(0, 10));
}

// ========== HELPER FUNCTIONS ==========
function showStatus(msg, isError) {
  statusMsg.textContent = msg;
  statusMsg.style.background = isError ? '#ffe0db' : '#eef3e3';
  statusMsg.style.color = isError ? '#b13e2d' : '#5f7c4b';
  setTimeout(() => {
    if (statusMsg.textContent === msg) {
      statusMsg.textContent = '✅ Ready';
      statusMsg.style.background = '#eef3e3';
      statusMsg.style.color = '#5f7c4b';
    }
  }, 2000);
}

// ========== THEME ==========
function initTheme() {
  const saved = localStorage.getItem('theme');
  if (saved === 'dark') {
    document.body.classList.add('dark');
    document.getElementById('themeToggle').textContent = '☀️ Light Mode';
  }
}

function toggleTheme() {
  document.body.classList.toggle('dark');
  const isDark = document.body.classList.contains('dark');
  localStorage.setItem('theme', isDark ? 'dark' : 'light');
  document.getElementById('themeToggle').textContent = isDark ? '☀️ Light Mode' : '🌙 Dark Mode';
}

// ========== SERVICE WORKER ==========
function registerSW() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js').catch(err => console.log('SW error:', err));
  }
}

// ========== AUTO DATE CHECK ==========
function checkDateChange() {
  const now = new Date().toISOString().slice(0, 10);
  if (now !== currentDate && document.visibilityState === 'visible') {
    currentDate = now;
    datePicker.value = currentDate;
    loadEntryToUI();
    updateStreakDisplay();
    showStatus('📅 New day! Ready for your entry', false);
  }
}

// ========== INITIALIZE ==========
function init() {
  loadFromLocalStorage();
  initTheme();
  datePicker.value = currentDate;
  loadEntryToUI();
  updateStreakDisplay();
  renderRecentEntries();
  registerSW();
  setupEmojiPicker();
  setupHabitEmojiPicker();
  
  // Event listeners
  document.getElementById('themeToggle').onclick = toggleTheme;
  document.getElementById('saveBtn').onclick = saveCurrentEntry;
  document.getElementById('clearBtn').onclick = resetCurrentEntry;
  document.getElementById('prevDay').onclick = () => changeDate(-1);
  document.getElementById('nextDay').onclick = () => changeDate(1);
  document.getElementById('todayBtn').onclick = () => setCurrentDate(new Date().toISOString().slice(0, 10));
  datePicker.onchange = (e) => setCurrentDate(e.target.value);
  document.getElementById('addMoodBtn').onclick = addCustomMood;
  document.getElementById('addHabitBtn').onclick = addCustomHabit;
  document.getElementById('addSummaryBtn').onclick = addCustomSummary;
  document.getElementById('updateBtn').onclick = () => showStatus('🔄 Checking for updates...', false);
  
  // Auto date check
  setInterval(checkDateChange, 60000);
  document.addEventListener('visibilitychange', checkDateChange);

}

init();