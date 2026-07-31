import { initCertificateGenerator, updateCertificateDropdown, renderWinnersPanel } from './certificate.js';
import confetti from 'canvas-confetti';
import { initLogin, getCurrentRole, getJudgeInfo, logout } from './login.js';

// --- Default Data for New Setup (Sample) ---
const DEFAULT_PARTICIPANTS = [
    {
        id: "default-1",
        name: "Aisha Verma",
        song: "Tum Hi Ho (Aashiqui 2)",
        scores: { vocal: 92, artikulasi: 88, pronounce: 90, pitch: 91, tempo: 85, feel: 95, teknik: 88 },
        total: 629
    },
    {
        id: "default-2",
        name: "Rahul Sharma",
        song: "Kal Ho Naa Ho (Title Track)",
        scores: { vocal: 85, artikulasi: 92, pronounce: 85, pitch: 88, tempo: 90, feel: 87, teknik: 83 },
        total: 610
    },
    {
        id: "default-3",
        name: "Priya Patel",
        song: "Tujh Mein Rab Dikhta Hai",
        scores: { vocal: 89, artikulasi: 85, pronounce: 93, pitch: 84, tempo: 88, feel: 91, teknik: 86 },
        total: 616
    },
    {
        id: "default-4",
        name: "Dev Dixit",
        song: "Channa Mereya",
        scores: { vocal: 80, artikulasi: 82, pronounce: 80, pitch: 85, tempo: 83, feel: 88, teknik: 79 },
        total: 577
    },
    {
        id: "default-5",
        name: "Rohan Malhotra",
        song: "Zalima (Raees)",
        scores: { vocal: 78, artikulasi: 80, pronounce: 75, pitch: 79, tempo: 82, feel: 80, teknik: 76 },
        total: 550
    },
    {
        id: "default-6",
        name: "Karan Johar",
        song: "Gerua (Dilwale)",
        scores: { vocal: 75, artikulasi: 72, pronounce: 78, pitch: 70, tempo: 75, feel: 74, teknik: 71 },
        total: 515
    }
];

const DEFAULT_PARTICIPANTS_S2 = [
    {
        id: "default-s2-1",
        name: "Aisha Verma",
        song: "Tum Hi Ho (Unplugged Version)",
        scores: { vocal: 95, artikulasi: 92, pronounce: 94, pitch: 93, tempo: 88, feel: 97, teknik: 91 },
        total: 650
    },
    {
        id: "default-s2-2",
        name: "Priya Patel",
        song: "Tujh Mein Rab Dikhta Hai (Reprise)",
        scores: { vocal: 92, artikulasi: 89, pronounce: 95, pitch: 88, tempo: 91, feel: 93, teknik: 89 },
        total: 637
    },
    {
        id: "default-s2-3",
        name: "Rahul Sharma",
        song: "Kal Ho Naa Ho (Sad Version)",
        scores: { vocal: 88, artikulasi: 94, pronounce: 86, pitch: 90, tempo: 92, feel: 89, teknik: 85 },
        total: 624
    },
    {
        id: "default-s2-4",
        name: "Dev Dixit",
        song: "Channa Mereya (Metal Mix)",
        scores: { vocal: 84, artikulasi: 86, pronounce: 82, pitch: 87, tempo: 84, feel: 90, teknik: 82 },
        total: 595
    },
    {
        id: "default-s2-5",
        name: "Rohan Malhotra",
        song: "Zalima (Acoustic Remix)",
        scores: { vocal: 80, artikulasi: 82, pronounce: 84, pitch: 80, tempo: 82, feel: 84, teknik: 78 },
        total: 570
    }
];

// --- Application State ---
const state = {
    participants: [],         // Season 1 list
    participantsSeason2: [],  // Season 2 list
    activeSeason: '1',        // '1' or '2'
    eventId: ''               // extendsclass binId or 'local'
};

// --- Polling Interval reference ---
let pollIntervalRef = null;

// --- Chart Instance Tracker ---
let radarChartInstance = null;

// --- DOM elements ---
let searchInput, leaderboardBody, noDataMsg, podiumArea;
let adminTableBody, btnAddRow, adminEventLink, btnCopyEventLink, cloudSyncStatusMsg;
let btnResetData, btnCloseModal, participantModal, btnCloseLive, btnLiveStage, liveStageOverlay;
let btnPromoteFinalists, liveStageTitle, liveStageSubtitle;
let headerEventLink, btnHeaderCopyLink;

