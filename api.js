// @ts-check

/**
 * @template T
 * @param {T} value
 * @returns {NonNullable<T>}
 */
export function assert(value) {
  if (value == null) {
    throw new Error('Assertion failed, value expected to be defined!')
  }

  return value
}

/**
 * @param {string} message
 * @param {unknown[]} meta
 */
export function logger(message, ...meta) {
  console.log('[Image from image]', message, ...meta)
}

/**
 * @param {unknown} value
 */
export function toError(value) {
  if (value instanceof Error) {
    return value
  }

  if (typeof value === 'string') {
    return new Error(value)
  }

  if (
    typeof value === 'object' &&
    value !== null &&
    'message' in value &&
    typeof value.message === 'string'
  ) {
    return new Error(value.message)
  }

  return new Error(String(value))
}

/**
 * @type {HTMLElement}
 */
const header = assert(document.querySelector('#header'))

export function clearHeader() {
  header.innerHTML = ''
}

/**
 * @type {HTMLCanvasElement}
 */
const workspaceCanvas = assert(document.querySelector('#canvas-workspace'))

const workspaceCanvasContext = assert(workspaceCanvas.getContext('2d'))

/**
 * @param {HTMLCanvasElement} canvas
 * @param {CanvasRenderingContext2D} context
 */
export function fixCanvasResolution(canvas, context) {
  const dpr = window.devicePixelRatio || 1

  const rect = canvas.getBoundingClientRect()

  canvas.width = rect.width * dpr
  canvas.height = rect.height * dpr

  context.scale(dpr, dpr)
}

export let workspaceMouseDown = false

workspaceCanvas.addEventListener('mousedown', () => {
  workspaceMouseDown = true
})

workspaceCanvas.addEventListener('mouseup', () => {
  workspaceMouseDown = false
})

export let workspaceMouseX = 0
export let workspaceMouseY = 0

workspaceCanvas.addEventListener('mousemove', event => {
  workspaceMouseX = event.clientX
  workspaceMouseY = event.clientY
})

export let workspaceZoom = 2

workspaceCanvas.addEventListener('wheel', event => {
  event.preventDefault()

  const scale = 1.1

  if (event.deltaY < 0) {
    workspaceZoom *= scale
  } else {
    workspaceZoom /= scale
  }

  workspaceZoom = Math.max(0.1, Math.min(15, workspaceZoom))
})

/**
 * @param {string} src
 */
export async function loadImage(src) {
  const image = new Image()
  image.src = src

  await /**
   * @type {Promise<void>}
   */ (
    new Promise(resolve => {
      image.onload = () => {
        resolve()
      }
    })
  )

  return image
}

/**
 * @type {HTMLImageElement | null}
 */
let workspaceImage = null

/**
 * @param {HTMLImageElement} image
 */
export function setWorkspaceImage(image) {
  workspaceImage = image
}

export function removeWorkspaceImage() {
  workspaceImage = null
}

function renderWorkspaceImage() {
  if (!workspaceImage) {
    return
  }

  workspaceCanvasContext.clearRect(
    0,
    0,
    workspaceCanvas.width,
    workspaceCanvas.height
  )

  const ratio = Math.min(workspaceCanvas.width, workspaceCanvas.height)
  const size = Math.min(
    ratio / workspaceImage.width,
    ratio / workspaceImage.height
  )

  if (workspaceMouseDown) {
    workspaceCanvasContext.save()
    workspaceCanvasContext.scale(workspaceZoom, workspaceZoom)
    workspaceCanvasContext.drawImage(
      workspaceImage,
      workspaceCanvas.width / 2 - workspaceMouseX,
      workspaceCanvas.height / 2 - workspaceMouseY,
      workspaceImage.width * size,
      workspaceImage.height * size
    )
    workspaceCanvasContext.restore()

    return
  }

  workspaceZoom = 2

  workspaceCanvasContext.save()
  workspaceCanvasContext.translate(
    workspaceCanvas.width / 2,
    workspaceCanvas.height / 2
  )
  workspaceCanvasContext.drawImage(
    workspaceImage,
    (-workspaceImage.width * size) / 2,
    (-workspaceImage.height * size) / 2,
    workspaceImage.width * size,
    workspaceImage.height * size
  )
  workspaceCanvasContext.restore()
}

