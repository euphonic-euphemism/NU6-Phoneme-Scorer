const { Crypto } = require('node-webcrypto-ossl');

// Minimal in-memory IndexedDB shim for tests (replaces fake-indexeddb/auto)
if (typeof indexedDB === 'undefined') {
  const DBs = new Map();
  global.indexedDB = {
    open(name, version) {
      let db = DBs.get(name);
      const request = {};
      setTimeout(() => {
        const isNew = !db;
        if (!db) {
          db = { name, version: version || 1, objectStores: new Map() };
          // Provide objectStoreNames.contains to mimic real IndexedDB
          db.objectStoreNames = { contains: (n) => db.objectStores.has(n) };
          // Create helper methods immediately so onupgradeneeded can use them
          db.createObjectStore = function(name) { if (!this.objectStores.has(name)) this.objectStores.set(name, new Map()); };
          db.transaction = function(storeNames, mode) {
            const tx = { oncomplete: null, onerror: null };
            setTimeout(() => { if (typeof tx.oncomplete === 'function') tx.oncomplete(); }, 0);
            tx.objectStore = (name) => {
              if (!db.objectStores.has(name)) db.objectStores.set(name, new Map());
              const store = db.objectStores.get(name);
              return {
                    put(value) { const req = {}; const id = value && value.id ? value.id : Date.now().toString(); if (value && value.id) store.set(value.id, value); else store.set(id, value); setTimeout(() => { if (typeof req.onsuccess === 'function') req.onsuccess({ target: { result: id } }); if (typeof tx.oncomplete === 'function') setTimeout(() => tx.oncomplete(), 0); }, 0); return req; },
                    get(key) { const req = {}; setTimeout(() => { req.result = store.get(key); if (typeof req.onsuccess === 'function') req.onsuccess({ target: { result: req.result } }); }, 0); return req; },
                    getAll() { const req = {}; setTimeout(() => { console.log('shim: getAll fired for store', name); req.result = Array.from(store.values()); if (typeof req.onsuccess === 'function') req.onsuccess({ target: { result: req.result } }); }, 0); return req; },
                    delete(key) { const req = {}; setTimeout(() => { store.delete(key); if (typeof req.onsuccess === 'function') req.onsuccess({}); }, 0); return req; }
                  };
            };
            return tx;
          };
          DBs.set(name, db);
        }
        // Ensure helper methods exist on the db
        if (!db.createObjectStore) {
          // installDbHelpers may be defined below; define it here as needed
        }
        request.result = db;
        request.target = { result: db };
        if (isNew && typeof request.onupgradeneeded === 'function') {
          request.onupgradeneeded({ target: { result: db } });
        }
        if (typeof request.onsuccess === 'function') request.onsuccess({ target: { result: db } });
      }, 0);
      return request;
    }
  };

  const installDbHelpers = (db) => {
    db.createObjectStore = function(name, opts) { if (!this.objectStores.has(name)) this.objectStores.set(name, new Map()); };
    db.transaction = function(storeNames, mode) {
      const tx = { oncomplete: null, onerror: null };
      setTimeout(() => { if (typeof tx.oncomplete === 'function') tx.oncomplete(); }, 0);
      tx.objectStore = (name) => {
        if (!db.objectStores.has(name)) db.objectStores.set(name, new Map());
        const store = db.objectStores.get(name);
        return {
          put(value) { const req = {}; const id = value && value.id ? value.id : Date.now().toString(); if (value && value.id) store.set(value.id, value); else store.set(id, value); setTimeout(() => { if (typeof req.onsuccess === 'function') req.onsuccess({ target: { result: id } }); }, 0); return req; },
          get(key) { const req = {}; setTimeout(() => { req.result = store.get(key); if (typeof req.onsuccess === 'function') req.onsuccess({ target: { result: req.result } }); }, 0); return req; },
          getAll() { const req = {}; setTimeout(() => { req.result = Array.from(store.values()); if (typeof req.onsuccess === 'function') req.onsuccess({ target: { result: req.result } }); }, 0); return req; },
          delete(key) { const req = {}; setTimeout(() => { store.delete(key); if (typeof req.onsuccess === 'function') req.onsuccess({}); }, 0); return req; }
        };
      };
      return tx;
    };
  };

  DBs.forEach(installDbHelpers);
}

