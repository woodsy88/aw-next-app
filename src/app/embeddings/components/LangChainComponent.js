"use client"

// import { CharacterTextSplitter } from "langchain/text_splitter"
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter"
import { useState, useEffect } from 'react'

export default function LangChainComponent() {
  const [text, setText] = useState('')

  useEffect(() => {
    const splitDocument = async () => {
      try {
        const response = await fetch('/podcasts.txt')
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }
        const fetchedText = await response.text()
        setText(fetchedText)
        // console.log("text", fetchedText)
        // const splitter = new CharacterTextSplitter({
        //   separator: " ",
        //   chunkSize: 150,
        //   chunkOverlap: 15,
        // });
        const splitter = new RecursiveCharacterTextSplitter({
          chunkSize: 150,
          chunkOverlap: 15,
        });
        const output = await splitter.createDocuments([fetchedText]);        
        // console.log("output", output)
      } catch (error) {
        console.error('Error fetching document:', error)
      }
    }

    splitDocument()
  }, [])

  return (
    <div>
      <h1>LangChainComponent</h1>
      {text && <p>Document loaded successfully!</p>}
    </div>
  )
}