// Basic state
const state = {
  monasteries: [],
  events: [],
  map: null,
  markers: [],
  selectedMonastery: null,
  deferredPrompt: null,
  voices: []
};

// DOM refs
const sectFilter = document.getElementById('sectFilter');
const districtFilter = document.getElementById('districtFilter');
const searchInput = document.getElementById('searchInput');
const profileContent = document.getElementById('profileContent');
const viewerFrame = document.getElementById('viewerFrame');
const calendarList = document.getElementById('calendarList');
const voiceSelect = document.getElementById('voiceSelect');
const rateRange = document.getElementById('rateRange');
const speakBtn = document.getElementById('speakBtn');
const stopSpeakBtn = document.getElementById('stopSpeakBtn');
const narrationText = document.getElementById('narrationText');
const sendChat = document.getElementById('sendChat');
const chatPrompt = document.getElementById('chatPrompt');
const chatMessages = document.getElementById('chatMessages');
const settingsBtn = document.getElementById('settingsBtn');
const settingsDialog = document.getElementById('settingsDialog');
const apiKeyInput = document.getElementById('apiKeyInput');
const saveSettings = document.getElementById('saveSettings');
const installBtn = document.getElementById('installBtn');

// Init
window.addEventListener('DOMContentLoaded', async () => {
  setupInstall();
  await loadData();
  initFilters();
  initMap();
  renderMonasteries();
  renderCalendar();
  initVoices();
  initChatbot();
  restoreApiKey();
});

async function loadData() {
  const [monasteries, events] = await Promise.all([
    fetch('/data/monasteries.json').then(r => r.json()),
    fetch('/data/events.json').then(r => r.json())
  ]);
  state.monasteries = monasteries;
  state.events = events;
}

function initFilters() {
  // Populate district list
  const districts = Array.from(new Set(state.monasteries.map(m => m.district))).sort();
  for (const d of districts) {
    const opt = document.createElement('option');
    opt.value = d; opt.textContent = d; districtFilter.appendChild(opt);
  }
  sectFilter.addEventListener('change', renderMonasteries);
  districtFilter.addEventListener('change', renderMonasteries);
  searchInput.addEventListener('input', debounce(renderMonasteries, 200));
}

function initMap() {
  state.map = L.map('map', { zoomControl: true });
  const osm = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors'
  }).addTo(state.map);
  const center = [27.3389, 88.6065]; // Sikkim approx
  state.map.setView(center, 8);
}

function renderMonasteries() {
  // Clear markers
  for (const m of state.markers) state.map.removeLayer(m);
  state.markers = [];

  const sect = sectFilter.value;
  const district = districtFilter.value;
  const term = searchInput.value.trim().toLowerCase();

  const filtered = state.monasteries.filter(m => {
    if (sect !== 'all' && m.sect !== sect) return false;
    if (district !== 'all' && m.district !== district) return false;
    if (term && !(`${m.name} ${m.district} ${m.sect}`.toLowerCase().includes(term))) return false;
    return true;
  });

  const iconColors = { Nyingma: 'red', Kagyu: 'blue', Gelug: 'gold', Sakya: 'green' };
  filtered.forEach(m => {
    const marker = L.circleMarker([m.lat, m.lng], {
      radius: 7,
      color: iconColors[m.sect] || '#1e8a6a',
      fillColor: iconColors[m.sect] || '#1e8a6a',
      fillOpacity: 0.8,
      weight: 1
    }).addTo(state.map);
    marker.bindTooltip(`${m.name} • ${m.sect}`);
    marker.on('click', () => selectMonastery(m));
    state.markers.push(marker);
  });

  if (filtered.length) {
    const group = L.featureGroup(state.markers);
    try { state.map.fitBounds(group.getBounds().pad(0.2)); } catch { /* ignore */ }
  }
}

function selectMonastery(m) {
  state.selectedMonastery = m;
  profileContent.innerHTML = `
    <h3>${m.name}</h3>
    <p><strong>Sect:</strong> ${m.sect} • <strong>District:</strong> ${m.district}</p>
    <p>${m.description}</p>
    <details>
      <summary>History</summary>
      <p>${m.history || '—'}</p>
    </details>
    <details>
      <summary>Architecture</summary>
      <p>${m.architecture || '—'}</p>
    </details>
    <details>
      <summary>Practices</summary>
      <p>${m.practices || '—'}</p>
    </details>
  `;
  narrationText.value = `${m.name} is a ${m.sect} monastery located in ${m.district}, Sikkim. ${m.description}`;
  viewerFrame.src = m.viewerUrl || '';
}