function renderWorkspaceCanvas() {
  fixCanvasResolution(workspaceCanvas, workspaceCanvasContext)
  renderWorkspaceImage()
  requestAnimationFrame(renderWorkspaceCanvas)
}

requestAnimationFrame(renderWorkspaceCanvas)

/**
 * @param {string} text
 * @param {() => Promise<void> | void} [callback]
 */
export function addButton(text, callback) {
  const button = document.createElement('button')
  button.className = 'button'
  button.textContent = text

  if (callback) {
    button.addEventListener('click', callback)
  }

  header.append(button)

  return button
}

/**
 * @param {string} text
 * @param {string} href
 */
export function addA(text, href) {
  const a = document.createElement('a')
  a.className = 'a'
  a.textContent = text
  a.href = href
  a.target = '_blank'
  a.rel = 'noopener noreferrer'

  header.append(a)

  return a
}

/**
 * @param {string} text
 */
export function addText(text) {
  const div = document.createElement('div')
  div.className = 'text'
  div.textContent = text

  header.append(div)

  return div
}

/**
 * @param {string} text
 */
export function addScript(text) {
  const script = document.createElement('script')
  script.textContent = text
  script.type = 'module'

  document.head.append(script)

  return script
}

/**
 * @param {string} text
 * @param {number} min
 * @param {number} value
 * @param {number} max
 * @param {(value: number) => Promise<void> | void} [callback]
 */
export function addInputNumber(text, min, value, max, callback) {
  const label = document.createElement('label')

  label.className = 'input-number'

  const input = document.createElement('input')
  input.type = 'number'
  input.value = String(value)
  input.min = String(min)
  input.max = String(max)

  label.append(input)

  label.append(text)

  if (callback) {
    input.addEventListener('input', async () => {
      await callback(input.valueAsNumber)
    })
  }

  header.append(label)

  return label
}

export async function openFileDialog() {
  /**
   * @type {File}
   */
  const file = await new Promise((resolve, reject) => {
    const input = document.createElement('input')

    input.type = 'file'

    input.addEventListener(
      'change',
      event => {
        // @ts-expect-error
        const [file] = Array.from(event.target?.files ?? [])
        if (!file) {
          reject(new Error('File not selected!'))
          return
        }
        resolve(file)
      },
      {
        once: true,
      }
    )

    input.click()
  })

  return file
}

export async function openMultipleFileDialog() {
  /**
   * @type {File[]}
   */
  const files = await new Promise(resolve => {
    const input = document.createElement('input')

    input.type = 'file'
    input.multiple = true

    input.addEventListener(
      'change',
      event => {
        // @ts-expect-error
        resolve(Array.from(event.target?.files ?? []))
      },
      {
        once: true,
      }
    )

    input.click()
  })

  return files
}

/**
 * @param {File} file
 */
export async function fileAsBase64(file) {
  /**
   * @type {string}
   */
  const string = await new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = () => {
      if (typeof reader.result !== 'string') {
        reject(new Error('FileReader result is not a string!'))
        return
      }
      resolve(reader.result)
    }

    reader.onerror = () => {
      reject(reader.error)
    }

    reader.readAsDataURL(file)
  })

  return string
}

/**
 * @param {File} file
 */
export async function fileAsBase64Image(file) {
  const src = await fileAsBase64(file)
  const image = await loadImage(src)
  return image
}

/**
 * @param {HTMLImageElement} image
 */
export async function downLoadImage(image) {
  const { width, height } = image
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height

  const context = assert(canvas.getContext('2d'))
  context.drawImage(image, 0, 0, canvas.width, canvas.height)

  const resultBlob = assert(
    await new Promise(resolve => {
      canvas.toBlob(blob => {
        resolve(blob)
      }, 'image/png')
    })
  )

  const link = document.createElement('a')
  link.href = URL.createObjectURL(resultBlob)
  link.download = 'download.png'

  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)

  URL.revokeObjectURL(link.href)
}

/**
 * @param {HTMLImageElement} image
 */
