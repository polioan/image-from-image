// @ts-check

import {
  addA,
  addButton,
  addScript,
  setWorkspaceImage,
  fileAsBase64Image,
  openFileDialog,
  openMultipleFileDialog,
  addInputNumber,
  effect,
  downloadImage,
} from '../scripts/api.js'

/**
 * @type {HTMLImageElement | null}
 */
let workspaceImage = null

/**
 * @type {HTMLImageElement[]}
 */
let imagesSheet = []

let xSize = 35

let ySize = 35

addA('Source code', 'https://github.com/polioan/image-from-image')

addButton('Load script', async () => {
  const file = await openFileDialog()
  const text = await file.text()
  addScript(text)
})

addButton('Load image', async () => {
  const file = await openFileDialog()
  const image = await fileAsBase64Image(file)
  setWorkspaceImage(image)
  workspaceImage = image
})

addButton('Load images sheet', async () => {
  const files = await openMultipleFileDialog()
  const images = await Promise.all(
    files.map(file => {
      return fileAsBase64Image(file)
    })
  )
  imagesSheet = images
})

addInputNumber('X size', 1, xSize, 256, value => {
  xSize = value
})

addInputNumber('Y size', 1, ySize, 256, value => {
  ySize = value
})

addButton('Go!', async () => {
  if (!workspaceImage) {
    alert('No workspace image!')
    return
  }

  if (imagesSheet.length < 1) {
    alert('No images sheet!')
    return
  }

  const result = await effect(workspaceImage, imagesSheet, xSize, ySize)

  setWorkspaceImage(result)

  workspaceImage = result
})

addButton('Download', async () => {
  if (!workspaceImage) {
    alert('Nothing to download!')
    return
  }

  await downloadImage(workspaceImage)
})
