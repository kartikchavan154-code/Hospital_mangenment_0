const { getFirestore, admin } = require('../config/firestore');

/**
 * Firestore Database Adapter
 * Provides helper methods for CRUD operations, filtering, ordering, and transactional updates.
 */

// Helper to convert Firestore Timestamps to JS Date objects
const formatDoc = (docSnap) => {
  if (!docSnap.exists) return null;
  const data = docSnap.data();
  
  // Transform Firestore Timestamps to ISO strings or Date objects if needed
  const formattedData = { ...data, id: docSnap.id };
  for (const key in formattedData) {
    if (formattedData[key] && typeof formattedData[key].toDate === 'function') {
      formattedData[key] = formattedData[key].toDate().toISOString();
    }
  }
  return formattedData;
};

// Collections catalog
const COLLECTIONS = {
  USERS: 'users',
  PATIENTS: 'patients',
  DOCTORS: 'doctors',
  DEPARTMENTS: 'departments',
  APPOINTMENTS: 'appointments',
  BILLS: 'bills',
  PAYMENTS: 'payments',
  MEDICAL_RECORDS: 'medical_records',
  PRESCRIPTIONS: 'prescriptions',
  AUDIT_LOGS: 'audit_logs',
  REPORTS: 'reports',
};

/**
 * Find document by ID
 */
const findById = async (collectionName, id) => {
  const db = getFirestore();
  const docRef = db.collection(collectionName).doc(String(id));
  const docSnap = await docRef.get();
  return formatDoc(docSnap);
};

/**
 * Find documents matching filters
 * @param {string} collectionName
 * @param {Array<{field: string, op: string, value: any}>} filters
 * @param {string} [orderByField]
 * @param {string} [orderDirection='asc']
 * @param {number} [limitCount]
 */
const findWhere = async (collectionName, filters = [], orderByField = null, orderDirection = 'asc', limitCount = null) => {
  const db = getFirestore();
  let query = db.collection(collectionName);

  filters.forEach(({ field, op, value }) => {
    if (value !== undefined && value !== null) {
      query = query.where(field, op || '==', value);
    }
  });

  if (orderByField) {
    query = query.orderBy(orderByField, orderDirection);
  }

  if (limitCount && limitCount > 0) {
    query = query.limit(limitCount);
  }

  const snapshot = await query.get();
  const results = [];
  snapshot.forEach(doc => {
    results.push(formatDoc(doc));
  });
  return results;
};

/**
 * Create or overwrite a document
 */
const createDoc = async (collectionName, id, data) => {
  const db = getFirestore();
  const docId = String(id || db.collection(collectionName).doc().id);
  const docRef = db.collection(collectionName).doc(docId);

  const payload = {
    ...data,
    id: docId,
    createdAt: data.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  await docRef.set(payload, { merge: true });
  return payload;
};

/**
 * Add a new document with auto-generated ID
 */
const addDoc = async (collectionName, data) => {
  const db = getFirestore();
  const docRef = db.collection(collectionName).doc();
  const docId = docRef.id;

  const payload = {
    ...data,
    id: docId,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  await docRef.set(payload);
  return payload;
};

/**
 * Update an existing document
 */
const updateDoc = async (collectionName, id, data) => {
  const db = getFirestore();
  const docRef = db.collection(collectionName).doc(String(id));

  const payload = {
    ...data,
    updatedAt: new Date().toISOString(),
  };

  await docRef.update(payload);
  const updatedSnap = await docRef.get();
  return formatDoc(updatedSnap);
};

/**
 * Delete a document
 */
const deleteDoc = async (collectionName, id) => {
  const db = getFirestore();
  await db.collection(collectionName).doc(String(id)).delete();
  return { success: true, id };
};

/**
 * List all documents in a collection
 */
const listAll = async (collectionName) => {
  const db = getFirestore();
  const snapshot = await db.collection(collectionName).get();
  const results = [];
  snapshot.forEach(doc => results.push(formatDoc(doc)));
  return results;
};

module.exports = {
  COLLECTIONS,
  findById,
  findWhere,
  createDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  listAll,
  formatDoc,
};
