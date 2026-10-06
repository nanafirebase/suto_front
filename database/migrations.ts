import type { SQLiteDatabase } from 'expo-sqlite';

export async function runMigrations(db: SQLiteDatabase) {
    const version = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version')
    const currentVersion = version?.user_version ?? 0;

    if (currentVersion < 1) {
        await migrateToV1(db);
    }

    if (currentVersion < 2) {
        await migrateToV2(db);
    }

    if (currentVersion < 3) {
        await migrateToV3(db);
    }

    if (currentVersion < 4) {
        await migrateToV4(db);
    }

    if (currentVersion < 5) {
        await migrateToV5(db);
    }

    if (currentVersion < 6) {
        await migrateToV6(db);
    }

    if (currentVersion < 7) {
        await migrateToV7(db);
    }

    if (currentVersion < 8) {
        await migrateToV8(db);
    }

    if (currentVersion < 9) {
        await migrateToV9(db);
    }

    if (currentVersion < 10) {
        await migrateToV10(db);
    }

    if (currentVersion < 11) {
        await migrateToV11(db);
    }

    if (currentVersion < 12) {
        await migrateToV12(db);
    }

    if (currentVersion < 13) {
        await migrateToV13(db);
    }

    if (currentVersion < 14) {
        await migrateToV14(db);
    }

    if (currentVersion < 15) {
        await migrateToV15(db);
    }
}

async function migrateToV1(db: SQLiteDatabase) {
    await db.execAsync(`
        CREATE TABLE IF NOT EXISTS app_context (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            business_id INTEGER,
            branch_id INTEGER,
            stock_id INTEGER,
            user_id INTEGER,
            session_id INTEGER,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS product_category (
            id INTEGER PRIMARY KEY,
            business_id INTEGER NOT NULL,
            category_name TEXT,
            dependency_id INTEGER,
            description TEXT,
            status TEXT,
            created_at TEXT,
            updated_at TEXT
        );

        CREATE TABLE IF NOT EXISTS uom (
            id INTEGER PRIMARY KEY,
            business_id INTEGER NOT NULL,
            name TEXT,
            short_code TEXT,
            category TEXT,
            status TEXT,
            created_at TEXT
        );

        CREATE TABLE IF NOT EXISTS product (
            id INTEGER PRIMARY KEY,
            business_id INTEGER NOT NULL,
            name TEXT,
            images TEXT,
            type TEXT,
            inventory_type TEXT,
            sku TEXT,
            tax_group_id INTEGER,
            product_category_id INTEGER,
            manufacturer_id INTEGER,
            product_description TEXT,
            status TEXT,
            created_at TEXT
        );

        CREATE TABLE IF NOT EXISTS stock (
            id INTEGER PRIMARY KEY,
            business_id INTEGER NOT NULL,
            branch_id INTEGER NOT NULL,
            parent_stock_id INTEGER,
            name TEXT,
            code TEXT,
            description TEXT,
            is_default_sales_stock INTEGER DEFAULT 0,
            status TEXT,
            created_at TEXT,
            updated_at TEXT
        );

        CREATE TABLE IF NOT EXISTS product_in_stock (
            id INTEGER PRIMARY KEY,
            business_id INTEGER NOT NULL,
            branch_id INTEGER NOT NULL,
            stock_id INTEGER NOT NULL,
            product_id INTEGER NOT NULL,
            reorder_level REAL DEFAULT 0,
            status TEXT,
            created_at TEXT,
            updated_at TEXT
        );

        CREATE INDEX IF NOT EXISTS idx_product_sku
            ON product(sku);

        CREATE INDEX IF NOT EXISTS idx_product_uom_barcode
            ON product_uom(barcode);

        CREATE INDEX IF NOT EXISTS idx_product_stock_balance
            ON product_stock_balance(stock_id, product_id);

        CREATE INDEX IF NOT EXISTS idx_product_in_stock
            ON product_in_stock(stock_id, product_id);

        PRAGMA user_version = 1;
    `);
}

