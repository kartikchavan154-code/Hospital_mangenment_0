const { initializeApp, cert, getApps } = require('firebase-admin/app');
const { getFirestore: getAdminFirestore } = require('firebase-admin/firestore');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');

let db = null;
let isFirestoreInitialized = false;

const DB_FILE_PATH = path.resolve(__dirname, '../db/.firestore_mock_db.json');

// Persistent JSON file-backed document store fallback for local offline testing
class MockFirestoreStore {
  constructor() {
    this.collections = new Map();
    this.loadFromDisk();
    if (!this.collections.has('users') || this.collections.get('users').size === 0) {
      this.seedDefaultData();
    }
  }

  loadFromDisk() {
    try {
      if (fs.existsSync(DB_FILE_PATH)) {
        const raw = fs.readFileSync(DB_FILE_PATH, 'utf8');
        const json = JSON.parse(raw);
        for (const colName in json) {
          const map = new Map();
          for (const docId in json[colName]) {
            map.set(docId, json[colName][docId]);
          }
          this.collections.set(colName, map);
        }
      }
    } catch (e) {
      console.warn('⚠️ Error loading mock Firestore disk cache:', e.message);
    }
  }

  saveToDisk() {
    try {
      const obj = {};
      this.collections.forEach((map, colName) => {
        obj[colName] = {};
        map.forEach((val, key) => {
          obj[colName][key] = val;
        });
      });
      fs.writeFileSync(DB_FILE_PATH, JSON.stringify(obj, null, 2), 'utf8');
    } catch (e) {
      console.warn('⚠️ Error saving mock Firestore disk cache:', e.message);
    }
  }

  seedDefaultData() {
    // Generate bcrypt password hashes
    const adminPass = bcrypt.hashSync('admin123', 10);
    const receptionPass = bcrypt.hashSync('reception123', 10);
    const doctorPass = bcrypt.hashSync('doctor123', 10);
    const patientPass = bcrypt.hashSync('patient123', 10);

    const usersMap = new Map();
    usersMap.set('usr-admin-1', {
      id: 'usr-admin-1',
      email: 'admin@hospital.com',
      password: adminPass,
      role: 'admin',
      firstName: 'System',
      lastName: 'Administrator',
      phone: '555-0100',
      isActive: true,
      createdAt: new Date().toISOString(),
    });
    usersMap.set('usr-reception-1', {
      id: 'usr-reception-1',
      email: 'reception@hospital.com',
      password: receptionPass,
      role: 'receptionist',
      firstName: 'Sarah',
      lastName: 'Johnson',
      phone: '555-0101',
      isActive: true,
      createdAt: new Date().toISOString(),
    });
    usersMap.set('usr-doc-1', {
      id: 'usr-doc-1',
      email: 'dr.smith@hospital.com',
      password: doctorPass,
      role: 'doctor',
      firstName: 'Robert',
      lastName: 'Smith',
      phone: '555-0201',
      isActive: true,
      createdAt: new Date().toISOString(),
    });
    usersMap.set('usr-pat-1', {
      id: 'usr-pat-1',
      email: 'john.doe@hospital.com',
      password: patientPass,
      role: 'patient',
      firstName: 'John',
      lastName: 'Doe',
      phone: '555-1001',
      isActive: true,
      createdAt: new Date().toISOString(),
    });
    this.collections.set('users', usersMap);

    // Seed Doctor profile
    const doctorsMap = new Map();
    doctorsMap.set('doc-1', {
      id: 'doc-1',
      userId: 'usr-doc-1',
      departmentId: 'dept-cardio',
      specialization: 'Interventional Cardiology',
      qualification: 'MD, DM Cardiology',
      experience: 15,
      consultationFee: 200,
    });
    this.collections.set('doctors', doctorsMap);

    // Seed Patient profile
    const patientsMap = new Map();
    patientsMap.set('pat-1', {
      id: 'pat-1',
      userId: 'usr-pat-1',
      dateOfBirth: '1985-03-15',
      gender: 'male',
      bloodGroup: 'A+',
      allergies: 'Penicillin',
    });
    this.collections.set('patients', patientsMap);

    this.saveToDisk();
  }

