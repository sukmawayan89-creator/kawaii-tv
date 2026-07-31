import html2canvas from 'html2canvas';

// Active Certificate Configuration State
let currentTheme = 'gold';
let activeCertSeason = '1';

// Helper to switch certificate background images dynamically
function updateCertificateBackground(canvasElement, titleText) {
    if (!canvasElement) return;
    let bgUrl = '/certificate_bg_juara1.jpg';
    const textUpper = (titleText || '').toUpperCase();
    if (textUpper.includes('2')) {
        bgUrl = '/certificate_bg_juara2.jpg';
    } else if (textUpper.includes('3')) {
        bgUrl = '/certificate_bg_juara3.jpg';
    } else if (textUpper.includes('FAVORIT')) {
        bgUrl = '/certificate_bg_favorit.jpg';
    }
    canvasElement.style.backgroundImage = `url('${bgUrl}')`;
}

/**
 * Initializes certificate control listeners and interactions
 * @param {Object} state - Main application state
 * @param {Function} updateStateCallback - Callback to update main state if needed
 */
export function initCertificateGenerator(state, updateStateCallback) {
    // Mode Switching elements
    const btnModeSingle = document.getElementById('btn-mode-single');
    const btnModeWinners = document.getElementById('btn-mode-winners');
    const certSingleArea = document.getElementById('cert-single-mode-area');
    const certWinnersArea = document.getElementById('cert-winners-mode-area');

    // Single Cert elements
    const certParticipantSelect = document.getElementById('cert-participant-select');
    const certTitleSelect = document.getElementById('cert-title-select');

    // Single Display elements
    const certDisplayName = document.getElementById('cert-display-name');
    
    const certCanvas = document.getElementById('certificate-canvas');
    const btnDownload = document.getElementById('btn-download-cert');
    const btnPrint = document.getElementById('btn-print-cert');
    const themeOptions = document.querySelectorAll('.theme-option');
    const certSeasonS1Btn = document.getElementById('cert-season-s1-btn');
    const certSeasonS2Btn = document.getElementById('cert-season-s2-btn');

    // Winners Panel elements
    const winnerFavSelect = document.getElementById('winner-fav-select');

    const boxC1Name = document.getElementById('box-c1-name');
    const boxC2Name = document.getElementById('box-c2-name');
    const boxC3Name = document.getElementById('box-c3-name');
    const boxCFavName = document.getElementById('box-cfav-name');

    // --- Mode Switch Listeners ---
    btnModeSingle.addEventListener('click', () => {
        btnModeSingle.classList.add('active');
        btnModeWinners.classList.remove('active');
        certSingleArea.style.display = 'grid';
        certWinnersArea.style.display = 'none';
        
        // Refresh single cert dropdown
        const activeList = activeCertSeason === '1' ? state.participants : state.participantsSeason2;
        updateCertificateDropdown(activeList);
    });

    btnModeWinners.addEventListener('click', () => {
        btnModeWinners.classList.add('active');
        btnModeSingle.classList.remove('active');
        certSingleArea.style.display = 'none';
        certWinnersArea.style.display = 'block';
        
        // Refresh winners display
        renderWinnersPanel(state);
    });

    // --- Single Certificate Listeners ---
    
    // Tab toggle for Single Cert Season source
    certSeasonS1Btn.addEventListener('click', () => {
        certSeasonS1Btn.classList.add('active');
        certSeasonS2Btn.classList.remove('active');
        activeCertSeason = '1';
        updateCertificateDropdown(state.participants);
        resetCertificatePreview();
    });

    certSeasonS2Btn.addEventListener('click', () => {
        certSeasonS2Btn.classList.add('active');
        certSeasonS1Btn.classList.remove('active');
        activeCertSeason = '2';
        updateCertificateDropdown(state.participantsSeason2);
        resetCertificatePreview();
    });

    // Participant select
    certParticipantSelect.addEventListener('change', (e) => {
        const participantId = e.target.value;
        if (!participantId) {
            resetCertificatePreview();
            return;
        }

        const activeList = activeCertSeason === '1' ? state.participants : state.participantsSeason2;
        const participant = activeList.find(p => p.id === participantId);
        if (participant) {
            certDisplayName.textContent = participant.name.toUpperCase();
            updateCertificateBackground(certCanvas, certTitleSelect.value);
        }
    });

    // Title select
    certTitleSelect.addEventListener('change', (e) => {
        const val = e.target.value;
        updateCertificateBackground(certCanvas, val);
        
        let theme = 'gold';
        if (val.includes('2')) theme = 'silver';
        else if (val.includes('3')) theme = 'bronze';
        else if (val.includes('FAVORIT')) theme = 'favorite';
        currentTheme = theme;
    });

    // Theme Picker
    themeOptions.forEach(opt => {
        opt.addEventListener('click', () => {
            themeOptions.forEach(o => o.classList.remove('active'));
            opt.classList.add('active');
            
            const theme = opt.dataset.theme;
            currentTheme = theme;
            
            let val = "JUARA 1";
            if (theme === "silver") val = "JUARA 2";
            else if (theme === "bronze") val = "JUARA 3";
            else if (theme === "favorite") val = "JUARA FAVORIT";
            
            certTitleSelect.value = val;
            updateCertificateBackground(certCanvas, val);
        });
    });

    // Download Single PNG
    btnDownload.addEventListener('click', async () => {
        if (!certParticipantSelect.value) {
            alert("Harap pilih nama peserta terlebih dahulu!");
            return;
        }

        const originalText = btnDownload.innerHTML;
        btnDownload.disabled = true;
        btnDownload.innerHTML = `<i class="lucide-spinner spin"></i> Mengunduh...`;

        try {
            await document.fonts.ready;
            
            const canvas = await html2canvas(certCanvas, {
                scale: 3, // HD print scale
                useCORS: true,
                allowTaint: false,
                logging: false
            });

            const imgData = canvas.toDataURL('image/png');
            const link = document.createElement('a');
            const participantName = certDisplayName.textContent.toLowerCase().replace(/\s+/g, '_');
            
            link.download = `piagam_${participantName}_${currentTheme}.png`;
            link.href = imgData;
            link.click();
        } catch (error) {
            console.error("Gagal mendownload sertifikat:", error);
            alert("Terjadi kesalahan saat membuat gambar sertifikat.");
        } finally {
            btnDownload.disabled = false;
            btnDownload.innerHTML = originalText;
        }
    });

    // Print Single Certificate
    btnPrint.addEventListener('click', () => {
        if (!certParticipantSelect.value) {
            alert("Harap pilih nama peserta terlebih dahulu!");
            return;
        }
        window.print();
    });

    // --- Winners Panel Action & Dropdown Listeners ---

    // Favorite Winner Selector Change
    winnerFavSelect.addEventListener('change', (e) => {
        const selectedId = e.target.value;
        
        // Find in all participants across both seasons
        const allParticipants = [...state.participants, ...state.participantsSeason2];
        const participant = allParticipants.find(p => p.id === selectedId);
        
        if (participant) {
            boxCFavName.textContent = participant.name;
        } else {
            boxCFavName.textContent = "-";
        }
    });

    // Download button event listener inside 4 winners grid
    const winnerDownloadBtns = document.querySelectorAll('.btn-download-winner');
    winnerDownloadBtns.forEach(btn => {
        btn.addEventListener('click', async () => {
            const rankType = btn.dataset.rank;
            let targetParticipant = null;
            let title = "";

            // Sort Season 2 to find Top 3
            const sortedFinals = [...state.participantsSeason2].sort((a, b) => b.total - a.total);

            let theme = "gold";
            if (rankType === "1") {
                targetParticipant = sortedFinals[0];
                title = "JUARA 1";
                theme = "gold";
            } else if (rankType === "2") {
                targetParticipant = sortedFinals[1];
                title = "JUARA 2";
                theme = "silver";
            } else if (rankType === "3") {
                targetParticipant = sortedFinals[2];
                title = "JUARA 3";
                theme = "bronze";
            } else if (rankType === "fav") {
                const favId = winnerFavSelect.value;
                if (!favId) {
                    alert("Harap tentukan pemenang Terfavorit melalui dropdown di atas terlebih dahulu!");
                    return;
                }
                const allParticipants = [...state.participants, ...state.participantsSeason2];
                targetParticipant = allParticipants.find(p => p.id === favId);
                title = "JUARA FAVORIT";
                theme = "favorite";
            }

            if (!targetParticipant) {
                alert("Data peserta pemenang belum lengkap untuk kategori ini!");
                return;
            }

            // Trigger hidden canvas render
            const hiddenCanvas = document.getElementById('hidden-winner-canvas');
            const hName = document.getElementById('hidden-c-name');

            // Inject values
            hName.textContent = targetParticipant.name.toUpperCase();
            updateCertificateBackground(hiddenCanvas, title);

            // Show loading
            const originalText = btn.innerHTML;
            btn.disabled = true;
            btn.innerHTML = `<i class="lucide-spinner spin"></i>...`;

            try {
                await document.fonts.ready;
                
                const canvas = await html2canvas(hiddenCanvas, {
                    scale: 3, // HD print scale
                    useCORS: true,
                    allowTaint: false,
                    logging: false
                });

                const imgData = canvas.toDataURL('image/png');
                const link = document.createElement('a');
                const pName = targetParticipant.name.toLowerCase().replace(/\s+/g, '_');
                
                link.download = `piagam_${title.toLowerCase().replace(/\s+/g, '_')}_${pName}.png`;
                link.href = imgData;
                link.click();
            } catch (err) {
                console.error("Gagal mendownload sertifikat pemenang:", err);
                alert("Terjadi kesalahan saat mengekspor gambar piagam.");
            } finally {
                btn.disabled = false;
                btn.innerHTML = originalText;
                lucide.createIcons();
            }
        });
    });

    function resetCertificatePreview() {
        certDisplayName.textContent = "NAMA PESERTA";
        certParticipantSelect.value = "";
        updateCertificateBackground(certCanvas, certTitleSelect.value);
    }
}

