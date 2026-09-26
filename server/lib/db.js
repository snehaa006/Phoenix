import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// Cloudflare D1 is SQLite at the edge. This server talks to it over the D1 HTTP API:
// https://developers.cloudflare.com/api/resources/d1/subresources/database/methods/query/
// Without Cloudflare credentials (local development only) it falls back to a local SQLite file.

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SCHEMA_FILE = path.join(__dirname, "../migrations/0001_init.sql");

const { CLOUDFLARE_ACCOUNT_ID, CLOUDFLARE_D1_DATABASE_ID, CLOUDFLARE_API_TOKEN } = process.env;
const useD1 = Boolean(CLOUDFLARE_ACCOUNT_ID && CLOUDFLARE_D1_DATABASE_ID && CLOUDFLARE_API_TOKEN);

let localDb;

const d1Query = async (sql, params) => {
    const url = `https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/d1/database/${CLOUDFLARE_D1_DATABASE_ID}/query`;
    const res = await fetch(url, {
        method: "POST",
        headers: { Authorization: `Bearer ${CLOUDFLARE_API_TOKEN}`, "Content-Type": "application/json" },
        body: JSON.stringify(params.length ? { sql, params } : { sql }),
    });
    const data = await res.json().catch(() => null);
    if (!res.ok || !data?.success) {
        const detail = data?.errors?.map((e) => e.message).join("; ") || `HTTP ${res.status}`;
        throw new Error(`D1 query failed: ${detail}`);
    }
    //one result per statement; callers only ever send one statement with params
    const last = data.result[data.result.length - 1];
    return { rows: last?.results || [], changes: last?.meta?.changes ?? 0 };
};

const localQuery = (sql, params) => {
    const stmt = localDb.prepare(sql);
    if (/^\s*(select|with)\b/i.test(sql) || /\breturning\b/i.test(sql)) {
        return { rows: stmt.all(...params), changes: 0 };
    }
    const info = stmt.run(...params);
    return { rows: [], changes: Number(info.changes) };
};

//run one SQL statement; returns { rows, changes }
export const query = async (sql, params = []) => {
    //D1 has no boolean/undefined types
    const values = params.map((v) => (v === undefined ? null : typeof v === "boolean" ? Number(v) : v));
    return useD1 ? d1Query(sql, values) : localQuery(sql, values);
};

export const queryOne = async (sql, params) => (await query(sql, params)).rows[0] || null;

//create tables if they don't exist yet
export const connectDB = async () => {
    const schema = fs.readFileSync(SCHEMA_FILE, "utf8");
    if (useD1) {
        await d1Query(schema, []);
        console.log("Connected to Cloudflare D1");
        return;
    }
    if (process.env.NODE_ENV === "production") {
        throw new Error("Set CLOUDFLARE_ACCOUNT_ID, CLOUDFLARE_D1_DATABASE_ID and CLOUDFLARE_API_TOKEN");
    }
    const { DatabaseSync } = await import("node:sqlite");
    const file = process.env.LOCAL_DB_PATH || path.join(__dirname, "../local.db");
    localDb = new DatabaseSync(file);
    localDb.exec("PRAGMA foreign_keys = ON;");
    localDb.exec(schema);
    console.log(`Cloudflare credentials not set, using local SQLite database: ${file}`);
};
