import type { SQLiteDatabase } from 'expo-sqlite';

/* -------------------------------------------------------------------------- */
/* Types                                                                      */
/* -------------------------------------------------------------------------- */

export type SaleItemInput = {
    productId: number;
    productUomId: number;
    quantity: number;
    sellingPrice: number;
};

export type SalePaymentInput = {
    paymentAccountId?: number | null;
    type: string;
    transactionType?: string | null;
    reference?: string | null;
    network?: string | null;
    accountNumber?: string | null;
    amount: number;
    confirmedManually?: boolean;
};

export type CreateSaleInput = {
    businessId: number;
    branchId: number;
    stockId: number;

    customerId?: number | null;

    referenceNumber: string;
    saleDate?: string;

    currencyId?: number | null;
    currencySnapshotId?: number | null;

    documentType?: string;

    discountAmount?: number;
    taxAmount?: number;

    remarks?: string | null;

    sessionId?: number | null;

    items: SaleItemInput[];

    payments?: SalePaymentInput[];
};

export type Sale = {
    id: number;

    business_id: number;
    branch_id: number;
    stock_id: number;
    customer_id: number | null;

    reference_number: string;
    sale_date: string;

    currency_id: number | null;
    currency_snapshot_id: number | null;

    document_type: string;
    document_status: string;
    payment_status: string;
    fulfillment_status: string;

    subtotal_amount: number;
    discount_amount: number;
    tax_amount: number;
    total_amount: number;

    subtotal_amount_base: number;
    discount_amount_base: number;
    tax_amount_base: number;
    total_amount_base: number;

    amount_paid: number;
    amount_paid_base: number;
    amount_due: number;
    amount_due_base: number;

    tax_snapshot: string | null;
    remarks: string | null;
    status: string | null;

    session_id: number | null;

    created_at: string;
    updated_at: string | null;
};

export type SaleItem = {
    id: number;

    business_id: number;
    sales_id: number;
    product_id: number;
    product_uom_id: number;

    quantity: number;
    selling_price: number;
    total_amount: number;
    total_amount_base: number;

    status: string | null;
    created_at: string;
};

export type SaleWithItems = {
    sale: Sale;
    items: SaleItem[];
};

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

function roundMoney(value: number): number {
    return Math.round((value + Number.EPSILON) * 100) / 100;
}

function now(): string {
    return new Date().toISOString();
}

function createIdempotencyKey(
    type: string,
    id: number,
): string {
    return `${type}:${id}:${Date.now()}:${Math.random()
        .toString(36)
        .slice(2)}`;
}

function getPaymentStatus(
    total: number,
    paid: number,
): string {
    if (paid <= 0) {
        return 'unpaid';
    }

    if (paid >= total) {
        return 'paid';
    }

    return 'partial';
}

function assertPositiveInteger(
    value: number,
    name: string,
): void {
    if (!Number.isInteger(value) || value <= 0) {
        throw new Error(`${name} must be a positive integer.`);
    }
}

/* -------------------------------------------------------------------------- */
/* Create Sale                                                                */
/* -------------------------------------------------------------------------- */