function renderCalendar() {
  const sorted = [...state.events].sort((a, b) => new Date(a.date) - new Date(b.date));
  const today = new Date();
  calendarList.innerHTML = '';
  for (const ev of sorted) {
    const monastery = state.monasteries.find(m => m.id === ev.monasteryId);
    const isUpcoming = new Date(ev.date) >= new Date(today.toDateString());
    const el = document.createElement('div');
    el.className = 'calendar-item';
    el.style.margin = '8px 0';
    el.innerHTML = `
      <div style="display:flex;justify-content:space-between;gap:8px;align-items:center;">
        <div>
          <strong>${ev.title}</strong>
          <div style="color:#9fb2a8;">${new Date(ev.date).toDateString()} • ${monastery ? monastery.name : ''}</div>
          <div>${ev.description}</div>
        </div>
        <button data-id="${ev.monasteryId}">View</button>
      </div>
    `;
    el.querySelector('button').addEventListener('click', () => {
      const m = state.monasteries.find(mm => mm.id === ev.monasteryId);
      if (m) selectMonastery(m);
    });
    calendarList.appendChild(el);
  }
}

// Audio guide via Web Speech API
function initVoices() {
  function populate() {
    state.voices = window.speechSynthesis.getVoices();
    voiceSelect.innerHTML = '';
    state.voices.forEach((v, idx) => {
      const opt = document.createElement('option');
      opt.value = String(idx);
      opt.textContent = `${v.name} (${v.lang})`;
      voiceSelect.appendChild(opt);
    });
  }
  populate();
  window.speechSynthesis.onvoiceschanged = populate;
  speakBtn.addEventListener('click', () => {
    const utter = new SpeechSynthesisUtterance(narrationText.value || '');
    const voice = state.voices[Number(voiceSelect.value)];
    if (voice) utter.voice = voice;
    utter.rate = Number(rateRange.value) || 1;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utter);
  });
  stopSpeakBtn.addEventListener('click', () => window.speechSynthesis.cancel());
}

// Chatbot
function initChatbot() {
  sendChat.addEventListener('click', onSend);
  chatPrompt.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); onSend(); } });
}

function appendMessage(role, text) {
  const div = document.createElement('div');
  div.className = `msg ${role === 'user' ? 'user' : 'bot'}`;
  div.textContent = text;
  chatMessages.appendChild(div);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

async function onSend() {
  const prompt = chatPrompt.value.trim();
  if (!prompt) return;
  appendMessage('user', prompt);
  chatPrompt.value = '';
  const key = localStorage.getItem('openai_api_key');
  if (!key) { appendMessage('bot', 'Please set your OpenAI API key in Settings.'); return; }

  try {
    const system = `You are Monastery360's virtual guide. You know Sikkim monasteries, sects (Nyingma, Kagyu, Gelug, Sakya), cultural calendar, and 360 tours. Help users navigate the app and answer cultural questions concisely. If suggesting monasteries, reference entries by name and sect.`;
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${key}` },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: prompt }
        ],
        temperature: 0.3
      })
    });
    if (!res.ok) throw new Error(await res.text());
    const data = await res.json();
    const text = data.choices?.[0]?.message?.content?.trim() || 'No response.';
    appendMessage('assistant', text);
  } catch (e) {
    appendMessage('bot', `Error: ${e.message}`);
  }
}

// Settings dialog
settingsBtn.addEventListener('click', () => {
  settingsDialog.showModal();
});
saveSettings.addEventListener('click', (e) => {
  e.preventDefault();
  const v = apiKeyInput.value.trim();
  if (v) localStorage.setItem('openai_api_key', v);
  settingsDialog.close();
});
function restoreApiKey() {
  const v = localStorage.getItem('openai_api_key');
  if (v) apiKeyInput.value = v;
}

// Install PWA
function setupInstall() {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    state.deferredPrompt = e;
    installBtn.disabled = false;
  });
  installBtn.addEventListener('click', async () => {
    if (!state.deferredPrompt) return;
    state.deferredPrompt.prompt();
    const { outcome } = await state.deferredPrompt.userChoice;
    state.deferredPrompt = null;
    installBtn.disabled = true;
  });
}

// Utils
function debounce(fn, wait) {
  let t; return (...args) => { clearTimeout(t); t = setTimeout(() => fn.apply(null, args), wait); };
}

