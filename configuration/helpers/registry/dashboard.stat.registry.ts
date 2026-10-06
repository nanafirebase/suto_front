import { HomeNavigationList, OperationNavigationList } from "../../../utils/types/index.type"

export type StatID = "products" | "low-stocks" | "sales-today" | "transactions-today" | "employees" |
"attendance" | "birthdays" | "revenue-month" | 'expiring-soon' | "revenue-month" | "gross-profit-month" | "cogs-month" |
"tax-collected"

type HomeScreenNames = keyof HomeNavigationList;

export interface StatConfig {
    id: StatID
    title: string
    icon?: string
    color: string
    colSpan: number
    screen?: HomeScreenNames
}

export const STAT_REGISTRY: Record<StatID, StatConfig> = {
    products: {
        id: "products",
        title: "Products",
        icon: "cube-outline",
        color: "#BC81EC",
        colSpan: 1,
        screen: 'ProductListScreen'
    },
    "low-stocks": {
        id: "low-stocks",
        title: "Low Stocks",
        icon: "alert-circle-outline",
        color: "#F44336",
        colSpan: 1,
        screen: 'LowStockScreen'
    },
    "expiring-soon": {
        id: "expiring-soon",
        title: "Expiring Soon",
        icon: "alert-circle-outline",
        color: "#06B6D4",
        colSpan: 1,
        screen: 'TrackExpiryListScreen'
    },
    "sales-today": {
        id: "sales-today",
        title: "Sales Today",
        icon: "shopping-cart",
        color: "#03AF50",
        colSpan: 1,
        screen: 'SaleListScreen'
    },
    "gross-profit-month": {
        id: "gross-profit-month",
        title: "Gross Profit This Month",
        icon: "cash-outline",
        color: "#1193E2",
        colSpan: 1.5,
        screen: "SaleListScreen"
    },
    "revenue-month": {
        id: "revenue-month",
        title: "Revenue This Month",
        icon: "trending-up",
        color: "#63C9AE",
        colSpan: 1.5,
        screen: "SaleListScreen"
    },
    "cogs-month": {
        id: "cogs-month",
        title: "Cost Of Goods Sold This Month",
        icon: "trending-up",
        color: "#FC234D",
        colSpan: 2,
        screen: "SaleListScreen"
    },
    "tax-collected": {
        id: "revenue-month",
        title: "Tax This Month",
        icon: "trending-up",
        color: "#289E43",
        colSpan: 1,
        screen: "TaxSummaryScreen"
    },
    "transactions-today": {
        id: "transactions-today",
        title: "Transactions Today",
        icon: "swap-horizontal",
        color: "#BE41AD",
        colSpan: 2,
        screen: 'PaymentListScreen'
    },
    employees: {
        id: "employees",
        title: "Employees",
        icon: "users",
        color: "#E91E63",
        colSpan: 1,
        screen: undefined
    },
    attendance: {
        id: "attendance",
        title: "Attendance",
        icon: "calendar-check",
        color: "#23DFCE",
        colSpan: 1,
        screen: undefined
    },
    birthdays: {
        id: "birthdays",
        title: "Birthdays",
        icon: "cake",
        color: "#AA902C",
        colSpan: 1,
        screen: undefined
    }
}
