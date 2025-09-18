 // Smart Study Planner - Local Storage based
// Author: Starter template
// Features:
// - Add/Edit/Delete tasks
// - Mark done/undone
// - Save to localStorage
// - Simple timeline sorted by date
// - Optional browser reminders (Notification API)

const STORAGE_KEY = 'smart-study-planner-v1';

// DOM refs
const form = document.getElementById('task-form');
const titleEl = document.getElementById('title');
const descEl = document.getElementById('description');
const dateEl = document.getElementById('date');
const timeEl = document.getElementById('time');
const priorityEl = document.getElementById('priority');
const remindEl = document.getElementById('remind');
const taskListEl = document.getElementById('task-list');
const timelineEl = document.getElementById('timeline');
const progressText = document.getElementById('progress-text');
const progressFill = document.getElementById('progress-fill');
const filterStatus = document.getElementById('filter-status');
const sortBy = document.getElementById('sort-by');
const searchInput = document.getElementById('search');
const taskIdInput = document.getElementById('task-id');

let tasks = loadTasks();

// Initialize UI
renderAll();
setupRemindersForLoaded();

// --- Form submit: Add or Update ---
form.addEventListener('submit', (e) => {
  e.preventDefault();
  const id = taskIdInput.value;
  if (id) {
    updateTask(id);
  } else {
    addTask();
  }
  form.reset();
  taskIdInput.value = '';
});

// --- Filters / search events ---
[filterStatus, sortBy, searchInput].forEach(el => el.addEventListener('input', renderAll));

// --- Core functions ---
function saveTasks() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
}

function loadTasks() {
  const raw = localStorage.getItem(STORAGE_KEY);
  return raw ? JSON.parse(raw) : [];
}

function uid() {
  return 't' + Date.now() + Math.floor(Math.random()*999);
}

function addTask() {
  const t = {
    id: uid(),
    title: titleEl.value.trim(),
    description: descEl.value.trim(),
    date: dateEl.value || null,
    time: timeEl.value || null,
    priority: priorityEl.value,
    remind: remindEl.checked,
    created: Date.now(),
    done: false
  };
  if (!t.title) return alert('Please add a title.');
  tasks.push(t);
  saveTasks();
  renderAll();
  if (t.remind) scheduleReminder(t);
}

function updateTask(id) {
  const t = tasks.find(x => x.id === id);
  if (!t) return;
  t.title = titleEl.value.trim();
  t.description = descEl.value.trim();
  t.date = dateEl.value || null;
  t.time = timeEl.value || null;
  t.priority = priorityEl.value;
  t.remind = remindEl.checked;
  saveTasks();
  renderAll();
  if (t.remind) scheduleReminder(t);
}

function deleteTask(id) {
  if (!confirm('Delete this task?')) return;
  tasks = tasks.filter(x => x.id !== id);
  saveTasks();
  renderAll();
}

function toggleDone(id) {
  const t = tasks.find(x => x.id === id);
  if (!t) return;
  t.done = !t.done;
  saveTasks();
  renderAll();
}