async function migrateToV2(db: SQLiteDatabase) {
    await db.execAsync(`
        CREATE TABLE IF NOT EXISTS supplier (
            id INTEGER PRIMARY KEY,
            business_id INTEGER NOT NULL,
            supplier_name TEXT,
            supplier_type TEXT,
            phone TEXT,
            email TEXT,
            contact_person_name TEXT,
            contact_person_phone TEXT,
            contact_person_email TEXT,
            contact_person_role TEXT,
            status TEXT,
            created_at TEXT,
            updated_at TEXT
        );

        CREATE TABLE IF NOT EXISTS stock_in (
            id INTEGER PRIMARY KEY,
            business_id INTEGER NOT NULL,
            branch_id INTEGER NOT NULL,
            stock_id INTEGER NOT NULL,
            supplier_id INTEGER,
            reference_number TEXT,
            invoice_date TEXT,
            currency_id INTEGER,
            currency_snapshot_id INTEGER,
            total_amount REAL DEFAULT 0,
            total_amount_base REAL DEFAULT 0,
            remarks TEXT,
            status TEXT,
            created_at TEXT,
            updated_at TEXT
        );

        CREATE TABLE IF NOT EXISTS stock_in_item (
            id INTEGER PRIMARY KEY,
            business_id INTEGER NOT NULL,
            stock_in_id INTEGER NOT NULL,
            product_id INTEGER NOT NULL,
            product_uom_id INTEGER NOT NULL,
            quantity REAL DEFAULT 0,
            remaining_quantity REAL DEFAULT 0,
            cost_price REAL DEFAULT 0,
            batch_number TEXT,
            expiry_date TEXT,
            manufacture_date TEXT,
            status TEXT,
            created_at TEXT,

            FOREIGN KEY (stock_in_id)
                REFERENCES stock_in(id),

            FOREIGN KEY (product_id)
                REFERENCES product(id),

            FOREIGN KEY (product_uom_id)
                REFERENCES product_uom(id)
        );

        CREATE INDEX IF NOT EXISTS idx_stock_in_branch
            ON stock_in(branch_id);

        CREATE INDEX IF NOT EXISTS idx_stock_in_stock
            ON stock_in(stock_id);

        CREATE INDEX IF NOT EXISTS idx_stock_in_item_stock_in
            ON stock_in_item(stock_in_id);

        CREATE INDEX IF NOT EXISTS idx_stock_in_item_product
            ON stock_in_item(product_id);

        CREATE INDEX IF NOT EXISTS idx_stock_in_item_batch
            ON stock_in_item(batch_number);

        PRAGMA user_version = 2;
    `);
}

async function migrateToV3(db: SQLiteDatabase) {
    await db.execAsync(`
        CREATE TABLE IF NOT EXISTS inventory_movement (
            id INTEGER PRIMARY KEY,
            business_id INTEGER NOT NULL,
            branch_id INTEGER NOT NULL,
            stock_id INTEGER NOT NULL,
            product_id INTEGER NOT NULL,

            reference_type TEXT NOT NULL,
            reference_id INTEGER,

            quantity_in REAL DEFAULT 0,
            quantity_out REAL DEFAULT 0,
            base_quantity REAL DEFAULT 0,

            cost_price REAL DEFAULT 0,
            remark TEXT,
            balance_quantity REAL DEFAULT 0,

            created_by INTEGER,
            session_id INTEGER,
            created_at TEXT NOT NULL
        );

        CREATE INDEX IF NOT EXISTS idx_inventory_movement_product
            ON inventory_movement(product_id);

        CREATE INDEX IF NOT EXISTS idx_inventory_movement_stock
            ON inventory_movement(stock_id);

        CREATE INDEX IF NOT EXISTS idx_inventory_movement_reference
            ON inventory_movement(reference_type, reference_id);

        PRAGMA user_version = 3;
    `);
}

