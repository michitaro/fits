import { WorkerRequestMessage, WorkerResponseMessage, HduSource, Header, DataType, card, HduDecodeOption } from "./common"
interface gzip {
    unzip(compressed: Uint8Array): number[]
}
const gzip = require<gzip>('gzip-js')


self.addEventListener('message', e => {
    const request: WorkerRequestMessage = e.data
    const mainThread: Worker = self as any
    try {
        const hduSources = decode(request)
        const response: WorkerResponseMessage = {
            requestId: request.requestId,
            hduSources,
        }
        mainThread.postMessage(response, hduSources.map(s => s.data))
    }
    catch (error) {
        const response: WorkerResponseMessage = {
            requestId: request.requestId,
            error,
        }
        mainThread.postMessage(response)
    }
})


function decode(request: WorkerRequestMessage): HduSource[] {
    debugger
    const raw = isGzipped(request.fileContent) ? gzipInflate(request.fileContent) : request.fileContent
    
    const { headers, dataBuffers } = strideArrayBuffer(raw)
    
    if (!request.hduDecodeOptions)
    request.hduDecodeOptions = headers.map((h, i) => ({ sourceIndex: i }))
    
    for (let j = 0; j < request.hduDecodeOptions.length; ++j) {
        const o = request.hduDecodeOptions[j]
        const i = o.sourceIndex == undefined ? (o.sourceIndex = j) : o.sourceIndex
        const h = headers[i]
        o.outputDataType == undefined && (o.outputDataType = DataType.float32)
    }
    
    return request.hduDecodeOptions.map((o: HduDecodeOption) => {
        const header = headers[o.sourceIndex]
        const buffer = dataBuffers[o.sourceIndex]
        const ab = buildTypedArray(header, buffer, o)
        return { header, data: ab, dataType: o.outputDataType }
    })
}


function buildTypedArray(header: Header, dv: DataView, o: HduDecodeOption) {
    const { nPixels } = calcDataSize(header)
    const bitpix = card(header, 'BITPIX', 'number')
    
    let picker: (i: number) => number
    switch (bitpix) {
        case 8:
        picker = i => dv.getUint8(i)
        break
        case 16:
        picker = i => dv.getUint16(i << 1)
            break
        case 32:
            picker = i => dv.getUint32(i << 2)
            break
        case -32:
            picker = i => dv.getFloat32(i << 2)
            break
        case -64:
            picker = i => dv.getFloat64(i << 4)
            break
    }

    let value = (i: number) => picker(i)
    if ([DataType.float32, DataType.float64].indexOf(o.outputDataType) >= 0) {
        const bzero = card(header, 'BZERO', 'number', 0)
        const bscale = card(header, 'BSCALE', 'number', 1)
        value = i => bscale * picker(i) + bzero
    }

    const outArrayFactory = {
        [DataType.uint8]: Uint8Array,
        [DataType.uint16]: Uint16Array,
        [DataType.uint32]: Uint32Array,
        [DataType.float32]: Float32Array,
        [DataType.float64]: Float64Array,
    }[o.outputDataType]

    const array = new outArrayFactory(nPixels)

    for (let i = 0; i < nPixels; ++i)
        array[i] = value(i)

    return array.buffer
}


const CARD_LENGTH = 80
const CARDS_PER_BLOCK = 36
const BLOCK_SIZE = CARD_LENGTH * CARDS_PER_BLOCK


function strideArrayBuffer(ab: ArrayBuffer) {
    let offset = 0
    const headers: Header[] = []
    const dataBuffers: DataView[] = []
    for (let hduIndex = 0; offset < ab.byteLength; ++hduIndex) {
        let header: Header = {}
        while (true) {
            const blockBytes = new Uint8Array(ab, offset, BLOCK_SIZE)
            offset += BLOCK_SIZE
            const { end, header: newHeader } = parseHeaderBlock(blockBytes)
            header = { ...header, ...newHeader }
            if (end)
                break
        }
        const { byteLength } = calcDataSize(header)
        headers.push(header)
        dataBuffers.push(new DataView(ab, offset, byteLength))
        offset += align(byteLength, BLOCK_SIZE)
    }
    return { headers, dataBuffers }
}


