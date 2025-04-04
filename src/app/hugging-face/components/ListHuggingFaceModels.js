'use client'

import { useState, useEffect } from 'react'
import { listModels } from '@huggingface/hub'

const isModelInferenceEnabled = async (modelName) => {
  const response = await fetch(`https://api-inference.huggingface.co/status/${modelName}`)
  const data = await response.json()
  return data.state === 'Loadable'
}

function ListHuggingFaceModels() {
  const [models, setModels] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    async function fetchModels() {
      try {
        const fetchedModels = []
        for await (const model of listModels({
          credentials: {
            accessToken: process.env.NEXT_PUBLIC_HUGGINGFACE_API_KEY,
          },
          search: {
            task: 'text-generation',
          }
        })) {
          if (model.likes <= 1000) {
            continue
          }
          console.log("model", model)
          if (await isModelInferenceEnabled(model.name)) {
            fetchedModels.push(model)
            if (fetchedModels.length >= 10) break
          }
        }
        setModels(fetchedModels)
      } catch (err) {
        setError(err.message)
      } finally {
        setIsLoading(false)
      }
    }

    fetchModels()
  }, [])

  if (isLoading) return <div>Loading...</div>
  if (error) return <div>Error: {error}</div>

  const sortedModels = models.sort((a, b) => b.likes - a.likes)

  return (
    <div>
      <h1>Hugging Face Models</h1>
      <ul>
        {sortedModels.map(model => (
          <li key={model.id}> <a href={`https://huggingface.co/${model.name}`}>{model.name}</a> - Likes: {model.likes}</li>
        ))}
      </ul>
    </div>
  )
}

export default ListHuggingFaceModels