  collection(colName) {
    if (!this.collections.has(colName)) {
      this.collections.set(colName, new Map());
    }
    const store = this.collections.get(colName);
    const self = this;

    return {
      doc: (docId) => {
        const id = docId || `doc_${Math.random().toString(36).substr(2, 9)}`;
        return {
          id,
          get: async () => ({
            exists: store.has(id),
            id,
            data: () => store.get(id) || null,
          }),
          set: async (data, options = {}) => {
            const current = store.get(id) || {};
            const payload = options.merge ? { ...current, ...data } : data;
            store.set(id, payload);
            self.saveToDisk();
            return payload;
          },
          update: async (data) => {
            const current = store.get(id) || {};
            const payload = { ...current, ...data };
            store.set(id, payload);
            self.saveToDisk();
            return payload;
          },
          delete: async () => {
            store.delete(id);
            self.saveToDisk();
            return { success: true };
          },
        };
      },
      get: async () => {
        const docs = [];
        store.forEach((data, id) => {
          docs.push({
            exists: true,
            id,
            data: () => data,
          });
        });
        return {
          forEach: (cb) => docs.forEach(cb),
          docs,
        };
      },
      where: function(field, op, val) {
        return {
          get: async () => {
            const docs = [];
            store.forEach((data, id) => {
              let match = true;
              if (op === '==' && data[field] !== val) match = false;
              if (match) {
                docs.push({ exists: true, id, data: () => data });
              }
            });
            return { forEach: (cb) => docs.forEach(cb), docs };
          },
          where: function() { return this; },
          orderBy: function() { return this; },
          limit: function() { return this; },
        };
      },
      orderBy: function() { return this; },
      limit: function() { return this; },
    };
  }
}

/**
 * Initialize Firebase Admin SDK and Cloud Firestore instance
 */
const initializeFirestore = () => {
  if (isFirestoreInitialized && db) {
    return db;
  }

  try {
    const projectId = process.env.FIREBASE_PROJECT_ID || 'hospital-mgmt-app';
    let clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    if (clientEmail) {
      clientEmail = clientEmail.trim().replace(/^["']|["']$/g, '');
    }
    let privateKey = process.env.FIREBASE_PRIVATE_KEY;
    if (privateKey) {
      privateKey = privateKey.trim().replace(/^["']|["']$/g, '').replace(/\\n/g, '\n');
    }

    const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH
      ? path.resolve(__dirname, '..', process.env.FIREBASE_SERVICE_ACCOUNT_PATH)
      : path.resolve(__dirname, 'firebase-service-account.json');

    const hasValidKey = privateKey && !privateKey.includes('YOUR_KEY_HERE') && privateKey.includes('BEGIN PRIVATE KEY');
    const hasServiceFile = fs.existsSync(serviceAccountPath);
    const hasEmulator = Boolean(process.env.FIRESTORE_EMULATOR_HOST);

    let app;
    const existingApps = getApps();

    if (existingApps.length > 0) {
      app = existingApps[0];
      db = getAdminFirestore(app);
    } else if (hasEmulator) {
      console.log(`🔥 Connecting to Cloud Firestore Emulator at ${process.env.FIRESTORE_EMULATOR_HOST}`);
      app = initializeApp({ projectId });
      db = getAdminFirestore(app);
    } else if (hasServiceFile) {
      console.log(`🔥 Initializing Firebase Admin with service account file: ${serviceAccountPath}`);
      const serviceAccount = require(serviceAccountPath);
      app = initializeApp({
        credential: cert(serviceAccount),
        projectId: serviceAccount.project_id || projectId,
      });
      db = getAdminFirestore(app);
    } else if (clientEmail && hasValidKey) {
      console.log(`🔥 Initializing Firebase Admin with environment credentials for project: ${projectId}`);
      app = initializeApp({
        credential: cert({
          projectId,
          clientEmail,
          privateKey,
        }),
      });
      db = getAdminFirestore(app);
    } else {
      console.log(`🔥 No active Cloud GCP key or Emulator detected. Initializing persistent Firestore local store for project: ${projectId}`);
      db = new MockFirestoreStore();
    }

    try {
      if (typeof db.settings === 'function') {
        db.settings({ ignoreUndefinedProperties: true });
      }
    } catch (_) {}

    isFirestoreInitialized = true;
    console.log('✅ Firebase Firestore store ready.');
    return db;
  } catch (error) {
    console.warn(`⚠️ Cloud Firestore standard init notice (${error.message}). Using Firestore local store fallback.`);
    db = new MockFirestoreStore();
    isFirestoreInitialized = true;
    return db;
  }
};

const getFirestore = () => {
  if (!db) {
    return initializeFirestore();
  }
  return db;
};

module.exports = {
  initializeFirestore,
  getFirestore,
};
