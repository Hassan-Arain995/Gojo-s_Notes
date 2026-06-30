(async function() {
  // State
  let allAnime = [];
  let filteredAnime = [];
  let currentSort = 'oldest';
  let searchQuery = '';

  // DOM refs
  const searchInput = document.getElementById('searchInput');
  const btnSort = document.getElementById('btnSort');
  const btnAdd = document.getElementById('btnAdd');
  const btnImport = document.getElementById('btnImport');
  const btnExport = document.getElementById('btnExport');
  const btnTrash = document.getElementById('btnTrash');
  const sortPanel = document.getElementById('sortPanel');
  const animeList = document.getElementById('animeList');
  const emptyState = document.getElementById('emptyState');

  // Modals
  const addModal = document.getElementById('addModal');
  const addBack = document.getElementById('addBack');
  const addSave = document.getElementById('addSave');
  const addName = document.getElementById('addName');
  const addRating = document.getElementById('addRating');
  const addChars = document.getElementById('addChars');

  const importModal = document.getElementById('importModal');
  const importBack = document.getElementById('importBack');
  const importFile = document.getElementById('importFile');
  const importText = document.getElementById('importText');
  const importBtn = document.getElementById('importBtn');

  const confirmModal = document.getElementById('confirmModal');
  const confirmText = document.getElementById('confirmText');
  const confirmNo = document.getElementById('confirmNo');
  const confirmYes = document.getElementById('confirmYes');

  // Init
  await loadAnime();
  render();

  // Events
  searchInput.addEventListener('input', (e) => {
    searchQuery = e.target.value.trim().toLowerCase();
    filterAndSort();
    render();
  });

  btnSort.addEventListener('click', () => {
    sortPanel.classList.toggle('hidden');
  });

  document.querySelectorAll('.sort-options button').forEach(btn => {
    btn.addEventListener('click', () => {
      currentSort = btn.dataset.sort;
      document.querySelectorAll('.sort-options button').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      sortPanel.classList.add('hidden');
      filterAndSort();
      render();
    });
  });

  btnAdd.addEventListener('click', () => openModal(addModal));
  addBack.addEventListener('click', () => closeModal(addModal));
  addSave.addEventListener('click', saveNewAnime);

  btnImport.addEventListener('click', () => openModal(importModal));
  importBack.addEventListener('click', () => closeModal(importModal));
  importBtn.addEventListener('click', doImport);

  btnExport.addEventListener('click', doExport);
  btnTrash.addEventListener('click', () => { location.href = 'trash.html'; });

  // ---- Functions ----

  async function loadAnime() {
    allAnime = await getAllAnime();
    const savedSort = await getMeta('sortMode');
    if (savedSort) currentSort = savedSort;
    document.querySelectorAll('.sort-options button').forEach(b => {
      b.classList.toggle('active', b.dataset.sort === currentSort);
    });
    filterAndSort();
  }

  function filterAndSort() {
    // Filter
    if (!searchQuery) {
      filteredAnime = [...allAnime];
    } else {
      filteredAnime = allAnime.filter(a => {
        const nameMatch = a.name.toLowerCase().includes(searchQuery);
        const charMatch = (a.characters || []).some(c => c.toLowerCase().includes(searchQuery));
        return nameMatch || charMatch;
      });
    }
    // Sort
    const sorters = {
      newest: (a, b) => b.created - a.created,
      oldest: (a, b) => a.created - b.created,
      ratingHigh: (a, b) => (b.rating || 0) - (a.rating || 0),
      ratingLow: (a, b) => (a.rating || 0) - (b.rating || 0),
      az: (a, b) => a.name.localeCompare(b.name),
      za: (a, b) => b.name.localeCompare(a.name),
    };
    filteredAnime.sort(sorters[currentSort] || sorters.newest);
  }

  function render() {
    animeList.innerHTML = '';
    if (filteredAnime.length === 0) {
      animeList.classList.add('hidden');
      emptyState.classList.remove('hidden');
      return;
    }
    animeList.classList.remove('hidden');
    emptyState.classList.add('hidden');

    filteredAnime.forEach((a, i) => {
      const el = document.createElement('div');
      el.className = 'anime-item';
      el.innerHTML = `
        <span class="anime-num">${i + 1}.</span>
        <span class="anime-name">${escapeHtml(a.name)}</span>
        ${a.rating !== undefined && a.rating !== null && a.rating !== '' ? `<span class="anime-rating">${a.rating}/10</span>` : ''}
      `;
      el.addEventListener('click', () => {
        location.href = 'anime.html?id=' + encodeURIComponent(a.id);
      });
      animeList.appendChild(el);
    });
  }

  async function saveNewAnime() {
    const name = addName.value.trim();
    if (!name) { addName.focus(); return; }
    const ratingRaw = addRating.value.trim();
    const rating = ratingRaw === '' ? undefined : parseFloat(ratingRaw);
    const charsRaw = addChars.value.trim();
    const characters = charsRaw ? charsRaw.split('\n').map(s => s.trim()).filter(Boolean) : [];

    const now = Date.now();
    const id = await getNextId();
    const anime = {
      id: id,
      name: name,
      rating: isNaN(rating) ? undefined : rating,
      characters: characters,
      created: now,
      updated: now,
      importOrder: id,
    };
    await saveAnime(anime);
    allAnime.push(anime);
    filterAndSort();
    render();
    closeModal(addModal);
    addName.value = '';
    addRating.value = '';
    addChars.value = '';
  }

  async function doImport() {
    const file = importFile.files[0];
    let text = importText.value.trim();

    if (file) {
      const ext = file.name.split('.').pop().toLowerCase();
      if (ext === 'json') {
        const content = await file.text();
        try {
          const data = JSON.parse(content);
          if (Array.isArray(data.anime)) {
            for (const a of data.anime) {
              if (!a.name) continue;
              const id = await getNextId();
              const now = Date.now();
              await saveAnime({
                id: id,
                name: a.name,
                rating: a.rating,
                characters: Array.isArray(a.characters) ? a.characters : [],
                created: a.created || now,
                updated: a.updated || now,
                importOrder: a.importOrder || id,
              });
            }
          }
        } catch (e) { alert('Invalid JSON backup'); return; }
      } else if (ext === 'txt') {
        text = await file.text();
      } else if (ext === 'docx') {
        const buf = await file.arrayBuffer();
        const str = new TextDecoder('utf-8').decode(buf);
        text = str.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
      }
    }

    if (text) {
      parseAndImportText(text);
    }

    importText.value = '';
    importFile.value = '';
    closeModal(importModal);
    await loadAnime();
    render();
  }

  async function parseAndImportText(text) {
    const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
    let currentAnime = null;
    let currentChars = [];

    for (const line of lines) {
      const animeMatch = line.match(/^(?:\d+[.\)\s]+)(.+)$/);
      const bulletMatch = line.match(/^[•\-\*]\s*(.+)$/);
      const isCharLine = !line.match(/^\d+[.\)\s]/) && line.includes(',');

      if (animeMatch) {
        if (currentAnime) {
          const id = await getNextId();
          const now = Date.now();
          await saveAnime({
            id: id,
            name: currentAnime,
            rating: undefined,
            characters: currentChars,
            created: now,
            updated: now,
            importOrder: id,
          });
        }
        currentAnime = animeMatch[1].trim();
        currentChars = [];
      } else if (bulletMatch && currentAnime) {
        currentChars.push(bulletMatch[1].trim());
      } else if (isCharLine && currentAnime) {
        const names = line.split(',').map(s => s.trim()).filter(Boolean);
        currentChars.push(...names);
      } else if (!line.match(/^\d+[.\)\s]/) && currentAnime) {
        currentChars.push(line);
      }
    }
    if (currentAnime) {
      const id = await getNextId();
      const now = Date.now();
      await saveAnime({
        id: id,
        name: currentAnime,
        rating: undefined,
        characters: currentChars,
        created: now,
        updated: now,
        importOrder: id,
      });
    }
  }

  async function doExport() {
    const anime = await getAllAnime();
    const trash = await getAllTrash();
    const nextId = await getMeta('nextId') || 1;
    const data = {
      version: 1,
      exportedAt: Date.now(),
      nextId: nextId,
      anime: anime,
      trash: trash,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'anime_backup.json';
    a.click();
    URL.revokeObjectURL(url);
  }

  function openModal(modal) {
    modal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
  }
  function closeModal(modal) {
    modal.classList.add('hidden');
    document.body.style.overflow = '';
  }

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

    // Service Worker Registration
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('service-worker.js')
        .then(reg => console.log('SW registered:', reg.scope))
        .catch(err => console.error('SW registration failed:', err));
    });
  }
})();
