import { getDatabase } from ".";

export async function queueSync(entityType: string, entityId: number, operation: 'create' | 'update' | 'delete', payload: unknown) {
    const db = await getDatabase();
    const now = new Date().toISOString();

    await db.runAsync(`INSERT INTO sync_queue (entity_type, entity_id, operation, payload, status, attempts, created_at, updated_at) VALUES (?, ?, ?, ?, 'pending', 0, ?, ?)`, entityType, entityId, operation, JSON.stringify(payload), now, now);
}

export async function processSyncQueue() {
    const db = await getDatabase();

    await db.runAsync(`UPDATE sync_queue SET status = 'pending', updated_at = ? WHERE status = 'syncing'`, new Date().toISOString());

    const items = await db.getAllAsync<{ id: number; entity_type: string; entity_id: number; operation: string; payload: string; attempts: number }>(`SELECT * FROM sync_queue WHERE status = 'pending' AND attempts < 10 ORDER BY id ASC LIMIT 50`);

    for (const item of items) {
        try {
            await db.runAsync(`UPDATE sync_queue SET status = 'syncing', attempts = attempts + 1, updated_at = ? WHERE id = ?`, new Date().toISOString(), item.id);

            // TODO: send to BusinessOS API
            // const response = await api.post('/sync', { entityType: item.entity_type, entityId: item.entity_id, operation: item.operation, payload: JSON.parse(item.payload) });

            await db.runAsync(`UPDATE sync_queue SET status = 'synced', last_error = NULL, updated_at = ? WHERE id = ?`, new Date().toISOString(), item.id);
        } catch (error) {
            await db.runAsync(`UPDATE sync_queue SET status = 'pending', last_error = ?, updated_at = ? WHERE id = ?`, String(error), new Date().toISOString(), item.id);
        }
    }
}
