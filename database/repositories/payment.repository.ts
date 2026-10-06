import type { SQLiteDatabase } from 'expo-sqlite';

export type PaymentTransaction = {
    id: number;
    business_id: number;
    branch_id: number;
    sale_id: number | null;
    cashier_id: number | null;
    payment_account_id: number | null;

    transaction_type: string | null;
    confirmed_manually: number;

    reference: string | null;
    type: string;
    network: string | null;
    account_number: string | null;

    amount: number;
    status: string;

    idempotency_key: string | null;

    session_id: number | null;

    created_at: string;
    updated_at: string | null;
};

export type CreatePaymentInput = {
    id?:number
    business_id: number;
    branch_id: number;

    sale_id?: number | null;

    cashier_id?: number | null;
    payment_account_id?: number | null;

    transaction_type?: string | null;

    confirmed_manually?: boolean;

    reference?: string | null;

    type: string;

    network?: string | null;
    account_number?: string | null;

    amount: number;

    status?: string;

    session_id?: number | null;
};

export type PaymentAllocation = {
    id: number;
    business_id: number;
    branch_id: number;

    payment_transaction_id: number;
    sale_id: number;
    customer_id: number | null;

    allocated_amount: number;
    allocated_amount_base: number;

    status: string;

    session_id: number | null;

    created_at: string;
    updated_at: string | null;
};

function now() {
    return new Date().toISOString();
}

function generateLocalId() {
    return -Date.now();
}

function generateIdempotencyKey(
    entity: string,
    id: number,
) {
    return `${entity}:${id}:${Date.now()}`;
}

/**
 * Create a payment locally.
 *
 * This does NOT require an internet connection.
 */
export async function createPayment(
    db: SQLiteDatabase,
    input: CreatePaymentInput,
): Promise<PaymentTransaction> {
    if (input.amount <= 0) {
        throw new Error('Payment amount must be greater than zero.');
    }

    const id = input?.id ?? generateLocalId();
    const timestamp = now();

    const payment: PaymentTransaction = {
        id,
        business_id: input.business_id,
        branch_id: input.branch_id,

        sale_id: input.sale_id ?? null,

        cashier_id: input.cashier_id ?? null,
        payment_account_id:
            input.payment_account_id ?? null,

        transaction_type:
            input.transaction_type ?? 'payment',

        confirmed_manually:
            input.confirmed_manually ? 1 : 0,

        reference: input.reference ?? null,

        type: input.type,

        network: input.network ?? null,
        account_number:
            input.account_number ?? null,

        amount: input.amount,

        status: input.status ?? 'completed',

        idempotency_key: null,

        session_id: input.session_id ?? null,

        created_at: timestamp,
        updated_at: timestamp,
    };

    payment.idempotency_key =
        generateIdempotencyKey(
            'payment',
            payment.id,
        );

    await db.withTransactionAsync(async () => {
        await db.runAsync(
            `
            INSERT INTO payment_transactions (
                id,
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
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `,
            payment.id,
            payment.business_id,
            payment.branch_id,
            payment.sale_id,
            payment.cashier_id,
            payment.payment_account_id,
            payment.transaction_type,
            payment.confirmed_manually,
            payment.reference,
            payment.type,
            payment.network,
            payment.account_number,
            payment.amount,
            payment.status,
            payment.idempotency_key,
            payment.session_id,
            payment.created_at,
            payment.updated_at,
        );

        await addSyncQueueItem(db, {
            business_id: payment.business_id,
            entity_type: 'payment_transaction',
            entity_id: payment.id,
            operation: 'create',
            payload: payment,
            idempotency_key:
                payment.idempotency_key,
        });
    });

    return payment;
}

/**
 * Get a payment by ID.
 */
export async function getPaymentById(
    db: SQLiteDatabase,
    paymentId: number,
): Promise<PaymentTransaction | null> {
    return await db.getFirstAsync<PaymentTransaction>(
        `
        SELECT *
        FROM payment_transactions
        WHERE id = ?
        LIMIT 1
        `,
        paymentId,
    );
}

/**
 * Get payments belonging to a sale.
 */
