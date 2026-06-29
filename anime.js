(async function() {
  const params = new URLSearchParams(location.search);
  const animeId = parseInt(params.get('id'));
  if (!animeId) { location.href = 'index.html'; return; }

  let anime = null;

  // DOM refs
  const btnBack = document.getElementById('btnBack');
  const btnEditAnime = document.getElementById('btnEditAnime');
  const btnDelAnime = document.getElementById('btnDelAnime');
  const detailName = document.getElementById('detailName');
  const detailRating = document.getElementById('detailRating');
  const detailDate = document.getElementById('detailDate');
  const charList = document.getElementById('charList');
  const charEmpty = document.getElementById('charEmpty');

  const btnAddChar = document.getElementById('btnAddChar');
  const btnEditChars = document.getElementById('btnEditChars');
  const btnDelChars = document.getElementById('btnDelChars');

  // Modals
  const addCharModal = document.getElementById('addCharModal');
  const addCharBack = document.getElementById('addCharBack');
  const addCharSave = document.getElementById('addCharSave');
  const addCharInput = document.getElementById('addCharInput');

  const editCharModal = document.getElementById('editCharModal');
  const editCharBack = document.getElementById('editCharBack');
  const editCharSave = document.getElementById('editCharSave');
  const editCharInput = document.getElementById('editCharInput');

  const delCharModal = document.getElementById('delCharModal');
  const delCharBack = document.getElementById('delCharBack');
  const delCharConfirm = document.getElementById('delCharConfirm');
  const delCharList = document.getElementById('delCharList');

  const editAnimeModal = document.getElementById('editAnimeModal');
  const editAnimeBack = document.getElementById('editAnimeBack');
  const editAnimeSave = document.getElementById('editAnimeSave');
  const editAnimeName = document.getElementById('editAnimeName');
  const editAnimeRating = document.getElementById('editAnimeRating');

  const confirmModal = document.getElementById('confirmModal');
  const confirmText = document.getElementById('confirmText');
  const confirmNo = document.getElementById('confirmNo');
  const confirmYes = document.getElementById('confirmYes');

  // Init
  await loadAnime();
  render();

  // Events
  btnBack.addEventListener('click', () => { location.href = 'index.html'; });
  btnEditAnime.addEventListener('click', openEditAnime);
  btnDelAnime.addEventListener('click', confirmDeleteAnime);

  btnAddChar.addEventListener('click', () => { addCharInput.value = ''; openModal(addCharModal); });
  addCharBack.addEventListener('click', () => closeModal(addCharModal));
  addCharSave.addEventListener('click', saveNewChars);

  btnEditChars.addEventListener('click', openEditChars);
  editCharBack.addEventListener('click', () => closeModal(editCharModal));
  editCharSave.addEventListener('click', saveEditChars);

  btnDelChars.addEventListener('click', openDelChars);
  delCharBack.addEventListener('click', () => closeModal(delCharModal));
  delCharConfirm.addEventListener('click', confirmDelChars);

  editAnimeBack.addEventListener('click', () => closeModal(editAnimeModal));
  editAnimeSave.addEventListener('click', saveEditAnime);

  confirmNo.addEventListener('click', () => closeModal(confirmModal));

  // ---- Functions ----

  async function loadAnime() {
    anime = await getAnime(animeId);
    if (!anime) { location.href = 'index.html'; }
  }

  function render() {
    detailName.textContent = anime.name;
    if (anime.rating !== undefined && anime.rating !== null && anime.rating !== '') {
      detailRating.textContent = 'Rating: ' + anime.rating + '/10';
    } else {
      detailRating.textContent = '';
    }
    const created = new Date(anime.created).toLocaleDateString();
    detailDate.textContent = 'Added: ' + created;

    charList.innerHTML = '';
    const chars = anime.characters || [];
    if (chars.length === 0) {
      charList.classList.add('hidden');
      charEmpty.classList.remove('hidden');
    } else {
      charList.classList.remove('hidden');
      charEmpty.classList.add('hidden');
      chars.forEach(c => {
        const li = document.createElement('li');
        li.textContent = c;
        charList.appendChild(li);
      });
    }
  }

  function openEditAnime() {
    editAnimeName.value = anime.name;
    editAnimeRating.value = anime.rating !== undefined ? anime.rating : '';
    openModal(editAnimeModal);
  }

  async function saveEditAnime() {
    const name = editAnimeName.value.trim();
    if (!name) { editAnimeName.focus(); return; }
    const ratingRaw = editAnimeRating.value.trim();
    anime.name = name;
    anime.rating = ratingRaw === '' ? undefined : parseFloat(ratingRaw);
    anime.updated = Date.now();
    await saveAnime(anime);
    closeModal(editAnimeModal);
    render();
  }

  function confirmDeleteAnime() {
    confirmText.textContent = 'Move "' + anime.name + '" to Trash?';
    confirmYes.textContent = 'Delete';
    confirmYes.onclick = async () => {
      await deleteAnime(anime.id);
      await saveTrash({
        id: anime.id,
        name: anime.name,
        rating: anime.rating,
        characters: anime.characters || [],
        created: anime.created,
        updated: anime.updated,
        importOrder: anime.importOrder,
        deletedAt: Date.now(),
      });
      closeModal(confirmModal);
      location.href = 'index.html';
    };
    openModal(confirmModal);
  }

  async function saveNewChars() {
    const raw = addCharInput.value.trim();
    if (!raw) { closeModal(addCharModal); return; }
    const newChars = raw.split('\n').map(s => s.trim()).filter(Boolean);
    anime.characters = [...(anime.characters || []), ...newChars];
    anime.updated = Date.now();
    await saveAnime(anime);
    closeModal(addCharModal);
    render();
  }

  function openEditChars() {
    const chars = anime.characters || [];
    editCharInput.value = chars.join('\n');
    openModal(editCharModal);
  }

  async function saveEditChars() {
    const raw = editCharInput.value;
    anime.characters = raw.split('\n').map(s => s.trim()).filter(Boolean);
    anime.updated = Date.now();
    await saveAnime(anime);
    closeModal(editCharModal);
    render();
  }

  function openDelChars() {
    const chars = anime.characters || [];
    delCharList.innerHTML = '';
    if (chars.length === 0) { closeModal(delCharModal); return; }
    chars.forEach((c, i) => {
      const div = document.createElement('label');
      div.className = 'check-item';
      div.innerHTML = `<input type="checkbox" value="${i}"><span>${escapeHtml(c)}</span>`;
      delCharList.appendChild(div);
    });
    openModal(delCharModal);
  }

  async function confirmDelChars() {
    const checked = Array.from(delCharList.querySelectorAll('input[type="checkbox"]:checked'))
      .map(cb => parseInt(cb.value))
      .sort((a, b) => b - a); // descending to remove safely
    const chars = [...(anime.characters || [])];
    checked.forEach(idx => chars.splice(idx, 1));
    anime.characters = chars;
    anime.updated = Date.now();
    await saveAnime(anime);
    closeModal(delCharModal);
    render();
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
})();