function bitpix2dataType(bitpix: number) {
    switch (bitpix) {
        case 8:
            return DataType.uint8
        case 16:
            return DataType.uint16
        case 32:
            return DataType.uint32
        case -32:
            return DataType.float32
        case -64:
            return DataType.float64
        default:
            throw new Error(`unknwon BITPIX: ${bitpix}`)
    }
}


function align(n: number, blockSize: number) {
    return (Math.floor((n - 1) / blockSize) + 1) * blockSize
}


function calcDataSize(header: Header) {
    const naxis = card(header, 'NAXIS', 'number')
    const naxes = range(1, naxis + 1).map(i => card(header, `NAXIS${i}`, 'number'))
    const nPixels = naxes.reduce((memo, next) => memo * next, 1)
    const byteDepth = Math.abs(card(header, 'BITPIX', 'number')) / 8
    const byteLength = nPixels * byteDepth
    return { nPixels, byteDepth, byteLength, naxis, naxes }
}


function range(a: number, b: number) {
    const array: number[] = []
    for (let i = a; i < b; ++i)
        array.push(i)
    return array
}


function parseHeaderBlock(bytes: Uint8Array) {
    const text = String.fromCharCode.apply(String, bytes) as string
    const header: Header = {}
    if (text.length != BLOCK_SIZE)
        throw new Error(`invalid byte sequence: ${text}`)
    let end = false
    cardLoop:
    for (let i = 0; i < CARDS_PER_BLOCK; ++i) {
        const cardString = text.substr(i * CARD_LENGTH, CARD_LENGTH)
        const card = Card.parse(cardString)
        switch (card.type) {
            case CardType.END:
                end = true
                break cardLoop
            case CardType.KEY_VALUE:
                header[card.key!] = card.value
                break
        }
    }
    return { end, header }
}


enum CardType {
    END,
    COMMENT,
    HISTORY,
    KEY_VALUE,
    UNKNOWN,
}


class Card {
    readonly key?: string
    readonly value?: any
    readonly comment?: string

    private constructor(readonly type: CardType, { key, value, comment }: {
        key?: string,
        value?: any,
        comment?: string,
    } = {}) {
        this.key = key
        this.value = value
        this.comment = comment
    }

    static parse(raw: string) {
        switch (raw.substr(0, 8)) {
            case 'END     ':
                return new Card(CardType.END)
            case 'COMMENT ': {
                const comment = strip(raw.substr(8))
                return new Card(CardType.COMMENT, { comment })
            }
            case 'HISTORY ': {
                const comment = strip(raw.substr(8))
                return new Card(CardType.HISTORY, { comment })
            }
            default: {
                let [left, right] = raw.split('=')
                if (!right) {
                    return new Card(CardType.UNKNOWN)
                }
                if (left.match(/^HIERARCH /))
                    left = left.substr(9)
                const key = strip(left)
                const { value, comment } = this.parseValueString(right)
                return new Card(CardType.KEY_VALUE, { key, value, comment })
            }
        }
    }

    private static parseValueString(raw: string) {
        let [valueString, commentString] = raw.split('/')
        let comment: string | undefined
        if (commentString) {
            comment = strip(commentString)
        }
        valueString = strip(valueString)
        let value: any
        if (valueString == 'T')
            value = true
        else if (valueString == 'F')
            value = false
        else if (valueString.substr(0, 1) == "'") {
            value = valueString.substring(1, valueString.length - 1)
        }
        else {
            value = Number(valueString)
        }
        return { value, comment }
    }
}


function isGzipped(ab: ArrayBuffer) {
    const a = new Uint8Array(ab, 0, 2)
    return a[0] == 0x1f && a[1] == 0x8b
}



function gzipInflate(ab: ArrayBuffer) {
    return (new Uint8Array(gzip.unzip(new Uint8Array(ab)))).buffer
}


function strip(s: string) {
    return s.match(/\s*(.*?)\s*$/)![1]
}