async function migrateToV4(db: SQLiteDatabase) {
    await db.execAsync(`
        CREATE TABLE IF NOT EXISTS manufacturer (
            id INTEGER PRIMARY KEY,
            business_id INTEGER NOT NULL,
            name TEXT NOT NULL,
            code TEXT,
            country_id INTEGER,
            phone TEXT,
            email TEXT,
            contact_person_name TEXT,
            contact_person_phone TEXT,
            contact_person_email TEXT,
            contact_person_role TEXT,
            notes TEXT,
            status TEXT,
            created_at TEXT,
            updated_at TEXT
        );

        CREATE TABLE IF NOT EXISTS product_uom (
            id INTEGER PRIMARY KEY,
            business_id INTEGER NOT NULL,
            product_id INTEGER NOT NULL,
            uom_id INTEGER NOT NULL,

            selling_price REAL DEFAULT 0,
            barcode TEXT,

            is_tax_inclusive INTEGER DEFAULT 0,
            conversion_rate REAL DEFAULT 1,
            is_base INTEGER DEFAULT 0,
            is_default INTEGER DEFAULT 0,

            status TEXT,
            created_at TEXT,

            FOREIGN KEY (product_id)
                REFERENCES product(id),

            FOREIGN KEY (uom_id)
                REFERENCES uom(id)
        );

        CREATE INDEX IF NOT EXISTS idx_product_sku
            ON product(sku);

        CREATE INDEX IF NOT EXISTS idx_product_uom_barcode
            ON product_uom(barcode);

        CREATE INDEX IF NOT EXISTS idx_product_uom_product
            ON product_uom(product_id);

        PRAGMA user_version = 4;
    `);
}

async function migrateToV5(db: SQLiteDatabase) {
    await db.execAsync(`
        CREATE TABLE IF NOT EXISTS customer (
            id INTEGER PRIMARY KEY,
            business_id INTEGER NOT NULL,
            customer_code TEXT,
            customer_name TEXT,
            customer_type TEXT,
            phone_number TEXT,
            email TEXT,
            address TEXT,
            tax_number TEXT,
            credit_limit REAL DEFAULT 0,
            status TEXT,
            created_at TEXT,
            updated_at TEXT
        );

        CREATE TABLE IF NOT EXISTS sales (
            id INTEGER PRIMARY KEY,
            business_id INTEGER NOT NULL,
            branch_id INTEGER NOT NULL,
            stock_id INTEGER NOT NULL,
            customer_id INTEGER,

            reference_number TEXT NOT NULL,
            sale_date TEXT NOT NULL,

            currency_id INTEGER,
            currency_snapshot_id INTEGER,

            total_amount REAL DEFAULT 0,
            total_amount_base REAL DEFAULT 0,
            discount_amount REAL DEFAULT 0,
            tax_snapshot TEXT,
            tax_amount REAL DEFAULT 0,

            remarks TEXT,
            status TEXT,

            session_id INTEGER,
            created_at TEXT NOT NULL,
            updated_at TEXT
        );

        CREATE TABLE IF NOT EXISTS sales_item (
            id INTEGER PRIMARY KEY,
            business_id INTEGER NOT NULL,
            sales_id INTEGER NOT NULL,
            product_id INTEGER NOT NULL,
            product_uom_id INTEGER NOT NULL,

            quantity REAL DEFAULT 0,
            selling_price REAL DEFAULT 0,
            total_amount REAL DEFAULT 0,
            total_amount_base REAL DEFAULT 0,

            status TEXT,
            created_at TEXT NOT NULL,

            FOREIGN KEY (sales_id)
                REFERENCES sales(id),

            FOREIGN KEY (product_id)
                REFERENCES product(id),

            FOREIGN KEY (product_uom_id)
                REFERENCES product_uom(id)
        );

        CREATE INDEX IF NOT EXISTS idx_sales_date
            ON sales(sale_date);

        CREATE INDEX IF NOT EXISTS idx_sales_branch
            ON sales(branch_id);

        CREATE INDEX IF NOT EXISTS idx_sales_reference
            ON sales(reference_number);

        CREATE INDEX IF NOT EXISTS idx_sales_item_sale
            ON sales_item(sales_id);

        CREATE INDEX IF NOT EXISTS idx_sales_item_product
            ON sales_item(product_id);

        PRAGMA user_version = 5;
    `);
}

