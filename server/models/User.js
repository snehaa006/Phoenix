import crypto from "crypto";
import { query, queryOne } from "../lib/db.js";

//DB row -> the shape the client expects
const toUser = (row, { withPassword = false } = {}) => {
    if (!row) return null;
    const user = {
        _id: row.id,
        email: row.email,
        fullName: row.full_name,
        profilePic: row.profile_pic,
        bio: row.bio,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
    };
    if (withPassword) user.password = row.password;
    return user;
};

const User = {
    async create({ fullName, email, password, bio = "" }) {
        const now = new Date().toISOString();
        const id = crypto.randomUUID();
        await query(
            "INSERT INTO users (id, email, full_name, password, profile_pic, bio, created_at, updated_at) VALUES (?, ?, ?, ?, '', ?, ?, ?)",
            [id, email, fullName, password, bio, now, now]
        );
        return User.findById(id);
    },

    async findById(id) {
        return toUser(await queryOne("SELECT * FROM users WHERE id = ?", [String(id)]));
    },

    //includes the password hash, for login only
    async findByEmailWithPassword(email) {
        return toUser(await queryOne("SELECT * FROM users WHERE email = ?", [email]), { withPassword: true });
    },

    async existsByEmail(email) {
        return Boolean(await queryOne("SELECT 1 AS found FROM users WHERE email = ?", [email]));
    },

    async exists(id) {
        return Boolean(await queryOne("SELECT 1 AS found FROM users WHERE id = ?", [String(id)]));
    },

    async findAllExcept(id) {
        const { rows } = await query("SELECT * FROM users WHERE id != ? ORDER BY full_name", [String(id)]);
        return rows.map((row) => toUser(row));
    },

    async update(id, { fullName, bio, profilePic }) {
        const now = new Date().toISOString();
        await query(
            "UPDATE users SET full_name = ?, bio = ?, profile_pic = COALESCE(?, profile_pic), updated_at = ? WHERE id = ?",
            [fullName, bio, profilePic ?? null, now, String(id)]
        );
        return User.findById(id);
    },
};

export default User;
