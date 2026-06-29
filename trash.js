(async function() {
  let trashItems = [];

  const btnBack = document.getElementById('btnBack');
  const btnEmptyTrash = document.getElementById('btnEmptyTrash');
  const trashList = document.getElementById('trashList');
  const emptyState = document.getElementById('emptyState');

  const confirmModal = document.getElementById('confirmModal');
  const confirmText = document.getElementById('confirmText');
  const confirmNo = document.getElementById('confirmNo');
  const confirmYes = document.getElementById('confirmYes');

  // Init
  await loadTrash();
  render();

  // Events
  btnBack.addEventListener('click', () => { location.href = 'index.html'; });
  btnEmptyTrash.addEventListener('click', confirmEmptyTrash);
  confirmNo.addEventListener('click', () => closeModal(confirmModal));

  async function loadTrash() {
    trashItems = await getAllTrash();
  }

  function render() {
    trashList.innerHTML = '';
    if (trashItems.length === 0) {
      trashList.classList.add('hidden');
      emptyState.classList.remove('hidden');
      return;
    }
    trashList.classList.remove('hidden');
    emptyState.classList.add('hidden');

    trashItems.forEach(item => {
      const el = document.createElement('div');
      el.className = 'trash-item';
      el.innerHTML = `
        <span class="trash-name">${escapeHtml(item.name)}</span>
        <div class="trash-actions">
          <button class="restore-btn">Restore</button>
          <button class="danger">Perm Delete</button>
        </div>
      `;
      const [restoreBtn, permBtn] = el.querySelectorAll('button');
      restoreBtn.addEventListener('click', () => restoreItem(item));
      permBtn.addEventListener('click', () => confirmPermDelete(item));
      trashList.appendChild(el);
    });
  }

  async function restoreItem(item) {
    // Restore to anime store
    await saveAnime({
      id: item.id,
      name: item.name,
      rating: item.rating,
      characters: item.characters || [],
      created: item.created,
      updated: Date.now(),
      importOrder: item.importOrder,
    });
    await deleteTrash(item.id);
    trashItems = trashItems.filter(t => t.id !== item.id);
    render();
  }

  function confirmPermDelete(item) {
    confirmText.textContent = 'Permanently delete "' + item.name + '"? This cannot be undone.';
    confirmYes.textContent = 'Delete';
    confirmYes.onclick = async () => {
      await deleteTrash(item.id);
      trashItems = trashItems.filter(t => t.id !== item.id);
      closeModal(confirmModal);
      render();
    };
    openModal(confirmModal);
  }

  function confirmEmptyTrash() {
    if (trashItems.length === 0) return;
    confirmText.textContent = 'Permanently delete all ' + trashItems.length + ' items in trash?';
    confirmYes.textContent = 'Empty Trash';
    confirmYes.onclick = async () => {
      await clearTrash();
      trashItems = [];
      closeModal(confirmModal);
      render();
    };
    openModal(confirmModal);
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
