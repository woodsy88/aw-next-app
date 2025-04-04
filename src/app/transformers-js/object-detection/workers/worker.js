// https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Using_web_workers
console.log('Worker script started')

import { pipeline, env } from "@xenova/transformers"

console.log('Imports completed')

env.allowLocalModels = false

class PipelineSingleton {
  static task = 'object-detection'
  static model = 'Xenova/yolos-tiny'
  static instance = null

  // self is the worker

  static async getInstance(progress_callback = null) {
    if (this.instance === null) {
      self.postMessage({ status: 'progress', message: 'Starting to load model...' })
      try {
        this.instance = await pipeline(this.task, this.model, { progress_callback })
        self.postMessage({ status: 'progress', message: 'Model loaded successfully' })
      } catch (error) {
        self.postMessage({ status: 'error', message: `Error loading model: ${error.message}` })
        throw error
      }
    }
    return this.instance
  }
}

self.postMessage({ status: 'progress', message: 'Worker initialized' })

console.log('Worker initialization complete')

// Immediately invoke this function to set up the model
;(async function() {
  try {
    self.postMessage({ status: 'progress', message: 'Starting model initialization' })
    self.detector = await PipelineSingleton.getInstance(x => {
      self.postMessage({ status: 'progress', message: `Loading model: ${JSON.stringify(x)}` })
    })
    self.postMessage({ status: 'ready' })
  } catch (error) {
    self.postMessage({ status: 'error', message: `Failed to initialize model: ${error.message}` })
  }
})()

self.addEventListener('message', async (event) => {
  self.postMessage({ status: 'progress', message: 'Received message in worker' })
  if (!self.detector) {
    self.postMessage({ status: 'error', message: 'Model not loaded' })
    return
  }

  try {
    self.postMessage({ status: 'progress', message: 'Starting object detection' })
    const output = await self.detector(event.data.image, {
      threshold: 0.95,
      percentage: true
    })

    self.postMessage({
      status: 'complete',
      output: output,
    })
  } catch (error) {
    self.postMessage({ status: 'error', message: `Error during detection: ${error.message}` })
  }
})