"use client"
import OpenAI from "openai";
import { useState } from "react";
const openai = new OpenAI({
  apiKey: process.env.NEXT_PUBLIC_OPEN_AI_API_KEY,
  dangerouslyAllowBrowser: true,
});

const simpleText = "The quick brown fox jumped over the lazy dog";
const arrayOfText = ["simple text", "another simple text", "yet another simple text"];

async function chunkEmbeddings(arrayOfText) {
  try {
    const results = await Promise.all(arrayOfText.map(async (text) => {
      const embeddingsResponse = await openai.embeddings.create({
        model: 'text-embedding-ada-002',
        input: text,
        encoding_format: 'float',
      })
      return { content: text, embedding: embeddingsResponse.data[0].embedding }
    }))
    console.log('data: ', results)
    return results
  } catch (error) {
    console.error('Error fetching chunk embeddings:', error)
  }
}

const Embeddings = () => {
  const [embeddings, setEmbeddings] = useState([]);
  const fetchEmbeddings = async () => {
    try {
      const response = await openai.embeddings.create({
        model: 'text-embedding-ada-002',
        input: arrayOfText,
        encoding_format: 'float',
      });
      console.log('embedding: ', response);
      // const truncatedEmbeddings = response.data.map(item => ({
      //   ...item,
      //   embedding: item.embedding.slice(0, 10)
      // }))

      const embeddingsObject = response.data.map((item, index) => ({
        text: arrayOfText[index],
        embedding: item.embedding.slice(0, 10)
      }))
      setEmbeddings(embeddingsObject);
    } catch (error) {
      console.error('Error fetching embeddings:', error);
    }
  }
  
  return (
    <div>
      <h1>Embeddings</h1>
      <button onClick={fetchEmbeddings}>Fetch Embeddings</button>
      <button onClick={() => chunkEmbeddings(arrayOfText)}>Chunk Embeddings</button>
      <pre>{JSON.stringify(embeddings, null, 2)}</pre>
    </div>
  )
}

export default Embeddings