import { WorkerRequestMessage, WorkerResponseMessage, HduSource, Header, DataType, card } from "./common"


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


const CARD_LENGTH = 80
const CARDS_PER_BLOCK = 36
const BLOCK_SIZE = CARD_LENGTH * CARDS_PER_BLOCK


function decode(request: WorkerRequestMessage): HduSource[] {
    let offset = 0
    const headers: Header[] = []
    const dataBuffers: DataView[] = []

    // parse only headers and stride all HDUs
    for (let hduIndex = 0; offset < request.fileContent.byteLength; ++hduIndex) {
        let header: Header = {}
        while (true) {
            const blockBytes = new Uint8Array(request.fileContent, offset, offset + BLOCK_SIZE)
            offset += BLOCK_SIZE
            const { end, header: newHeader } = parseHeaderBlock(blockBytes)
            header = { ...header, ...newHeader }
            if (end)
                break
        }
        const { byteLength } = calcDataSize(header)
        headers.push(header)
        dataBuffers.push(new DataView(request.fileContent, offset, byteLength))
        offset += align(byteLength, BLOCK_SIZE)
    }

    // fill hduDecodeOptions
    if (request.hduDecodeOptions == undefined)
        request.hduDecodeOptions = headers.map((h, index) => ({
            sourceIndex: index,
            outputDataType: bitpix2dataType(card(h, 'BITPIX', 'number')),
        }))

    return request.hduDecodeOptions.map((o => {
        const header = headers[o.sourceIndex]
        const buffer = dataBuffers[o.sourceIndex]
        const { nPixels } = calcDataSize(header)
        const dataType = o.outputDataType
        const outTypedArray = new ({
            [DataType.float32]: Float32Array,
            [DataType.uint8]: Uint8Array,
        }[dataType])(nPixels)

        if (!o.doNotScaleImageData && card(header, 'BITPIX', 'number') > 0)
            console.warn(`B{SCALE,ZERO} not supported`)

        const picker = ({
            [-32]: (i: number) => buffer.getFloat32(4 * i),
            [8]: (i: number) => buffer.getUint8(i),
        } as { [bitpix: number]: (i: number) => number })[card(header, 'BITPIX', 'number')]

        for (let i = 0; i < nPixels; ++i) {
            outTypedArray[i] = picker(i)
        }

        const data = outTypedArray.buffer

        return { header, data, dataType }
    }))
}


function bitpix2dataType(bitpix: number) {
    switch (bitpix) {
        case 8:
            return DataType.uint8
        case -32:
            return DataType.float32
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


function strip(s: string) {
    return s.match(/\s*(.*?)\s*$/)![1]
}