function editTask(id) {
  const t = tasks.find(x => x.id === id);
  if (!t) return;
  taskIdInput.value = t.id;
  titleEl.value = t.title;
  descEl.value = t.description;
  dateEl.value = t.date || '';
  timeEl.value = t.time || '';
  priorityEl.value = t.priority;
  remindEl.checked = !!t.remind;
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// --- Rendering ---
function renderAll() {
  renderList();
  renderTimeline();
  renderProgress();
}

function applyFilters(list) {
  const status = filterStatus.value;
  const q = searchInput.value.trim().toLowerCase();
  let out = list.slice();

  if (status === 'todo') out = out.filter(t => !t.done);
  if (status === 'done') out = out.filter(t => t.done);
  if (q) out = out.filter(t => (t.title + ' ' + t.description).toLowerCase().includes(q));

  const s = sortBy.value;
  if (s === 'date') {
    out.sort((a,b) => {
      if (!a.date && !b.date) return a.created - b.created;
      if (!a.date) return 1;
      if (!b.date) return -1;
      const ad = new Date(a.date + (a.time ? 'T' + a.time : ''));
      const bd = new Date(b.date + (b.time ? 'T' + b.time : ''));
      return ad - bd;
    });
  } else if (s === 'priority') {
    const map = { high: 0, medium: 1, low: 2 };
    out.sort((a,b) => map[a.priority]-map[b.priority]);
  } else {
    out.sort((a,b) => a.created - b.created);
  }
  return out;
}

function renderList() {
  taskListEl.innerHTML = '';
  const list = applyFilters(tasks);
  if (list.length === 0) {
    taskListEl.innerHTML = `<li style="color:var(--muted)">No tasks found.</li>`;
    return;
  }

  list.forEach(t => {
    const li = document.createElement('li');
    li.className = 'task';
    if (t.done) li.classList.add('done');

    const left = document.createElement('div');
    left.className = 'left';

    const h3 = document.createElement('h3');
    h3.textContent = t.title;
    left.appendChild(h3);

    const meta = document.createElement('div');
    meta.className = 'meta';
    const p = document.createElement('span');
    p.className = 'badge ' + (t.priority || 'medium');
    p.textContent = t.priority?.toUpperCase() || 'MEDIUM';
    meta.appendChild(p);

    if (t.date) {
      const d = document.createElement('span');
      d.textContent = `Due: ${t.date}${t.time ? ' ' + t.time : ''}`;
      meta.appendChild(d);
    }

    if (t.description) {
      const desc = document.createElement('span');
      desc.textContent = t.description;
      meta.appendChild(desc);
    }

    left.appendChild(meta);

    const actions = document.createElement('div');
    actions.className = 'actions';

    const doneBtn = document.createElement('button');
    doneBtn.className = 'btn';
    doneBtn.textContent = t.done ? 'Undo' : 'Done';
    doneBtn.onclick = () => toggleDone(t.id);
    actions.appendChild(doneBtn);

    const editBtn = document.createElement('button');
    editBtn.className = 'btn';
    editBtn.textContent = 'Edit';
    editBtn.onclick = () => editTask(t.id);
    actions.appendChild(editBtn);

    const delBtn = document.createElement('button');
    delBtn.className = 'btn danger';
    delBtn.textContent = 'Delete';
    delBtn.onclick = () => deleteTask(t.id);
    actions.appendChild(delBtn);

    li.appendChild(left);
    li.appendChild(actions);
    taskListEl.appendChild(li);
  });
}

function renderTimeline() {
  timelineEl.innerHTML = '';
  // upcoming tasks with dates, next 8
  const upcoming = tasks
    .filter(t => t.date && !t.done)
    .sort((a,b) => new Date(a.date + (a.time? 'T' + a.time : '')) - new Date(b.date + (b.time? 'T' + b.time : '')))
    .slice(0, 8);

  if (upcoming.length === 0) {
    timelineEl.innerHTML = `<div style="color:var(--muted)">No upcoming tasks with dates.</div>`;
    return;
  }

  upcoming.forEach(t => {
    const item = document.createElement('div');
    item.className = 'timeline-item';
    const dot = document.createElement('div');
    dot.className = 'dot';
    item.appendChild(dot);

    const time = document.createElement('div');
    time.className = 'time';
    time.innerHTML = `<strong>${t.date}</strong>${t.time ? ' • ' + t.time : ''}`;
    item.appendChild(time);

    const body = document.createElement('div');
    body.innerHTML = `<div style="font-weight:600">${t.title}</div><div style="font-size:0.9rem;color:var(--muted)">${t.description|| ''}</div>`;
    item.appendChild(body);

    timelineEl.appendChild(item);
  });
}

function renderProgress() {
  const total = tasks.length;
  const done = tasks.filter(t => t.done).length;
  progressText.textContent = `${done} / ${total} completed`;
  const pct = total === 0 ? 0 : Math.round((done/total)*100);
  progressFill.style.width = pct + '%';
}

// --- Notifications / reminders ---
function requestNotificationPermission() {
  if (!('Notification' in window)) return Promise.resolve('denied');
  return Notification.requestPermission();
}

function scheduleReminder(task) {
  // Use simple approach: compute time difference and setTimeout (works while the page is open)
  if (!task.date) return;
  const when = new Date(task.date + (task.time ? 'T' + task.time : 'T00:00'));
  const ms = when.getTime() - Date.now();
  if (ms <= 0) return;
  // store a small timer id in-task (not persisted across reloads)
  task._reminderTimeoutId = setTimeout(() => {
    notify(task);
  }, Math.min(ms, 2147483647)); // cap to max setTimeout
}

function notify(task) {
  if (!('Notification' in window)) return;
  if (Notification.permission === 'granted') {
    new Notification('Study Reminder', {
      body: `${task.title}${task.description ? ' — ' + task.description : ''}`,
      tag: task.id
    });
  } else {
    // fallback: browser alert
    alert(`Reminder: ${task.title}`);
  }
}

function setupRemindersForLoaded() {
  // ask permission lazily when user sets a reminder or on load if any task wants remind
  if (tasks.some(t => t.remind)) {
    requestNotificationPermission();
  }
  tasks.forEach(t => {
    if (t.remind) scheduleReminder(t);
  });
}

// Optionally request permission when user toggles remind in form
remindEl.addEventListener('change', (e) => {
  if (e.target.checked) requestNotificationPermission();
});

// Expose a quick export/import for user (optional)
window.saveToFile = function() {
  const a = document.createElement('a');
  a.href = 'data:application/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(tasks));
  a.download = 'study-planner-backup.json';
  a.click();
};

window.loadFromFile = function(json) {
  try {
    const arr = JSON.parse(json);
    if (Array.isArray(arr)) {
      tasks = arr;
      saveTasks();
      renderAll();
    }
  } catch(e) { console.error(e); alert('Invalid file'); }
};

