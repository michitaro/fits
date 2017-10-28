export enum DataType {
    uint8,
    float32,
}


export type HduDecodeOption = {
    sourceIndex: number
    outputDataType: DataType
    doNotScaleImageData?: boolean
}


export type WorkerRequestMessage = {
    requestId: number
    fileContent: ArrayBuffer
    hduDecodeOptions?: HduDecodeOption[]
}


export type WorkerResponseMessage = {
    requestId: number
    hduSources?: HduSource[]
    error?: any
}


export type Header = { [key: string]: any }


export type HduSource = {
    header: Header
    data: ArrayBuffer
    dataType: DataType
}


export type CardTypes = {
    number: number
    string: string
    boolean: boolean
}


export function card<T extends keyof CardTypes>(header: Header, key: string, type: T): CardTypes[T] {
    const value = header[key]
    if (typeof value != type)
        throw new Error(`Type mismatch: ${value} for ${key}`)
    return value
}