export function toImageData(image) {
  const canvas = document.createElement('canvas')
  canvas.width = image.width
  canvas.height = image.height

  const context = assert(canvas.getContext('2d'))

  context.drawImage(image, 0, 0)

  return context.getImageData(0, 0, image.width, image.height)
}

/**
 * @param {HTMLImageElement} image
 * @param {number} xSize
 * @param {number} ySize
 */
export async function resizeImage(image, xSize, ySize) {
  /**
   * @type {HTMLImageElement}
   */
  const result = await new Promise(resolve => {
    const canvas = document.createElement('canvas')
    canvas.width = xSize
    canvas.height = ySize

    const context = assert(canvas.getContext('2d'))
    context.drawImage(image, 0, 0, xSize, ySize)

    const resized = new Image()

    resized.onload = () => {
      resolve(resized)
    }

    resized.src = canvas.toDataURL()
  })
  return result
}

/**
 * @param {HTMLCanvasElement} canvas
 */
export async function canvasToImage(canvas) {
  /**
   * @type {HTMLImageElement}
   */
  const result = await new Promise(resolve => {
    const image = new Image()

    image.onload = () => {
      resolve(image)
    }

    image.src = canvas.toDataURL()
  })
  return result
}

/**
 * @param {ImageData} imageData
 * @param {number} x
 * @param {number} y
 */
export function getPixel(imageData, x, y) {
  const i = (y * imageData.width + x) * 4
  return {
    r: imageData.data[i],
    g: imageData.data[i + 1],
    b: imageData.data[i + 2],
    a: imageData.data[i + 3],
  }
}

/**
 * @param {number} r1
 * @param {number} g1
 * @param {number} b1
 * @param {number} r2
 * @param {number} g2
 * @param {number} b2
 */
export function rgbDist(r1, g1, b1, r2, g2, b2) {
  return Math.sqrt((r2 - r1) ** 2 + (g2 - g1) ** 2 + (b2 - b1) ** 2)
}

/**
 * @param {ImageData} imageData
 */
export function accentColor(imageData) {
  let count = 0
  let sumR = 0
  let sumG = 0
  let sumB = 0

  for (let x = 0; x < imageData.width - 1; x++) {
    for (let y = 0; y < imageData.height - 1; y++) {
      count++
      const { r, g, b } = getPixel(imageData, x, y)
      sumR += r
      sumG += g
      sumB += b
    }
  }

  return {
    r: sumR / count,
    g: sumG / count,
    b: sumB / count,
  }
}

/**
 * @param {HTMLImageElement} image
 * @param {HTMLImageElement[]} imagesSheet
 * @param {number} xSize
 * @param {number} ySize
 */
export async function effect(image, imagesSheet, xSize, ySize) {
  const { width, height } = image
  const imageData = toImageData(image)

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const context = assert(canvas.getContext('2d'))

  const sheets = (
    await Promise.all(
      imagesSheet.map(imageSheet => {
        return resizeImage(imageSheet, xSize, ySize)
      })
    )
  ).map(resizedImageSheet => {
    const imageData = toImageData(resizedImageSheet)
    return {
      imageData,
      ...accentColor(imageData),
    }
  })

  for (let x = 0; x < width - 1; x += xSize) {
    for (let y = 0; y < height - 1; y += ySize) {
      let count = 0
      let sumR = 0
      let sumG = 0
      let sumB = 0

      for (let xP = 0; xP < xSize - 1; xP++) {
        for (let yP = 0; yP < ySize - 1; yP++) {
          const xPlus = x + xP
          const yPlus = y + yP
          if (xPlus >= width || yPlus >= height) {
            break
          }
          count++
          const { r, g, b } = getPixel(imageData, xPlus, yPlus)
          sumR += r
          sumG += g
          sumB += b
        }
      }

      let minDist = Infinity
      let closest = sheets[0]

      const avgR = sumR / count
      const avgG = sumG / count
      const avgB = sumB / count

      for (const sheet of sheets) {
        const dist = rgbDist(avgR, avgG, avgB, sheet.r, sheet.g, sheet.b)
        if (dist < minDist) {
          minDist = dist
          closest = sheet
        }
      }

      if (closest) {
        context.putImageData(closest.imageData, x, y)
      }
    }
  }

  const result = await canvasToImage(canvas)

  return result
}
