/**
 * THE WEDDING OF RUDI & TARI - ONLINE INVITATION SCRIPT
 * Cinematic Camera Motion | Interactive 3D Envelope | Music Sync | RSVP & Modals
 */

document.addEventListener('DOMContentLoaded', () => {

  // --- Elements & Selectors ---
  const envelopeScreen = document.getElementById('envelopeScreen');
  const envelopeObj = document.getElementById('envelopeObj');
  const btnOpenEnvelope = document.getElementById('btnOpenEnvelope');
  const guestNameDisplay = document.getElementById('guestNameDisplay');
  const mainExperience = document.getElementById('mainExperience');
  
  const bgmAudio = document.getElementById('bgmAudio');
  const btnToggleAudio = document.getElementById('btnToggleAudio');
  const discVinyl = document.getElementById('discVinyl');
  
  const sceneLayer = document.getElementById('sceneLayer');
  const progressBarFill = document.getElementById('progressBarFill');
  const sceneDots = document.querySelectorAll('.scene-dot');
  const btnReplayStory = document.getElementById('btnReplayStory');
  
  const toastNotice = document.getElementById('toastNotice');
  const toastMsg = document.getElementById('toastMsg');

  // Narrative Cards
  const cards = {
    0: null, // Dove & Banner (Full View)
    1: document.getElementById('cardTari'),
    2: document.getElementById('cardRudi'),
    3: document.getElementById('cardEvent'),
    4: document.getElementById('cardLocation'),
    5: document.getElementById('cardVerse'),
    6: document.getElementById('cardFinale')
  };

  // Dove Actor
  const doveActor = document.getElementById('doveActor');

  // State Variables
  let isAudioPlaying = false;
  let currentSceneIndex = 0;
  let isEnvelopeOpened = false;
  let autoStoryTimer = null;
  const TOTAL_DURATION = 53.7; // Total song length in seconds

  // --- 1. Dynamic Guest Name (URL Param ?to= or ?u=) ---
  function initGuestName() {
    const urlParams = new URLSearchParams(window.location.search);
    const guestParam = urlParams.get('to') || urlParams.get('u') || urlParams.get('guest') || urlParams.get('nama');
    
    let guestName = 'Tamu Undangan';
    if (guestParam) {
      guestName = decodeURIComponent(guestParam.replace(/\+/g, ' ')).trim();
    }
    
    guestNameDisplay.textContent = guestName;
    
    // Also prefill RSVP name input
    const rsvpNameInput = document.getElementById('rsvpName');
    if (rsvpNameInput && guestName !== 'Tamu Undangan') {
      rsvpNameInput.value = guestName;
    }

    // Set initial share tool values if function exists
    try {
      if (typeof updateShareToolValues === 'function') {
        updateShareToolValues(guestName === 'Tamu Undangan' ? '' : guestName);
      }
    } catch (e) {
      console.warn('Share tool init delayed:', e);
    }

    // Direct scene navigation parameter (?scene=0..6)
    const sceneParam = urlParams.get('scene');
    if (sceneParam !== null) {
      const sIdx = parseInt(sceneParam);
      if (!isNaN(sIdx) && sIdx >= 0 && sIdx < SCENE_CONFIGS.length) {
        if (urlParams.get('instant') === '1') {
          const style = document.createElement('style');
          style.innerHTML = `* { transition-duration: 0.001s !important; transition-delay: 0s !important; }`;
          document.head.appendChild(style);
        }
        isEnvelopeOpened = true;
        if (envelopeScreen) envelopeScreen.style.display = 'none';
        if (mainExperience) mainExperience.classList.remove('hidden');
        if (urlParams.get('freeze') === '1') {
          isSeeking = true;
        }
        goToScene(sIdx, false);
      }
    }
  }

  // --- 2. Envelope Opening & Audio Launch ---
  function playEnvelopeChime() {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        const ctx = new AudioCtx();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
        osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.3); // A5
        gain.gain.setValueAtTime(0.15, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.8);
      }
    } catch (e) {
      // AudioContext not supported or blocked
    }
  }

  // --- 2. Envelope Opening & Audio Launch ---
  function triggerOpenEnvelope() {
    if (isEnvelopeOpened) return;
    isEnvelopeOpened = true;

    try {
      playEnvelopeChime();
    } catch (e) {
      console.warn('Chime error:', e);
    }

    // 3D Flap opening
    if (envelopeObj) {
      envelopeObj.classList.add('opened-state');
    }

    // Attempt to start audio immediately on user click
    try {
      startAudio();
    } catch (e) {
      console.warn('Audio play error:', e);
    }

    // Prepare main experience underneath immediately
    if (mainExperience) {
      mainExperience.classList.remove('hidden');
    }

    // Transition to main cinematic screen smoothly
    setTimeout(() => {
      if (envelopeScreen) {
        envelopeScreen.classList.add('opened');
        // Hide envelope completely after transition so it never blocks any clicks
        setTimeout(() => {
          envelopeScreen.style.display = 'none';
        }, 800);
      }

      // Start the cinematic camera story
      goToScene(0);
      startFallbackTimeline();
    }, 400);
  }

  // Expose to window for inline onclick fallback
  window.triggerOpenEnvelope = triggerOpenEnvelope;

  // Bind click event to button, wax seal, recipient badge, and envelope body
  if (btnOpenEnvelope) {
    btnOpenEnvelope.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      triggerOpenEnvelope();
    });
  }

  const waxSealWrapper = document.getElementById('waxSealWrapper');
  if (waxSealWrapper) {
    waxSealWrapper.addEventListener('click', (e) => {
      e.stopPropagation();
      triggerOpenEnvelope();
    });
  }

  const recipientBadge = document.getElementById('recipientBadge');
  if (recipientBadge) {
    recipientBadge.addEventListener('click', (e) => {
      e.stopPropagation();
      triggerOpenEnvelope();
    });
  }

  if (envelopeObj) {
    envelopeObj.addEventListener('click', (e) => {
      // Don't trigger if clicked on the custom guest button
      if (e.target.closest('#btnCustomGuest')) return;
      triggerOpenEnvelope();
    });
  }

  // --- 3. Audio Controls ---
  function startAudio() {
    if (!bgmAudio) return;
    bgmAudio.play().then(() => {
      isAudioPlaying = true;
      discVinyl.classList.add('spinning');
    }).catch((err) => {
      console.log('Audio autoplay prevented:', err);
      isAudioPlaying = false;
      discVinyl.classList.remove('spinning');
    });
  }

  function pauseAudio() {
    if (!bgmAudio) return;
    bgmAudio.pause();
    isAudioPlaying = false;
    discVinyl.classList.remove('spinning');
  }

  btnToggleAudio.addEventListener('click', () => {
    if (isAudioPlaying) {
      pauseAudio();
      showToast('Musik dijeda');
    } else {
      startAudio();
      showToast('Musik diputar');
    }
  });

  // --- 4. Cinematic Camera Scenes & Timeline ---
  /**
   * Scene coordinates and zoom levels:
   * 0: Overview (Dove flying with banner)
   * 1: Zoom to Tari (Bride on the left)
   * 2: Pan to Rudi (Groom on the right)
   * 3: Pan to Event details (Akad & Resepsi)
   * 4: Pan to Location (Notebook & Polaroid)
   * 5: Pan to Quranic verse (QS. Ar-Rum: 21)
   * 6: Zoom out to full view (Save the Date Finale)
   */
  const SCENE_CONFIGS = [
    {
      id: 0,
      startTime: 0,
      endTime: 7.0,
      transform: 'translate3d(0%, 0%, 0) scale(1.0)',
      showDove: true
    },
    {
      id: 1,
      startTime: 7.0,
      endTime: 14.5,
      transform: 'translate3d(24%, 6%, 0) scale(2.05)',
      showDove: false
    },
    {
      id: 2,
      startTime: 14.5,
      endTime: 22.5,
      transform: 'translate3d(-20%, 6%, 0) scale(2.05)',
      showDove: false
    },
    {
      id: 3,
      startTime: 22.5,
      endTime: 32.0,
      transform: 'translate3d(-10%, -18%, 0) scale(1.95)',
      showDove: false
    },
    {
      id: 4,
      startTime: 32.0,
      endTime: 41.5,
      transform: 'translate3d(-6%, -32%, 0) scale(2.05)',
      showDove: false
    },
    {
      id: 5,
      startTime: 41.5,
      endTime: 48.0,
      transform: 'translate3d(-12%, 30%, 0) scale(2.05)',
      showDove: false
    },
    {
      id: 6,
      startTime: 48.0,
      endTime: 54.0,
      transform: 'translate3d(0%, 0%, 0) scale(1.0)',
      showDove: true
    }
  ];

  function goToScene(index, seekAudio = false) {
    if (index < 0 || index >= SCENE_CONFIGS.length) return;
    currentSceneIndex = index;
    const config = SCENE_CONFIGS[index];
    simulatedTime = config.startTime;

    // Apply camera transform to the scene layer
    sceneLayer.style.transform = config.transform;

    // Toggle Dove visibility
    if (doveActor) {
      if (config.showDove) {
        doveActor.style.opacity = '1';
        doveActor.style.transform = 'translateX(-50%) translateY(0) scale(1)';
      } else {
        doveActor.style.opacity = '0';
        doveActor.style.transform = 'translateX(-50%) translateY(-30px) scale(0.8)';
      }
    }

    // Toggle active narrative cards
    Object.keys(cards).forEach(key => {
      const card = cards[key];
      if (card) {
        if (parseInt(key) === index) {
          card.classList.add('active');
        } else {
          card.classList.remove('active');
        }
      }
    });

    // Update scene dots
    sceneDots.forEach(dot => {
      const dotScene = parseInt(dot.getAttribute('data-scene'));
      if (dotScene === index) {
        dot.classList.add('active');
      } else {
        dot.classList.remove('active');
      }
    });

    // Seek audio to match scene timestamp only when explicit seek is requested
    try {
      if (bgmAudio && seekAudio) {
        isSeeking = true;
        bgmAudio.currentTime = config.startTime;
        if (seekDebounce) clearTimeout(seekDebounce);
        seekDebounce = setTimeout(() => { isSeeking = false; }, 1500);
        if (!isAudioPlaying) startAudio();
      }
    } catch (e) {
      // Audio seek error
    }

    // Trigger celebration effect on finale
    if (index === 6) {
      triggerConfettiBurst();
    }
  }

  // Expose to window for external control & testing
  window.goToScene = goToScene;

  // Resilient Timeline: Works with audio timeupdate OR timer fallback if audio is paused/blocked
  let simulatedTime = 0;
  let fallbackTimer = null;
  let isSeeking = false;
  let seekDebounce = null;

  function startFallbackTimeline() {
    if (fallbackTimer) clearInterval(fallbackTimer);
    fallbackTimer = setInterval(() => {
      if (isSeeking) return;
      // If audio is actively playing, audio timeupdate drives the experience
      if (isAudioPlaying && bgmAudio && !bgmAudio.paused) return;

      simulatedTime += 0.25;
      if (simulatedTime >= TOTAL_DURATION) {
        simulatedTime = 0;
        goToScene(0, false);
        return;
      }

      const progressPercent = Math.min(100, (simulatedTime / TOTAL_DURATION) * 100);
      if (progressBarFill) progressBarFill.style.width = `${progressPercent}%`;

      for (let i = 0; i < SCENE_CONFIGS.length; i++) {
        const config = SCENE_CONFIGS[i];
        if (simulatedTime >= config.startTime && simulatedTime < config.endTime) {
          if (currentSceneIndex !== i) {
            goToScene(i, false);
          }
          break;
        }
      }
    }, 250);
  }

  // Audio Time Update Loop
  if (bgmAudio) {
    bgmAudio.addEventListener('seeked', () => {
      setTimeout(() => { isSeeking = false; }, 200);
    });

    bgmAudio.addEventListener('timeupdate', () => {
      if (isSeeking) return;
      const current = bgmAudio.currentTime;
      simulatedTime = current;
      const progressPercent = Math.min(100, (current / TOTAL_DURATION) * 100);
      if (progressBarFill) progressBarFill.style.width = `${progressPercent}%`;

      // Determine which scene should be active based on audio timestamp
      for (let i = 0; i < SCENE_CONFIGS.length; i++) {
        const config = SCENE_CONFIGS[i];
        if (current >= config.startTime && current < config.endTime) {
          if (currentSceneIndex !== i) {
            goToScene(i, false);
          }
          break;
        }
      }
    });

    // Loop back to start when audio ends
    bgmAudio.addEventListener('ended', () => {
      goToScene(0, true);
    });
  }

  // Scene Dots Navigation Click
  sceneDots.forEach(dot => {
    dot.addEventListener('click', () => {
      const sceneIndex = parseInt(dot.getAttribute('data-scene'));
      goToScene(sceneIndex, true);
    });
  });

  // Replay Button
  btnReplayStory.addEventListener('click', () => {
    goToScene(0, true);
    showToast('Memutar ulang dari awal...');
  });

  // --- 5. Countdown Timer (18 Januari 2026) ---
  function updateCountdown() {
    const targetDate = new Date('2026-01-18T08:00:00+07:00').getTime();
    const now = new Date().getTime();
    const diff = targetDate - now;

    const daysEl = document.getElementById('cdDays');
    const hoursEl = document.getElementById('cdHours');
    const minsEl = document.getElementById('cdMins');
    const secsEl = document.getElementById('cdSecs');

    if (diff > 0) {
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const secs = Math.floor((diff % (1000 * 60)) / 1000);

      if (daysEl) daysEl.textContent = String(days).padStart(2, '0');
      if (hoursEl) hoursEl.textContent = String(hours).padStart(2, '0');
      if (minsEl) minsEl.textContent = String(mins).padStart(2, '0');
      if (secsEl) secsEl.textContent = String(secs).padStart(2, '0');
    } else {
      // Event has arrived or passed
      if (daysEl) daysEl.textContent = '00';
      if (hoursEl) hoursEl.textContent = '00';
      if (minsEl) minsEl.textContent = '00';
      if (secsEl) secsEl.textContent = '00';
    }
  }

  setInterval(updateCountdown, 1000);
  updateCountdown();

  // Add to Google Calendar
  const btnAddToCalendar = document.getElementById('btnAddToCalendar');
  if (btnAddToCalendar) {
    btnAddToCalendar.addEventListener('click', () => {
      const gcalUrl = 'https://calendar.google.com/calendar/render?action=TEMPLATE&text=The+Wedding+of+Rudi+%26+Tari&dates=20260118T010000Z/20260118T060000Z&details=Pernikahan+Rudi+Kurniawan+%26+Lestari+Rahayu&location=Hotel+Sindoro+Cilacap';
      window.open(gcalUrl, '_blank');
    });
  }

  // --- 6. Modal Handlers ---
  function openModal(id) {
    const modal = document.getElementById(id);
    if (modal) modal.classList.remove('hidden');
  }

  function closeModal(id) {
    const modal = document.getElementById(id);
    if (modal) modal.classList.add('hidden');
  }

  // Close buttons inside modals
  document.querySelectorAll('.modal-close').forEach(btn => {
    btn.addEventListener('click', () => {
      const targetId = btn.getAttribute('data-close');
      if (targetId) closeModal(targetId);
    });
  });

  // Close when clicking modal backdrop
  document.querySelectorAll('.modal-overlay').forEach(modal => {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.classList.add('hidden');
      }
    });
  });

  // Action Dock Buttons
  document.getElementById('btnOpenRsvp')?.addEventListener('click', () => openModal('modalRsvp'));
  document.getElementById('btnOpenGift')?.addEventListener('click', () => openModal('modalGift'));
  document.getElementById('btnOpenWishes')?.addEventListener('click', () => openModal('modalWishes'));
  document.getElementById('btnShareInvite')?.addEventListener('click', () => openModal('modalShare'));
  
  // Buttons inside Scene 7 finale
  document.getElementById('btnOpenRsvpFromFinale')?.addEventListener('click', () => openModal('modalRsvp'));
  document.getElementById('btnOpenGiftFromFinale')?.addEventListener('click', () => openModal('modalGift'));

  // Custom Guest button on envelope
  document.getElementById('btnCustomGuest')?.addEventListener('click', () => openModal('modalCustomGuest'));

  // Apply custom guest name
  document.getElementById('btnApplyGuestName')?.addEventListener('click', () => {
    const nameInput = document.getElementById('inputQuickGuest');
    if (nameInput && nameInput.value.trim()) {
      const newName = nameInput.value.trim();
      guestNameDisplay.textContent = newName;
      document.getElementById('rsvpName').value = newName;
      updateShareToolValues(newName);
      closeModal('modalCustomGuest');
      showToast(`Nama tamu diatur: "${newName}"`);
    }
  });

  // --- 7. Copy to Clipboard Functionality ---
  document.querySelectorAll('.btn-copy').forEach(btn => {
    btn.addEventListener('click', () => {
      const text = btn.getAttribute('data-copy');
      if (text) {
        copyTextToClipboard(text, 'Nomor rekening disalin!');
      }
    });
  });

  function copyTextToClipboard(text, message = 'Teks berhasil disalin!') {
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(text).then(() => {
        showToast(message);
      }).catch(() => fallbackCopy(text, message));
    } else {
      fallbackCopy(text, message);
    }
  }

  function fallbackCopy(text, message) {
    const tempInput = document.createElement('textarea');
    tempInput.value = text;
    tempInput.style.position = 'fixed';
    tempInput.style.opacity = '0';
    document.body.appendChild(tempInput);
    tempInput.select();
    try {
      document.execCommand('copy');
      showToast(message);
    } catch (err) {
      showToast('Gagal menyalin otomatis');
    }
    document.body.removeChild(tempInput);
  }

  function showToast(msg) {
    if (!toastNotice) return;
    toastMsg.textContent = msg;
    toastNotice.classList.add('show');
    setTimeout(() => {
      toastNotice.classList.remove('show');
    }, 2800);
  }

  // --- 8. RSVP & Guestbook Local Storage ---
  const defaultWishes = [
    {
      name: 'H. Bambang & Keluarga',
      status: 'Hadir',
      message: 'Barakallahu lakuma wa baraka alaikuma wa jamaa bainakuma fii khair. Selamat untuk Rudi dan Tari! Semoga menjadi keluarga yang sakinah, mawaddah, warahmah.',
      time: '1 jam yang lalu'
    },
    {
      name: 'Dewi Lestari & Suami',
      status: 'Hadir',
      message: 'Selamat menempuh hidup baru sahabatku Tari & Mas Rudi! Semoga selalu rukun, bahagia dan segera dikaruniai momongan yang sholeh/sholehah.',
      time: '3 jam yang lalu'
    },
    {
      name: 'Rian Pratama',
      status: 'Hadir',
      message: 'Lancar sampai hari H brader Rudi! Doa terbaik untuk kalian berdua.',
      time: 'Kemarin'
    }
  ];

  function loadWishes() {
    const saved = localStorage.getItem('rudi_tari_wishes');
    let list = defaultWishes;
    if (saved) {
      try {
        list = JSON.parse(saved);
      } catch (e) {
        list = defaultWishes;
      }
    }
    renderWishes(list);
  }

  function renderWishes(list) {
    const container = document.getElementById('wishesContainer');
    if (!container) return;
    container.innerHTML = '';

    list.forEach(item => {
      const wishItem = document.createElement('div');
      wishItem.className = 'wish-item';

      let badgeClass = 'hadir';
      if (item.status === 'Ragu') badgeClass = 'ragu';
      if (item.status === 'Tidak Hadir') badgeClass = 'tidak-hadir';

      wishItem.innerHTML = `
        <div class="wish-header">
          <span class="wish-author">${escapeHtml(item.name)}</span>
          <span class="wish-badge ${badgeClass}">${escapeHtml(item.status)}</span>
        </div>
        <p class="wish-text">${escapeHtml(item.message)}</p>
        <p class="wish-time">${item.time || 'Baru saja'}</p>
      `;
      container.appendChild(wishItem);
    });
  }

  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  // Handle RSVP Submit
  const formRsvp = document.getElementById('formRsvp');
  if (formRsvp) {
    formRsvp.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = document.getElementById('rsvpName').value.trim();
      const status = document.querySelector('input[name="rsvpStatus"]:checked').value;
      const message = document.getElementById('rsvpMessage').value.trim();

      if (!name || !message) return;

      const newWish = {
        name: name,
        status: status,
        message: message,
        time: 'Baru saja'
      };

      const saved = localStorage.getItem('rudi_tari_wishes');
      let list = defaultWishes;
      if (saved) {
        try { list = JSON.parse(saved); } catch (e) { list = defaultWishes; }
      }
      list.unshift(newWish);
      localStorage.setItem('rudi_tari_wishes', JSON.stringify(list));

      renderWishes(list);
      closeModal('modalRsvp');
      showToast('Konfirmasi & ucapan berhasil dikirim! Terima kasih.');
      formRsvp.reset();
    });
  }

  loadWishes();

  // --- 9. WhatsApp Share Link Generator ---
  const inputGuestShare = document.getElementById('inputGuestShare');
  const generatedShareUrl = document.getElementById('generatedShareUrl');
  const whatsappMessageText = document.getElementById('whatsappMessageText');
  const btnSendWhatsapp = document.getElementById('btnSendWhatsapp');
  const btnCopyShareUrl = document.getElementById('btnCopyShareUrl');

  function updateShareToolValues(guestName) {
    const baseUrl = window.location.origin + window.location.pathname;
    const queryParam = guestName ? `?to=${encodeURIComponent(guestName)}` : '';
    const fullUrl = baseUrl + queryParam;

    if (generatedShareUrl) generatedShareUrl.value = fullUrl;

    const waMsg = `Kepada Yth. ${guestName || 'Bapak/Ibu/Saudara/i'},\n\nTanpa mengurangi rasa hormat, perkenankan kami mengundang Anda untuk menghadiri pernikahan kami:\n\n*Rudi & Tari*\nMinggu, 18 Januari 2026\n\nUntuk informasi lengkap acara dan konfirmasi kehadiran, silakan buka tautan undangan di bawah ini:\n${fullUrl}\n\nMerupakan suatu kehormatan dan kebahagiaan bagi kami apabila Anda berkenan hadir dan memberikan doa restu.\n\nTerima kasih,\n*Rudi & Tari*`;

    if (whatsappMessageText) whatsappMessageText.value = waMsg;
    if (btnSendWhatsapp) {
      btnSendWhatsapp.href = `https://api.whatsapp.com/send?text=${encodeURIComponent(waMsg)}`;
    }
  }

  if (inputGuestShare) {
    inputGuestShare.addEventListener('input', (e) => {
      updateShareToolValues(e.target.value.trim());
    });
  }

  if (btnCopyShareUrl) {
    btnCopyShareUrl.addEventListener('click', () => {
      if (generatedShareUrl) {
        copyTextToClipboard(generatedShareUrl.value, 'Tautan undangan disalin!');
      }
    });
  }

  // --- 10. Canvas Floating Petals & Light Orbs ---
  const canvas = document.getElementById('particleCanvas');
  const ctx = canvas.getContext('2d');
  let particles = [];

  function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  window.addEventListener('resize', resizeCanvas);
  resizeCanvas();

  // --- 10. Realistic Falling Nature Leaves System ---
  // Matched to the picnic green leaves in the couple background photo
  class NatureLeaf {
    constructor(initial = false) {
      this.reset(initial);
    }
    reset(initial = false) {
      this.x = Math.random() * canvas.width;
      this.y = initial ? Math.random() * canvas.height : -35;
      this.length = Math.random() * 14 + 14; // 14 to 28 px
      this.width = this.length * (Math.random() * 0.22 + 0.48); // 0.48 to 0.7 aspect ratio
      this.speedY = Math.random() * 1.1 + 0.7;
      this.speedX = Math.random() * 0.8 - 0.4;
      this.rotation = Math.random() * 360;
      this.rotationSpeed = (Math.random() - 0.5) * 1.6;
      this.flip = Math.random() * Math.PI * 2;
      this.flipSpeed = Math.random() * 0.03 + 0.015;
      this.swayOffset = Math.random() * Math.PI * 2;
      this.swaySpeed = Math.random() * 0.018 + 0.01;

      // Nature green palette from user's leaf photo (media_1794597258723.png)
      const leafPalettes = [
        { main: '#6bb032', dark: '#48851b', spine: '#8ed544' },
        { main: '#78bc38', dark: '#529622', spine: '#9be04a' },
        { main: '#5b9e28', dark: '#3b7015', spine: '#7dca3b' },
        { main: '#8bc83c', dark: '#63a322', spine: '#afee55' }
      ];
      this.color = leafPalettes[Math.floor(Math.random() * leafPalettes.length)];
      this.opacity = Math.random() * 0.3 + 0.7; // 0.7 to 1.0
    }
    update() {
      this.y += this.speedY;
      this.x += this.speedX + Math.sin(this.y * this.swaySpeed + this.swayOffset) * 0.75;
      this.rotation += this.rotationSpeed;
      this.flip += this.flipSpeed;
      if (this.y > canvas.height + 40) {
        this.reset(false);
      }
    }
    draw() {
      const scaleX = Math.cos(this.flip); // 3D tumbling flip effect
      ctx.save();
      ctx.translate(this.x, this.y);
      ctx.rotate((this.rotation * Math.PI) / 180);
      ctx.scale(scaleX, 1);
      ctx.globalAlpha = this.opacity;

      const halfL = this.length / 2;
      const halfW = this.width / 2;

      // Draw Leaf Silhouette with smooth pointed curves
      ctx.beginPath();
      ctx.moveTo(0, -halfL); // Pointed leaf tip
      // Right curved side tapering to stem
      ctx.bezierCurveTo(halfW * 1.25, -halfL * 0.35, halfW * 1.15, halfL * 0.5, 0, halfL);
      // Left curved side back to tip
      ctx.bezierCurveTo(-halfW * 1.15, halfL * 0.5, -halfW * 1.25, -halfL * 0.35, 0, -halfL);
      ctx.closePath();

      // Leaf green fill
      ctx.fillStyle = this.color.main;
      ctx.fill();

      // Central Leaf Spine / Midrib
      ctx.beginPath();
      ctx.moveTo(0, -halfL * 0.85);
      ctx.quadraticCurveTo(halfW * 0.08, 0, 0, halfL * 0.95);
      ctx.strokeStyle = this.color.spine;
      ctx.lineWidth = Math.max(0.7, this.width * 0.08);
      ctx.stroke();

      // Delicate Branching Lateral Veins
      ctx.beginPath();
      ctx.moveTo(0, -halfL * 0.3);
      ctx.lineTo(halfW * 0.6, -halfL * 0.45);
      ctx.moveTo(0, 0);
      ctx.lineTo(halfW * 0.68, -halfL * 0.15);
      ctx.moveTo(0, halfL * 0.3);
      ctx.lineTo(halfW * 0.55, halfL * 0.15);
      ctx.moveTo(0, -halfL * 0.3);
      ctx.lineTo(-halfW * 0.6, -halfL * 0.45);
      ctx.moveTo(0, 0);
      ctx.lineTo(-halfW * 0.68, -halfL * 0.15);
      ctx.moveTo(0, halfL * 0.3);
      ctx.lineTo(-halfW * 0.55, halfL * 0.15);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.22)';
      ctx.lineWidth = 0.55;
      ctx.stroke();

      // Tiny natural brown/green stem
      ctx.beginPath();
      ctx.moveTo(0, halfL);
      ctx.lineTo(0, halfL + 3.5);
      ctx.strokeStyle = this.color.dark;
      ctx.lineWidth = 1;
      ctx.stroke();

      ctx.restore();
    }
  }

  // Populate 32 natural floating leaves
  for (let i = 0; i < 32; i++) {
    particles.push(new NatureLeaf(true));
  }

  function animateParticles() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    particles.forEach(p => {
      p.update();
      p.draw();
    });
    requestAnimationFrame(animateParticles);
  }
  animateParticles();

  // --- 11. Confetti Burst Helper ---
  function triggerConfettiBurst() {
    for (let i = 0; i < 40; i++) {
      const p = new NatureLeaf(false);
      p.x = canvas.width * 0.5 + (Math.random() * 200 - 100);
      p.y = canvas.height * 0.4 + (Math.random() * 100 - 50);
      p.speedX = (Math.random() - 0.5) * 7;
      p.speedY = (Math.random() - 0.8) * 7;
      particles.push(p);
    }
  }

  // --- 12. Final Initialization ---
  try {
    initGuestName();
    console.log('Undangan Rudi & Tari initialized successfully!');
  } catch (e) {
    console.error('Initialization error:', e);
  }

});
