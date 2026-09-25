// One-time copy of existing MongoDB data into Cloudflare D1.
// Ids are kept as-is, so existing login tokens stay valid.
//
//   MONGODB_URI=... CLOUDFLARE_ACCOUNT_ID=... CLOUDFLARE_D1_DATABASE_ID=... CLOUDFLARE_API_TOKEN=... \
//     npm run migrate:mongo
//
// Safe to re-run: rows that already exist are skipped.
import "dotenv/config";
import mongoose from "mongoose";
import { connectDB, query } from "../lib/db.js";

const COLUMNS = 8;
const ROWS_PER_INSERT = Math.floor(100 / COLUMNS); //D1 allows at most 100 bound parameters per query

const iso = (d) => (d ? new Date(d).toISOString() : new Date().toISOString());

const insertAll = async (table, columns, rows) => {
    for (let i = 0; i < rows.length; i += ROWS_PER_INSERT) {
        const chunk = rows.slice(i, i + ROWS_PER_INSERT);
        const placeholders = chunk.map(() => `(${columns.map(() => "?").join(", ")})`).join(", ");
        await query(`INSERT OR IGNORE INTO ${table} (${columns.join(", ")}) VALUES ${placeholders}`, chunk.flat());
        process.stdout.write(`\r${table}: ${Math.min(i + ROWS_PER_INSERT, rows.length)}/${rows.length}`);
    }
    if (rows.length) process.stdout.write("\n");
};

if (!process.env.MONGODB_URI) throw new Error("Set MONGODB_URI to the database you are migrating from");

await connectDB();
await mongoose.connect(`${process.env.MONGODB_URI}/chat-app`);
const db = mongoose.connection.db;

const users = await db.collection("users").find().toArray();
await insertAll(
    "users",
    ["id", "email", "full_name", "password", "profile_pic", "bio", "created_at", "updated_at"],
    users.map((u) => [String(u._id), u.email.toLowerCase(), u.fullName, u.password, u.profilePic || "", u.bio || "", iso(u.createdAt), iso(u.updatedAt)])
);

const messages = await db.collection("messages").find().toArray();
await insertAll(
    "messages",
    ["id", "sender_id", "receiver_id", "text", "image", "seen", "created_at", "updated_at"],
    messages.map((m) => [String(m._id), String(m.senderId), String(m.recieverId), m.text ?? null, m.image ?? null, m.seen ? 1 : 0, iso(m.createdAt), iso(m.updatedAt)])
);

console.log(`Done: ${users.length} users, ${messages.length} messages`);
await mongoose.disconnect();
