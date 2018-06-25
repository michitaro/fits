import { Hdu } from "./hdu"
import { Decoder } from "./decoder"
import { HduDecodeOption, DataType } from "./common"


export class Fits extends Array<Hdu> {
    static DataType = DataType

    constructor() {
        super()
    }

    private static decoder?: Decoder

    static async decode(arraybuffer: ArrayBuffer, hduDecodeOptions?: Partial<HduDecodeOption>[]) {
        this.decoder || (this.decoder = new Decoder())
        return await this.decoder.decode(arraybuffer, hduDecodeOptions)
    }

    static async fetch(url: string, hduDecodeOptions?: Partial<HduDecodeOption>[]) {
        return await this.decode(await ajax(url), hduDecodeOptions)
    }
}


function ajax(url: string) {
    return new Promise<ArrayBuffer>((resolve, reject) => {
        const xhr = new XMLHttpRequest()
        xhr.open('GET', url)
        xhr.addEventListener('load', () => {
            if (xhr.status == 200)
                resolve(xhr.response)
            else
                reject(`status=${xhr.status}`)
        })
        xhr.addEventListener('error', e => reject(e))
        xhr.responseType = 'arraybuffer'
        xhr.send()
    })
}