// --- Initialize App ---
document.addEventListener('DOMContentLoaded', () => {
    lucide.createIcons();

    // Start with login screen - proceed to app only after successful login
    initLogin((role) => {
        applyRoleBasedUI(role);
        bootApp();
    });
});

// Apply role-based UI restrictions
function applyRoleBasedUI(role) {
    const judgeInfo = getJudgeInfo(role);
    const judgeBadge = document.getElementById('judge-badge');
    const certTab = document.getElementById('nav-cert-btn');
    const shareBar = document.getElementById('header-share-bar');

    if (judgeInfo) {
        // JUDGE MODE: show badge, hide cert tab and share bar
        judgeBadge.style.display = 'flex';
        document.getElementById('judge-badge-name').textContent = judgeInfo.name;
        document.getElementById('judge-badge-criteria').textContent = judgeInfo.criteria;
        judgeBadge.style.setProperty('--judge-color', judgeInfo.color);
        if (certTab) certTab.style.display = 'none';
        if (shareBar) shareBar.style.display = 'none';
    } else {
        // OWNER MODE: show share bar, hide badge
        judgeBadge.style.display = 'none';
        if (certTab) certTab.style.display = '';
        if (shareBar) shareBar.style.display = '';
    }

    // Logout button
    const btnLogout = document.getElementById('btn-logout');
    if (btnLogout) btnLogout.addEventListener('click', logout);
}

// Main boot sequence after login
function bootApp() {
    // Cache App Header Share elements
    headerEventLink = document.getElementById('header-event-link');
    btnHeaderCopyLink = document.getElementById('btn-header-copy-link');

    // Cache App Dashboard Elements
    searchInput = document.getElementById('search-input');
    leaderboardBody = document.getElementById('leaderboard-body');
    noDataMsg = document.getElementById('no-data-msg');
    podiumArea = document.getElementById('podium-area');
    adminTableBody = document.getElementById('admin-table-body');
    btnAddRow = document.getElementById('btn-add-row');
    adminEventLink = document.getElementById('admin-event-link');
    btnCopyEventLink = document.getElementById('btn-copy-event-link');
    cloudSyncStatusMsg = document.getElementById('cloud-sync-status-msg');
    
    btnResetData = document.getElementById('btn-reset-data');
    btnCloseModal = document.getElementById('btn-close-modal');
    participantModal = document.getElementById('participant-modal');
    btnCloseLive = document.getElementById('btn-close-live');
    btnLiveStage = document.getElementById('btn-live-stage');
    liveStageOverlay = document.getElementById('live-stage-overlay');
    btnPromoteFinalists = document.getElementById('btn-promote-finalists');
    liveStageTitle = document.getElementById('live-stage-title');
    liveStageSubtitle = document.getElementById('live-stage-subtitle');

    // Check for Event ID in URL (?event=XYZ)
    const urlParams = new URLSearchParams(window.location.search);
    let eventParam = urlParams.get('event');
    
    if (!eventParam) {
        eventParam = localStorage.getItem('kcba_event_id');
    }

    if (!eventParam) {
        headerEventLink && (headerEventLink.value = "Menghubungkan cloud...");
        (async () => {
            const newBinId = await createNewEventOnCloud();
            if (newBinId) {
                localStorage.setItem('kcba_event_id', newBinId);
                window.location.search = `?event=${newBinId}`;
            } else {
                initializeLocalMode();
            }
        })();
    } else {
        state.eventId = eventParam.trim();
        localStorage.setItem('kcba_event_id', state.eventId);

        if (state.eventId === 'local') {
            initializeLocalMode();
        } else {
            (async () => {
                try {
                    await fetchStateFromCloud();
                    setupActiveInterface();
                } catch (e) {
                    console.warn("Gagal terhubung cloud. Membuka dalam mode penyimpanan lokal.", e);
                    initializeLocalMode();
                }
            })();
        }
    }

    lucide.createIcons();
}

// Setup interface elements once data is active
function setupActiveInterface() {
    const eventUrl = state.eventId === 'local' 
        ? `${window.location.origin}${window.location.pathname}`
        : `${window.location.origin}${window.location.pathname}?event=${state.eventId}`;
        
    headerEventLink.value = state.eventId === 'local' ? "Penyimpanan Lokal (Offline)" : eventUrl;
    adminEventLink.value = state.eventId === 'local' ? "Penyimpanan Lokal (Offline)" : eventUrl;
    
    setupTabs();
    setupEventListeners();
    
    renderLeaderboard();
    renderAdminTable();
    initCertificateGenerator(state, updateState);

    if (state.eventId !== 'local') {
        startCloudPolling();
    }
}