/**
 * Updates the dropdown list of participants in the certificate tab.
 * @param {Array} participants - List of participants to display
 */
export function updateCertificateDropdown(participants) {
    const certParticipantSelect = document.getElementById('cert-participant-select');
    if (!certParticipantSelect) return;

    const currentVal = certParticipantSelect.value;
    certParticipantSelect.innerHTML = `<option value="">-- Pilih Peserta --</option>`;

    // Sort by score
    const sorted = [...participants].sort((a, b) => b.total - a.total);

    sorted.forEach((p, idx) => {
        const option = document.createElement('option');
        option.value = p.id;
        option.textContent = `${idx + 1}. ${p.name} (${p.total.toFixed(2)})`;
        certParticipantSelect.appendChild(option);
    });

    if (participants.some(p => p.id === currentVal)) {
        certParticipantSelect.value = currentVal;
    }
}

/**
 * Renders names in the Winners Panel and updates the Favorite Winner dropdown list.
 * @param {Object} state - Main application state
 */
export function renderWinnersPanel(state) {
    const boxC1Name = document.getElementById('box-c1-name');
    const boxC2Name = document.getElementById('box-c2-name');
    const boxC3Name = document.getElementById('box-c3-name');
    const boxCFavName = document.getElementById('box-cfav-name');
    const winnerFavSelect = document.getElementById('winner-fav-select');

    if (!boxC1Name || !boxC2Name || !boxC3Name || !winnerFavSelect) return;

    // Get Season 2 participants, sorted by total score descending
    const sortedFinals = [...state.participantsSeason2].sort((a, b) => b.total - a.total);

    // Fill Top 3 names
    boxC1Name.textContent = sortedFinals[0] ? sortedFinals[0].name : "-";
    boxC2Name.textContent = sortedFinals[1] ? sortedFinals[1].name : "-";
    boxC3Name.textContent = sortedFinals[2] ? sortedFinals[2].name : "-";

    // Populate Favorite dropdown with ALL participants across both Season 1 and Season 2 (deduplicated by name)
    const currentFavVal = winnerFavSelect.value;
    winnerFavSelect.innerHTML = `<option value="">-- Pilih Juara Terfavorit --</option>`;

    const allParticipants = [];
    const namesSet = new Set();

    // Add Season 2 first
    sortedFinals.forEach(p => {
        if (!namesSet.has(p.name)) {
            namesSet.add(p.name);
            allParticipants.push(p);
        }
    });

    // Add Season 1
    state.participants.forEach(p => {
        if (!namesSet.has(p.name)) {
            namesSet.add(p.name);
            allParticipants.push(p);
        }
    });

    allParticipants.forEach(p => {
        const option = document.createElement('option');
        option.value = p.id;
        option.textContent = p.name;
        winnerFavSelect.appendChild(option);
    });

    // Restore selected favorite if exists
    if (allParticipants.some(p => p.id === currentFavVal)) {
        winnerFavSelect.value = currentFavVal;
        const favWinner = allParticipants.find(p => p.id === currentFavVal);
        boxCFavName.textContent = favWinner ? favWinner.name : "-";
    } else {
        boxCFavName.value = "";
        boxCFavName.textContent = "-";
    }
}
