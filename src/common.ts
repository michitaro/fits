export enum DataType {
    uint8,
    uint16,
    uint32,
    float32,
    float64,
}


export type HduDecodeOption = {
    sourceIndex: number
    outputDataType: DataType
    // doNotScaleImageData: boolean
}


export type WorkerRequestMessage = {
    requestId: number
    fileContent: ArrayBuffer
    hduDecodeOptions?: Partial<HduDecodeOption>[]
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


export function card<T extends keyof CardTypes>(header: Header, key: string, type: T, defaultValue?: any): CardTypes[T] {
    let value = header[key]
    if (value == undefined)
        value = defaultValue
    if (typeof value != type)
        throw new Error(`Type mismatch: ${value} for ${key}`)
    return value
}