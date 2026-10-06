import type { SQLiteDatabase } from 'expo-sqlite';

export type InventoryBalance = {
    id: number;
    business_id: number;
    branch_id: number;
    product_id: number;
    stock_id: number;
    base_quantity: number;
    created_at: string;
    updated_at: string;
};

export type InventoryMovement = {
    id: number;
    business_id: number;
    branch_id: number;
    stock_id: number;
    product_id: number;

    reference_type: string;
    reference_id: number | null;

    quantity_in: number;
    quantity_out: number;
    base_quantity: number;

    cost_price: number;
    remark: string | null;
    balance_quantity: number;

    created_by: number | null;
    session_id: number | null;
    created_at: string;
};

export type AdjustInventoryInput = {
    business_id: number;
    branch_id: number;
    stock_id: number;
    product_id: number;

    quantity: number;

    reference_type: string;
    reference_id?: number | null;

    cost_price?: number;
    remark?: string | null;

    created_by?: number | null;
    session_id?: number | null;
};

function now() {
    return new Date().toISOString();
}

function generateLocalId() {
    return -Date.now();
}

function generateIdempotencyKey(
    operation: string,
    movementId: number,
) {
    return `inventory:${operation}:${movementId}:${Date.now()}`;
}

/**
 * Get the current balance of one product in one stock.
 */
export async function getInventoryBalance(
    db: SQLiteDatabase,
    businessId: number,
    branchId: number,
    stockId: number,
    productId: number,
): Promise<InventoryBalance | null> {
    return await db.getFirstAsync<InventoryBalance>(
        `
        SELECT *
        FROM product_stock_balance
        WHERE business_id = ?
          AND branch_id = ?
          AND stock_id = ?
          AND product_id = ?
        LIMIT 1
        `,
        businessId,
        branchId,
        stockId,
        productId,
    );
}

/**
 * Get all inventory balances for a stock.
 */
export async function getStockInventory(
    db: SQLiteDatabase,
    businessId: number,
    branchId: number,
    stockId: number,
): Promise<InventoryBalance[]> {
    return await db.getAllAsync<InventoryBalance>(
        `
        SELECT *
        FROM product_stock_balance
        WHERE business_id = ?
          AND branch_id = ?
          AND stock_id = ?
        ORDER BY product_id ASC
        `,
        businessId,
        branchId,
        stockId,
    );
}

/**
 * Increase or decrease inventory.
 *
 * This operation:
 *
 * 1. Reads the current balance.
 * 2. Calculates the new balance locally.
 * 3. Updates product_stock_balance.
 * 4. Creates inventory_movement.
 * 5. Adds the movement to sync_queue.
 *
 * Everything happens inside one SQLite transaction.
 */
