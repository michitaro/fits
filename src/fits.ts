import { ajax } from "./ajax";
import { DataType, HduDecodeOption } from "./common";
import { decode } from "./decoder";
import { Hdu } from "./hdu";


export class Fits extends Array<Hdu> {
    static DataType = DataType

    static async decode(arraybuffer: ArrayBuffer, hduDecodeOptions?: Partial<HduDecodeOption>[]) {
        return await decode(arraybuffer, hduDecodeOptions)
    }

    static async fetch(url: string, hduDecodeOptions?: Partial<HduDecodeOption>[]) {
        return await this.decode(await ajax(url), hduDecodeOptions)
    }
}