export async function getSalePayments(
    db: SQLiteDatabase,
    businessId: number,
    saleId: number,
): Promise<PaymentTransaction[]> {
    return await db.getAllAsync<PaymentTransaction>(
        `
        SELECT *
        FROM payment_transactions
        WHERE business_id = ?
          AND sale_id = ?
        ORDER BY created_at ASC
        `,
        businessId,
        saleId,
    );
}

/**
 * Get all payments for a customer through allocations.
 */
export async function getCustomerPayments(
    db: SQLiteDatabase,
    businessId: number,
    customerId: number,
): Promise<PaymentTransaction[]> {
    return await db.getAllAsync<PaymentTransaction>(
        `
        SELECT DISTINCT pt.*
        FROM payment_transactions pt
        INNER JOIN payment_allocations pa
            ON pa.payment_transaction_id = pt.id
        WHERE pt.business_id = ?
          AND pa.customer_id = ?
        ORDER BY pt.created_at DESC
        `,
        businessId,
        customerId,
    );
}

/**
 * Allocate a payment against a sale.
 *
 * This is useful for:
 *
 * - invoice payments
 * - partial payments
 * - customer credit payments
 * - allocating one payment across multiple invoices
 */
export async function allocatePayment(
    db: SQLiteDatabase,
    input: {
        business_id: number;
        branch_id: number;

        payment_transaction_id: number;
        sale_id: number;

        customer_id?: number | null;

        allocated_amount: number;
        allocated_amount_base?: number;

        session_id?: number | null;
    },
): Promise<PaymentAllocation> {
    if (input.allocated_amount <= 0) {
        throw new Error(
            'Allocated payment amount must be greater than zero.',
        );
    }

    const payment = await getPaymentById(
        db,
        input.payment_transaction_id,
    );

    if (!payment) {
        throw new Error('Payment transaction not found.');
    }

    const sale = await db.getFirstAsync<{
        id: number;
        business_id: number;
        total_amount: number;
        amount_paid: number;
        amount_due: number;
    }>(
        `
        SELECT
            id,
            business_id,
            total_amount,
            amount_paid,
            amount_due
        FROM sales
        WHERE id = ?
          AND business_id = ?
        LIMIT 1
        `,
        input.sale_id,
        input.business_id,
    );

    if (!sale) {
        throw new Error('Sale not found.');
    }

    const allocationId = generateLocalId();
    const timestamp = now();

    const allocatedAmountBase =
        input.allocated_amount_base ??
        input.allocated_amount;

    let allocation: PaymentAllocation;

    await db.withTransactionAsync(async () => {
        /*
         * Calculate how much of this payment has
         * already been allocated.
         */
        const existingAllocation =
            await db.getFirstAsync<{
                total: number | null;
            }>(
                `
                SELECT SUM(allocated_amount) AS total
                FROM payment_allocations
                WHERE payment_transaction_id = ?
                  AND status = 'active'
                `,
                payment.id,
            );

        const alreadyAllocated =
            existingAllocation?.total ?? 0;

        const remainingPayment =
            payment.amount - alreadyAllocated;

        if (
            input.allocated_amount >
            remainingPayment
        ) {
            throw new Error(
                `Payment allocation exceeds remaining payment amount. Remaining: ${remainingPayment}`,
            );
        }

        /*
         * Do not allocate more than the invoice balance.
         */
        if (
            input.allocated_amount >
            sale.amount_due
        ) {
            throw new Error(
                `Payment allocation exceeds invoice balance. Due: ${sale.amount_due}`,
            );
        }

        allocation = {
            id: allocationId,

            business_id: input.business_id,
            branch_id: input.branch_id,

            payment_transaction_id:
                payment.id,

            sale_id: input.sale_id,

            customer_id:
                input.customer_id ?? null,

            allocated_amount:
                input.allocated_amount,

            allocated_amount_base:
                allocatedAmountBase,

            status: 'active',

            session_id:
                input.session_id ?? null,

            created_at: timestamp,
            updated_at: timestamp,
        };

        await db.runAsync(
            `
            INSERT INTO payment_allocations (
                id,
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
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `,
            allocation.id,
            allocation.business_id,
            allocation.branch_id,
            allocation.payment_transaction_id,
            allocation.sale_id,
            allocation.customer_id,
            allocation.allocated_amount,
            allocation.allocated_amount_base,
            allocation.status,
            allocation.session_id,
            allocation.created_at,
            allocation.updated_at,
        );

        /*
         * Update the local sale immediately.
         */
        const newAmountPaid =
            sale.amount_paid +
            input.allocated_amount;

        const newAmountDue = Math.max(
            sale.total_amount - newAmountPaid,
            0,
        );

        const paymentStatus =
            newAmountDue <= 0
                ? 'paid'
                : newAmountPaid > 0
                    ? 'partial'
                    : 'unpaid';

        await db.runAsync(
            `
            UPDATE sales
            SET
                amount_paid = ?,
                amount_due = ?,
                payment_status = ?,
                updated_at = ?
            WHERE id = ?
              AND business_id = ?
            `,
            newAmountPaid,
            newAmountDue,
            paymentStatus,
            timestamp,
            sale.id,
            input.business_id,
        );

        /*
         * Queue allocation for server synchronization.
         */
        await addSyncQueueItem(db, {
            business_id: input.business_id,
            entity_type: 'payment_allocation',
            entity_id: allocation.id,
            operation: 'create',
            payload: allocation,
            idempotency_key:
                generateIdempotencyKey(
                    'payment_allocation',
                    allocation.id,
                ),
        });

        /*
         * Queue the sale update as well.
         */
        await addSyncQueueItem(db, {
            business_id: input.business_id,
            entity_type: 'sale',
            entity_id: sale.id,
            operation: 'update_payment_status',
            payload: {
                sale_id: sale.id,
                amount_paid: newAmountPaid,
                amount_due: newAmountDue,
                payment_status: paymentStatus,
            },
            idempotency_key:
                generateIdempotencyKey(
                    'sale_payment_status',
                    sale.id,
                ),
        });
    });

    return allocation!;
}