export async function createSale(
    db: SQLiteDatabase,
    input: CreateSaleInput,
): Promise<SaleWithItems> {
    assertPositiveInteger(input.businessId, 'businessId');
    assertPositiveInteger(input.branchId, 'branchId');
    assertPositiveInteger(input.stockId, 'stockId');

    if (!input.referenceNumber.trim()) {
        throw new Error('Sale reference number is required.');
    }

    if (!input.items.length) {
        throw new Error('A sale must contain at least one item.');
    }

    for (const item of input.items) {
        assertPositiveInteger(item.productId, 'productId');
        assertPositiveInteger(item.productUomId, 'productUomId');

        if (item.quantity <= 0) {
            throw new Error(
                `Quantity for product ${item.productId} must be greater than zero.`,
            );
        }

        if (item.sellingPrice < 0) {
            throw new Error(
                `Selling price for product ${item.productId} cannot be negative.`,
            );
        }
    }

    const createdAt = now();

    const discountAmount = roundMoney(
        input.discountAmount ?? 0,
    );

    const taxAmount = roundMoney(
        input.taxAmount ?? 0,
    );

    const subtotalAmount = roundMoney(
        input.items.reduce(
            (total, item) =>
                total +
                item.quantity *
                    item.sellingPrice,
            0,
        ),
    );

    if (discountAmount < 0) {
        throw new Error(
            'Discount cannot be negative.',
        );
    }

    if (taxAmount < 0) {
        throw new Error(
            'Tax cannot be negative.',
        );
    }

    if (discountAmount > subtotalAmount) {
        throw new Error(
            'Discount cannot be greater than subtotal.',
        );
    }

    const totalAmount = roundMoney(
        subtotalAmount -
            discountAmount +
            taxAmount,
    );

    if (totalAmount < 0) {
        throw new Error(
            'Sale total cannot be negative.',
        );
    }

    const payments = input.payments ?? [];

    for (const payment of payments) {
        if (payment.amount <= 0) {
            throw new Error(
                'Payment amount must be greater than zero.',
            );
        }
    }

    const amountPaid = roundMoney(
        payments.reduce(
            (sum, payment) =>
                sum + payment.amount,
            0,
        ),
    );

    if (amountPaid > totalAmount) {
        throw new Error(
            'Payment amount cannot exceed the sale total.',
        );
    }

    const amountDue = roundMoney(
        Math.max(
            totalAmount - amountPaid,
            0,
        ),
    );

    const paymentStatus = getPaymentStatus(
        totalAmount,
        amountPaid,
    );

    let saleId = 0;

    await db.withTransactionAsync(async () => {
        /* ------------------------------------------------------------------ */
        /* Validate stock and products                                        */
        /* ------------------------------------------------------------------ */

        for (const item of input.items) {
            const product = await db.getFirstAsync<{
                id: number;
                status: string | null;
            }>(
                `
                SELECT id, status
                FROM product
                WHERE id = ?
                  AND business_id = ?
                `,
                item.productId,
                input.businessId,
            );

            if (!product) {
                throw new Error(
                    `Product ${item.productId} does not exist.`,
                );
            }

            if (
                product.status &&
                product.status !== 'active'
            ) {
                throw new Error(
                    `Product ${item.productId} is not active.`,
                );
            }

            const productUom =
                await db.getFirstAsync<{
                    id: number;
                    product_id: number;
                    status: string | null;
                }>(
                    `
                    SELECT
                        id,
                        product_id,
                        status
                    FROM product_uom
                    WHERE id = ?
                      AND business_id = ?
                    `,
                    item.productUomId,
                    input.businessId,
                );

            if (!productUom) {
                throw new Error(
                    `Product UOM ${item.productUomId} does not exist.`,
                );
            }

            if (
                productUom.product_id !==
                item.productId
            ) {
                throw new Error(
                    `Product UOM ${item.productUomId} does not belong to product ${item.productId}.`,
                );
            }
        }

        /* ------------------------------------------------------------------ */
        /* Create sale                                                         */
        /* ------------------------------------------------------------------ */

        const saleResult =
            await db.runAsync(
                `
                INSERT INTO sales (
                    business_id,
                    branch_id,
                    stock_id,
                    customer_id,

                    reference_number,
                    sale_date,

                    currency_id,
                    currency_snapshot_id,

                    document_type,
                    document_status,
                    payment_status,
                    fulfillment_status,

                    subtotal_amount,
                    discount_amount,
                    tax_amount,
                    total_amount,

                    subtotal_amount_base,
                    discount_amount_base,
                    tax_amount_base,
                    total_amount_base,

                    amount_paid,
                    amount_paid_base,
                    amount_due,
                    amount_due_base,

                    remarks,
                    status,

                    session_id,
                    created_at,
                    updated_at
                )
                VALUES (
                    ?, ?, ?, ?,
                    ?, ?,
                    ?, ?,
                    ?, 'confirmed', ?, 'fulfilled',
                    ?, ?, ?, ?,
                    ?, ?, ?, ?,
                    ?, ?, ?, ?,
                    ?, 'active',
                    ?, ?, ?
                )
                `,
                input.businessId,
                input.branchId,
                input.stockId,
                input.customerId ?? null,

                input.referenceNumber,
                input.saleDate ?? createdAt,

                input.currencyId ?? null,
                input.currencySnapshotId ?? null,

                input.documentType ?? 'invoice',
                paymentStatus,

                subtotalAmount,
                discountAmount,
                taxAmount,
                totalAmount,

                subtotalAmount,
                discountAmount,
                taxAmount,
                totalAmount,

                amountPaid,
                amountPaid,
                amountDue,
                amountDue,

                input.remarks ?? null,

                input.sessionId ?? null,
                createdAt,
                createdAt,
            );

        saleId =
            Number(saleResult.lastInsertRowId);

        /* ------------------------------------------------------------------ */
        /* Create sale items                                                   */
        /* ------------------------------------------------------------------ */

        for (const item of input.items) {
            const itemTotal = roundMoney(
                item.quantity *
                    item.sellingPrice,
            );

            const itemResult =
                await db.runAsync(
                    `
                    INSERT INTO sales_item (
                        business_id,
                        sales_id,
                        product_id,
                        product_uom_id,

                        quantity,
                        selling_price,
                        total_amount,
                        total_amount_base,

                        status,
                        created_at
                    )
                    VALUES (
                        ?, ?, ?, ?,
                        ?, ?, ?, ?,
                        'active', ?
                    )
                    `,
                    input.businessId,
                    saleId,
                    item.productId,
                    item.productUomId,

                    item.quantity,
                    item.sellingPrice,
                    itemTotal,
                    itemTotal,

                    createdAt,
                );

            const saleItemId =
                Number(
                    itemResult.lastInsertRowId,
                );

            /* -------------------------------------------------------------- */
            /* Update stock                                                    */
            /* -------------------------------------------------------------- */

            const balance =
                await db.getFirstAsync<{
                    id: number;
                    base_quantity: number;
                }>(
                    `
                    SELECT
                        id,
                        base_quantity
                    FROM product_stock_balance
                    WHERE business_id = ?
                      AND branch_id = ?
                      AND stock_id = ?
                      AND product_id = ?
                    `,
                    input.businessId,
                    input.branchId,
                    input.stockId,
                    item.productId,
                );

            if (!balance) {
                throw new Error(
                    `No stock balance exists for product ${item.productId}.`,
                );
            }

            const currentQuantity =
                Number(
                    balance.base_quantity ?? 0,
                );

            /*
             * IMPORTANT:
             *
             * We assume the incoming quantity is
             * already in the product's base UOM.
             *
             * If your system supports UOM conversion,
             * convert the quantity here before updating
             * inventory.
             */
            const outgoingQuantity =
                item.quantity;

            const newBalance =
                roundMoney(
                    currentQuantity -
                        outgoingQuantity,
                );

            if (newBalance < 0) {
                throw new Error(
                    `Insufficient stock for product ${item.productId}. Available: ${currentQuantity}, requested: ${outgoingQuantity}.`,
                );
            }

            await db.runAsync(
                `
                UPDATE product_stock_balance
                SET
                    base_quantity = ?,
                    updated_at = ?
                WHERE id = ?
                `,
                newBalance,
                createdAt,
                balance.id,
            );

            /* -------------------------------------------------------------- */
            /* Inventory movement                                              */
            /* -------------------------------------------------------------- */

            await db.runAsync(
                `
                INSERT INTO inventory_movement (
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
                VALUES (
                    ?, ?, ?, ?,
                    'sale', ?,
                    0, ?, ?,
                    0,
                    ?,
                    ?,
                    NULL,
                    ?,
                    ?
                )
                `,
                input.businessId,
                input.branchId,
                input.stockId,
                item.productId,

                saleId,

                outgoingQuantity,
                -outgoingQuantity,

                `Sale ${input.referenceNumber}`,

                newBalance,

                input.sessionId ?? null,
                createdAt,
            );

            /* -------------------------------------------------------------- */
            /* FIFO batch consumption                                          */
            /* -------------------------------------------------------------- */

            let remaining =
                outgoingQuantity;

            const batches =
                await db.getAllAsync<{
                    id: number;
                    stock_in_id: number;
                    product_id: number;
                    remaining_quantity: number;
                    cost_price: number;
                    batch_number: string | null;
                }>(
                    `
                    SELECT
                        id,
                        stock_in_id,
                        product_id,
                        remaining_quantity,
                        cost_price,
                        batch_number
                    FROM stock_in_item
                    WHERE business_id = ?
                      AND product_id = ?
                      AND remaining_quantity > 0
                      AND status = 'active'
                    ORDER BY
                        COALESCE(expiry_date, '9999-12-31') ASC,
                        id ASC
                    `,
                    input.businessId,
                    item.productId,
                );

            for (const batch of batches) {
                if (remaining <= 0) {
                    break;
                }

                const available =
                    Number(
                        batch.remaining_quantity,
                    );

                const consumed =
                    Math.min(
                        remaining,
                        available,
                    );

                if (consumed <= 0) {
                    continue;
                }

                const newRemaining =
                    roundMoney(
                        available -
                            consumed,
                    );

                const totalCost =
                    roundMoney(
                        consumed *
                            Number(
                                batch.cost_price ??
                                    0,
                            ),
                    );

                await db.runAsync(
                    `
                    UPDATE stock_in_item
                    SET
                        remaining_quantity = ?
                    WHERE id = ?
                    `,
                    newRemaining,
                    batch.id,
                );

                await db.runAsync(
                    `
                    INSERT INTO sale_batch_consumption (
                        business_id,
                        branch_id,

                        sale_id,
                        sale_item_id,

                        stock_in_id,
                        stock_in_item_id,

                        product_id,

                        quantity,
                        cost_price,
                        total_cost,

                        status,
                        session_id,
                        created_at
                    )
                    VALUES (
                        ?, ?,
                        ?, ?,
                        ?, ?,
                        ?,
                        ?, ?, ?,
                        'active',
                        ?, ?
                    )
                    `,
                    input.businessId,
                    input.branchId,

                    saleId,
                    saleItemId,

                    batch.stock_in_id,
                    batch.id,

                    item.productId,

                    consumed,
                    batch.cost_price ?? 0,
                    totalCost,

                    input.sessionId ??
                        null,
                    createdAt,
                );

                remaining =
                    roundMoney(
                        remaining -
                            consumed,
                    );
            }

            if (remaining > 0) {
                throw new Error(
                    `Insufficient batch inventory for product ${item.productId}. Remaining: ${remaining}.`,
                );
            }
        }

        /* ------------------------------------------------------------------ */
        /* Payments                                                            */
        /* ------------------------------------------------------------------ */

        for (const payment of payments) {
            const idempotencyKey =
                createIdempotencyKey(
                    'payment',
                    saleId,
                );

            const paymentResult =
                await db.runAsync(
                    `
                    INSERT INTO payment_transactions (
                        business_id,
                        branch_id,
                        sale_id,
                        cashier_id,

                        payment_account_id,

                        transaction_type,
                        confirmed_manually,

                        reference,
                        type,
                        network,
                        account_number,

                        amount,

                        status,

                        idempotency_key,

                        session_id,
                        created_at,
                        updated_at
                    )
                    VALUES (
                        ?, ?, ?, NULL,
                        ?,
                        ?, ?,
                        ?, ?, ?, ?,
                        ?,
                        'confirmed',
                        ?,
                        ?,
                        ?, ?
                    )
                    `,
                    input.businessId,
                    input.branchId,
                    saleId,

                    payment.paymentAccountId ??
                        null,

                    payment.transactionType ??
                        'sale_payment',

                    payment.confirmedManually
                        ? 1
                        : 0,

                    payment.reference ??
                        null,

                    payment.type,

                    payment.network ??
                        null,

                    payment.accountNumber ??
                        null,

                    payment.amount,

                    idempotencyKey,

                    input.sessionId ??
                        null,

                    createdAt,
                    createdAt,
                );

            const paymentId =
                Number(
                    paymentResult.lastInsertRowId,
                );

            /* -------------------------------------------------------------- */
            /* Payment allocation                                               */
            /* -------------------------------------------------------------- */

            await db.runAsync(
                `
                INSERT INTO payment_allocations (
                    business_id,
                    branch_id,

                    payment_transaction_id,
                    sale_id,
                    customer_id,

                    allocated_amount,
                    allocated_amount_base,

                    status,

                    session_id,
                    created_at,
                    updated_at
                )
                VALUES (
                    ?, ?,
                    ?, ?, ?,
                    ?, ?,
                    'active',
                    ?, ?, ?
                )
                `,
                input.businessId,
                input.branchId,

                paymentId,
                saleId,
                input.customerId ??
                    null,

                payment.amount,
                payment.amount,

                input.sessionId ??
                    null,

                createdAt,
                createdAt,
            );

            /* -------------------------------------------------------------- */
            /* Queue payment synchronization                                    */
            /* -------------------------------------------------------------- */

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
                    updated_at
                )
                VALUES (
                    ?,
                    ?,
                    ?,
                    ?,
                    'pending',
                    0,
                    ?,
                    ?
                )
                `,
                'payment_transaction',
                paymentId,
                'create',
                JSON.stringify({
                    paymentId,
                    saleId,
                    businessId:
                        input.businessId,
                    branchId:
                        input.branchId,
                }),
                createdAt,
                createdAt,
            );
        }

        /* ------------------------------------------------------------------ */
        /* Customer balance                                                    */
        /* ------------------------------------------------------------------ */

        if (input.customerId) {
            const existingBalance =
                await db.getFirstAsync<{
                    id: number;
                    total_invoiced: number;
                    total_paid: number;
                    total_credit: number;
                    total_due: number;
                }>(
                    `
                    SELECT
                        id,
                        total_invoiced,
                        total_paid,
                        total_credit,
                        total_due
                    FROM customer_balance
                    WHERE business_id = ?
                      AND customer_id = ?
                      AND (
                          currency_id = ?
                          OR (
                              currency_id IS NULL
                              AND ? IS NULL
                          )
                      )
                    `,
                    input.businessId,
                    input.customerId,
                    input.currencyId ??
                        null,
                    input.currencyId ??
                        null,
                );

            if (existingBalance) {
                await db.runAsync(
                    `
                    UPDATE customer_balance
                    SET
                        total_invoiced = ?,
                        total_paid = ?,
                        total_due = ?,
                        updated_at = ?
                    WHERE id = ?
                    `,
                    roundMoney(
                        Number(
                            existingBalance.total_invoiced ??
                                0,
                        ) +
                            totalAmount,
                    ),

                    roundMoney(
                        Number(
                            existingBalance.total_paid ??
                                0,
                        ) +
                            amountPaid,
                    ),

                    roundMoney(
                        Number(
                            existingBalance.total_due ??
                                0,
                        ) +
                            amountDue,
                    ),

                    createdAt,
                    existingBalance.id,
                );
            } else {
                await db.runAsync(
                    `
                    INSERT INTO customer_balance (
                        business_id,
                        customer_id,
                        currency_id,

                        total_invoiced,
                        total_paid,
                        total_credit,
                        total_due,

                        updated_at
                    )
                    VALUES (
                        ?, ?, ?,
                        ?, ?, 0, ?,
                        ?
                    )
                    `,
                    input.businessId,
                    input.customerId,
                    input.currencyId ??
                        null,

                    totalAmount,
                    amountPaid,
                    amountDue,

                    createdAt,
                );
            }
        }

        /* ------------------------------------------------------------------ */
        /* Queue complete sale synchronization                                 */
        /* ------------------------------------------------------------------ */

        const idempotencyKey =
            createIdempotencyKey(
                'sale',
                saleId,
            );

        await db.runAsync(
            `
            INSERT INTO sync_queue (
                business_id,
                branch_id,
                device_id,

                entity_type,
                entity_id,

                operation,
                payload,

                status,
                attempts,

                idempotency_key,

                created_at,
                updated_at
            )
            VALUES (
                ?, ?, NULL,
                ?, ?,
                ?, ?,
                'pending', 0,
                ?,
                ?, ?
            )
            `,
            input.businessId,
            input.branchId,

            'sale',
            saleId,

            'create',

            JSON.stringify({
                saleId,
                businessId:
                    input.businessId,
                branchId:
                    input.branchId,
                stockId:
                    input.stockId,
                customerId:
                    input.customerId ??
                    null,
                referenceNumber:
                    input.referenceNumber,
            }),

            idempotencyKey,

            createdAt,
            createdAt,
        );
    });

    const result =
        await getSaleWithItems(
            db,
            saleId,
        );

    if (!result) {
        throw new Error(
            'Sale was created but could not be loaded.',
        );
    }

    return result;
}

/* -------------------------------------------------------------------------- */
/* Get Sale                                                                   */
/* -------------------------------------------------------------------------- */

export async function getSale(
    db: SQLiteDatabase,
    saleId: number,
): Promise<Sale | null> {
    return db.getFirstAsync<Sale>(
        `
        SELECT *
        FROM sales
        WHERE id = ?
        `,
        saleId,
    );
}

/* -------------------------------------------------------------------------- */
/* Get Sale With Items                                                        */
/* -------------------------------------------------------------------------- */

export async function getSaleWithItems(
    db: SQLiteDatabase,
    saleId: number,
): Promise<SaleWithItems | null> {
    const sale =
        await getSale(
            db,
            saleId,
        );

    if (!sale) {
        return null;
    }

    const items =
        await db.getAllAsync<SaleItem>(
            `
            SELECT *
            FROM sales_item
            WHERE sales_id = ?
            ORDER BY id ASC
            `,
            saleId,
        );

    return {
        sale,
        items,
    };
}

/* -------------------------------------------------------------------------- */
/* List Sales                                                                 */
/* -------------------------------------------------------------------------- */

export async function getSales(
    db: SQLiteDatabase,
    businessId: number,
    branchId: number,
    options?: {
        limit?: number;
        offset?: number;
        customerId?: number;
        status?: string;
    },
): Promise<Sale[]> {
    const limit =
        options?.limit ?? 50;

    const offset =
        options?.offset ?? 0;

    const conditions = [
        'business_id = ?',
        'branch_id = ?',
    ];

    const params: Array<
        number | string
    > = [
        businessId,
        branchId,
    ];

    if (
        options?.customerId !==
        undefined
    ) {
        conditions.push(
            'customer_id = ?',
        );

        params.push(
            options.customerId,
        );
    }

    if (options?.status) {
        conditions.push(
            'status = ?',
        );

        params.push(
            options.status,
        );
    }

    params.push(limit);
    params.push(offset);

    return db.getAllAsync<Sale>(
        `
        SELECT *
        FROM sales
        WHERE ${conditions.join(
            ' AND ',
        )}
        ORDER BY sale_date DESC, id DESC
        LIMIT ?
        OFFSET ?
        `,
        ...params,
    );
}

/* -------------------------------------------------------------------------- */
/* Void Sale                                                                  */
/* -------------------------------------------------------------------------- */

export async function voidSale(
    db: SQLiteDatabase,
    saleId: number,
    sessionId?: number | null,
): Promise<void> {
    const createdAt = now();

    await db.withTransactionAsync(
        async () => {
            const sale =
                await db.getFirstAsync<Sale>(
                    `
                    SELECT *
                    FROM sales
                    WHERE id = ?
                    `,
                    saleId,
                );

            if (!sale) {
                throw new Error(
                    'Sale not found.',
                );
            }

            if (
                sale.document_status ===
                'voided'
            ) {
                return;
            }

            const items =
                await db.getAllAsync<SaleItem>(
                    `
                    SELECT *
                    FROM sales_item
                    WHERE sales_id = ?
                      AND status = 'active'
                    `,
                    saleId,
                );

            /* -------------------------------------------------------------- */
            /* Restore stock                                                    */
            /* -------------------------------------------------------------- */

            for (const item of items) {
                const balance =
                    await db.getFirstAsync<{
                        id: number;
                        base_quantity: number;
                    }>(
                        `
                        SELECT
                            id,
                            base_quantity
                        FROM product_stock_balance
                        WHERE business_id = ?
                          AND branch_id = ?
                          AND stock_id = ?
                          AND product_id = ?
                        `,
                        sale.business_id,
                        sale.branch_id,
                        sale.stock_id,
                        item.product_id,
                    );

                if (!balance) {
                    throw new Error(
                        `Stock balance not found for product ${item.product_id}.`,
                    );
                }

                const restoredBalance =
                    roundMoney(
                        Number(
                            balance.base_quantity ??
                                0,
                        ) +
                            item.quantity,
                    );

                await db.runAsync(
                    `
                    UPDATE product_stock_balance
                    SET
                        base_quantity = ?,
                        updated_at = ?
                    WHERE id = ?
                    `,
                    restoredBalance,
                    createdAt,
                    balance.id,
                );

                await db.runAsync(
                    `
                    INSERT INTO inventory_movement (
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
                    VALUES (
                        ?, ?, ?, ?,
                        'sale_void',
                        ?,
                        ?, 0, ?,
                        0,
                        ?,
                        ?,
                        NULL,
                        ?,
                        ?
                    )
                    `,
                    sale.business_id,
                    sale.branch_id,
                    sale.stock_id,
                    item.product_id,

                    saleId,

                    item.quantity,
                    item.quantity,

                    `Void sale ${sale.reference_number}`,

                    restoredBalance,

                    sessionId ??
                        sale.session_id ??
                        null,

                    createdAt,
                );
            }

            /* -------------------------------------------------------------- */
            /* Restore consumed batches                                        */
            /* -------------------------------------------------------------- */

            const consumptions =
                await db.getAllAsync<{
                    stock_in_item_id: number;
                    quantity: number;
                }>(
                    `
                    SELECT
                        stock_in_item_id,
                        quantity
                    FROM sale_batch_consumption
                    WHERE sale_id = ?
                      AND status = 'active'
                    `,
                    saleId,
                );

            for (const consumption of consumptions) {
                await db.runAsync(
                    `
                    UPDATE stock_in_item
                    SET
                        remaining_quantity =
                            remaining_quantity + ?
                    WHERE id = ?
                    `,
                    consumption.quantity,
                    consumption.stock_in_item_id,
                );
            }

            await db.runAsync(
                `
                UPDATE sale_batch_consumption
                SET status = 'voided'
                WHERE sale_id = ?
                  AND status = 'active'
                `,
                saleId,
            );

            /* -------------------------------------------------------------- */
            /* Void sale items                                                  */
            /* -------------------------------------------------------------- */

            await db.runAsync(
                `
                UPDATE sales_item
                SET status = 'voided'
                WHERE sales_id = ?
                `,
                saleId,
            );

            /* -------------------------------------------------------------- */
            /* Void payments                                                    */
            /* -------------------------------------------------------------- */

            await db.runAsync(
                `
                UPDATE payment_transactions
                SET
                    status = 'voided',
                    updated_at = ?
                WHERE sale_id = ?
                  AND status = 'confirmed'
                `,
                createdAt,
                saleId,
            );

            await db.runAsync(
                `
                UPDATE payment_allocations
                SET
                    status = 'voided',
                    updated_at = ?
                WHERE sale_id = ?
                  AND status = 'active'
                `,
                createdAt,
                saleId,
            );

            /* -------------------------------------------------------------- */
            /* Update customer balance                                          */
            /* -------------------------------------------------------------- */

            if (sale.customer_id) {
                const balance =
                    await db.getFirstAsync<{
                        id: number;
                        total_invoiced: number;
                        total_paid: number;
                        total_due: number;
                    }>(
                        `
                        SELECT
                            id,
                            total_invoiced,
                            total_paid,
                            total_due
                        FROM customer_balance
                        WHERE business_id = ?
                          AND customer_id = ?
                          AND (
                              currency_id = ?
                              OR (
                                  currency_id IS NULL
                                  AND ? IS NULL
                              )
                          )
                        `,
                        sale.business_id,
                        sale.customer_id,
                        sale.currency_id ??
                            null,
                        sale.currency_id ??
                            null,
                    );

                if (balance) {
                    await db.runAsync(
                        `
                        UPDATE customer_balance
                        SET
                            total_invoiced = ?,
                            total_paid = ?,
                            total_due = ?,
                            updated_at = ?
                        WHERE id = ?
                        `,
                        Math.max(
                            0,
                            roundMoney(
                                Number(
                                    balance.total_invoiced ??
                                        0,
                                ) -
                                    sale.total_amount,
                            ),
                        ),

                        Math.max(
                            0,
                            roundMoney(
                                Number(
                                    balance.total_paid ??
                                        0,
                                ) -
                                    sale.amount_paid,
                            ),
                        ),

                        Math.max(
                            0,
                            roundMoney(
                                Number(
                                    balance.total_due ??
                                        0,
                                ) -
                                    sale.amount_due,
                            ),
                        ),

                        createdAt,
                        balance.id,
                    );
                }
            }

            /* -------------------------------------------------------------- */
            /* Update sale                                                      */
            /* -------------------------------------------------------------- */

            await db.runAsync(
                `
                UPDATE sales
                SET
                    document_status = 'voided',
                    payment_status = 'unpaid',
                    fulfillment_status = 'cancelled',
                    status = 'voided',
                    updated_at = ?
                WHERE id = ?
                `,
                createdAt,
                saleId,
            );

            /* -------------------------------------------------------------- */
            /* Queue void                                                       */
            /* -------------------------------------------------------------- */

            await db.runAsync(
                `
                INSERT INTO sync_queue (
                    business_id,
                    branch_id,
                    entity_type,
                    entity_id,
                    operation,
                    payload,
                    status,
                    attempts,
                    idempotency_key,
                    created_at,
                    updated_at
                )
                VALUES (
                    ?, ?,
                    'sale',
                    ?,
                    'void',
                    ?,
                    'pending',
                    0,
                    ?,
                    ?,
                    ?
                )
                `,
                sale.business_id,
                sale.branch_id,

                saleId,

                JSON.stringify({
                    saleId,
                    businessId:
                        sale.business_id,
                    branchId:
                        sale.branch_id,
                    reason: 'voided',
                }),

                createIdempotencyKey(
                    'sale_void',
                    saleId,
                ),

                createdAt,
                createdAt,
            );
        },
    );
}

/* -------------------------------------------------------------------------- */
/* Get Customer Balance                                                       */
/* -------------------------------------------------------------------------- */

export async function getCustomerBalance(
    db: SQLiteDatabase,
    businessId: number,
    customerId: number,
    currencyId?: number | null,
) {
    return db.getFirstAsync<{
        id: number;
        business_id: number;
        customer_id: number;
        currency_id: number | null;

        total_invoiced: number;
        total_paid: number;
        total_credit: number;
        total_due: number;

        updated_at: string;
    }>(
        `
        SELECT *
        FROM customer_balance
        WHERE business_id = ?
          AND customer_id = ?
          AND (
              currency_id = ?
              OR (
                  currency_id IS NULL
                  AND ? IS NULL
              )
          )
        `,
        businessId,
        customerId,
        currencyId ?? null,
        currencyId ?? null,
    );
}