export async function adjustInventory(
    db: SQLiteDatabase,
    input: AdjustInventoryInput,
): Promise<InventoryBalance> {
    if (input.quantity === 0) {
        throw new Error('Inventory quantity cannot be zero.');
    }

    const timestamp = now();

    const quantityIn =
        input.quantity > 0
            ? input.quantity
            : 0;

    const quantityOut =
        input.quantity < 0
            ? Math.abs(input.quantity)
            : 0;

    const movementId = generateLocalId();

    let result: InventoryBalance | null = null;

    await db.withTransactionAsync(async () => {
        const existing = await getInventoryBalance(
            db,
            input.business_id,
            input.branch_id,
            input.stock_id,
            input.product_id,
        );

        const currentQuantity =
            existing?.base_quantity ?? 0;

        const newQuantity =
            currentQuantity + input.quantity;

        /*
         * We do not allow the local POS to create
         * negative inventory.
         *
         * If your business allows negative stock,
         * we can change this rule later.
         */
        if (newQuantity < 0) {
            throw new Error(
                `Insufficient stock. Available: ${currentQuantity}, requested: ${Math.abs(input.quantity)}`
            );
        }

        if (existing) {
            await db.runAsync(
                `
                UPDATE product_stock_balance
                SET
                    base_quantity = ?,
                    updated_at = ?
                WHERE id = ?
                `,
                newQuantity,
                timestamp,
                existing.id,
            );

            result = {
                ...existing,
                base_quantity: newQuantity,
                updated_at: timestamp,
            };
        } else {
            await db.runAsync(
                `
                INSERT INTO product_stock_balance (
                    id,
                    business_id,
                    branch_id,
                    product_id,
                    stock_id,
                    base_quantity,
                    created_at,
                    updated_at
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                `,
                movementId,
                input.business_id,
                input.branch_id,
                input.product_id,
                input.stock_id,
                newQuantity,
                timestamp,
                timestamp,
            );

            result = {
                id: movementId,
                business_id: input.business_id,
                branch_id: input.branch_id,
                product_id: input.product_id,
                stock_id: input.stock_id,
                base_quantity: newQuantity,
                created_at: timestamp,
                updated_at: timestamp,
            };
        }

        const movement: InventoryMovement = {
            id: movementId,
            business_id: input.business_id,
            branch_id: input.branch_id,
            stock_id: input.stock_id,
            product_id: input.product_id,

            reference_type: input.reference_type,
            reference_id: input.reference_id ?? null,

            quantity_in: quantityIn,
            quantity_out: quantityOut,
            base_quantity: input.quantity,

            cost_price: input.cost_price ?? 0,
            remark: input.remark ?? null,

            balance_quantity: newQuantity,

            created_by: input.created_by ?? null,
            session_id: input.session_id ?? null,

            created_at: timestamp,
        };

        await db.runAsync(
            `
            INSERT INTO inventory_movement (
                id,
                business_id,
                branch_id,
                stock_id,
                product_id,
                reference_type,
                reference_id,
                quantity_in,
                quantity_out,
                base_quantity,
                cost_price,
                remark,
                balance_quantity,
                created_by,
                session_id,
                created_at
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `,
            movement.id,
            movement.business_id,
            movement.branch_id,
            movement.stock_id,
            movement.product_id,
            movement.reference_type,
            movement.reference_id,
            movement.quantity_in,
            movement.quantity_out,
            movement.base_quantity,
            movement.cost_price,
            movement.remark,
            movement.balance_quantity,
            movement.created_by,
            movement.session_id,
            movement.created_at,
        );

        await addSyncQueueItem(db, {
            business_id: input.business_id,
            entity_type: 'inventory_movement',
            entity_id: movement.id,
            operation: 'create',
            payload: movement,
            idempotency_key: generateIdempotencyKey(
                'create',
                movement.id,
            ),
        });
    });

    if (!result) {
        throw new Error('Failed to update inventory.');
    }

    return result;
}

/**
 * Add stock.
 *
 * Example:
 *
 * Receiving 10 units:
 *
 * await addStock(db, {
 *     ...
 *     quantity: 10,
 *     reference_type: 'stock_in',
 * });
 */
export async function addStock(
    db: SQLiteDatabase,
    input: Omit<AdjustInventoryInput, 'quantity'> & {
        quantity: number;
    },
): Promise<InventoryBalance> {
    if (input.quantity <= 0) {
        throw new Error('addStock quantity must be greater than zero.');
    }

    return adjustInventory(db, {
        ...input,
        quantity: input.quantity,
    });
}

/**
 * Remove stock.
 *
 * Example:
 *
 * Selling 3 units:
 *
 * await removeStock(db, {
 *     ...
 *     quantity: 3,
 *     reference_type: 'sale',
 * });
 */
export async function removeStock(
    db: SQLiteDatabase,
    input: Omit<AdjustInventoryInput, 'quantity'> & {
        quantity: number;
    },
): Promise<InventoryBalance> {
    if (input.quantity <= 0) {
        throw new Error(
            'removeStock quantity must be greater than zero.',
        );
    }

    return adjustInventory(db, {
        ...input,
        quantity: -input.quantity,
    });
}

/**
 * Get movement history for a product.
 */
export async function getInventoryMovements(
    db: SQLiteDatabase,
    businessId: number,
    branchId: number,
    stockId: number,
    productId: number,
): Promise<InventoryMovement[]> {
    return await db.getAllAsync<InventoryMovement>(
        `
        SELECT *
        FROM inventory_movement
        WHERE business_id = ?
          AND branch_id = ?
          AND stock_id = ?
          AND product_id = ?
        ORDER BY created_at DESC
        `,
        businessId,
        branchId,
        stockId,
        productId,
    );
}

type SyncQueueInput = {
    business_id: number;
    entity_type: string;
    entity_id: number;
    operation: string;
    payload: unknown;
    idempotency_key: string;
};

async function addSyncQueueItem(
    db: SQLiteDatabase,
    input: SyncQueueInput,
) {
    const timestamp = now();

    await db.runAsync(
        `
        INSERT INTO sync_queue (
            entity_type,
            entity_id,
            operation,
            payload,
            status,
            attempts,
            created_at,
            updated_at,
            business_id,
            idempotency_key,
            priority
        )
        VALUES (?, ?, ?, ?, 'pending', 0, ?, ?, ?, ?, ?)
        `,
        input.entity_type,
        input.entity_id,
        input.operation,
        JSON.stringify(input.payload),
        timestamp,
        timestamp,
        input.business_id,
        input.idempotency_key,
        50,
    );
}