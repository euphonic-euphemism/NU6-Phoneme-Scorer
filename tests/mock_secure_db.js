let storage = [];
let sessionPassword = null;
let _idCounter = 0;

const SecureDB = {
  setupPassword: async (password) => {
    sessionPassword = password;
    return true;
  },
  login: async (password) => {
    // For mock, accept any password and set session
    sessionPassword = password;
    return true;
  },
  saveTest: async (data, options = {}) => {
    if (!sessionPassword) throw new Error('Database locked');
    const patientKey = (data.cNumber || data.patientName || '').toString();
    const testDate = data.testDate || '';

    if (data.id) {
      const idx = storage.findIndex(r => r.id === data.id);
      const toSave = { id: data.id, ...data };
      if (idx >= 0) storage[idx] = toSave; else storage.push(toSave);
      return String(data.id);
    }

    for (const rec of storage) {
      const existingPatientKey = (rec.cNumber || rec.patientName || '').toString();
      const existingDate = rec.testDate || '';
      if (existingPatientKey === patientKey && existingDate === testDate) {
        if (options.overwriteExistingSameDate) {
          const id = rec.id;
          const newRec = { id, ...data };
          storage[storage.indexOf(rec)] = newRec;
          return String(id);
        } else {
          const err = new Error('A record for this patient on the same date already exists.');
          err.code = 'DUPLICATE_DATE';
          err.existingId = rec.id;
          throw err;
        }
      }
    }

    const recordId = Date.now().toString() + '-' + (++_idCounter);
    storage.push({ id: recordId, ...data });
    return recordId;
  },
  getAllTests: async () => {
    return storage.slice().sort((a,b) => new Date(b.testDate || 0) - new Date(a.testDate || 0));
  },
  deleteTest: async (id) => {
    storage = storage.filter(r => r.id !== id);
  }
};

module.exports = { SecureDB };