async function migrateToV6(db: SQLiteDatabase) {
    await db.execAsync(`
        CREATE TABLE IF NOT EXISTS payment_transactions (
            id INTEGER PRIMARY KEY,

            business_id INTEGER NOT NULL,
            branch_id INTEGER NOT NULL,
            sale_id INTEGER NOT NULL,
            cashier_id INTEGER,

            transaction_type TEXT,
            confirmed_manually INTEGER DEFAULT 0,

            reference TEXT,
            type TEXT NOT NULL,
            network TEXT,
            account_number TEXT,

            amount REAL NOT NULL DEFAULT 0,

            status TEXT NOT NULL,

            session_id INTEGER,
            created_at TEXT NOT NULL,
            updated_at TEXT,

            FOREIGN KEY (sale_id)
                REFERENCES sales(id)
        );

        CREATE INDEX IF NOT EXISTS idx_payment_sale
            ON payment_transactions(sale_id);

        CREATE INDEX IF NOT EXISTS idx_payment_reference
            ON payment_transactions(reference);

        CREATE INDEX IF NOT EXISTS idx_payment_status
            ON payment_transactions(status);

        PRAGMA user_version = 6;
    `);
}

async function migrateToV7(db: SQLiteDatabase) {
    await db.execAsync(`
        CREATE TABLE IF NOT EXISTS sale_batch_consumption (
            id INTEGER PRIMARY KEY,

            business_id INTEGER NOT NULL,
            branch_id INTEGER NOT NULL,

            sale_id INTEGER NOT NULL,
            sale_item_id INTEGER NOT NULL,

            stock_in_id INTEGER NOT NULL,
            stock_in_item_id INTEGER NOT NULL,

            product_id INTEGER NOT NULL,

            quantity REAL NOT NULL DEFAULT 0,
            cost_price REAL NOT NULL DEFAULT 0,
            total_cost REAL NOT NULL DEFAULT 0,

            status TEXT,
            session_id INTEGER,
            created_at TEXT NOT NULL,

            FOREIGN KEY (sale_id)
                REFERENCES sales(id),

            FOREIGN KEY (sale_item_id)
                REFERENCES sales_item(id),

            FOREIGN KEY (stock_in_id)
                REFERENCES stock_in(id),

            FOREIGN KEY (stock_in_item_id)
                REFERENCES stock_in_item(id),

            FOREIGN KEY (product_id)
                REFERENCES product(id)
        );

        CREATE INDEX IF NOT EXISTS idx_batch_consumption_sale
            ON sale_batch_consumption(sale_id);

        CREATE INDEX IF NOT EXISTS idx_batch_consumption_item
            ON sale_batch_consumption(sale_item_id);

        CREATE INDEX IF NOT EXISTS idx_batch_consumption_stock_item
            ON sale_batch_consumption(stock_in_item_id);

        PRAGMA user_version = 7;
    `);
}

async function migrateToV8(db: SQLiteDatabase) {
    await db.execAsync(`
        CREATE TABLE IF NOT EXISTS product_stock_balance (
            id INTEGER PRIMARY KEY,

            business_id INTEGER NOT NULL,
            branch_id INTEGER NOT NULL,
            product_id INTEGER NOT NULL,
            stock_id INTEGER NOT NULL,

            base_quantity REAL NOT NULL DEFAULT 0,

            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL,

            UNIQUE (
                branch_id,
                stock_id,
                product_id
            ),

            FOREIGN KEY (product_id)
                REFERENCES product(id),

            FOREIGN KEY (stock_id)
                REFERENCES stock(id)
        );

        CREATE INDEX IF NOT EXISTS idx_product_stock_balance_product
            ON product_stock_balance(product_id);

        CREATE INDEX IF NOT EXISTS idx_product_stock_balance_stock
            ON product_stock_balance(stock_id);

        CREATE INDEX IF NOT EXISTS idx_product_stock_balance_branch
            ON product_stock_balance(branch_id);

        PRAGMA user_version = 8;
    `);
}

