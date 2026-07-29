import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import type { WarnEntry, HistoryEntry } from "../types.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, "../../data");

if (!existsSync(DATA_DIR)) {
  mkdirSync(DATA_DIR, { recursive: true });
}

function loadJson<T>(file: string, fallback: T): T {
  const path = join(DATA_DIR, file);
  if (!existsSync(path)) return fallback;
  try {
    return JSON.parse(readFileSync(path, "utf-8")) as T;
  } catch {
    return fallback;
  }
}

function saveJson(file: string, data: unknown) {
  writeFileSync(join(DATA_DIR, file), JSON.stringify(data, null, 2), "utf-8");
}

// ── Autoroles ────────────────────────────────────────────────────────
const AUTOROLE_FILE = "autoroles.json";
const _autoroles: Record<string, string[]> = loadJson<Record<string, string[]>>(AUTOROLE_FILE, {});

export const autoroleStore = {
  get(guildId: string): string[] {
    return _autoroles[guildId] ?? [];
  },
  set(guildId: string, roleIds: string[]) {
    _autoroles[guildId] = roleIds;
    saveJson(AUTOROLE_FILE, _autoroles);
  },
  add(guildId: string, roleId: string): boolean {
    const roles = this.get(guildId);
    if (roles.includes(roleId)) return false;
    roles.push(roleId);
    this.set(guildId, roles);
    return true;
  },
  remove(guildId: string, roleId: string): boolean {
    const roles = this.get(guildId);
    const idx = roles.indexOf(roleId);
    if (idx === -1) return false;
    roles.splice(idx, 1);
    this.set(guildId, roles);
    return true;
  },
};

// ── Warns ────────────────────────────────────────────────────────────
const WARNS_FILE = "warns.json";
const _warns: Record<string, WarnEntry[]> = loadJson<Record<string, WarnEntry[]>>(WARNS_FILE, {});

export const warnsStore = {
  get(key: string): WarnEntry[] {
    return _warns[key] ?? [];
  },
  add(key: string, entry: WarnEntry) {
    if (!_warns[key]) _warns[key] = [];
    _warns[key].push(entry);
    saveJson(WARNS_FILE, _warns);
  },
  set(key: string, entries: WarnEntry[]) {
    _warns[key] = entries;
    saveJson(WARNS_FILE, _warns);
  },
  clear(key: string) {
    delete _warns[key];
    saveJson(WARNS_FILE, _warns);
  },
};

// ── Règlement ────────────────────────────────────────────────────────
const REGLEMENT_FILE = "reglement.json";

interface ReglementData {
  texts: Record<string, string>;
  acceptRoles: Record<string, string>;
}

function loadReglement(): ReglementData {
  const raw = loadJson<unknown>(REGLEMENT_FILE, { texts: {}, acceptRoles: {} });
  // Migration : ancien format { guildId: "texte" } → nouveau format { texts: {}, acceptRoles: {} }
  if (raw && typeof raw === "object" && !("texts" in raw)) {
    const texts = raw as Record<string, string>;
    return { texts, acceptRoles: {} };
  }
  return raw as ReglementData;
}

const _reglement: ReglementData = loadReglement();

export const reglementStore = {
  get(guildId: string): string | undefined {
    return _reglement.texts?.[guildId];
  },
  set(guildId: string, texte: string) {
    if (!_reglement.texts) _reglement.texts = {};
    _reglement.texts[guildId] = texte;
    saveJson(REGLEMENT_FILE, _reglement);
  },
  delete(guildId: string) {
    if (_reglement.texts) delete _reglement.texts[guildId];
    saveJson(REGLEMENT_FILE, _reglement);
  },
  getAcceptRole(guildId: string): string | undefined {
    return _reglement.acceptRoles?.[guildId];
  },
  setAcceptRole(guildId: string, roleId: string) {
    if (!_reglement.acceptRoles) _reglement.acceptRoles = {};
    _reglement.acceptRoles[guildId] = roleId;
    saveJson(REGLEMENT_FILE, _reglement);
  },
};

// ── Historique ───────────────────────────────────────────────────────
const HISTORY_FILE = "history.json";
const MAX_PER_GUILD = 500;

const _history: Record<string, HistoryEntry[]> = loadJson<Record<string, HistoryEntry[]>>(HISTORY_FILE, {});

export const historyStore = {
  add(entry: HistoryEntry) {
    const guildId = entry.guildId;
    if (!_history[guildId]) _history[guildId] = [];
    _history[guildId].unshift(entry); // plus récent en premier
    if (_history[guildId].length > MAX_PER_GUILD) {
      _history[guildId] = _history[guildId].slice(0, MAX_PER_GUILD);
    }
    saveJson(HISTORY_FILE, _history);
  },
  getForGuild(guildId: string, limit = 20): HistoryEntry[] {
    return (_history[guildId] ?? []).slice(0, limit);
  },
  getForMember(guildId: string, userId: string, limit = 20): HistoryEntry[] {
    return (_history[guildId] ?? [])
      .filter((e) => e.targetId === userId)
      .slice(0, limit);
  },
};
