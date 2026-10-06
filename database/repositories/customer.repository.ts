import type { SQLiteDatabase } from 'expo-sqlite';

export type Customer = {
    id: number;
    business_id: number;
    customer_code: string | null;
    customer_name: string | null;
    customer_type: string | null;
    phone_number: string | null;
    email: string | null;
    address: string | null;
    tax_number: string | null;
    credit_limit: number;
    status: string | null;
    created_at: string;
    updated_at: string | null;
};

export type CreateCustomerInput = {
    id?: number;
    business_id: number;
    customer_code?: string | null;
    customer_name?: string | null;
    customer_type?: string | null;
    phone_number?: string | null;
    email?: string | null;
    address?: string | null;
    tax_number?: string | null;
    credit_limit?: number;
    status?: string | null;
};

export type UpdateCustomerInput = Partial<
    Omit<CreateCustomerInput, 'business_id' | 'id'>
>;

function now() {
    return new Date().toISOString();
}

function generateLocalId() {
    return -Date.now();
}

function generateIdempotencyKey(
    operation: string,
    entityId: number,
) {
    return `customer:${operation}:${entityId}:${Date.now()}`;
}

export async function createCustomer(
    db: SQLiteDatabase,
    input: CreateCustomerInput,
): Promise<Customer> {
    const id = input.id ?? generateLocalId();
    const timestamp = now();

    const customer: Customer = {
        id,
        business_id: input.business_id,
        customer_code: input.customer_code ?? null,
        customer_name: input.customer_name ?? null,
        customer_type: input.customer_type ?? null,
        phone_number: input.phone_number ?? null,
        email: input.email ?? null,
        address: input.address ?? null,
        tax_number: input.tax_number ?? null,
        credit_limit: input.credit_limit ?? 0,
        status: input.status ?? 'active',
        created_at: timestamp,
        updated_at: timestamp,
    };

    await db.withTransactionAsync(async () => {
        await db.runAsync(
            `
            INSERT INTO customer (
                id,
                business_id,
                customer_code,
                customer_name,
                customer_type,
                phone_number,
                email,
                address,
                tax_number,
                credit_limit,
                status,
                created_at,
                updated_at
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `,
            customer.id,
            customer.business_id,
            customer.customer_code,
            customer.customer_name,
            customer.customer_type,
            customer.phone_number,
            customer.email,
            customer.address,
            customer.tax_number,
            customer.credit_limit,
            customer.status,
            customer.created_at,
            customer.updated_at,
        );

        await addSyncQueueItem(db, {
            business_id: customer.business_id,
            entity_type: 'customer',
            entity_id: customer.id,
            operation: 'create',
            payload: customer,
            idempotency_key: generateIdempotencyKey('create', customer.id),
        });
    });

    return customer;
}

export async function updateCustomer(
    db: SQLiteDatabase,
    customerId: number,
    input: UpdateCustomerInput,
): Promise<Customer | null> {
    const existing = await getCustomerById(db, customerId);

    if (!existing) {
        return null;
    }

    const updated: Customer = {
        ...existing,
        ...input,
        id: existing.id,
        business_id: existing.business_id,
        updated_at: now(),
    };

    await db.withTransactionAsync(async () => {
        await db.runAsync(
            `
            UPDATE customer
            SET
                customer_code = ?,
                customer_name = ?,
                customer_type = ?,
                phone_number = ?,
                email = ?,
                address = ?,
                tax_number = ?,
                credit_limit = ?,
                status = ?,
                updated_at = ?
            WHERE id = ?
              AND business_id = ?
            `,
            updated.customer_code,
            updated.customer_name,
            updated.customer_type,
            updated.phone_number,
            updated.email,
            updated.address,
            updated.tax_number,
            updated.credit_limit,
            updated.status,
            updated.updated_at,
            updated.id,
            updated.business_id,
        );

        await addSyncQueueItem(db, {
            business_id: updated.business_id,
            entity_type: 'customer',
            entity_id: updated.id,
            operation: 'update',
            payload: updated,
            idempotency_key: generateIdempotencyKey(
                'update',
                updated.id,
            ),
        });
    });

    return updated;
}

export async function getCustomerById(
    db: SQLiteDatabase,
    customerId: number,
): Promise<Customer | null> {
    return await db.getFirstAsync<Customer>(
        `
        SELECT *
        FROM customer
        WHERE id = ?
        LIMIT 1
        `,
        customerId,
    );
}

export async function getCustomers(
    db: SQLiteDatabase,
    businessId: number,
): Promise<Customer[]> {
    return await db.getAllAsync<Customer>(
        `
        SELECT *
        FROM customer
        WHERE business_id = ?
        ORDER BY customer_name COLLATE NOCASE ASC
        `,
        businessId,
    );
}

export async function searchCustomers(
    db: SQLiteDatabase,
    businessId: number,
    search: string,
): Promise<Customer[]> {
    const query = `%${search.trim()}%`;

    return await db.getAllAsync<Customer>(
        `
        SELECT *
        FROM customer
        WHERE business_id = ?
          AND (
              customer_name LIKE ?
              OR customer_code LIKE ?
              OR phone_number LIKE ?
              OR email LIKE ?
          )
        ORDER BY customer_name COLLATE NOCASE ASC
        LIMIT 50
        `,
        businessId,
        query,
        query,
        query,
        query,
    );
}

export async function deleteCustomer(
    db: SQLiteDatabase,
    customerId: number,
): Promise<boolean> {
    const existing = await getCustomerById(db, customerId);

    if (!existing) {
        return false;
    }

    await db.withTransactionAsync(async () => {
        await db.runAsync(
            `
            UPDATE customer
            SET
                status = 'deleted',
                updated_at = ?
            WHERE id = ?
              AND business_id = ?
            `,
            now(),
            existing.id,
            existing.business_id,
        );

        await addSyncQueueItem(db, {
            business_id: existing.business_id,
            entity_type: 'customer',
            entity_id: existing.id,
            operation: 'delete',
            payload: {
                id: existing.id,
                business_id: existing.business_id,
            },
            idempotency_key: generateIdempotencyKey(
                'delete',
                existing.id,
            ),
        });
    });

    return true;
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
        100,
    );
}
