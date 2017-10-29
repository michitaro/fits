import { HduDecodeOption, DataType, WorkerRequestMessage, WorkerResponseMessage } from "./common"
type DecodeWorker = Worker
const DecodeWorker = require<{ new(): DecodeWorker }>('worker-loader!./decode_worker')
import { Hdu } from "./hdu"


type Callback = {
    resolve: (hdul: Hdu[]) => void
    reject: (error: any) => void
}


export class Decoder {
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

    close() {
        this.worker!.terminate()
    }
}