/**
 * Calculate how much has been paid against a sale
 * using allocations rather than trusting a cached value.
 */
export async function getSaleAllocatedAmount(
    db: SQLiteDatabase,
    businessId: number,
    saleId: number,
): Promise<number> {
    const result = await db.getFirstAsync<{
        total: number | null;
    }>(
        `
        SELECT SUM(allocated_amount) AS total
        FROM payment_allocations
        WHERE business_id = ?
          AND sale_id = ?
          AND status = 'active'
        `,
        businessId,
        saleId,
    );

    return result?.total ?? 0;
}

/**
 * Get the remaining unallocated amount
 * on a payment transaction.
 */
export async function getPaymentRemainingAmount(
    db: SQLiteDatabase,
    paymentId: number,
): Promise<number> {
    const payment = await getPaymentById(
        db,
        paymentId,
    );

    if (!payment) {
        throw new Error('Payment transaction not found.');
    }

    const allocated =
        await db.getFirstAsync<{
            total: number | null;
        }>(
            `
            SELECT SUM(allocated_amount) AS total
            FROM payment_allocations
            WHERE payment_transaction_id = ?
              AND status = 'active'
            `,
            paymentId,
        );

    const totalAllocated =
        allocated?.total ?? 0;

    return Math.max(
        payment.amount - totalAllocated,
        0,
    );
}

/**
 * Get payment accounts available to the POS.
 */
export async function getPaymentAccounts(
    db: SQLiteDatabase,
    businessId: number,
    branchId: number,
): Promise<Array<{
    id: number;
    business_id: number;
    branch_id: number;
    name: string;
    type: string;
    currency_id: number | null;
    account_number: string | null;
    provider: string | null;
    status: string;
    created_at: string;
    updated_at: string | null;
}>> {
    return await db.getAllAsync(
        `
        SELECT *
        FROM payment_accounts
        WHERE business_id = ?
          AND branch_id = ?
          AND status = 'active'
        ORDER BY name COLLATE NOCASE ASC
        `,
        businessId,
        branchId,
    );
}

type SyncQueueInput = {
    business_id: number;
    entity_type: string;
    entity_id: number;
    operation: string;
    payload: unknown;
    idempotency_key: string | null;
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
        40,
    );
}
