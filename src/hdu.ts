import { Header, HduSource, card, CardTypes, DataType } from "./common"


export class Hdu {
    constructor(
        readonly header: Header,
        readonly data: ArrayBuffer,
        readonly dataType: DataType,
    ) {
    }

    static fromSource(source: HduSource): Hdu {
        return new Hdu(source.header, source.data, source.dataType)
    }

    card<T extends keyof CardTypes>(key: string, type: T) {
        return card(this.header, key, type)
    }

    uint8array(cb: (array: Uint8Array) => void) { this.typedArray(DataType.uint8, Uint8Array, cb) }
    uint16array(cb: (array: Uint16Array) => void) { this.typedArray(DataType.uint16, Uint16Array, cb) }
    uint32array(cb: (array: Uint32Array) => void) { this.typedArray(DataType.uint32, Uint32Array, cb) }
    float32arrray(cb: (array: Float32Array) => void) { this.typedArray(DataType.float32, Float32Array, cb) }
    float64arrray(cb: (array: Float64Array) => void) { this.typedArray(DataType.float64, Float64Array, cb) }

    private typedArray<T>(dataType: DataType, ctr: { new(ab: ArrayBuffer): T }, cb: (array: T) => void) {
        if (this.dataType != dataType)
            throw new Error(`type mismatch: ${DataType[this.dataType]} -> ${DataType[dataType]}`)
        cb(new ctr(this.data))
    }
}