// Chiffre le PDF du kit pour qu'il puisse être stocké dans le dépôt public sans être lisible.
// Usage : KIT_KEY=<clé hexadécimale de 64 caractères> node outils/chiffrer-kit.js chemin/vers/Kit.pdf
// La même clé doit être enregistrée dans Netlify (variable KIT_KEY) pour que la fonction
// « telecharger » puisse déchiffrer le fichier après un paiement confirmé par Stripe.
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const key = Buffer.from(process.env.KIT_KEY || "", "hex");
if (key.length !== 32) { console.error("KIT_KEY doit contenir 64 caractères hexadécimaux."); process.exit(1); }
const src = process.argv[2];
if (!src || !fs.existsSync(src)) { console.error("Indiquez le chemin du PDF."); process.exit(1); }

const iv = crypto.randomBytes(12);
const c = crypto.createCipheriv("aes-256-gcm", key, iv);
const data = Buffer.concat([c.update(fs.readFileSync(src)), c.final()]);
const out = path.join(__dirname, "../netlify/functions/telecharger/kit.enc");
// Format : IV (12 octets) | étiquette d'authentification (16 octets) | contenu chiffré
fs.writeFileSync(out, Buffer.concat([iv, c.getAuthTag(), data]));
console.log("Fichier chiffré :", path.relative(process.cwd(), out), data.length, "octets");