// Fallback to local storage (Offline Mode)
function initializeLocalMode() {
    state.eventId = 'local';
    localStorage.setItem('kcba_event_id', 'local');
    
    // Load local storage keys
    const localS1 = localStorage.getItem('kcba_local_s1');
    const localS2 = localStorage.getItem('kcba_local_s2');
    const localSeason = localStorage.getItem('kcba_local_season');
    
    state.participants = localS1 ? JSON.parse(localS1) : [...DEFAULT_PARTICIPANTS];
    state.participantsSeason2 = localS2 ? JSON.parse(localS2) : [...DEFAULT_PARTICIPANTS_S2];
    state.activeSeason = localSeason ? localSeason : '1';

    cloudSyncStatusMsg.innerHTML = `<i data-lucide="database"></i> Penyimpanan: Lokal (Offline)`;
    cloudSyncStatusMsg.className = `sync-status connected`; // green style

    setupActiveInterface();
}

// --- Tab Setup & Config ---
function setupTabs() {
    const navButtons = document.querySelectorAll('.nav-btn');
    const tabPanes = document.querySelectorAll('.tab-pane');

    navButtons.forEach(btn => {
        btn.removeEventListener('click', tabClickListener); // prevent duplicates
        btn.addEventListener('click', tabClickListener);
    });
}

function tabClickListener(e) {
    const btn = e.currentTarget;
    const targetTab = btn.dataset.tab;
    const navButtons = document.querySelectorAll('.nav-btn');
    const tabPanes = document.querySelectorAll('.tab-pane');

    navButtons.forEach(b => b.classList.remove('active'));
    tabPanes.forEach(pane => pane.classList.remove('active'));

    btn.classList.add('active');
    document.getElementById(targetTab).classList.add('active');
    
    if (targetTab === 'leaderboard-tab') {
        renderLeaderboard();
    } else if (targetTab === 'admin-tab') {
        renderAdminTable();
    } else if (targetTab === 'certificate-tab') {
        renderWinnersPanel(state);
    }
}

// --- Cloud ExtendsClass Actions (CORS Allowed Programmatic REST Bin) ---
async function createNewEventOnCloud() {
    try {
        const initData = {
            participants: DEFAULT_PARTICIPANTS,
            participantsSeason2: DEFAULT_PARTICIPANTS_S2,
            activeSeason: '1'
        };
        const response = await fetch('https://extendsclass.com/api/json-storage/bin', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(initData)
        });
        if (!response.ok) throw new Error("Gagal membuat database event baru.");
        const data = await response.json();
        return data.id; // Returns extendsclass unique bin ID
    } catch (e) {
        console.error("Gagal createNewEventOnCloud:", e);
        return null;
    }
}

async function fetchStateFromCloud() {
    if (!state.eventId || state.eventId === 'local') return;
    try {
        const response = await fetch(`https://extendsclass.com/api/json-storage/bin/${state.eventId}`);
        if (!response.ok) throw new Error("Gagal mengunduh database cloud.");
        const data = await response.json();
        
        state.participants = data.participants || [];
        state.participantsSeason2 = data.participantsSeason2 || [];
        state.activeSeason = data.activeSeason || '1';

        // Update active season toggler class states
        document.querySelectorAll('.season-toggle-btn').forEach(btn => {
            if (btn.dataset.season === state.activeSeason) btn.classList.add('active');
            else btn.classList.remove('active');
        });
        document.getElementById('admin-season-s1-btn').className = state.activeSeason === '1' ? 'season-toggle-btn active' : 'season-toggle-btn';
        document.getElementById('admin-season-s2-btn').className = state.activeSeason === '2' ? 'season-toggle-btn active' : 'season-toggle-btn';

        cloudSyncStatusMsg.innerHTML = `<i data-lucide="cloud"></i> Database: Terhubung Cloud`;
        cloudSyncStatusMsg.className = `sync-status connected`;
        lucide.createIcons();
    } catch (e) {
        cloudSyncStatusMsg.innerHTML = `<i data-lucide="cloud-off"></i> Database: Disconnected`;
        cloudSyncStatusMsg.className = `sync-status`;
        lucide.createIcons();
        throw e;
    }
}

