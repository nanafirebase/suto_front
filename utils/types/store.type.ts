import { PermissionEngine } from "../../configuration/data/PermissionEngine";

export interface Employee {
    id: string;
    full_name: string
    other_names?: string
    last_name: string
    date_of_birth: string
    gender: 'male'|'female'
    email?: string
    phone?: string
    department_id?: string
    joining_date?: string
    marital_status?: 'Single' | 'Married' | 'Divorced' | 'Widowed'
    
    country: string
    region?: string
    city?: string
    home_address?: string,
    citizen_of_ghana?: 'yes' | 'no',
    nationality?: string,
    permanent_residence?: 'yes' | 'no',
    working_visa?: 'yes' | 'no' | 'n/a',
    visa_expiry?: string,
    restrictions?: string,

    tax_id?: string,
    ssnit_number?: string,
}

export interface Branch {
    id: number | string
    name: string
}

export interface User {
    id: number | string
    full_name: string
    email: string
    phone: string
    employeeID?: string|number
}

export interface Company {
    id: string;
    // Basic Info
    owner_id?: string;
    name: string;
    registrationNumber?: string;
    industry?: string;
    description?: string;
    // Location
    country: string;
    region?: string;
    city?: string;
    address?: string;
    // Contact
    email?: string;
    phone?: string;
    website?: string;
    baseCurrencyId: string;
    supportedCurrencies: string[];
    // Settings
    timezone?: string;
    logoUrl?: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface Bank {
    id: string
    name: string
    code: string
    country: string
    logoUrl?: string
}

export interface Currency {
    id: string;        // ex: uuid
    short: string;        // ex: "GHS", "USD", "EUR"
    name: string;      // ex: "Ghana Cedi", "US Dollar"
    symbol: string;    // ex: "₵", "$", "€"
    isDefault?: boolean
}

export interface CurrencyConversionRate {
    id: string;
    company_id: string;
    base_currency_id: string;   // ex: "GHS"
    rates: {
        [currency_id: string]: number; // ex: { USD: 0.089, EUR: 0.083 }
    }
    lastUpdated: Date;
}

export interface CurrencySnapshot {
    id: string;
    transaction_id: string;
    company_id: string;
    base_currency_id: string;      // e.g. GHS
    currency_id: string;           // e.g. USD (transaction currency)
    rate_against_base: number;       // e.g. 0.089
    date: Date;                    // timestamp when snapshot was taken
}

// so set snapshot transaction_id to null and change only when transaction it successful

export interface Transaction {
    id: string
    transaction_type: 'income' | 'expense' | 'transfer' | 'invoice' | 'payroll' | 'other'
    metadata?: Record<string, any>
    company_id: string
    amount: number
    currency_id: string       // e.g. "USD"
    base_amount: number       // always in base currency for reports
    snapshot_id: string
    createdAt: Date
}

export interface BankAccount {
    id: string
    bank_id: string
    country: string
    accountNumber: string
    sortOrRoutingCode?: string
    currency: string
    balance: number
    createdAt: Date
}

export interface Session {
    provider_token?: string | null
    provider_refresh_token?: string | null
    access_token: string
    refresh_token: string
    expires_in: number
    expires_at?: number
    token_type: string
    user: User
}

export interface iCurrency {
    code?: string | null
    currencyID?: string | number | null
    name?: string
    symbol?: string
}

export interface IShowAlert {
    visibility:boolean
    type?:'error'|'warning'|'success'|'info'
    message?:any
    messageType?:'JSX'|'text'
    title?: any
}

export interface IShowAlertJSX {
    visibility:boolean
    message?:any
    title?: any
}

export interface OTPMeta {
    refNumber: string
    businessID: number
    sessionID: number | string
}

export interface IOTPAlert {
    visibility:boolean
    refNumber: string
    businessID: number
    sessionID: string | number
    onSubmit?: (code: string, meta: OTPMeta) => Promise<void> | void
}

export interface IShowPaymentModal {
    visibility:boolean
    refNumber: string
    businessID: number
    sessionID: string | number
}

export interface AppContainerUse {
    isLoggedIn: boolean
    setIsLoggedIn: React.Dispatch<React.SetStateAction<boolean>>
    session: any
    setSession: React.Dispatch<React.SetStateAction<any>>
    openAlertJSX: IShowAlertJSX | null
    showAlertJSX: React.Dispatch<React.SetStateAction<IShowAlertJSX|null>>
    openAlert: IShowAlert | null
    showAlert: React.Dispatch<React.SetStateAction<IShowAlert|null>>
    otpAlert: IOTPAlert | null
    showOTPAlert: React.Dispatch<React.SetStateAction<IOTPAlert|null>>
    openPaymentModal: IShowPaymentModal | null
    showPaymentModal: React.Dispatch<React.SetStateAction<IShowPaymentModal|null>>
    userData: User | null
    setUserData: React.Dispatch<React.SetStateAction<User | null>>
    selectedBusiness: any | null
    setSelectedBusiness: React.Dispatch<React.SetStateAction<any | null>>
    notification: any[]
    setNotification: React.Dispatch<React.SetStateAction<any[]>>
    isLoading: boolean
    setIsLoading: React.Dispatch<React.SetStateAction<boolean>>
    isLoadingSplash: boolean
    setIsLoadingSplash: React.Dispatch<React.SetStateAction<boolean>>
    businessCurrency: any
    setBusinessCurrency: React.Dispatch<React.SetStateAction<any>>
    userBranch: any
    setUserBranch: React.Dispatch<React.SetStateAction<any>>
    userGrade: any
    setUserGrade: React.Dispatch<React.SetStateAction<any>>
    permission: PermissionEngine | null
    packageName: 'Micro'|'Small'|'Medium'|null
    can: (permission: string) => boolean
}

