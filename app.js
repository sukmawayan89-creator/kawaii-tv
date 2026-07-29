/* ==========================================================================
   KAWAII ANDROID TV EMULATOR - CORE CLIENT-SIDE ENGINE
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  console.log('Android TV Emulator engine initialized.');

  // --- CONFIG ---
  // Secara otomatis mendeteksi server lokal atau cloud (Vercel)
  const BACKEND_URL = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') 
    ? 'http://localhost:8081' 
    : window.location.origin;

  // --- STATE ---
  const state = {
    isPowerOn: true,
    volume: 0.8,
    activeApp: null,
    focusedAppIndex: 0,
    apps: [],
    customApps: [],
    
    // Navigation details for Next / Prev Channel switching
    activeChannelUrl: null,
    
    // APK Installation state
    pendingApk: null,
    lastInstalledApp: null
  };

  // Preloaded TV apps - Fallbacks in case the dynamic /channels API is loading
  const defaultApps = [
    {
      id: 'app-gvision-v3',
      name: 'GVision V3 (IPTV Premium)',
      icon: 'fa-solid fa-satellite-dish',
      color: '#eab308',
      channels: [
        { name: 'TVRI Nasional HD', url: 'https://ott-balancer.tvri.go.id/live/eds/Nasional/hls/Nasional.m3u8', desc: 'Siaran Publik Nasional HD' },
        { name: 'Metro TV Live HD', url: 'https://edge.medcom.id/live-edge/smil:metro.smil/playlist.m3u8', desc: 'Siaran Berita Nasional 24 Jam' },
        { name: 'DAAI TV HD', url: 'https://pull.daaiplus.com/live-DAAIPLUS/live-DAAIPLUS_HD.m3u8', desc: 'Televisi Kemanusiaan & Budaya' },
        { name: 'ANTV Live', url: 'http://103.58.160.157:8278/720-ANTV/playlist.m3u8', desc: 'Hiburan Keluarga & Sinetron' },
        { name: 'SCTV HD (DensTV)', url: 'https://op-flashcon-digdayahd-1.dens.tv/h/h217/index.m3u8', desc: 'Siaran Nasional SCTV' },
        { name: 'Indosiar HD (DensTV)', url: 'https://op-flashcon-digdayahd-1.dens.tv/h/h235/index.m3u8', desc: 'Siaran Nasional Indosiar' },
        { name: 'tvOne HD (DensTV)', url: 'https://op-flashcon-digdayahd-1.dens.tv/h/h40/index.m3u8', desc: 'Siaran Berita tvOne' },
        { name: 'Kompas TV (DensTV)', url: 'https://op-flashcon-digdayahd-1.dens.tv/h/h234/index.m3u8', desc: 'Siaran Berita Kompas' },
        { name: 'CNN Indonesia', url: 'https://live.cnnindonesia.com/livecnn/livecnn-avc1_2500000=7-3277707030000000.mpd|User-Agent=referrer=https://www.cnnindonesia.com/', desc: 'Berita Terkini CNN Indonesia' },
        { name: 'CNBC Indonesia', url: 'https://live.cnbcindonesia.com/livecnbc/livecnbc-avc1_2500000=7-3277707030000000.mpd|User-Agent=referrer=https://www.cnbcindonesia.com/', desc: 'Berita Bisnis CNBC Indonesia' }
      ]
    },
    {
      id: 'app-tvri-nasional',
      name: 'TVRI Nasional HD (FTA)',
      icon: 'fa-solid fa-satellite-dish',
      color: '#3b82f6',
      channels: [
        { name: 'TVRI Nasional', url: 'https://ott-balancer.tvri.go.id/live/eds/Nasional/hls/Nasional.m3u8', desc: 'Siaran Publik Nasional HD' },
        { name: 'TVRI Sport HD', url: 'https://ott-balancer.tvri.go.id/live/eds/SportHD/hls/SportHD.m3u8', desc: 'Siaran Olahraga Nasional' }
      ]
    },
    {
      id: 'app-metro-tv',
      name: 'Metro TV HD (FTA)',
      icon: 'fa-solid fa-tv',
      color: '#a78bfa',
      channels: [
        { name: 'Metro TV Live', url: 'https://edge.medcom.id/live-edge/smil:metro.smil/playlist.m3u8', desc: 'Siaran Berita Nasional 24 Jam' }
      ]
    }
  ];

  // --- HTML ELEMENTS ---
  const appsGridContainer = document.getElementById('apps-grid-container');
  const viewHome = document.getElementById('view-home');
  const viewAppPlayer = document.getElementById('view-app-player');
  const viewApkInstaller = document.getElementById('view-apk-installer');
  const currentAppTitle = document.getElementById('current-app-title');
  const btnAppClose = document.getElementById('btn-app-close');
  const liveVideoPlayer = document.getElementById('live-video-player');
  const channelListContainer = document.getElementById('channel-list-container');
  const videoErrorMsg = document.getElementById('video-error-msg');
  const videoErrorText = document.getElementById('video-error-text');
  const statusTime = document.getElementById('status-time');

  // Next / Prev Channel buttons
  const btnNextChannel = document.getElementById('btn-next-channel');
  const btnPrevChannel = document.getElementById('btn-prev-channel');
  const btnFloatNext = document.getElementById('btn-float-next');
  const btnFloatPrev = document.getElementById('btn-float-prev');

  // M3U Loader Elements
  const m3uDropzone = document.getElementById('m3u-dropzone');
  const m3uFileInput = document.getElementById('m3u-file-input');
  const m3uUrlInput = document.getElementById('m3u-url-input');
  const btnLoadM3uUrl = document.getElementById('btn-load-m3u-url');
  const channelSearch = document.getElementById('channel-search');

  // APK Uploader Elements
  const apkDropzone = document.getElementById('apk-dropzone');
  const apkFileInput = document.getElementById('apk-file-input');
  const installAppName = document.getElementById('install-app-name');
  const installAppFilename = document.getElementById('install-app-filename');
  const installAppIcon = document.getElementById('install-app-icon');
  const installAppUrl = document.getElementById('install-app-url');
  
  const step1 = document.getElementById('installer-body-step1');
  const step2 = document.getElementById('installer-body-step2');
  const step3 = document.getElementById('installer-body-step3');
  
  const btnInstallCancel = document.getElementById('btn-install-cancel');
  const btnInstallConfirm = document.getElementById('btn-install-confirm');
  const btnInstallDone = document.getElementById('btn-install-done');
  const btnInstallOpen = document.getElementById('btn-install-open');
  const installProgressFill = document.getElementById('install-progress-fill');
  const installStatusText = document.getElementById('install-status-text');

  // Virtual Remote Elements
  const remotePower = document.getElementById('remote-power');
  const remoteUp = document.getElementById('remote-up');
  const remoteDown = document.getElementById('remote-down');
  const remoteLeft = document.getElementById('remote-left');
  const remoteRight = document.getElementById('remote-right');
  const remoteOk = document.getElementById('remote-ok');
  const remoteBack = document.getElementById('remote-back');
  const remoteHome = document.getElementById('remote-home');
  const remoteVolUp = document.getElementById('remote-vol-up');
  const remoteVolDown = document.getElementById('remote-vol-down');

  // System Stats Elements
  const valCpu = document.getElementById('cpu-val');
  const valRam = document.getElementById('ram-val');
  const valPing = document.getElementById('ping-val');
  
  const fillCpu = document.querySelector('.fill-cpu');
  const fillRam = document.querySelector('.fill-ram');
  const fillPing = document.querySelector('.fill-ping');

  let hlsInstance = null;
  let shakaPlayer = null;

  // --- INITIALIZE ---
  loadApps();
  updateTime();
  setInterval(updateTime, 60000);
  initSystemStatsSimulator();
  initRemoteControl();
  initApkInstaller();
  initM3uLoader();
  initApkFileUploader();
  initDeviceNav();
  initVideoPlayerEvents();
  initChannelNavigatorEvents();
  initRemoteReceiver();

  // Polling interval for background auto-refresh (every 30 seconds)
  setInterval(loadApps, 30000);

  // Load channels dynamically from backend proxy server
  function loadApps() {
    // Show local drawer immediately with defaults and custom apps
    const customAppsStr = localStorage.getItem('kawaii_user_custom_apps');
    let customApps = [];
    if (customAppsStr) {
      customApps = JSON.parse(customAppsStr);
    }
    
    state.apps = [...defaultApps, ...customApps];
    renderAppDrawer();

    // Fetch latest online list from backend /channels API (fallback to absolute url if loaded via local file:/// protocol)
    const channelsUrl = (window.location.protocol === 'file:' || window.location.hostname !== 'localhost') ? `${BACKEND_URL}/channels` : '/channels';
    fetch(channelsUrl)
      .then(res => {
        if (!res.ok) throw new Error("API returned non-200");
        return res.json();
      })
      .then(data => {
        if (data && data.length > 0) {
          state.apps = [...data, ...customApps];
          console.log(`Loaded ${state.apps.length} TV categories dynamically.`);
          
          // Silently update active app channels if player screen is active
          if (state.activeApp) {
            const updated = state.apps.find(a => a.id === state.activeApp.id);
            if (updated) {
              state.activeApp.channels = updated.channels;
              renderChannelSidebar(state.activeApp.channels, false);
            }
          }
        }
        renderAppDrawer();
      })
      .catch(err => {
        console.warn("Falling back to offline cache, API failed:", err);
        renderAppDrawer();
      });
  }

  function renderAppDrawer() {
    if (!appsGridContainer) return;
    appsGridContainer.innerHTML = '';

    state.apps.forEach((app, idx) => {
      const appCard = document.createElement('div');
      appCard.className = 'app-icon-card';
      if (idx === state.focusedAppIndex) {
        appCard.classList.add('focused');
      }

      appCard.innerHTML = `
        <div class="app-icon-wrapper" style="color: ${app.color || '#3b82f6'}; border-bottom: 3px solid ${app.color || '#3b82f6'};">
          <i class="${app.icon || 'fa-solid fa-tv'}"></i>
        </div>
        <span class="app-icon-title">${app.name}</span>
      `;

      appCard.addEventListener('click', () => {
        state.focusedAppIndex = idx;
        updateFocus();
        launchApp(app);
      });

      appsGridContainer.appendChild(appCard);
    });
  }

  function updateFocus() {
    const cards = appsGridContainer.querySelectorAll('.app-icon-card');
    cards.forEach((card, idx) => {
      if (idx === state.focusedAppIndex) {
        card.classList.add('focused');
        card.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      } else {
        card.classList.remove('focused');
      }
    });
  }

  // --- PLAYBACK ENGINE ---
  async function playStream(url) {
    if (videoErrorMsg) videoErrorMsg.classList.add('hidden');
    
    // Unload HLS instance
    if (hlsInstance) {
      hlsInstance.destroy();
      hlsInstance = null;
    }

    // Unload Shaka Player instance
    if (shakaPlayer) {
      await shakaPlayer.unload();
    }

    // Remove existing iframe if present
    const container = document.querySelector('.video-container');
    const existingIframe = container.querySelector('iframe');
    if (existingIframe) {
      existingIframe.remove();
    }
    liveVideoPlayer.style.display = 'block';

    // YouTube Live Stream fallback
    if (url.includes('youtube.com') || url.includes('youtu.be')) {
      liveVideoPlayer.style.display = 'none';
      liveVideoPlayer.pause();
      liveVideoPlayer.src = ''; 

      const iframe = document.createElement('iframe');
      iframe.src = url;
      iframe.style.width = '100%';
      iframe.style.height = '100%';
      iframe.style.border = 'none';
      iframe.allow = 'autoplay; encrypted-media; picture-in-picture';
      iframe.allowFullscreen = true;
      container.appendChild(iframe);
      return;
    }

    // Wrap URL in local CORS Proxy
    let playUrl = url;
    if (url.startsWith('http') && !url.includes('localhost') && !url.includes('127.0.0.1')) {
      const cleanUrl = url.split('|')[0];
      playUrl = `${BACKEND_URL}/proxy?url=${encodeURIComponent(cleanUrl)}`;
    }

    // MPEG-DASH (.mpd) Stream Engine using Shaka Player
    if (url.includes('.mpd') || url.includes('mpd') || url.includes('|license_type=')) {
      if (!shakaPlayer) {
        shaka.polyfill.installAll();
        shakaPlayer = new shaka.Player(liveVideoPlayer);
        
        // Register networking filter to route all DASH segments through our proxy with correct headers
        shakaPlayer.getNetworkingEngine().registerRequestFilter((type, request) => {
          // If this is a DRM license server request, do not proxy it. Request it directly from browser.
          if (type === shaka.net.NetworkingEngine.RequestType.LICENSE) {
            const url = request.uris[0];
            if (url.includes('|')) {
              const paramsPart = url.split('|')[1];
              const params = new URLSearchParams(paramsPart);
              params.forEach((value, key) => {
                request.headers[key] = value;
              });
              request.uris[0] = url.split('|')[0];
            }
            return;
          }

          let originalUrl = request.uris[0];
          
          if (window.currentStreamPipeParams && !originalUrl.includes('|')) {
            originalUrl += window.currentStreamPipeParams;
          }
          
          if (originalUrl.startsWith('http') && !originalUrl.includes('localhost') && !originalUrl.includes('127.0.0.1')) {
            request.uris[0] = `${BACKEND_URL}/proxy?url=${encodeURIComponent(originalUrl)}`;
          }
        });

        // Track listener to pick standard AAC audio track over Dolby AC-3/EC-3 if present (fixes no sound issues)
        shakaPlayer.addEventListener('trackschanged', () => {
          try {
            const tracks = shakaPlayer.getVariantTracks();
            console.log('Shaka variant tracks:', tracks);
            const standardAac = tracks.find(t => t.audioCodec && t.audioCodec.includes('mp4a'));
            if (standardAac) {
              console.log('Selected standard AAC stereo track to prevent no-sound Dolby issues:', standardAac);
              shakaPlayer.selectVariantTrack(standardAac, false);
            }
          } catch(err) {
            console.warn('Track selection filter failed:', err);
          }
        });

        shakaPlayer.addEventListener('error', (event) => {
          console.error('Shaka player error:', event.detail);
          if (liveVideoPlayer.paused) {
            handleVideoLoadError('Gagal memuat DASH Stream (MPEG-DASH).');
          }
        });
      }

      try {
        window.currentStreamPipeParams = url.includes('|') ? '|' + url.split('|')[1] : '';

        // Configure DRM key / license server settings based on pipe parameters
        let drmConfigured = false;

        // 1. ClearKey DRM Configuration
        if (url.includes('|license_key=')) {
          const keyPart = url.split('|license_key=')[1].split('&')[0];
          const [kid, kvalue] = keyPart.split(':');
          if (kid && kvalue) {
            shakaPlayer.configure({
              drm: {
                clearKeys: {
                  [kid.trim()]: kvalue.trim()
                }
              }
            });
            drmConfigured = true;
          }
        }

        // 2. Widevine DRM License Server Configuration
        if (url.includes('|license_url=')) {
          const licenseUrlPart = url.split('|license_url=')[1].split('&')[0];
          const licenseUrl = decodeURIComponent(licenseUrlPart);
          
          shakaPlayer.configure({
            drm: {
              servers: {
                'com.widevine.alpha': licenseUrl,
                'org.w3.clearkey': licenseUrl
              }
            }
          });
          drmConfigured = true;
        }

        if (!drmConfigured) {
          shakaPlayer.configure({
            drm: {
              clearKeys: {},
              servers: {}
            }
          });
        }

        await shakaPlayer.load(url);
        liveVideoPlayer.play().catch(e => console.log('Autoplay blocked:', e));
      } catch (e) {
        console.error('Shaka loading failed:', e);
        handleVideoLoadError('Gagal memuat DASH Stream. Stream terenkripsi atau offline.');
      }
    }
    // HLS (.m3u8) Stream Engine using Hls.js
    else if (url.includes('.m3u8') || url.includes('m3u8') || url === 'transtv-live' || url === 'trans7-live') {
      if (Hls.isSupported()) {
        hlsInstance = new Hls({
          maxMaxBufferLength: 10,
          enableWorker: true,
          lowLatencyMode: true
        });
        hlsInstance.loadSource(playUrl);
        hlsInstance.attachMedia(liveVideoPlayer);
        hlsInstance.on(Hls.Events.MANIFEST_PARSED, () => {
          liveVideoPlayer.play().catch(e => console.log('Autoplay blocked: ', e));
        });
        hlsInstance.on(Hls.Events.ERROR, (event, data) => {
          if (data.fatal) {
            switch (data.type) {
              case Hls.ErrorTypes.NETWORK_ERROR:
                console.log('Fatal HLS network error, trying to recover...', data);
                hlsInstance.startLoad();
                break;
              case Hls.ErrorTypes.MEDIA_ERROR:
                console.log('Fatal HLS media error, trying to recover...', data);
                hlsInstance.recoverMediaError();
                break;
              default:
                console.error('Fatal HLS error, cannot recover:', data);
                handleVideoLoadError('Gagal memuat HLS Live Stream. URL tidak dapat diakses atau diblokir.');
                break;
            }
          }
        });
      } else if (liveVideoPlayer.canPlayType('application/vnd.apple.mpegurl')) {
        liveVideoPlayer.src = playUrl;
        liveVideoPlayer.addEventListener('loadedmetadata', () => {
          liveVideoPlayer.play();
        });
      } else {
        handleVideoLoadError('Browser tidak mendukung pemutaran HLS (.m3u8).');
      }
    } else {
      // Direct mp4/ts video stream format
      liveVideoPlayer.src = playUrl;
      liveVideoPlayer.load();
      liveVideoPlayer.play().catch(e => {
        console.error('Video player load error:', e);
        handleVideoLoadError('Format media tidak didukung atau stream sedang luring.');
      });
    }
  }

  function initVideoPlayerEvents() {
    if (liveVideoPlayer) {
      liveVideoPlayer.addEventListener('playing', () => {
        if (videoErrorMsg) videoErrorMsg.classList.add('hidden');
      });
      liveVideoPlayer.addEventListener('canplay', () => {
        if (videoErrorMsg) videoErrorMsg.classList.add('hidden');
      });
    }
  }

  function handleVideoLoadError(message) {
    if (videoErrorText) videoErrorText.textContent = message;
    if (videoErrorMsg) videoErrorMsg.classList.remove('hidden');
    liveVideoPlayer.style.display = 'none';
  }

  // --- APP LIFECYCLE ---
  function launchApp(app) {
    state.activeApp = app;
    if (currentAppTitle) {
      currentAppTitle.textContent = app.name;
    }
    
    // Switch Screen UI
    viewHome.classList.remove('active');
    viewAppPlayer.classList.add('active');

    // Populate Sidebar channel list
    renderChannelSidebar(app.channels);

    // Auto play first channel
    if (app.channels && app.channels.length > 0) {
      selectChannel(app.channels[0], 0);
    }
  }

  function renderChannelSidebar(channels, resetSearch = true) {
    if (!channelListContainer) return;
    const scrollTop = channelListContainer.scrollTop;
    channelListContainer.innerHTML = '';

    if (!channels || channels.length === 0) {
      channelListContainer.innerHTML = '<div style="padding:15px; font-size:0.8rem; color:var(--text-muted);">Tidak ada saluran TV.</div>';
      return;
    }

    channels.forEach((ch, idx) => {
      const item = document.createElement('div');
      item.className = 'channel-item';
      if (ch.url === state.activeChannelUrl) {
        item.classList.add('active');
      }

      item.innerHTML = `
        <div class="channel-img-placeholder">
          ${ch.logo ? `<img src="${ch.logo}" alt="logo" onerror="this.outerHTML='${ch.name.charAt(0)}'" style="width:100%; height:100%; object-fit:contain; border-radius:4px;">` : ch.name.charAt(0)}
        </div>
        <div class="channel-info">
          <span class="channel-title">${ch.name}</span>
          <span class="channel-desc">${ch.desc || 'Siaran Live Streaming'}</span>
        </div>
      `;

      item.addEventListener('click', () => selectChannel(ch, idx));
      channelListContainer.appendChild(item);
    });

    channelListContainer.scrollTop = scrollTop;

    // Add search listener
    if (channelSearch) {
      if (resetSearch) {
        channelSearch.value = '';
      }
      channelSearch.oninput = (e) => {
        const query = e.target.value.toLowerCase();
        const items = channelListContainer.querySelectorAll('.channel-item');
        items.forEach((item, index) => {
          const title = channels[index].name.toLowerCase();
          if (title.includes(query)) {
            item.style.display = 'flex';
          } else {
            item.style.display = 'none';
          }
        });
      };
    }
  }

  function selectChannel(channel, index) {
    state.activeChannelUrl = channel.url;
    
    // Highlight sidebar active item
    const items = channelListContainer.querySelectorAll('.channel-item');
    items.forEach((item, idx) => {
      if (idx === index) {
        item.classList.add('active');
        item.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      } else {
        item.classList.remove('active');
      }
    });

    playStream(channel.url);
  }

  // --- PREVIOUS / NEXT CHANNEL CHANNEL SWITCHING CONTROLLER ---
  function initChannelNavigatorEvents() {
    // Helper function to switch channel relative to active channel index
    function switchChannel(direction) {
      if (!state.activeApp || !state.activeApp.channels || state.activeApp.channels.length <= 1) return;

      const currentIdx = state.activeApp.channels.findIndex(ch => ch.url === state.activeChannelUrl);
      let targetIdx = currentIdx + direction;

      // Wrap around logic
      if (targetIdx >= state.activeApp.channels.length) {
        targetIdx = 0;
      } else if (targetIdx < 0) {
        targetIdx = state.activeApp.channels.length - 1;
      }

      const targetChannel = state.activeApp.channels[targetIdx];
      selectChannel(targetChannel, targetIdx);
      showToast(`Beralih ke: ${targetChannel.name}`);
    }

    // Bind next channel button
    if (btnNextChannel) {
      btnNextChannel.addEventListener('click', () => switchChannel(1));
    }
    // Bind prev channel button
    if (btnPrevChannel) {
      btnPrevChannel.addEventListener('click', () => switchChannel(-1));
    }
    // Bind floating next button
    if (btnFloatNext) {
      btnFloatNext.addEventListener('click', () => switchChannel(1));
    }
    // Bind floating prev button
    if (btnFloatPrev) {
      btnFloatPrev.addEventListener('click', () => switchChannel(-1));
    }
  }

  async function closeAppPlayer() {
    if (hlsInstance) {
      hlsInstance.destroy();
      hlsInstance = null;
    }

    if (shakaPlayer) {
      await shakaPlayer.unload();
    }

    const container = document.querySelector('.video-container');
    const existingIframe = container.querySelector('iframe');
    if (existingIframe) {
      existingIframe.remove();
    }

    viewAppPlayer.classList.remove('active');
    viewHome.classList.add('active');
  }

  if (btnAppClose) {
    btnAppClose.addEventListener('click', closeAppPlayer);
  }

  // --- M3U PLAYLIST LOADER & PARSER ---
  function initM3uLoader() {
    if (m3uDropzone) {
      m3uDropzone.addEventListener('click', () => {
        m3uFileInput.click();
      });
      initDragAndDrop(m3uDropzone, readM3uFile);
    }

    if (m3uFileInput) {
      m3uFileInput.addEventListener('change', (e) => {
        if (e.target.files && e.target.files[0]) {
          const file = e.target.files[0];
          readM3uFile(file);
        }
      });
    }

    if (btnLoadM3uUrl) {
      btnLoadM3uUrl.addEventListener('click', () => {
        const url = m3uUrlInput.value.trim();
        if (!url) {
          alert('⚠️ Silakan masukkan Link URL M3U!');
          return;
        }

        btnLoadM3uUrl.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>';
        fetch(url)
          .then(res => {
            if (!res.ok) throw new Error('Gagal mengunduh file playlist.');
            return res.text();
          })
          .then(text => {
            btnLoadM3uUrl.innerHTML = '<i class="fa-solid fa-download"></i>';
            processM3uContent(text, 'URL Playlist');
            m3uUrlInput.value = '';
          })
          .catch(err => {
            btnLoadM3uUrl.innerHTML = '<i class="fa-solid fa-download"></i>';
            alert(`⚠️ Error: ${err.message}. Pastikan CORS tidak diblokir.`);
          });
      });
    }
  }

  function readM3uFile(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target.result;
      processM3uContent(text, file.name);
    };
    reader.readAsText(file);
  }

  function processM3uContent(text, filename) {
    const channels = parseM3U(text);
    if (channels.length === 0) {
      alert('⚠️ Gagal memproses M3U! Format tidak valid.');
      return;
    }

    const playlistName = filename.replace(/\.[^/.]+$/, "").toUpperCase();

    // Create a new TV App category
    const newApp = {
      id: `app-m3u-${Date.now()}`,
      name: playlistName,
      icon: 'fa-solid fa-file-lines',
      color: '#ec4899',
      channels: channels
    };

    // Save custom app separately
    const customAppsStr = localStorage.getItem('kawaii_user_custom_apps');
    let customApps = [];
    if (customAppsStr) {
      customApps = JSON.parse(customAppsStr);
    }
    customApps.push(newApp);
    localStorage.setItem('kawaii_user_custom_apps', JSON.stringify(customApps));

    // Reload layout
    loadApps();
    showToast(`Daftar putar "${playlistName}" (${channels.length} saluran) berhasil diimport!`);
  }

  function parseM3U(text) {
    const lines = text.split(/\r?\n/);
    const channels = [];
    let currentInfo = null;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      if (line.startsWith('#EXTINF:')) {
        const commaIndex = line.lastIndexOf(',');
        let name = 'Saluran Tanpa Nama';
        if (commaIndex !== -1) {
          name = line.substring(commaIndex + 1).trim();
        }

        const logoMatch = line.match(/tvg-logo="([^"]+)"/i);
        const logo = logoMatch ? logoMatch[1] : null;

        const groupMatch = line.match(/group-title="([^"]+)"/i);
        const group = groupMatch ? groupMatch[1] : 'IPTV Channel';

        currentInfo = { name, logo, group, url: '', desc: group };
      } else if (line.startsWith('http') && currentInfo) {
        currentInfo.url = line;
        
        // Auto-replace DensTV private domain to working flashcon server
        if (line.includes('dens.tv')) {
          currentInfo.url = line.replace('op-group1-swiftservehd-1.dens.tv', 'op-flashcon-digdayahd-1.dens.tv');
        }

        channels.push(currentInfo);
        currentInfo = null;
      }
    }
    return channels;
  }

  // Drag and Drop File Uploader Utility
  function initDragAndDrop(dropzone, callback) {
    if (!dropzone) return;
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
      dropzone.addEventListener(eventName, (e) => {
        e.preventDefault();
        e.stopPropagation();
      }, false);
    });
    ['dragenter', 'dragover'].forEach(eventName => {
      dropzone.addEventListener(eventName, () => dropzone.classList.add('drag-active'), false);
    });
    ['dragleave', 'drop'].forEach(eventName => {
      dropzone.addEventListener(eventName, () => dropzone.classList.remove('drag-active'), false);
    });
    dropzone.addEventListener('drop', (e) => {
      const dt = e.dataTransfer;
      const files = dt.files;
      if (files && files.length > 0) {
        callback(files[0]);
      }
    }, false);
  }

  // --- APK FILE UPLOADER & SYSTEM PACKAGE INSTALLER ---
  function initApkFileUploader() {
    if (apkDropzone) {
      apkDropzone.addEventListener('click', () => {
        apkFileInput.click();
      });
      initDragAndDrop(apkDropzone, startApkInstallationFlow);
    }

    if (apkFileInput) {
      apkFileInput.addEventListener('change', (e) => {
        if (e.target.files && e.target.files[0]) {
          const file = e.target.files[0];
          startApkInstallationFlow(file);
        }
      });
    }

    if (btnInstallCancel) {
      btnInstallCancel.addEventListener('click', () => {
        state.pendingApk = null;
        viewApkInstaller.classList.remove('active');
        viewHome.classList.add('active');
      });
    }

    if (btnInstallConfirm) {
      btnInstallConfirm.addEventListener('click', executeApkInstallation);
    }

    if (btnInstallDone) {
      btnInstallDone.addEventListener('click', () => {
        viewApkInstaller.classList.remove('active');
        viewHome.classList.add('active');
        state.pendingApk = null;
      });
    }

    if (btnInstallOpen) {
      btnInstallOpen.addEventListener('click', () => {
        viewApkInstaller.classList.remove('active');
        if (state.lastInstalledApp) {
          launchApp(state.lastInstalledApp);
        }
        state.pendingApk = null;
      });
    }
  }

  function startApkInstallationFlow(file) {
    const fname = file.name.toLowerCase();
    let appName = 'Android TV App';
    let icon = 'fa-solid fa-box-archive';
    let color = '#3bef7e';

    if (fname.includes('tivimate') || fname.includes('iptv')) {
      appName = 'TiviMate IPTV Player';
      icon = 'fa-solid fa-satellite-dish';
      color = '#eab308';
    } else if (fname.includes('vlc')) {
      appName = 'VLC Media Player';
      icon = 'fa-solid fa-play';
      color = '#f97316';
    } else if (fname.includes('kodi')) {
      appName = 'Kodi Media Center';
      icon = 'fa-solid fa-cubes';
      color = '#06b6d4';
    } else if (fname.includes('smarttube') || fname.includes('youtube')) {
      appName = 'SmartTube Premium';
      icon = 'fa-brand fa-youtube';
      color = '#ef4444';
    } else {
      appName = file.name.replace(/\.[^/.]+$/, "").toUpperCase();
    }

    state.pendingApk = {
      name: appName,
      filename: file.name,
      icon,
      color,
      channels: []
    };

    // Populate installer view meta details
    installAppName.textContent = appName;
    installAppFilename.textContent = file.name;
    installAppIcon.innerHTML = `<i class="${icon}" style="color: ${color};"></i>`;
    installAppUrl.value = '';

    // Switch Screen UI to APK installer wizard
    viewHome.classList.remove('active');
    viewAppPlayer.classList.remove('active');
    viewApkInstaller.classList.add('active');

    step1.classList.remove('hidden');
    step2.classList.add('hidden');
    step3.classList.add('hidden');
  }

  function executeApkInstallation() {
    if (!state.pendingApk) return;
    
    const customUrl = installAppUrl.value.trim();
    if (!customUrl) {
      alert('⚠️ Silakan masukkan URL streaming untuk APK TV ini!');
      return;
    }

    // Set custom streaming channel inside APK app
    state.pendingApk.channels = [
      { name: state.pendingApk.name, url: customUrl, desc: 'Saluran IPTV APK Kustom' }
    ];

    step1.classList.add('hidden');
    step2.classList.remove('hidden');

    let progress = 0;
    installProgressFill.style.width = '0%';
    
    const statuses = [
      'Mengekstrak berkas package APK...',
      'Menganalisis dependensi manifest...',
      'Menyetel sandbox storage emulator...',
      'Mendaftarkan shortcut di launcher TV...',
      'Selesai memasang!'
    ];

    const timer = setInterval(() => {
      progress += 10;
      installProgressFill.style.width = `${progress}%`;
      
      const statusIdx = Math.min(statuses.length - 1, Math.floor(progress / 25));
      installStatusText.textContent = statuses[statusIdx];

      if (progress >= 100) {
        clearInterval(timer);

        const newApp = {
          id: `app-apk-${Date.now()}`,
          name: state.pendingApk.name,
          icon: state.pendingApk.icon,
          color: state.pendingApk.color,
          channels: state.pendingApk.channels
        };

        // Save user custom app separately
        const customAppsStr = localStorage.getItem('kawaii_user_custom_apps');
        let customApps = [];
        if (customAppsStr) {
          customApps = JSON.parse(customAppsStr);
        }
        customApps.push(newApp);
        localStorage.setItem('kawaii_user_custom_apps', JSON.stringify(customApps));

        state.lastInstalledApp = newApp;

        // Reload layout
        loadApps();

        step2.classList.add('hidden');
        step3.classList.remove('hidden');
        showToast(`Aplikasi "${state.pendingApk.name}" berhasil dipasang!`);
      }
    }, 120);
  }

  // --- VIRTUAL REMOTE CONTROL HANDLERS ---
  function initRemoteControl() {
    if (remoteUp) {
      remoteUp.addEventListener('click', () => {
        if (state.activeApp || viewApkInstaller.classList.contains('active')) return;
        const cols = 5;
        if (state.focusedAppIndex >= cols) {
          state.focusedAppIndex -= cols;
          updateFocus();
        }
      });
    }

    if (remoteDown) {
      remoteDown.addEventListener('click', () => {
        if (state.activeApp || viewApkInstaller.classList.contains('active')) return;
        const totalApps = state.apps.length;
        const cols = 5;
        if (state.focusedAppIndex + cols < totalApps) {
          state.focusedAppIndex += cols;
          updateFocus();
        }
      });
    }

    if (remoteLeft) {
      remoteLeft.addEventListener('click', () => {
        if (state.activeApp || viewApkInstaller.classList.contains('active')) return;
        if (state.focusedAppIndex > 0) {
          state.focusedAppIndex--;
          updateFocus();
        }
      });
    }

    if (remoteRight) {
      remoteRight.addEventListener('click', () => {
        if (state.activeApp || viewApkInstaller.classList.contains('active')) return;
        if (state.focusedAppIndex < state.apps.length - 1) {
          state.focusedAppIndex++;
          updateFocus();
        }
      });
    }

    if (remoteOk) {
      remoteOk.addEventListener('click', () => {
        if (state.activeApp || viewApkInstaller.classList.contains('active')) return;
        const app = state.apps[state.focusedAppIndex];
        if (app) launchApp(app);
      });
    }

    if (remoteBack) {
      remoteBack.addEventListener('click', () => {
        if (viewAppPlayer.classList.contains('active')) {
          closeAppPlayer();
        } else if (viewApkInstaller.classList.contains('active')) {
          viewApkInstaller.classList.remove('active');
          viewHome.classList.add('active');
        }
      });
    }

    if (remoteHome) {
      remoteHome.addEventListener('click', () => {
        closeAppPlayer();
        viewApkInstaller.classList.remove('active');
        viewHome.classList.add('active');
      });
    }

    if (remotePower) {
      remotePower.addEventListener('click', () => {
        state.isPowerOn = !state.isPowerOn;
        const screen = document.getElementById('emulator-screen');
        if (!state.isPowerOn) {
          screen.style.background = '#000000';
          screen.style.filter = 'brightness(0)';
          remotePower.style.background = '#374151';
          remotePower.style.boxShadow = 'none';
          showToast('Power OFF - Menghemat daya');
        } else {
          screen.style.background = '';
          screen.style.filter = '';
          remotePower.style.background = '#ef4444';
          remotePower.style.boxShadow = '0 0 15px rgba(239, 68, 68, 0.4)';
          showToast('Power ON - Android TV Siap');
        }
      });
    }

    if (remoteVolUp) {
      remoteVolUp.addEventListener('click', () => {
        if (liveVideoPlayer.volume < 1) {
          liveVideoPlayer.volume = Math.min(1, liveVideoPlayer.volume + 0.1);
          state.volume = liveVideoPlayer.volume;
          showToast(`Volume: ${Math.round(state.volume * 100)}%`);
        }
      });
    }

    if (remoteVolDown) {
      remoteVolDown.addEventListener('click', () => {
        if (liveVideoPlayer.volume > 0) {
          liveVideoPlayer.volume = Math.max(0, liveVideoPlayer.volume - 0.1);
          state.volume = liveVideoPlayer.volume;
          showToast(`Volume: ${Math.round(state.volume * 100)}%`);
        }
      });
    }
  }

  // --- PHYSICAL DEVICE NAV BAR BUTTONS ---
  function initDeviceNav() {
    const navBack = document.getElementById('nav-back');
    const navHome = document.getElementById('nav-home');
    const navRecent = document.getElementById('nav-recent');

    if (navBack) {
      navBack.addEventListener('click', () => {
        if (viewAppPlayer.classList.contains('active')) {
          closeAppPlayer();
        } else if (viewApkInstaller.classList.contains('active')) {
          viewApkInstaller.classList.remove('active');
          viewHome.classList.add('active');
        }
      });
    }

    if (navHome) {
      navHome.addEventListener('click', () => {
        closeAppPlayer();
        viewApkInstaller.classList.remove('active');
        viewHome.classList.add('active');
      });
    }

    if (navRecent) {
      navRecent.addEventListener('click', () => {
        showToast('Kawaii Android TV - v5.0 Active Task');
      });
    }
  }

  // --- STATS SIMULATOR ---
  function initSystemStatsSimulator() {
    setInterval(() => {
      const cpu = Math.floor(Math.random() * 25) + 5;
      const ping = Math.floor(Math.random() * 15) + 10;
      
      if (valCpu) {
        valCpu.textContent = `${cpu}%`;
        fillCpu.style.width = `${cpu}%`;
      }
      if (valPing) {
        valPing.textContent = `${ping} ms`;
        fillPing.style.width = `${ping}%`;
      }
    }, 4000);
  }

  // --- TOAST NOTIFICATIONS ---
  function showToast(message) {
    const toast = document.getElementById('toast-notification');
    if (!toast) return;
    toast.textContent = message;
    toast.classList.remove('hidden');

    if (window.toastTimeout) clearTimeout(window.toastTimeout);
    window.toastTimeout = setTimeout(() => {
      toast.classList.add('hidden');
    }, 2800);
  }

  // --- CLOCK CONTROLLER ---
  function updateTime() {
    if (!statusTime) return;
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    statusTime.textContent = `${hours}:${minutes}`;
  }

  // --- APK WIZARD DIRECT INPUT LOADER ---
  function initApkInstaller() {
    // Handled inside direct listener bindings
  }

  // --- BACKGROUND REMOTE RECEIVER ---
  function initRemoteReceiver() {
    setInterval(() => {
      // Only request remote commands if TV is powered on
      if (!state.isPowerOn) return;
      
      fetch(`${BACKEND_URL}/remote-get`)
        .then(res => {
          if (!res.ok) throw new Error();
          return res.json();
        })
        .then(data => {
          if (data && data.cmd) {
            console.log(`Received Remote Command: ${data.cmd}`);
            handleRemoteCommand(data.cmd);
          }
        })
        .catch(() => {});
    }, 450); // check every 450ms
  }

  function handleRemoteCommand(cmd) {
    if (!state.isPowerOn && cmd !== 'power') return;
    
    switch(cmd) {
      case 'power':
        const btnPower = document.getElementById('remote-power');
        if (btnPower) btnPower.click();
        break;
      case 'up':
        const btnUp = document.getElementById('remote-up');
        if (btnUp) btnUp.click();
        break;
      case 'down':
        const btnDown = document.getElementById('remote-down');
        if (btnDown) btnDown.click();
        break;
      case 'left':
        const btnLeft = document.getElementById('remote-left');
        if (btnLeft) btnLeft.click();
        break;
      case 'right':
        const btnRight = document.getElementById('remote-right');
        if (btnRight) btnRight.click();
        break;
      case 'ok':
        const btnOk = document.getElementById('remote-ok');
        if (btnOk) btnOk.click();
        break;
      case 'back':
        const btnBack = document.getElementById('remote-back');
        if (btnBack) btnBack.click();
        break;
      case 'home':
        const btnHome = document.getElementById('remote-home');
        if (btnHome) btnHome.click();
        break;
      case 'volup':
        const btnVolUp = document.getElementById('remote-vol-up');
        if (btnVolUp) btnVolUp.click();
        break;
      case 'voldown':
        const btnVolDown = document.getElementById('remote-vol-down');
        if (btnVolDown) btnVolDown.click();
        break;
      case 'chnext':
        const btnChNext = document.getElementById('btn-next-channel');
        if (btnChNext) btnChNext.click();
        break;
      case 'chprev':
        const btnChPrev = document.getElementById('btn-prev-channel');
        if (btnChPrev) btnChPrev.click();
        break;
      case 'mute':
        if (liveVideoPlayer) {
          liveVideoPlayer.muted = !liveVideoPlayer.muted;
          showToast(liveVideoPlayer.muted ? 'Muted (Suara Senyap)' : 'Suara Aktif');
        }
        break;
    }
  }

});
