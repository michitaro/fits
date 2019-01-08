import { HduDecodeOption, WorkerRequestMessage, WorkerResponseMessage } from "./common";
import { Hdu } from "./hdu";
type DecodeWorker = Worker
const DecodeWorker = require<{ new(): DecodeWorker }>('worker-loader!./decode_worker')


type Callback = {
    resolve: (hdul: Hdu[]) => void
    reject: (error: any) => void
}


class Decoder {
    private worker?: DecodeWorker
    private requestId = 0
    private callbacks = new Map<number, Callback>()

    decode(fileContent: ArrayBuffer, hduDecodeOptions?: Partial<HduDecodeOption>[]) {
        return new Promise<Hdu[]>((resolve, reject) => {
            const worker = this.setupWorker()
            const requestId = ++this.requestId
            const request: WorkerRequestMessage = {
                requestId,
                fileContent,
                hduDecodeOptions,
            }
            this.callbacks.set(requestId, {
                resolve,
                reject,
            })
            worker.postMessage(request)
        })
    }

    private setupWorker() {
        if (this.worker)
            return this.worker
        this.worker = new DecodeWorker()
        this.worker.addEventListener('message', e => {
            const response: WorkerResponseMessage = e.data
            const { resolve, reject } = this.callbacks.get(response.requestId)!
            response.error ? reject(response.error) : resolve(response.hduSources!.map(Hdu.fromSource))
            this.callbacks.delete(response.requestId)
        })
        return this.worker
    }

    static singleton?: Decoder
}


export async function decode(fileContent: ArrayBuffer, hduDecodeOptions?: Partial<HduDecodeOption>[]) {
    const decoder = Decoder.singleton = Decoder.singleton || new Decoder()
    const start = performance.now()
    console.log('decode start')
    const hdul = await decoder.decode(fileContent, hduDecodeOptions)
    console.log(performance.now() - start)
    return hdul
}