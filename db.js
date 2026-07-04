/**
 * db.js — Derma Care IndexedDB Database Layer
 * Stores products with real uploaded images (base64) in the browser's IndexedDB.
 * Falls back to localStorage-only if IndexedDB is unavailable.
 */

(function (global) {
  'use strict';

  var DB_NAME = 'BahabehioDB';
  var DB_VERSION = 1;
  var STORE_NAME = 'products';

  var _db = null; // cached connection

  /* ── Open / init DB ─────────────────────────────────────────────── */
  function openDB(callback) {
    if (_db) { callback(null, _db); return; }

    if (!window.indexedDB) {
      callback(new Error('IndexedDB not supported'), null);
      return;
    }

    var req = indexedDB.open(DB_NAME, DB_VERSION);

    req.onupgradeneeded = function (e) {
      var db = e.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        var store = db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
        store.createIndex('nameEn', 'nameEn', { unique: false });
      }
    };

    req.onsuccess = function (e) {
      _db = e.target.result;
      callback(null, _db);
    };

    req.onerror = function (e) {
      callback(e.target.error, null);
    };
  }

  /* ── Get all products ────────────────────────────────────────────── */
  function getAllProducts(callback) {
    openDB(function (err, db) {
      if (err) { callback(err, []); return; }
      var tx = db.transaction(STORE_NAME, 'readonly');
      var store = tx.objectStore(STORE_NAME);
      var req = store.getAll();
      req.onsuccess = function () { callback(null, req.result || []); };
      req.onerror = function (e) { callback(e.target.error, []); };
    });
  }

  /* ── Get one product by id ───────────────────────────────────────── */
  function getProduct(id, callback) {
    openDB(function (err, db) {
      if (err) { callback(err, null); return; }
      var tx = db.transaction(STORE_NAME, 'readonly');
      var store = tx.objectStore(STORE_NAME);
      var req = store.get(id);
      req.onsuccess = function () { callback(null, req.result || null); };
      req.onerror = function (e) { callback(e.target.error, null); };
    });
  }

  /* ── Add product ─────────────────────────────────────────────────── */
  function addProduct(product, callback) {
    openDB(function (err, db) {
      if (err) { callback(err, null); return; }
      var tx = db.transaction(STORE_NAME, 'readwrite');
      var store = tx.objectStore(STORE_NAME);
      // Remove id so autoIncrement assigns one
      var rec = Object.assign({}, product);
      delete rec.id;
      rec.createdAt = Date.now();
      var req = store.add(rec);
      req.onsuccess = function () { callback(null, req.result); };
      req.onerror = function (e) { callback(e.target.error, null); };
    });
  }

  /* ── Update product ──────────────────────────────────────────────── */
  function updateProduct(product, callback) {
    openDB(function (err, db) {
      if (err) { callback(err); return; }
      var tx = db.transaction(STORE_NAME, 'readwrite');
      var store = tx.objectStore(STORE_NAME);
      var rec = Object.assign({}, product);
      rec.updatedAt = Date.now();
      var req = store.put(rec);
      req.onsuccess = function () { callback(null); };
      req.onerror = function (e) { callback(e.target.error); };
    });
  }

  /* ── Delete product ──────────────────────────────────────────────── */
  function deleteProduct(id, callback) {
    openDB(function (err, db) {
      if (err) { callback(err); return; }
      var tx = db.transaction(STORE_NAME, 'readwrite');
      var store = tx.objectStore(STORE_NAME);
      var req = store.delete(id);
      req.onsuccess = function () { callback(null); };
      req.onerror = function (e) { callback(e.target.error); };
    });
  }

  /* ── Count products ──────────────────────────────────────────────── */
  function countProducts(callback) {
    openDB(function (err, db) {
      if (err) { callback(0); return; }
      var tx = db.transaction(STORE_NAME, 'readonly');
      var store = tx.objectStore(STORE_NAME);
      var req = store.count();
      req.onsuccess = function () { callback(req.result); };
      req.onerror = function () { callback(0); };
    });
  }

  /* ── Replace all products in the store ─────────────────────────── */
  function replaceAllProducts(products, callback) {
    openDB(function (err, db) {
      if (err) { callback && callback(err); return; }
      var tx = db.transaction(STORE_NAME, 'readwrite');
      var store = tx.objectStore(STORE_NAME);
      var req = store.clear();

      req.onsuccess = function () {
        var items = (products || []).map(function (p) {
          var rec = Object.assign({}, p);
          delete rec.id;
          rec.createdAt = rec.createdAt || Date.now();
          rec.updatedAt = Date.now();
          return rec;
        });

        if (!items.length) {
          tx.oncomplete = function () { callback && callback(null); };
          return;
        }

        items.forEach(function (item) { store.add(item); });
        tx.oncomplete = function () { callback && callback(null); };
        tx.onerror = function (e) { callback && callback(e.target.error || new Error('Failed to save products')); };
      };

      req.onerror = function (e) {
        callback && callback(e.target.error || new Error('Failed to clear products'));
      };
    });
  }

  /* ── Seed from DEFAULT_PRODUCTS (localStorage migration) ─────────── */
  function seedIfEmpty(defaults, callback) {
    countProducts(function (count) {
      if (count > 0) { callback(); return; }

      // Seed default products (images stored as filename strings — legacy)
      openDB(function (err, db) {
        if (err) { callback(); return; }
        var tx = db.transaction(STORE_NAME, 'readwrite');
        var store = tx.objectStore(STORE_NAME);
        var done = 0;

        defaults.forEach(function (p) {
          var rec = Object.assign({}, p);
          // For legacy products, imageData stays undefined; image = filename
          rec.createdAt = Date.now();
          delete rec.id; // let autoIncrement assign
          store.add(rec);
        });

        tx.oncomplete = function () { callback(); };
        tx.onerror = function () { callback(); };
      });
    });
  }

  /* ── Convert File to Base64 ──────────────────────────────────────── */
  function fileToBase64(file, callback) {
    var reader = new FileReader();
    reader.onload = function (e) { callback(null, e.target.result); };
    reader.onerror = function () { callback(new Error('Failed to read file'), null); };
    reader.readAsDataURL(file);
  }

  /* ── Export ──────────────────────────────────────────────────────── */
  global.BahabehioDB = {
    getAllProducts: getAllProducts,
    getProduct: getProduct,
    addProduct: addProduct,
    updateProduct: updateProduct,
    deleteProduct: deleteProduct,
    replaceAllProducts: replaceAllProducts,
    seedIfEmpty: seedIfEmpty,
    fileToBase64: fileToBase64
  };

  global.DermaCareDB = global.BahabehioDB;

})(window);
