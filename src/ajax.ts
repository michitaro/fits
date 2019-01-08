export function ajax(url: string) {
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