async function migrateToV9(db: SQLiteDatabase) {
    await db.execAsync(`
        CREATE TABLE IF NOT EXISTS stock (
            id INTEGER PRIMARY KEY,

            business_id INTEGER NOT NULL,
            branch_id INTEGER NOT NULL,
            parent_stock_id INTEGER,

            name TEXT NOT NULL,
            code TEXT,

            description TEXT,
            is_default_sales_stock INTEGER DEFAULT 0,

            status TEXT,

            created_at TEXT NOT NULL,
            updated_at TEXT,

            FOREIGN KEY (parent_stock_id)
                REFERENCES stock(id)
        );

        CREATE INDEX IF NOT EXISTS idx_stock_branch
            ON stock(branch_id);

        CREATE INDEX IF NOT EXISTS idx_stock_business
            ON stock(business_id);

        CREATE INDEX IF NOT EXISTS idx_stock_code
            ON stock(code);

        PRAGMA user_version = 9;
    `);
}

async function migrateToV10(db: SQLiteDatabase) {
    await db.execAsync(`
        CREATE TABLE IF NOT EXISTS currency (
            id INTEGER PRIMARY KEY,
            code TEXT NOT NULL,
            name TEXT,
            symbol TEXT,
            status TEXT,
            created_at TEXT
        );

        CREATE TABLE IF NOT EXISTS currency_snapshot (
            id INTEGER PRIMARY KEY,

            business_id INTEGER NOT NULL,
            branch_id INTEGER NOT NULL,

            transaction_type TEXT NOT NULL,
            transaction_id INTEGER NOT NULL,

            base_currency_id INTEGER NOT NULL,
            currency_id INTEGER NOT NULL,

            rate_against_base REAL NOT NULL,

            status TEXT,
            created_at TEXT NOT NULL,

            FOREIGN KEY (base_currency_id)
                REFERENCES currency(id),

            FOREIGN KEY (currency_id)
                REFERENCES currency(id)
        );

        CREATE INDEX IF NOT EXISTS idx_currency_code
            ON currency(code);

        CREATE INDEX IF NOT EXISTS idx_currency_snapshot_transaction
            ON currency_snapshot(transaction_type, transaction_id);

        PRAGMA user_version = 10;
    `);
}

async function migrateToV11(db: SQLiteDatabase) {
    await db.execAsync(`
        CREATE TABLE IF NOT EXISTS sync_queue (
            id INTEGER PRIMARY KEY AUTOINCREMENT,

            entity_type TEXT NOT NULL,
            entity_id INTEGER NOT NULL,

            operation TEXT NOT NULL,

            payload TEXT NOT NULL,

            status TEXT NOT NULL DEFAULT 'pending',

            attempts INTEGER NOT NULL DEFAULT 0,
            last_error TEXT,

            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
        );

        CREATE INDEX IF NOT EXISTS idx_sync_queue_status
            ON sync_queue(status);

        CREATE INDEX IF NOT EXISTS idx_sync_queue_entity
            ON sync_queue(entity_type, entity_id);

        PRAGMA user_version = 11;
    `);
}

async function migrateToV12(db: SQLiteDatabase) {
    await db.execAsync(`
        CREATE TABLE IF NOT EXISTS sync_state (
            id INTEGER PRIMARY KEY,
            device_id TEXT NOT NULL,
            business_id INTEGER NOT NULL,
            branch_id INTEGER NOT NULL,

            last_sync_at TEXT,
            last_successful_sync_at TEXT,

            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
        );

        PRAGMA user_version = 12;
    `);
}

