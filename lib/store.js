'use strict';
/** Armazenamento simples em arquivo JSON (gravação atômica). */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, '..', 'data');
const FILE = path.join(DATA_DIR, 'db.json');

const EMPTY = () => ({
  users: [], sessions: [], settings: {},
  companies: [], deliveries: [], materials: [], campaigns: [], responses: [], feedback: []
});

let db = null;

function load() {
  if (db) return db;
  fs.mkdirSync(DATA_DIR, { recursive: true });
  if (fs.existsSync(FILE)) {
    db = { ...EMPTY(), ...JSON.parse(fs.readFileSync(FILE, 'utf8')) };
  } else {
    db = EMPTY();
    save();
  }
  return db;
}

function save() {
  const tmp = FILE + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(db, null, 2));
  fs.renameSync(tmp, FILE);
}

const id = () => crypto.randomUUID();
const token = () => crypto.randomBytes(9).toString('base64url');

/** Reinicia o banco (usado em testes). */
function reset() { db = EMPTY(); save(); }

module.exports = { load, save, id, token, reset, FILE };
