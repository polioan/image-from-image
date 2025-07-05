// @ts-check

import {
  addButton,
  addInputBoolean,
  addInputNumber,
  chopImage,
  clearHeader,
  downloadImage,
  fileAsBase64Image,
  openFileDialog,
  removeWorkspaceImage,
  setWorkspaceImage,
} from '../scripts/api.js'

/**
 * @type {HTMLImageElement | null}
 */
let workspaceImage = null

let xSize = 35

let ySize = 35

let skipWhatNotFitting = true

clearHeader()
removeWorkspaceImage()

addButton('Load image', async () => {
  const file = await openFileDialog()
  const image = await fileAsBase64Image(file)
  setWorkspaceImage(image)
  workspaceImage = image
})

addInputNumber('X size', 1, xSize, 256, value => {
  xSize = value
})

addInputNumber('Y size', 1, ySize, 256, value => {
  ySize = value
})

addInputBoolean('Skip what not fitting?', skipWhatNotFitting, value => {
  skipWhatNotFitting = value
})

addButton('Go!', async () => {
  if (!workspaceImage) {
    alert('No workspace image!')
    return
  }

  const images = await chopImage(
    workspaceImage,
    xSize,
    ySize,
    skipWhatNotFitting
  )

  for (const [i, image] of Object.entries(images)) {
    await downloadImage(image, `${Number(i) + 1}.png`)
  }
})
