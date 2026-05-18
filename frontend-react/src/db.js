const DB_NAME = 'NoteAppDB';
const DB_VERSION = 1;
const STORE_NOTES = 'notes';
const STORE_LABELS = 'labels';
const STORE_PENDING_SYNCS = 'pendingSyncs';

export const initDB = () => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      
      // Store for local notes
      if (!db.objectStoreNames.contains(STORE_NOTES)) {
        db.createObjectStore(STORE_NOTES, { keyPath: 'id' });
      }
      
      // Store for local labels
      if (!db.objectStoreNames.contains(STORE_LABELS)) {
        db.createObjectStore(STORE_LABELS, { keyPath: 'id' });
      }
      
      // Store for pending background synchronization when online
      if (!db.objectStoreNames.contains(STORE_PENDING_SYNCS)) {
        db.createObjectStore(STORE_PENDING_SYNCS, { keyPath: 'sync_id', autoIncrement: true });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

const getStore = async (storeName, mode = 'readonly') => {
  const db = await initDB();
  const transaction = db.transaction(storeName, mode);
  return transaction.objectStore(storeName);
};

// Notes API
export const getLocalNotes = () => {
  return new Promise(async (resolve, reject) => {
    try {
      const store = await getStore(STORE_NOTES, 'readonly');
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    } catch (e) {
      reject(e);
    }
  });
};

export const saveLocalNote = (note) => {
  return new Promise(async (resolve, reject) => {
    try {
      const store = await getStore(STORE_NOTES, 'readwrite');
      // Ensure the id exists (generate fallback temp id if it's new offline)
      if (!note.id) {
        note.id = Date.now();
      }
      const request = store.put(note);
      request.onsuccess = () => resolve(note);
      request.onerror = () => reject(request.error);
    } catch (e) {
      reject(e);
    }
  });
};

export const saveLocalNotesBulk = (notes) => {
  return new Promise(async (resolve, reject) => {
    try {
      const db = await initDB();
      const transaction = db.transaction(STORE_NOTES, 'readwrite');
      const store = transaction.objectStore(STORE_NOTES);
      
      store.clear();
      notes.forEach(note => {
        store.put(note);
      });
      
      transaction.oncomplete = () => resolve(true);
      transaction.onerror = () => reject(transaction.error);
    } catch (e) {
      reject(e);
    }
  });
};

export const deleteLocalNote = (id) => {
  return new Promise(async (resolve, reject) => {
    try {
      const store = await getStore(STORE_NOTES, 'readwrite');
      const request = store.delete(id);
      request.onsuccess = () => resolve(true);
      request.onerror = () => reject(request.error);
    } catch (e) {
      reject(e);
    }
  });
};

// Labels API
export const getLocalLabels = () => {
  return new Promise(async (resolve, reject) => {
    try {
      const store = await getStore(STORE_LABELS, 'readonly');
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    } catch (e) {
      reject(e);
    }
  });
};

export const saveLocalLabelsBulk = (labels) => {
  return new Promise(async (resolve, reject) => {
    try {
      const db = await initDB();
      const transaction = db.transaction(STORE_LABELS, 'readwrite');
      const store = transaction.objectStore(STORE_LABELS);
      
      store.clear();
      labels.forEach(label => {
        store.put(label);
      });
      
      transaction.oncomplete = () => resolve(true);
      transaction.onerror = () => reject(transaction.error);
    } catch (e) {
      reject(e);
    }
  });
};

// Sync queue API
export const addPendingSync = (task) => {
  return new Promise(async (resolve, reject) => {
    try {
      const store = await getStore(STORE_PENDING_SYNCS, 'readwrite');
      const request = store.put(task);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    } catch (e) {
      reject(e);
    }
  });
};

export const getPendingSyncs = () => {
  return new Promise(async (resolve, reject) => {
    try {
      const store = await getStore(STORE_PENDING_SYNCS, 'readonly');
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    } catch (e) {
      reject(e);
    }
  });
};

export const removePendingSync = (syncId) => {
  return new Promise(async (resolve, reject) => {
    try {
      const store = await getStore(STORE_PENDING_SYNCS, 'readwrite');
      const request = store.delete(syncId);
      request.onsuccess = () => resolve(true);
      request.onerror = () => reject(request.error);
    } catch (e) {
      reject(e);
    }
  });
};

export const clearPendingSyncs = () => {
  return new Promise(async (resolve, reject) => {
    try {
      const store = await getStore(STORE_PENDING_SYNCS, 'readwrite');
      const request = store.clear();
      request.onsuccess = () => resolve(true);
      request.onerror = () => reject(request.error);
    } catch (e) {
      reject(e);
    }
  });
};

export const clearAllLocalData = () => {
  return new Promise(async (resolve, reject) => {
    try {
      const db = await initDB();
      const transaction = db.transaction([STORE_NOTES, STORE_LABELS, STORE_PENDING_SYNCS], 'readwrite');
      transaction.objectStore(STORE_NOTES).clear();
      transaction.objectStore(STORE_LABELS).clear();
      transaction.objectStore(STORE_PENDING_SYNCS).clear();
      
      transaction.oncomplete = () => resolve(true);
      transaction.onerror = () => reject(transaction.error);
    } catch (e) {
      reject(e);
    }
  });
};