global.crypto = new Crypto();

const TextEncoder = require('util').TextEncoder;
const TextDecoder = require('util').TextDecoder;

const DB_NAME = 'NU6_Audiology_DB_Secure_test';
const DB_VERSION = 1;
const STORE_NAME = 'secure_tests';
const CONFIG_STORE = 'app_config';

const dbPromise = new Promise((resolve, reject) => {
  const request = indexedDB.open(DB_NAME, DB_VERSION);
  request.onerror = (event) => reject("Database error: " + event.target.errorCode);
  request.onsuccess = (event) => resolve(event.target.result);
  request.onupgradeneeded = (event) => {
    const db = event.target.result;
    if (!db.objectStoreNames.contains(STORE_NAME)) db.createObjectStore(STORE_NAME, { keyPath: "id" });
    if (!db.objectStoreNames.contains(CONFIG_STORE)) db.createObjectStore(CONFIG_STORE, { keyPath: "id" });
  };
});

const CryptoService = {
  deriveKey: async (password, salt) => {
    const enc = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey('raw', enc.encode(password), { name: 'PBKDF2' }, false, ['deriveKey']);
    return crypto.subtle.deriveKey(
      { name: 'PBKDF2', salt: salt, iterations: 100000, hash: 'SHA-256' },
      keyMaterial,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt']
    );
  },
  encryptData: async (dataObj, password) => {
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const key = await CryptoService.deriveKey(password, salt);
    const enc = new TextEncoder();
    const encodedData = enc.encode(JSON.stringify(dataObj));
    const encryptedContent = await crypto.subtle.encrypt({ name: 'AES-GCM', iv: iv }, key, encodedData);
    return {
      salt: Buffer.from(salt).toString('base64'),
      iv: Buffer.from(iv).toString('base64'),
      data: Buffer.from(new Uint8Array(encryptedContent)).toString('base64')
    };
  },
  decryptData: async (encryptedObj, password) => {
    try {
      const salt = new Uint8Array(Buffer.from(encryptedObj.salt, 'base64'));
      const iv = new Uint8Array(Buffer.from(encryptedObj.iv, 'base64'));
      const data = new Uint8Array(Buffer.from(encryptedObj.data, 'base64'));
      const key = await CryptoService.deriveKey(password, salt);
      const decryptedContent = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: iv }, key, data);
      const dec = new TextDecoder();
      return JSON.parse(dec.decode(decryptedContent));
    } catch (e) {
      throw new Error('Decryption failed.');
    }
  }
};

