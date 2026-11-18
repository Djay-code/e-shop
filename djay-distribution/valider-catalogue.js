// Vérifie catalogue.json avant toute publication. Usage : node djay-distribution/valider-catalogue.js
// Sort avec le code 1 et la liste des erreurs si le catalogue n'est pas publiable.
const fs = require("fs");
const path = require("path");
const f = path.join(__dirname, "catalogue.json");
const err = [];
let d;
try { d = JSON.parse(fs.readFileSync(f, "utf8")); } catch (e) { console.error("JSON invalide :", e.message); process.exit(1); }

const cats = new Set((d.categories || []).map((c) => c.id));
const usages = new Set(Object.keys(d.usages || {}));
if (!d.societe?.email) err.push("societe.email manquant");
if (!/^\d{4}-\d{2}-\d{2}$/.test(d.societe?.majCatalogue || "")) err.push("societe.majCatalogue doit être au format AAAA-MM-JJ");
if (!cats.size) err.push("aucune catégorie");

const ids = new Set();
for (const [i, p] of (d.produits || []).entries()) {
  const o = `produit ${i + 1} (${p.nom || p.id || "?"})`;
  if (!/^[a-z0-9-]{2,40}$/.test(p.id || "")) err.push(`${o} : id invalide (minuscules, chiffres, tirets)`);
  if (ids.has(p.id)) err.push(`${o} : id en double`);
  ids.add(p.id);
  if (!cats.has(p.categorie)) err.push(`${o} : catégorie inconnue « ${p.categorie} »`);
  for (const k of ["nom", "marque", "pour", "description"]) if (typeof p[k] !== "string" || !p[k].trim()) err.push(`${o} : « ${k} » manquant`);
  if (!Number.isInteger(p.prix) || p.prix < 5 || p.prix > 5000) err.push(`${o} : prix invalide (entier en euros entre 5 et 5000)`);
  if (!Array.isArray(p.tags) || !p.tags.length || p.tags.some((t) => !usages.has(t))) err.push(`${o} : tags vides ou inconnus`);
  if (!p.caracteristiques || typeof p.caracteristiques !== "object" || !Object.keys(p.caracteristiques).length) err.push(`${o} : caractéristiques manquantes`);
  for (const k of ["plus", "moins"]) if (!Array.isArray(p[k]) || p[k].length < 1 || p[k].length > 4) err.push(`${o} : « ${k} » doit avoir 1 à 4 éléments`);
  if (p.asin !== "" && !/^B0[A-Z0-9]{8}$/.test(p.asin || "")) err.push(`${o} : asin invalide (B0 + 8 caractères, ou vide)`);
  if (p.ajouteLe !== undefined && !/^\d{4}-\d{2}-\d{2}$/.test(p.ajouteLe)) err.push(`${o} : ajouteLe au format AAAA-MM-JJ`);
}
// Chaque catégorie garde entre 2 et 5 produits, pour que la comparaison reste utile
for (const c of cats) {
  const n = d.produits.filter((p) => p.categorie === c).length;
  if (n < 2 || n > 5) err.push(`catégorie ${c} : ${n} produits (attendu 2 à 5)`);
}
if (err.length) { console.error("Catalogue NON publiable :\n- " + err.join("\n- ")); process.exit(1); }
console.log(`Catalogue valide : ${d.produits.length} produits, ${cats.size} catégories.`);
