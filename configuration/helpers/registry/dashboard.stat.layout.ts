import { StatID } from "./dashboard.stat.registry";

export const PACKAGE_STATS: Record<string, StatID[]> = {
    Basic: [
        "products",
        "low-stocks",
        "expiring-soon",
        "sales-today",
        "transactions-today"
    ],
    Business: [
        // "employees",
        // "attendance",
        // "birthdays",
        "products",
        "low-stocks",
        "expiring-soon",
        "sales-today",
        "transactions-today",
        "revenue-month",
        "gross-profit-month",
        "cogs-month",
        "tax-collected"
    ],
    Pro: [
        // "employees",
        // "attendance",
        // "birthdays",
        "products",
        "low-stocks",
        "sales-today",
        "transactions-today",
        "revenue-month",
        "gross-profit-month",
        "expiring-soon"
    ]
}
