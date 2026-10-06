declare module 'react-native-bluetooth-escpos-printer' {
    export const BluetoothEscposPrinter: {
        printText(text: string): Promise<void>
        printerAlign(alignment: number): Promise<void>
        setBlob(mode: number): Promise<void>
    }

    export const BluetoothManager: any
}