async function migrateToV13(db: SQLiteDatabase) {
    const columns = await db.getAllAsync<{ name: string }>(`PRAGMA table_info(sync_queue)`);
    const existing = new Set(columns.map(column => column.name));

    if (!existing.has("business_id")) await db.execAsync(`ALTER TABLE sync_queue ADD COLUMN business_id INTEGER`);
    if (!existing.has("branch_id")) await db.execAsync(`ALTER TABLE sync_queue ADD COLUMN branch_id INTEGER`);
    if (!existing.has("device_id")) await db.execAsync(`ALTER TABLE sync_queue ADD COLUMN device_id TEXT`);
    if (!existing.has("idempotency_key")) await db.execAsync(`ALTER TABLE sync_queue ADD COLUMN idempotency_key TEXT`);
    if (!existing.has("priority")) await db.execAsync(`ALTER TABLE sync_queue ADD COLUMN priority INTEGER NOT NULL DEFAULT 100`);
    if (!existing.has("next_attempt_at")) await db.execAsync(`ALTER TABLE sync_queue ADD COLUMN next_attempt_at TEXT`);
    if (!existing.has("synced_at")) await db.execAsync(`ALTER TABLE sync_queue ADD COLUMN synced_at TEXT`);
    if (!existing.has("response")) await db.execAsync(`ALTER TABLE sync_queue ADD COLUMN response TEXT`);
    if (!existing.has("error_code")) await db.execAsync(`ALTER TABLE sync_queue ADD COLUMN error_code TEXT`);
    
    await db.execAsync(`
        CREATE UNIQUE INDEX IF NOT EXISTS idx_sync_queue_idempotency ON sync_queue(idempotency_key);
        CREATE INDEX IF NOT EXISTS idx_sync_queue_next_attempt ON sync_queue(status, next_attempt_at);
        CREATE INDEX IF NOT EXISTS idx_sync_queue_priority ON sync_queue(status, priority, id);
        PRAGMA user_version = 13;
    `);
}

async function migrateToV14(db: SQLiteDatabase) {
    await db.execAsync(`
        CREATE TABLE IF NOT EXISTS payment_accounts (
            id INTEGER PRIMARY KEY,
            business_id INTEGER NOT NULL,
            branch_id INTEGER NOT NULL,
            name TEXT NOT NULL,
            type TEXT NOT NULL,
            currency_id INTEGER,
            account_number TEXT,
            provider TEXT,
            status TEXT NOT NULL DEFAULT 'active',
            created_at TEXT NOT NULL,
            updated_at TEXT,
            FOREIGN KEY (currency_id) REFERENCES currency(id)
        );

        CREATE INDEX IF NOT EXISTS idx_payment_account_business
            ON payment_accounts(business_id);

        CREATE INDEX IF NOT EXISTS idx_payment_account_branch
            ON payment_accounts(branch_id);

        CREATE INDEX IF NOT EXISTS idx_payment_account_type
            ON payment_accounts(type);

        CREATE INDEX IF NOT EXISTS idx_payment_account_status
            ON payment_accounts(status);
    `);

    const columns = await db.getAllAsync<{ name: string }>(`PRAGMA table_info(payment_transactions)`);
    const existing = new Set(columns.map(column => column.name));

    if (!existing.has("payment_account_id")) {
        await db.execAsync(`ALTER TABLE payment_transactions ADD COLUMN payment_account_id INTEGER`);
    }

    if (!existing.has("idempotency_key")) {
        await db.execAsync(`ALTER TABLE payment_transactions ADD COLUMN idempotency_key TEXT`);
    }

    const saleIdColumn = await db.getFirstAsync<{ notnull: number }>(`SELECT notnull FROM pragma_table_info('payment_transactions') WHERE name = 'sale_id'`);

    if (saleIdColumn?.notnull === 1) {
        await db.execAsync(`PRAGMA foreign_keys = OFF;`);
        await db.execAsync(`BEGIN;`);

        try {
            await db.execAsync(`
                CREATE TABLE payment_transactions_new (
                    id INTEGER PRIMARY KEY,
                    business_id INTEGER NOT NULL,
                    branch_id INTEGER NOT NULL,
                    sale_id INTEGER,
                    cashier_id INTEGER,
                    payment_account_id INTEGER,
                    transaction_type TEXT,
                    confirmed_manually INTEGER DEFAULT 0,
                    reference TEXT,
                    type TEXT NOT NULL,
                    network TEXT,
                    account_number TEXT,
                    amount REAL NOT NULL DEFAULT 0,
                    status TEXT NOT NULL,
                    idempotency_key TEXT,
                    session_id INTEGER,
                    created_at TEXT NOT NULL,
                    updated_at TEXT,
                    FOREIGN KEY (sale_id) REFERENCES sales(id),
                    FOREIGN KEY (payment_account_id) REFERENCES payment_accounts(id)
                );
            `);

            await db.execAsync(`
                INSERT INTO payment_transactions_new (
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
                SELECT
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
                FROM payment_transactions;
            `);

            await db.execAsync(`DROP TABLE payment_transactions;`);
            await db.execAsync(`ALTER TABLE payment_transactions_new RENAME TO payment_transactions;`);

            await db.execAsync(`
                CREATE INDEX IF NOT EXISTS idx_payment_sale
                    ON payment_transactions(sale_id);

                CREATE INDEX IF NOT EXISTS idx_payment_reference
                    ON payment_transactions(reference);

                CREATE INDEX IF NOT EXISTS idx_payment_status
                    ON payment_transactions(status);

                CREATE INDEX IF NOT EXISTS idx_payment_account
                    ON payment_transactions(payment_account_id);

                CREATE UNIQUE INDEX IF NOT EXISTS idx_payment_idempotency
                    ON payment_transactions(idempotency_key);
            `);

            await db.execAsync(`COMMIT;`);
        } catch (error) {
            await db.execAsync(`ROLLBACK;`);
            throw error;
        } finally {
            await db.execAsync(`PRAGMA foreign_keys = ON;`);
        }
    } else {
        await db.execAsync(`
            CREATE INDEX IF NOT EXISTS idx_payment_account
                ON payment_transactions(payment_account_id);

            CREATE UNIQUE INDEX IF NOT EXISTS idx_payment_idempotency
                ON payment_transactions(idempotency_key);
        `);
    }

    await db.execAsync(`PRAGMA user_version = 14;`);
}

