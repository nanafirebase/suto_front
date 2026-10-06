import { getDatabase } from ".";

export async function consumeStock(businessId: number, branchId: number, stockId: number, productId: number, saleId: number, saleItemId: number, quantity: number, sessionId?: number) {
    const db = await getDatabase();
    let remaining = quantity;

    const batches = await db.getAllAsync<{ id: number; stockInID: number; quantity: number; remainingQuantity: number; costPrice: number; expiryDate: string | null }>(`SELECT id, stock_in_id as stockInID, quantity, remaining_quantity as remainingQuantity, cost_price as costPrice, expiry_date as expiryDate FROM stock_in_item WHERE business_id = ? AND stock_in_id IN (SELECT id FROM stock_in WHERE branch_id = ? AND stock_id = ?) AND product_id = ? AND remaining_quantity > 0 AND status = 'active' ORDER BY CASE WHEN expiry_date IS NULL THEN 1 ELSE 0 END, expiry_date ASC, id ASC`, businessId, branchId, stockId, productId);

    for (const batch of batches) {
        if (remaining <= 0) break;

        const consumed = Math.min(remaining, batch.remainingQuantity);
        const newRemaining = batch.remainingQuantity - consumed;
        await db.runAsync(`UPDATE stock_in_item SET remaining_quantity = ? WHERE id = ?`, newRemaining, batch.id);

        const consumptionId = Date.now() + Math.floor(Math.random() * 1000);
        await db.runAsync(`INSERT INTO sale_batch_consumption (id, business_id, branch_id, sale_id, sale_item_id, stock_in_id, stock_in_item_id, product_id, quantity, cost_price, total_cost, status, session_id, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'completed', ?, ?)`, consumptionId, businessId, branchId, saleId, saleItemId, batch.stockInID, batch.id, productId, consumed, batch.costPrice, consumed * batch.costPrice, sessionId ?? null, new Date().toISOString());

        remaining -= consumed;
    }

    if (remaining > 0) throw new Error(`Insufficient stock for product ${productId}`);
    return quantity;
}