const SecureDB = {
  sessionPassword: null,
  isSetup: async () => {
    const db = await dbPromise;
    return new Promise((resolve) => {
      const tx = db.transaction([CONFIG_STORE], 'readonly');
      const req = tx.objectStore(CONFIG_STORE).get('validation');
      req.onsuccess = () => resolve(!!req.result);
      req.onerror = () => resolve(false);
    });
  },
  setupPassword: async (password) => {
    const encryptedValidation = await CryptoService.encryptData({ check: 'VALID' }, password);
    const db = await dbPromise;
    return new Promise((resolve, reject) => {
      const tx = db.transaction([CONFIG_STORE], 'readwrite');
      tx.objectStore(CONFIG_STORE).put({ id: 'validation', ...encryptedValidation });
      tx.oncomplete = () => {
        SecureDB.sessionPassword = password;
        resolve(true);
      };
      tx.onerror = () => reject('Setup failed');
    });
  },
  login: async (password) => {
    const db = await dbPromise;
    return new Promise((resolve, reject) => {
      const tx = db.transaction([CONFIG_STORE], 'readonly');
      const req = tx.objectStore(CONFIG_STORE).get('validation');
      req.onsuccess = async () => {
        if (!req.result) return reject('No setup found');
        try {
          const decrypted = await CryptoService.decryptData(req.result, password);
          if (decrypted.check === 'VALID') {
            SecureDB.sessionPassword = password;
            resolve(true);
          } else {
            resolve(false);
          }
        } catch (e) { resolve(false); }
      };
    });
  },
  saveTest: async (data, options = {}) => {
    if (!SecureDB.sessionPassword) throw new Error('Database locked');
    const db = await dbPromise;
    const patientKey = (data.cNumber || data.patientName || '').toString();
    console.log('shim: saveTest start for', patientKey, data.testDate);
    const testDate = data.testDate || '';

    return new Promise((resolve, reject) => {
      const tx = db.transaction([STORE_NAME], 'readwrite');
      const store = tx.objectStore(STORE_NAME);

      if (data.id) {
        (async () => {
          try {
            const encryptedData = await CryptoService.encryptData(data, SecureDB.sessionPassword);
            store.put({ id: String(data.id), ...encryptedData });
            tx.oncomplete = () => resolve(String(data.id));
            tx.onerror = (e) => reject(e.target.error);
          } catch (e) { reject(e); }
        })();
        return;
      }

      const getAllReq = store.getAll();
      getAllReq.onsuccess = async () => {
        console.log('shim: getAll onsuccess, raw count =', (getAllReq.result || []).length);
        try {
          const raw = getAllReq.result || [];
          for (const rec of raw) {
            try {
              const dec = await CryptoService.decryptData(rec, SecureDB.sessionPassword);
              const existingPatientKey = (dec.cNumber || dec.patientName || '').toString();
              const existingDate = dec.testDate || '';
              if (existingPatientKey === patientKey && existingDate === testDate) {
                if (options.overwriteExistingSameDate) {
                  const encryptedData = await CryptoService.encryptData(data, SecureDB.sessionPassword);
                  store.put({ id: String(rec.id), ...encryptedData });
                  tx.oncomplete = () => resolve(String(rec.id));
                  tx.onerror = (e) => reject(e.target.error);
                  return;
                } else {
                  const err = new Error('A record for this patient on the same date already exists.');
                  err.code = 'DUPLICATE_DATE';
                  err.existingId = rec.id;
                  reject(err);
                  return;
                }
              }
            } catch (e) {
              // ignore
            }
          }

          try {
            const encryptedData = await CryptoService.encryptData(data, SecureDB.sessionPassword);
            const recordId = Date.now().toString();
            console.log('shim: putting record', recordId);
            store.put({ id: String(recordId), ...encryptedData });
            tx.oncomplete = () => resolve(recordId);
            tx.onerror = (e) => reject(e.target.error);
          } catch (e) { console.error('shim: saveTest encrypt error', e); reject(e); }
        } catch (e) { reject(e); }
      };

      getAllReq.onerror = () => reject(getAllReq.error);
    });
  },
  getAllTests: async () => {
    if (!SecureDB.sessionPassword) throw new Error('Database locked');
    const db = await dbPromise;
    return new Promise((resolve, reject) => {
      const tx = db.transaction([STORE_NAME], 'readonly');
      const req = tx.objectStore(STORE_NAME).getAll();
      req.onsuccess = async () => {
        try {
          const rawRecords = req.result;
          const decryptedRecords = await Promise.all(rawRecords.map(async (rec) => {
            try {
              const dec = await CryptoService.decryptData(rec, SecureDB.sessionPassword);
              if (rec.id === 'clinic_settings') return { ...dec, id: 'clinic_settings', isSettings: true };
              return { ...dec, id: rec.id };
            } catch (e) { return null; }
          }));
          const valid = decryptedRecords.filter(r => r !== null && !r.isSettings)
            .sort((a, b) => new Date(b.testDate || 0) - new Date(a.testDate || 0));
          resolve(valid);
        } catch (e) { reject(e); }
      };
      req.onerror = () => reject(req.error);
    });
  },
  deleteTest: async (id) => {
    if (!SecureDB.sessionPassword) throw new Error('Database locked');
    const db = await dbPromise;
    return new Promise((resolve, reject) => {
      const tx = db.transaction([STORE_NAME], 'readwrite');
      tx.objectStore(STORE_NAME).delete(id);
      tx.oncomplete = () => resolve();
      tx.onerror = (e) => reject(e.target.error);
    });
  }
};

module.exports = { CryptoService, SecureDB, dbPromise };
