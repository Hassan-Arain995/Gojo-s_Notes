// IndexedDB wrapper for Anime Notes
const DB_NAME = 'AnimeNotesDB';
const DB_VERSION = 1;
const STORE_ANIME = 'anime';
const STORE_TRASH = 'trash';
const STORE_META = 'meta';

let db = null;

function openDB() {
  return new Promise((resolve, reject) => {
    if (db) { resolve(db); return; }
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onerror = () => reject(req.error);
    req.onsuccess = () => { db = req.result; resolve(db); };
    req.onupgradeneeded = (e) => {
      const d = e.target.result;
      if (!d.objectStoreNames.contains(STORE_ANIME)) {
        d.createObjectStore(STORE_ANIME, { keyPath: 'id' });
      }
      if (!d.objectStoreNames.contains(STORE_TRASH)) {
        d.createObjectStore(STORE_TRASH, { keyPath: 'id' });
      }
      if (!d.objectStoreNames.contains(STORE_META)) {
        d.createObjectStore(STORE_META, { keyPath: 'key' });
      }
    };
  });
}

async function getNextId() {
  const d = await openDB();
  return new Promise((resolve, reject) => {
    const tx = d.transaction(STORE_META, 'readwrite');
    const store = tx.objectStore(STORE_META);
    const getReq = store.get('nextId');
    getReq.onsuccess = () => {
      let val = (getReq.result && getReq.result.value) || 1;
      const next = val + 1;
      store.put({ key: 'nextId', value: next });
      resolve(val);
    };
    getReq.onerror = () => reject(getReq.error);
  });
}

async function getAllAnime() {
  const d = await openDB();
  return new Promise((resolve, reject) => {
    const tx = d.transaction(STORE_ANIME, 'readonly');
    const store = tx.objectStore(STORE_ANIME);
    const req = store.getAll();
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => reject(req.error);
  });
}

async function getAnime(id) {
  const d = await openDB();
  return new Promise((resolve, reject) => {
    const tx = d.transaction(STORE_ANIME, 'readonly');
    const store = tx.objectStore(STORE_ANIME);
    const req = store.get(id);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function saveAnime(anime) {
  const d = await openDB();
  return new Promise((resolve, reject) => {
    const tx = d.transaction(STORE_ANIME, 'readwrite');
    const store = tx.objectStore(STORE_ANIME);
    const req = store.put(anime);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

async function deleteAnime(id) {
  const d = await openDB();
  return new Promise((resolve, reject) => {
    const tx = d.transaction(STORE_ANIME, 'readwrite');
    const store = tx.objectStore(STORE_ANIME);
    const req = store.delete(id);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

async function getAllTrash() {
  const d = await openDB();
  return new Promise((resolve, reject) => {
    const tx = d.transaction(STORE_TRASH, 'readonly');
    const store = tx.objectStore(STORE_TRASH);
    const req = store.getAll();
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => reject(req.error);
  });
}

async function saveTrash(item) {
  const d = await openDB();
  return new Promise((resolve, reject) => {
    const tx = d.transaction(STORE_TRASH, 'readwrite');
    const store = tx.objectStore(STORE_TRASH);
    const req = store.put(item);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

async function deleteTrash(id) {
  const d = await openDB();
  return new Promise((resolve, reject) => {
    const tx = d.transaction(STORE_TRASH, 'readwrite');
    const store = tx.objectStore(STORE_TRASH);
    const req = store.delete(id);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

async function clearTrash() {
  const d = await openDB();
  return new Promise((resolve, reject) => {
    const tx = d.transaction(STORE_TRASH, 'readwrite');
    const store = tx.objectStore(STORE_TRASH);
    const req = store.clear();
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

async function getMeta(key) {
  const d = await openDB();
  return new Promise((resolve, reject) => {
    const tx = d.transaction(STORE_META, 'readonly');
    const store = tx.objectStore(STORE_META);
    const req = store.get(key);
    req.onsuccess = () => resolve(req.result ? req.result.value : null);
    req.onerror = () => reject(req.error);
  });
}

async function setMeta(key, value) {
  const d = await openDB();
  return new Promise((resolve, reject) => {
    const tx = d.transaction(STORE_META, 'readwrite');
    const store = tx.objectStore(STORE_META);
    const req = store.put({ key, value });
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}