async function migrateToV15(db: SQLiteDatabase) {
    const salesColumns = await db.getAllAsync<{ name: string }>(`PRAGMA table_info(sales)`);
    const salesExisting = new Set(salesColumns.map(column => column.name));

    if (!salesExisting.has("document_type")) await db.execAsync(`ALTER TABLE sales ADD COLUMN document_type TEXT NOT NULL DEFAULT 'invoice'`);
    if (!salesExisting.has("document_status")) await db.execAsync(`ALTER TABLE sales ADD COLUMN document_status TEXT NOT NULL DEFAULT 'draft'`);
    if (!salesExisting.has("payment_status")) await db.execAsync(`ALTER TABLE sales ADD COLUMN payment_status TEXT NOT NULL DEFAULT 'unpaid'`);
    if (!salesExisting.has("fulfillment_status")) await db.execAsync(`ALTER TABLE sales ADD COLUMN fulfillment_status TEXT NOT NULL DEFAULT 'pending'`);
    if (!salesExisting.has("subtotal_amount")) await db.execAsync(`ALTER TABLE sales ADD COLUMN subtotal_amount REAL NOT NULL DEFAULT 0`);
    if (!salesExisting.has("discount_amount")) await db.execAsync(`ALTER TABLE sales ADD COLUMN discount_amount REAL NOT NULL DEFAULT 0`);
    if (!salesExisting.has("subtotal_amount_base")) await db.execAsync(`ALTER TABLE sales ADD COLUMN subtotal_amount_base REAL NOT NULL DEFAULT 0`);
    if (!salesExisting.has("discount_amount_base")) await db.execAsync(`ALTER TABLE sales ADD COLUMN discount_amount_base REAL NOT NULL DEFAULT 0`);
    if (!salesExisting.has("tax_amount_base")) await db.execAsync(`ALTER TABLE sales ADD COLUMN tax_amount_base REAL NOT NULL DEFAULT 0`);
    if (!salesExisting.has("total_amount_base")) await db.execAsync(`ALTER TABLE sales ADD COLUMN total_amount_base REAL NOT NULL DEFAULT 0`);
    if (!salesExisting.has("amount_paid")) await db.execAsync(`ALTER TABLE sales ADD COLUMN amount_paid REAL NOT NULL DEFAULT 0`);
    if (!salesExisting.has("amount_paid_base")) await db.execAsync(`ALTER TABLE sales ADD COLUMN amount_paid_base REAL NOT NULL DEFAULT 0`);
    if (!salesExisting.has("amount_due")) await db.execAsync(`ALTER TABLE sales ADD COLUMN amount_due REAL NOT NULL DEFAULT 0`);
    if (!salesExisting.has("amount_due_base")) await db.execAsync(`ALTER TABLE sales ADD COLUMN amount_due_base REAL NOT NULL DEFAULT 0`);

    await db.execAsync(`
        CREATE INDEX IF NOT EXISTS idx_sales_customer
            ON sales(customer_id);

        CREATE INDEX IF NOT EXISTS idx_sales_document_status
            ON sales(document_status);

        CREATE INDEX IF NOT EXISTS idx_sales_payment_status
            ON sales(payment_status);

        CREATE INDEX IF NOT EXISTS idx_sales_fulfillment_status
            ON sales(fulfillment_status);

        CREATE INDEX IF NOT EXISTS idx_sales_sale_date
            ON sales(sale_date);
    `);

    await db.execAsync(`
        CREATE TABLE IF NOT EXISTS payment_allocations (
            id INTEGER PRIMARY KEY,
            business_id INTEGER NOT NULL,
            branch_id INTEGER NOT NULL,
            payment_transaction_id INTEGER NOT NULL,
            sale_id INTEGER NOT NULL,
            customer_id INTEGER,
            allocated_amount REAL NOT NULL DEFAULT 0,
            allocated_amount_base REAL NOT NULL DEFAULT 0,
            status TEXT NOT NULL DEFAULT 'active',
            session_id INTEGER,
            created_at TEXT NOT NULL,
            updated_at TEXT,
            FOREIGN KEY (payment_transaction_id) REFERENCES payment_transactions(id),
            FOREIGN KEY (sale_id) REFERENCES sales(id)
        );

        CREATE INDEX IF NOT EXISTS idx_payment_allocation_payment
            ON payment_allocations(payment_transaction_id);

        CREATE INDEX IF NOT EXISTS idx_payment_allocation_sale
            ON payment_allocations(sale_id);

        CREATE INDEX IF NOT EXISTS idx_payment_allocation_customer
            ON payment_allocations(customer_id);
    `);

    await db.execAsync(`
        CREATE TABLE IF NOT EXISTS customer_balance (
            id INTEGER PRIMARY KEY,
            business_id INTEGER NOT NULL,
            customer_id INTEGER NOT NULL,
            currency_id INTEGER,
            total_invoiced REAL NOT NULL DEFAULT 0,
            total_paid REAL NOT NULL DEFAULT 0,
            total_credit REAL NOT NULL DEFAULT 0,
            total_due REAL NOT NULL DEFAULT 0,
            updated_at TEXT NOT NULL,
            UNIQUE (business_id, customer_id, currency_id),
            FOREIGN KEY (customer_id) REFERENCES customer(id),
            FOREIGN KEY (currency_id) REFERENCES currency(id)
        );

        CREATE INDEX IF NOT EXISTS idx_customer_balance_customer
            ON customer_balance(customer_id);

        CREATE INDEX IF NOT EXISTS idx_customer_balance_business
            ON customer_balance(business_id);
    `);

    await db.execAsync(`
        UPDATE sales
        SET subtotal_amount = CASE WHEN subtotal_amount = 0 THEN total_amount - discount_amount - tax_amount ELSE subtotal_amount END,
            subtotal_amount_base = CASE WHEN subtotal_amount_base = 0 THEN total_amount_base - discount_amount_base - tax_amount_base ELSE subtotal_amount_base END,
            amount_paid = COALESCE(amount_paid, 0),
            amount_due = CASE WHEN amount_due = 0 THEN MAX(total_amount - COALESCE(amount_paid, 0), 0) ELSE amount_due END;
    `);

    await db.execAsync(`
        PRAGMA user_version = 15;
    `);
}
