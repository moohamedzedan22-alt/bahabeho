/**
 * products.js — Shared product data store for Derma Care
 * Uses localStorage as the sync cache and mirrors data to IndexedDB when available.
 */

var DEFAULT_PRODUCTS = [
  {id: 1, nameEn: "Product 1", nameAr: "منتج 1", price: 750, image: "WhatsApp Image 2026-06-13 at 2.12.06 AM.jpeg", descEn: "", descAr: ""},
  {id: 2, nameEn: "Product 2", nameAr: "منتج 2", price: 750, image: "WhatsApp Image 2026-06-13 at 2.12.07 AM.jpeg", descEn: "", descAr: ""},
  {id: 3, nameEn: "Product 3", nameAr: "منتج 3", price: 750, image: "WhatsApp Image 2026-06-13 at 2.12.08 AM.jpeg", descEn: "", descAr: ""},
  {id: 4, nameEn: "Product 4", nameAr: "منتج 4", price: 750, image: "WhatsApp Image 2026-06-13 at 2.12.07 AM (1).jpeg", descEn: "", descAr: ""},
  {id: 5, nameEn: "Product 5", nameAr: "منتج 5", price: 750, image: "WhatsApp Image 2026-06-13 at 2.12.07 AM (2).jpeg", descEn: "", descAr: ""},
  {id: 6, nameEn: "Product 6", nameAr: "منتج 6", price: 750, image: "WhatsApp Image 2026-06-13 at 2.12.07 AM (3).jpeg", descEn: "", descAr: ""},
  {id: 7, nameEn: "Product 7", nameAr: "منتج 7", price: 750, image: "WhatsApp Image 2026-06-13 at 2.12.08 AM (2).jpeg", descEn: "", descAr: ""},
  {id: 8, nameEn: "Product 8", nameAr: "منتج 8", price: 750, image: "WhatsApp Image 2026-06-13 at 2.12.08 AM (1).jpeg", descEn: "", descAr: ""},
  {id: 9, nameEn: "Product 9", nameAr: "منتج 9", price: 750, image: "photo_2026-06-13_13-56-16.jpg", descEn: "", descAr: ""},
  {id: 10, nameEn: "Product 10", nameAr: "منتج 10", price: 750, image: "photo_2026-06-13_13-56-33.jpg", descEn: "", descAr: ""},
  {id: 11, nameEn: "Product 11", nameAr: "منتج 11", price: 750, image: "photo_2026-06-13_13-56-55.jpg", descEn: "", descAr: ""},
  {id: 12, nameEn: "Product 12", nameAr: "منتج 12", price: 1150, image: "photo_2026-06-13_13-57-22.jpg", descEn: "", descAr: ""},
  {id: 13, nameEn: "Product 13", nameAr: "منتج 13", price: 750, image: "photo_2026-06-13_13-57-44.jpg", descEn: "", descAr: ""}
];

// ── Admin credentials a(change these if needed) ──────────────────────────────
var ADMIN_EMAIL    = "admin@dermacare.com";
var ADMIN_PASSWORD = "200.300.200";

// ── Storage helpers ──────────────────────────────────────────────────────────
function DC_getProducts() {
  try {
    var stored = localStorage.getItem("dc_products");
    if (stored) return JSON.parse(stored);
  } catch(e) {}

  // First visit — seed with defaults
  DC_saveProducts(DEFAULT_PRODUCTS.slice());
  return DEFAULT_PRODUCTS.slice();
}

function DC_saveProducts(arr) {
  var normalized = (arr || []).map(function (p) { return Object.assign({}, p); });
  try { localStorage.setItem("dc_products", JSON.stringify(normalized)); } catch(e) {}

  if (window.BahabehioDB && typeof window.BahabehioDB.replaceAllProducts === "function") {
    window.BahabehioDB.replaceAllProducts(normalized, function () {});
  }
}

function DC_getNextId() {
  var products = DC_getProducts();
  if (!products.length) return 1;
  return Math.max.apply(null, products.map(function(p){ return p.id; })) + 1;
}

// ── Admin session ────────────────────────────────────────────────────────────
function DC_isAdminLoggedIn() {
  return localStorage.getItem("dc_admin_logged_in") === "true";
}

function DC_adminLogin(email, password) {
  if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
    localStorage.setItem("dc_admin_logged_in", "true");
    return true;
  }
  return false;
}

function DC_adminLogout() {
  localStorage.removeItem("dc_admin_logged_in");
}