async function saveStateToCloud() {
    const saveData = {
        participants: state.participants,
        participantsSeason2: state.participantsSeason2,
        activeSeason: state.activeSeason
    };

    // Save to LocalStorage first (instant backup!)
    localStorage.setItem('kcba_local_s1', JSON.stringify(state.participants));
    localStorage.setItem('kcba_local_s2', JSON.stringify(state.participantsSeason2));
    localStorage.setItem('kcba_local_season', state.activeSeason);

    if (state.eventId === 'local') {
        cloudSyncStatusMsg.innerHTML = `<i data-lucide="database"></i> Penyimpanan: Tersimpan Lokal`;
        cloudSyncStatusMsg.className = `sync-status connected`;
        lucide.createIcons();
        return;
    }

    if (!state.eventId) return;

    try {
        cloudSyncStatusMsg.innerHTML = `<i data-lucide="refresh-cw" class="spin"></i> Cloud Saving...`;
        
        const response = await fetch(`https://extendsclass.com/api/json-storage/bin/${state.eventId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(saveData)
        });
        if (!response.ok) throw new Error("Gagal mengunggah data.");
        
        cloudSyncStatusMsg.innerHTML = `<i data-lucide="cloud"></i> Database: Terhubung Cloud`;
        cloudSyncStatusMsg.className = `sync-status connected`;
    } catch (e) {
        console.error("Gagal sinkronisasi data ke cloud:", e);
        cloudSyncStatusMsg.innerHTML = `<i data-lucide="cloud-off"></i> Simpan Gagal (Lokal OK)`;
        cloudSyncStatusMsg.className = `sync-status`;
    }
    lucide.createIcons();
}

function startCloudPolling() {
    stopCloudPolling();
    // Poll cloud DB for updates every 6 seconds
    pollIntervalRef = setInterval(async () => {
        try {
            await fetchStateFromCloud();
            renderLeaderboard();
            renderAdminTable();
            updateCertificateDropdown(state.activeSeason === '1' ? state.participants : state.participantsSeason2);
            renderWinnersPanel(state);
        } catch (err) {
            console.warn("Polling fetch failed (temporary network error):", err);
        }
    }, 6000);
}

// --- Dynamic updates callback ---
function updateState(updates) {
    Object.assign(state, updates);
    renderLeaderboard();
    renderAdminTable();
}

function stopCloudPolling() {
    if (pollIntervalRef) {
        clearInterval(pollIntervalRef);
        pollIntervalRef = null;
    }
}

// --- Leaderboard Views ---
function renderLeaderboard() {
    if (!leaderboardBody) return;

    const activeList = state.activeSeason === '1' ? state.participants : state.participantsSeason2;
    const query = searchInput.value.toLowerCase().trim();
    let filtered = activeList.filter(p => 
        p.name.toLowerCase().includes(query)
    );

    filtered.sort((a, b) => b.total - a.total);

    if (query === "" && filtered.length > 0) {
        podiumArea.style.display = 'grid';
        renderPodium(filtered.slice(0, 3));
    } else {
        podiumArea.style.display = 'none';
    }

    leaderboardBody.innerHTML = '';
    
    if (filtered.length === 0) {
        noDataMsg.style.display = 'block';
        return;
    } else {
        noDataMsg.style.display = 'none';
    }

    filtered.forEach((p, index) => {
        const rank = index + 1;
        const row = document.createElement('tr');
        row.className = `leaderboard-row rank-${rank}`;
        row.dataset.id = p.id;
        
        row.innerHTML = `
            <td>
                <div class="rank-num-circle">${rank}</div>
            </td>
            <td>
                <span class="td-participant-name">${escapeHtml(p.name)}</span>
            </td>
            <td>
                <span class="td-participant-song">${escapeHtml(p.song)}</span>
            </td>
            <td class="score-col hide-mobile">${p.scores.vocal || '-'}</td>
            <td class="score-col hide-mobile">${p.scores.artikulasi || '-'}</td>
            <td class="score-col hide-mobile">${p.scores.pronounce || '-'}</td>
            <td class="score-col hide-mobile">${p.scores.pitch || '-'}</td>
            <td class="score-col hide-mobile">${p.scores.tempo || '-'}</td>
            <td class="score-col hide-mobile">${p.scores.feel || '-'}</td>
            <td class="score-col hide-mobile">${p.scores.teknik || '-'}</td>
            <td class="td-total-score">${p.total.toFixed(2)}</td>
        `;

        row.addEventListener('click', () => {
            openParticipantModal(p, rank);
        });

        leaderboardBody.appendChild(row);
    });
}

function renderPodium(top3) {
    if (!podiumArea) return;
    podiumArea.innerHTML = '';

    top3.forEach((p, idx) => {
        const rank = idx + 1;
        const card = document.createElement('div');
        card.className = `podium-card podium-${rank}`;
        
        card.innerHTML = `
            <div class="podium-rank">${rank}</div>
            <h3 class="podium-name">${escapeHtml(p.name)}</h3>
            <p class="podium-song">${escapeHtml(p.song)}</p>
            <div class="podium-score">${p.total.toFixed(2)}</div>
            <div class="podium-score-lbl">Total Nilai</div>
        `;

        card.addEventListener('click', () => {
            openParticipantModal(p, rank);
        });

        podiumArea.appendChild(card);
    });
}

// --- Admin Section Rendering ---
function renderAdminTable() {
    if (!adminTableBody) return;
    adminTableBody.innerHTML = '';

    const activeList = state.activeSeason === '1' ? state.participants : state.participantsSeason2;
    const role = getCurrentRole();
    const judgeInfo = getJudgeInfo(role);
    
    document.getElementById('admin-table-title').innerHTML = judgeInfo
        ? `<i class="lucide-table"></i> Lembar Nilai — ${judgeInfo.criteria} (${judgeInfo.name}) — Season ${state.activeSeason}`
        : `<i class="lucide-table"></i> Manajemen Nilai - Season ${state.activeSeason}`;

    activeList.forEach((p) => {
        const row = document.createElement('tr');

        if (judgeInfo) {
            // === JUDGE MODE: Only show Nama + Lagu + their one column ===
            row.innerHTML = `
                <td data-label="Nama Peserta">
                    <input type="text" class="admin-input-name" value="${escapeHtml(p.name)}" data-id="${p.id}" data-field="name" readonly style="opacity:0.6;cursor:not-allowed;">
                </td>
                <td data-label="Judul Lagu">
                    <input type="text" class="admin-input-song" value="${escapeHtml(p.song)}" data-id="${p.id}" data-field="song" readonly style="opacity:0.6;cursor:not-allowed;">
                </td>
                <td data-label="${judgeInfo.criteria}">
                    <input type="number" step="any" min="0" max="100" class="admin-input-score" value="${p.scores[judgeInfo.field] || 0}" data-id="${p.id}" data-field="${judgeInfo.field}">
                </td>
            `;
        } else {
            // === OWNER MODE: Show all 7 columns ===
            row.innerHTML = `
                <td data-label="Nama Peserta">
                    <input type="text" class="admin-input-name" value="${escapeHtml(p.name)}" data-id="${p.id}" data-field="name">
                </td>
                <td data-label="Judul Lagu">
                    <input type="text" class="admin-input-song" value="${escapeHtml(p.song)}" data-id="${p.id}" data-field="song">
                </td>
                <td data-label="Kualitas Vocal (MPUT)">
                    <input type="number" step="any" min="0" max="100" class="admin-input-score" value="${p.scores.vocal || 0}" data-id="${p.id}" data-field="vocal">
                </td>
                <td data-label="Artikulasi (NUR)">
                    <input type="number" step="any" min="0" max="100" class="admin-input-score" value="${p.scores.artikulasi || 0}" data-id="${p.id}" data-field="artikulasi">
                </td>
                <td data-label="Pronounce (KHRISNA)">
                    <input type="number" step="any" min="0" max="100" class="admin-input-score" value="${p.scores.pronounce || 0}" data-id="${p.id}" data-field="pronounce">
                </td>
                <td data-label="Pitch Control (DEWI)">
                    <input type="number" step="any" min="0" max="100" class="admin-input-score" value="${p.scores.pitch || 0}" data-id="${p.id}" data-field="pitch">
                </td>
                <td data-label="Tempo (CECEP)">
                    <input type="number" step="any" min="0" max="100" class="admin-input-score" value="${p.scores.tempo || 0}" data-id="${p.id}" data-field="tempo">
                </td>
                <td data-label="Penghayatan (WILDAN)">
                    <input type="number" step="any" min="0" max="100" class="admin-input-score" value="${p.scores.feel || 0}" data-id="${p.id}" data-field="feel">
                </td>
                <td data-label="Teknik Vocal (WAY)">
                    <input type="number" step="any" min="0" max="100" class="admin-input-score" value="${p.scores.teknik || 0}" data-id="${p.id}" data-field="teknik">
                </td>
                <td data-label="Aksi">
                    <button class="delete-row-btn" data-id="${p.id}">
                        <i data-lucide="trash"></i>
                    </button>
                </td>
            `;
        }
        adminTableBody.appendChild(row);
    });

    setupAdminInputsListeners();
    lucide.createIcons();
}

function setupAdminInputsListeners() {
    const inputs = adminTableBody.querySelectorAll('input');
    inputs.forEach(input => {
        input.addEventListener('change', async (e) => {
            const id = input.dataset.id;
            const field = input.dataset.field;
            let value = input.value;

            const listKey = state.activeSeason === '1' ? 'participants' : 'participantsSeason2';
            const list = [...state[listKey]];
            const pIdx = list.findIndex(p => p.id === id);
            
            if (pIdx !== -1) {
                if (field === 'name' || field === 'song') {
                    list[pIdx][field] = value.trim();
                } else {
                    // It is a score input: Validate 50 - 100 range. Treat 0 as "belum dinilai"
                    let num = parseFloat(value);
                    if (isNaN(num)) num = 0;
                    
                    if (num !== 0) {
                        num = Math.max(50, Math.min(100, num));
                    }
                    
                    list[pIdx].scores[field] = num;
                    
                    // Recalculate total across all 7 criteria
                    const s = list[pIdx].scores;
                    const tot = (s.vocal||0) + (s.artikulasi||0) + (s.pronounce||0) + (s.pitch||0) + (s.tempo||0) + (s.feel||0) + (s.teknik||0);
                    list[pIdx].total = parseFloat(tot.toFixed(2));
                }
                
                // Update State and sync to Cloud
                state[listKey] = list;
                await saveStateToCloud();
                
                // Rerender table
                renderAdminTable();
                
                // Sync cert dropdown
                updateCertificateDropdown(state.activeSeason === '1' ? state.participants : state.participantsSeason2);
                renderWinnersPanel(state);
            }
        });
    });

    // Handle delete row
    const deleteBtns = adminTableBody.querySelectorAll('.delete-row-btn');
    deleteBtns.forEach(btn => {
        btn.addEventListener('click', async () => {
            const id = btn.dataset.id;
            if (confirm("Apakah Anda yakin ingin menghapus peserta ini?")) {
                const listKey = state.activeSeason === '1' ? 'participants' : 'participantsSeason2';
                const filtered = state[listKey].filter(p => p.id !== id);
                
                state[listKey] = filtered;
                await saveStateToCloud();
                
                updateState({});
            }
        });
    });
}

// --- Event Listeners Setup ---
function setupEventListeners() {
    // Search input
    searchInput.addEventListener('input', () => {
        renderLeaderboard();
    });

    // Add Row locally
    btnAddRow.addEventListener('click', async () => {
        const newId = `local-${Date.now()}`;
        const newParticipant = {
            id: newId,
            name: "Nama Peserta Baru",
            song: "Judul Lagu Baru",
            scores: { vocal: 0, artikulasi: 0, pronounce: 0, pitch: 0, tempo: 0, feel: 0, teknik: 0 },
            total: 0
        };

        const listKey = state.activeSeason === '1' ? 'participants' : 'participantsSeason2';
        const list = [...state[listKey], newParticipant];
        
        state[listKey] = list;
        await saveStateToCloud();
        
        updateState({});
    });

    // Season selectors (Leaderboard Page)
    document.querySelectorAll('.season-toggle-btn').forEach(btn => {
        btn.addEventListener('click', async () => {
            const season = btn.dataset.season;
            if (!season) return;

            document.querySelectorAll('.season-toggle-btn').forEach(b => {
                if (b.dataset.season === season) b.classList.add('active');
                else b.classList.remove('active');
            });

            // Update state & sync to cloud
            state.activeSeason = season;
            await saveStateToCloud();

            // Synced toggles on Admin page
            document.getElementById('admin-season-s1-btn').className = season === '1' ? 'season-toggle-btn active' : 'season-toggle-btn';
            document.getElementById('admin-season-s2-btn').className = season === '2' ? 'season-toggle-btn active' : 'season-toggle-btn';

            renderLeaderboard();
            renderAdminTable();
            updateCertificateDropdown(season === '1' ? state.participants : state.participantsSeason2);
        });
    });

    // Admin Season buttons listeners
    document.getElementById('admin-season-s1-btn').addEventListener('click', () => {
        document.querySelector('.season-toggle-btn[data-season="1"]').click();
    });

    document.getElementById('admin-season-s2-btn').addEventListener('click', () => {
        document.querySelector('.season-toggle-btn[data-season="2"]').click();
    });

    // Copy Event Link Button (Admin Tab)
    btnCopyEventLink.addEventListener('click', () => {
        adminEventLink.select();
        adminEventLink.setSelectionRange(0, 99999);
        navigator.clipboard.writeText(adminEventLink.value);
        
        const originalText = btnCopyEventLink.innerHTML;
        btnCopyEventLink.innerHTML = `<i data-lucide="check"></i> Tersalin`;
        lucide.createIcons();
        setTimeout(() => {
            btnCopyEventLink.innerHTML = originalText;
            lucide.createIcons();
        }, 1500);
    });

    // Copy Event Link Button (Header Bar)
    btnHeaderCopyLink.addEventListener('click', () => {
        headerEventLink.select();
        headerEventLink.setSelectionRange(0, 99999);
        navigator.clipboard.writeText(headerEventLink.value);
        
        const originalText = btnHeaderCopyLink.innerHTML;
        btnHeaderCopyLink.innerHTML = `<i data-lucide="check"></i> <span>Tersalin</span>`;
        lucide.createIcons();
        setTimeout(() => {
            btnHeaderCopyLink.innerHTML = originalText;
            lucide.createIcons();
        }, 1500);
    });

    // Promote 5 Finalists from Season 1 to Season 2
    btnPromoteFinalists.addEventListener('click', async () => {
        if (state.participants.length === 0) {
            alert("Tidak ada data peserta di Season 1!");
            return;
        }

        if (confirm("Apakah Anda yakin ingin mempromosikan 5 peserta terbaik Season 1 ke Season 2 di cloud? Tindakan ini akan mengosongkan data Season 2 Anda saat ini.")) {
            const sortedS1 = [...state.participants].sort((a, b) => b.total - a.total);
            const top5 = sortedS1.slice(0, 5);

            const promotedList = top5.map((p, idx) => ({
                id: `promoted-${idx}-${Date.now()}`,
                name: p.name,
                song: `${p.song} (Finals)`,
                scores: { vocal: 0, artikulasi: 0, pronounce: 0, pitch: 0, tempo: 0, feel: 0, teknik: 0 },
                total: 0
            }));

            state.participantsSeason2 = promotedList;
            state.activeSeason = '2';
            
            await saveStateToCloud();
            updateState({});

            document.querySelector('.season-toggle-btn[data-season="2"]').click();
            alert("5 Finalis terbaik berhasil dipromosikan ke Season 2! Data diupdate di database cloud.");
        }
    });

    // Reset Data
    btnResetData.addEventListener('click', async () => {
        if (confirm("Apakah Anda yakin ingin RESET database cloud? Tindakan ini akan mengembalikan data default contoh.")) {
            state.participants = [...DEFAULT_PARTICIPANTS];
            state.participantsSeason2 = [...DEFAULT_PARTICIPANTS_S2];
            state.activeSeason = '1';
            
            await saveStateToCloud();
            updateState({});
            alert("Database event cloud berhasil di-reset.");
        }
    });

    // Close Modal Detail
    btnCloseModal.addEventListener('click', () => {
        participantModal.style.display = 'none';
    });

    // Click outside modal card to close
    participantModal.addEventListener('click', (e) => {
        if (e.target === participantModal) {
            participantModal.style.display = 'none';
        }
    });

    // Open Live Stage Mode
    btnLiveStage.addEventListener('click', () => {
        liveStageOverlay.style.display = 'flex';
        renderLiveStage();
        
        const activeList = state.activeSeason === '1' ? state.participants : state.participantsSeason2;
        if (activeList.length > 0) {
            triggerConfetti();
        }
    });

    // Close Live Stage Mode
    btnCloseLive.addEventListener('click', () => {
        liveStageOverlay.style.display = 'none';
    });
}

// --- Radar Chart Rendering via Chart.js ---
function openParticipantModal(participant, rank) {
    document.getElementById('modal-participant-name').textContent = participant.name;
    document.getElementById('modal-participant-song').textContent = participant.song;
    
    // Fill numbers
    document.getElementById('val-vocal').textContent = participant.scores.vocal || '-';
    document.getElementById('val-artikulasi').textContent = participant.scores.artikulasi || '-';
    document.getElementById('val-pronounce').textContent = participant.scores.pronounce || '-';
    document.getElementById('val-pitch').textContent = participant.scores.pitch || '-';
    document.getElementById('val-tempo').textContent = participant.scores.tempo || '-';
    document.getElementById('val-feel').textContent = participant.scores.feel || '-';
    document.getElementById('val-teknik').textContent = participant.scores.teknik || '-';
    document.getElementById('val-total-score').textContent = participant.total.toFixed(2);
    
    participantModal.style.display = 'flex';

    // Render Radar Chart
    const ctx = document.getElementById('performance-chart').getContext('2d');
    
    if (radarChartInstance) {
        radarChartInstance.destroy();
    }

    const data = {
        labels: ['Kualitas Vocal\n(MPUT)', 'Artikulasi\n(NUR)', 'Pronounce\n(KHRISNA)', 'Pitch Control\n(DEWI)', 'Tempo\n(CECEP)', 'Penghayatan\n(WILDAN)', 'Teknik Vocal\n(WAY)'],
        datasets: [{
            label: 'Skor Peserta',
            data: [
                participant.scores.vocal || 0,
                participant.scores.artikulasi || 0,
                participant.scores.pronounce || 0,
                participant.scores.pitch || 0,
                participant.scores.tempo || 0,
                participant.scores.feel || 0,
                participant.scores.teknik || 0
            ],
            fill: true,
            backgroundColor: 'rgba(204, 17, 47, 0.2)',
            borderColor: '#ffd700',
            pointBackgroundColor: '#ffd700',
            pointBorderColor: '#fff',
            pointHoverBackgroundColor: '#fff',
            pointHoverBorderColor: '#cc112f',
            borderWidth: 2
        }]
    };

    const config = {
        type: 'radar',
        data: data,
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false }
            },
            scales: {
                r: {
                    angleLines: { color: 'rgba(255, 255, 255, 0.1)' },
                    grid: { color: 'rgba(255, 255, 255, 0.1)' },
                    pointLabels: {
                        color: '#d0b9c3',
                        font: { family: 'Outfit', size: 11, weight: 'bold' }
                    },
                    ticks: {
                        color: '#c99e12',
                        backdropColor: 'transparent',
                        font: { size: 9 }
                    },
                    min: 0,
                    max: 100
                }
            }
        }
    };

    radarChartInstance = new Chart(ctx, config);
}

// --- Live Stage Overlay Rendering ---
function renderLiveStage() {
    const livePodiumDisplay = document.getElementById('live-podium-display');
    const liveRankingListBody = document.getElementById('live-ranking-list-body');
    
    if (!livePodiumDisplay || !liveRankingListBody) return;

    liveStageTitle.textContent = "THE VOICE KCBA";
    liveStageSubtitle.textContent = `SEASON ${state.activeSeason} LEADERBOARD`;

    const activeList = state.activeSeason === '1' ? state.participants : state.participantsSeason2;
    const sorted = [...activeList].sort((a, b) => b.total - a.total);
    
    // Render live podiums (Top 3)
    livePodiumDisplay.innerHTML = '';
    const top3 = sorted.slice(0, 3);
    
    top3.forEach((p, idx) => {
        const rank = idx + 1;
        const podium = document.createElement('div');
        podium.className = `live-podium live-podium-${rank}`;
        
        podium.innerHTML = `
            <div class="live-podium-avatar">${rank}</div>
            <div class="live-podium-name">${escapeHtml(p.name)}</div>
            <div class="live-podium-song">${escapeHtml(p.song)}</div>
            <div class="live-podium-score">${p.total.toFixed(2)}</div>
        `;
        
        livePodiumDisplay.appendChild(podium);
    });

    // Render list (All)
    liveRankingListBody.innerHTML = '';
    sorted.forEach((p, idx) => {
        const rank = idx + 1;
        const row = document.createElement('div');
        row.className = 'live-list-row';
        
        row.innerHTML = `
            <div class="live-list-rank">${rank}</div>
            <div class="live-list-name-area">
                <span class="live-list-name">${escapeHtml(p.name)}</span>
                <span class="live-list-song">${escapeHtml(p.song)}</span>
            </div>
            <div class="live-list-score">${p.total.toFixed(2)}</div>
        `;
        
        liveRankingListBody.appendChild(row);
    });
}

// --- Confetti Celebration ---
function triggerConfetti() {
    const duration = 3 * 1000;
    const end = Date.now() + duration;

    (function frame() {
        confetti({
            particleCount: 5,
            angle: 60,
            spread: 55,
            origin: { x: 0, y: 0.8 },
            colors: ['#ffd700', '#cc112f', '#ffe066']
        });
        confetti({
            particleCount: 5,
            angle: 120,
            spread: 55,
            origin: { x: 1, y: 0.8 },
            colors: ['#ffd700', '#cc112f', '#ffe066']
        });

        if (Date.now() < end) {
            requestAnimationFrame(frame);
        }
    }());
}

// --- Helper Functions ---
function escapeHtml(str) {
    if (!str) return '';
    return str
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}
