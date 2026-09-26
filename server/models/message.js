import crypto from "crypto";
import { query, queryOne } from "../lib/db.js";

//DB row -> the shape the client expects (field names kept from the original API)
const toMessage = (row) => row && ({
    _id: row.id,
    senderId: row.sender_id,
    recieverId: row.receiver_id,
    text: row.text ?? undefined,
    image: row.image ?? undefined,
    seen: Boolean(row.seen),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
});

const Message = {
    async create({ senderId, recieverId, text, image }) {
        const now = new Date().toISOString();
        const id = crypto.randomUUID();
        await query(
            "INSERT INTO messages (id, sender_id, receiver_id, text, image, seen, created_at, updated_at) VALUES (?, ?, ?, ?, ?, 0, ?, ?)",
            [id, String(senderId), String(recieverId), text || null, image || null, now, now]
        );
        return Message.findById(id);
    },

    async findById(id) {
        return toMessage(await queryOne("SELECT * FROM messages WHERE id = ?", [String(id)]));
    },

    //full conversation between two users, oldest first
    async findConversation(userA, userB) {
        const { rows } = await query(
            `SELECT * FROM messages
             WHERE (sender_id = ? AND receiver_id = ?) OR (sender_id = ? AND receiver_id = ?)
             ORDER BY created_at ASC`,
            [String(userA), String(userB), String(userB), String(userA)]
        );
        return rows.map(toMessage);
    },

    //mark everything `senderId` sent to `receiverId` as seen; returns how many changed
    async markConversationSeen(senderId, receiverId) {
        const { changes } = await query(
            "UPDATE messages SET seen = 1, updated_at = ? WHERE sender_id = ? AND receiver_id = ? AND seen = 0",
            [new Date().toISOString(), String(senderId), String(receiverId)]
        );
        return changes;
    },

    //mark one message as seen, only if `receiverId` is its receiver
    async markSeen(id, receiverId) {
        const { changes } = await query(
            "UPDATE messages SET seen = 1, updated_at = ? WHERE id = ? AND receiver_id = ?",
            [new Date().toISOString(), String(id), String(receiverId)]
        );
        return changes > 0 ? Message.findById(id) : null;
    },

    //delete a message, only if `senderId` sent it
    async deleteOwn(id, senderId) {
        const message = await Message.findById(id);
        if (!message || message.senderId !== String(senderId)) return null;
        await query("DELETE FROM messages WHERE id = ?", [String(id)]);
        return message;
    },

    //last message + unread count for every conversation the user is part of
    async conversationSummaries(userId) {
        const id = String(userId);
        const { rows } = await query(
            `WITH convo AS (
                SELECT *, CASE WHEN sender_id = ? THEN receiver_id ELSE sender_id END AS other_id
                FROM messages WHERE sender_id = ? OR receiver_id = ?
             ),
             ranked AS (
                SELECT *,
                    ROW_NUMBER() OVER (PARTITION BY other_id ORDER BY created_at DESC) AS rn,
                    SUM(CASE WHEN receiver_id = ? AND seen = 0 THEN 1 ELSE 0 END) OVER (PARTITION BY other_id) AS unseen
                FROM convo
             )
             SELECT * FROM ranked WHERE rn = 1`,
            [id, id, id, id]
        );
        return rows.map((row) => ({ otherId: row.other_id, unseen: Number(row.unseen), lastMessage: toMessage(row) }));
    },
};

export default Message;
