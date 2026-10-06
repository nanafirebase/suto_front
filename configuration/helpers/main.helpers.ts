import { io } from "socket.io-client"
import { API_URL } from "../credentials"

export const SocketIO = io(API_URL)

export const shortenText = ( text?: string | null | number, maxLength: number = 50): string => {
    if (!text || typeof text !== 'string') return ''
    if (text.length <= maxLength) return text
    return text.slice(0, maxLength).trim() + '...'
}

export function formatBytes(bytes: number, decimals = 2): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

export const fullDateTime = (value?:string) => {
    let date
    if (value) {
        date = new Date(value)
    } else {
        date = new Date()
    }
    let dd:any = date.getUTCDate()
    dd = dd < 10 ? '0'+dd : dd
    let mm:any = date.getUTCMonth()+1
    mm = mm < 10 ? '0'+mm : mm
    let yyyy = date.getUTCFullYear()
    return yyyy+'-'+mm+'-'+dd+' '+date.getUTCHours()+':'+date.getUTCMinutes()+':'+date.getUTCSeconds()
}

export const fullDate = (value?:string) => {
    let date
    if (value) {
        date = new Date(value)
    } else {
        date = new Date()
    }
    let dd:any = date.getUTCDate()
    dd = dd < 10 ? '0'+dd : dd
    let mm:any = date.getUTCMonth()+1
    mm = mm < 10 ? '0'+mm : mm
    let yyyy = date.getUTCFullYear()
    return yyyy+'-'+mm+'-'+dd
}

export const fullDateWord = (value?: string) => {
    const date = value ? new Date(value) : new Date();

    const months = [
        'January',
        'February',
        'March',
        'April',
        'May',
        'June',
        'July',
        'August',
        'September',
        'October',
        'November',
        'December'
    ];

    const day = date.getUTCDate();
    const month = months[date.getUTCMonth()];
    const year = date.getUTCFullYear();

    return `${day} ${month} ${year}`;
};

export const fullDateTimeWord = (value?: string) => {
    const date = value ? new Date(value) : new Date();

    const months = [
        'January',
        'February',
        'March',
        'April',
        'May',
        'June',
        'July',
        'August',
        'September',
        'October',
        'November',
        'December'
    ];

    const day = date.getUTCDate();
    const month = months[date.getUTCMonth()];
    const year = date.getUTCFullYear();

    return `${day} ${month} ${year} ${date.getUTCHours()+':'+date.getUTCMinutes()+':'+date.getUTCSeconds()}`;
};

export const generateBatchNumber = (productID: number) => {
    const date = new Date()
    const ymd = date.getFullYear().toString().slice(2) + String(date.getMonth() + 1).padStart(2, '0') + String(date.getDate()).padStart(2, '0')
    const random = Math.floor(1000 + Math.random() * 9000)
    return `${productID}-${ymd}-${random}`
}

export const generateSKU = (prefix = 'SKU', productId?: number, categoryCode?: string): string => {
    const idPart = productId ? String(productId).padStart(6, '0') : Date.now().toString().slice(-6)
    const categoryPart = categoryCode ? categoryCode.toUpperCase() : 'GEN'
    return `${categoryPart}-${prefix}-${idPart}`
}

export const generateId = () => {
    return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
};

export const generateCode = (prefix:string, length: number = 5): string => {
    const randomPart = Array.from({ length }, () => {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
        return chars.charAt(Math.floor(Math.random() * chars.length))
    }).join('')
    const year = new Date().getFullYear()
    return `${prefix}-${randomPart}-${year}`
}

export const getNameAbbr = (name: string, maxLetters = 2): string => {
    if (!name) return ''
    return name.trim().split(/\s+/).filter(Boolean).slice(0, maxLetters).map(word => word[0].toUpperCase()).join('')
}


export function calculateRemainingTime(examStartTimeUTC: Date) {
    const currentTime:Date = new Date()
    const timeDifference = examStartTimeUTC.getTime() - currentTime.getTime()

    const hours = Math.floor(timeDifference / (1000 * 60 * 60))
    const minutes = Math.floor((timeDifference % (1000 * 60 * 60)) / (1000 * 60))
    const seconds = Math.floor((timeDifference % (1000 * 60)) / 1000)

    return { hours, minutes, seconds }
}

export function generateHexColor(): string {
    const letters = "0123456789ABCDEF"
    let color = "#"
    for (let i = 0; i < 6; i++) {
        color += letters[Math.floor(Math.random() * 16)]
    }
    return color
}

export function generateNiceHexColor(): string {
    const palette = ["#2563EB", "#16A34A", "#F59E0B", "#DC2626", "#7C3AED", "#0891B2", "#DB2777", "#4B5563"]
    return palette[Math.floor(Math.random() * palette.length)]
}

export const smartAbbreviate = (text: string) => {
    const words = text.trim().split(" ")

    if (words.length <= 2) return text

    const first = words[0]
    const last = words[words.length - 1]

    const middle = words
        .slice(1, -1)
        .map(word => word[0] + ".")
        .join("")

    return `${first} ${middle} ${last}`
}
