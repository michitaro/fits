# Introduction
* [Working demo](https://michitaro.github.io/fits/)

# Requisites
* https://github.com/michitaro/assets-installer-plugin

# Example (Source code of the working demo)
```typescript
import { Fits, DataType } from "@hscmap/fits"
const sampleFitsURL = require<string>('file-loader!./sample.fits')


window.addEventListener('load', async e => {
    const fits = await Fits.fetch(sampleFitsURL, [{ sourceIndex: 0, outputDataType: DataType.uint8, doNotScaleImageData: true }])
    const hdu = fits[0]

    const width = hdu.card('NAXIS1', 'number')
    const height = hdu.card('NAXIS2', 'number')

    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')!
    canvas.width = width
    canvas.height = height

    const imagedata = ctx.createImageData(width, height)
    hdu.uint8array(array => {
        for (let y = 0; y < height; ++y) {
            for (let x = 0; x < width; ++x) {
                const i = y * width + x
                const j = (height - y) * width + x
                imagedata.data[4 * j] = array[i]
                imagedata.data[4 * j + 1] = array[i]
                imagedata.data[4 * j + 2] = array[i]
                imagedata.data[4 * j + 3] = 255
            }
        }
    })
    ctx.putImageData(imagedata, 0, 0)
    document.body.appendChild(canvas)

    const pre = document.createElement('pre')
    pre.innerText = JSON.stringify(hdu.header, undefined, 2)
    document.body.appendChild(pre)
})
```

# See also
* https://fits.gsfc.nasa.gov