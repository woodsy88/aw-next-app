"use client"
import { useState } from "react";
import TranslatorForm from "./TranslatorForm";
import TranslationResults from "./TranslationResults";
import ImageForm from "./ImageForm";
import ImageResults from "./ImageResults";


export default function Translator() {
  const [conversation, setConversation] = useState([]);
  const [editingIndex, setEditingIndex] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [imageData, setImageData] = useState(null);
  
  const createAvatar = async (prompt) => {
    console.log("Creating avatar", prompt);
    try {
      console.log("Fetching image", prompt);
      const response = await fetch("https://openai-api-worker.andrewwoods88.workers.dev/generate-image", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ prompt }),
      });
      console.log("Response", response);
      const data = await response.json();
      console.log("Data", data);
      return data.image; // Return the base64 image data directly
    }
    catch (e) {
      console.error(e);
      throw e; // Re-throw the error to be handled by the caller
    }
  }

  const handleTranslation = async (text, language, editIndex = null) => {
    try {
      setErrorMessage("");
      let updatedConversation;
      if (editIndex !== null) {
        updatedConversation = [...conversation.slice(0, editIndex), { role: "user", content: text }];
      } else {
        updatedConversation = [...conversation, { role: "user", content: text }];
      }

      const messages = [
        {
          role: "system",
          content: `You are a ${language} translator. Translate the user's messages from English to ${language}. Maintain context from previous messages if relevant.`,
        },
        ...updatedConversation
      ];

      const response = await fetch("https://openai-api-worker.andrewwoods88.workers.dev/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(messages),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
      }

      const result = await response.json();
      console.log("API response:", result);

      if (typeof result !== 'object' || !result.content) {
        throw new Error("Unexpected response format from API");
      }

      setConversation([...updatedConversation, { role: "assistant", content: result.content }]);
      setEditingIndex(null);
    } catch (error) {
      console.error("Translation error:", error);
      setErrorMessage(`An error occurred while translating: ${error.message}`);
    }
  }

  const handleEdit = (index) => {
    setEditingIndex(index);
  }

  const handleImage = async (description) => {
    const imageData = await createAvatar(description);
    setImageData(imageData);
  }


  return (
    <div className="grid grid-cols-3 gap-4">
      <div className="col-span-1">
        <TranslatorForm 
          onSubmit={handleTranslation} 
          editingMessage={editingIndex !== null ? conversation[editingIndex] : null}
          editingIndex={editingIndex}
        />
        {errorMessage && (
          <div className="mt-4 p-2 bg-red-100 border border-red-400 text-red-700 rounded">
            {errorMessage}
          </div>
        )}
        <ImageForm
        onSubmit={handleImage}
        />
      </div>
      <div className="col-span-2">
        <TranslationResults userAvatar={imageData} conversation={conversation} onEdit={handleEdit} />
        <ImageResults imageData={imageData} />
      </div>
    </div>
  );
}