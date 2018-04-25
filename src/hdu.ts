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

    uint8array() { return this.typedArray(DataType.uint8, Uint8Array) }
    uint16array() { return this.typedArray(DataType.uint16, Uint16Array) }
    uint32array() { return this.typedArray(DataType.uint32, Uint32Array) }
    float32array() { return this.typedArray(DataType.float32, Float32Array) }
    float64array() { return this.typedArray(DataType.float64, Float64Array) }

    private typedArray<T>(dataType: DataType, ctr: { new(ab: ArrayBuffer): T }) {
        if (this.dataType != dataType)
            throw new Error(`type mismatch: ${DataType[this.dataType]} -> ${DataType[dataType]}`)
        return new ctr(this.data)
    }
}