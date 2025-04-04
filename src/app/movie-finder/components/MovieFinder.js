"use client";

import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { useState, useEffect, useCallback } from "react";
import { useForm } from "react-hook-form";
import * as Yup from "yup";
import { yupResolver } from "@hookform/resolvers/yup";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { openai, supabase } from "../../../utils/clients";

const InputFormSchema = Yup.object().shape({
  query: Yup.string().required("Text is required."),
});

export default function MovieFinder() {
  const [text, setText] = useState("");
  const [chunks, setChunks] = useState([]);
  const [embedChunks, setEmbedChunks] = useState([]);
  const [answer, setAnswer] = useState("");
  const [chatMessages, setChatMessages] = useState([
    {
      role: "system",
      content: `You are an enthusiastic movie expert who loves recommending movies to people. You will be given two pieces of information - some "movie context" which comes from a vector database about a movie and a "user question" which is the text from the person using the tool. Ensure you differentiate from the movie context and the user question. Your main job is to formulate a short answer to the user question using the provided movie context. If the answer is not given in the context, find the answer in the conversation history if possible. If you are unsure and cannot find the answer, say, "Sorry, I don't know the answer." Please do not make up the answer. Always speak as if you were chatting to a friend.`,
    },
  ]);

  /*
  Challenge: Text Splitters, Embeddings, and Vector Databases!
    1. Use LangChain to split the content in movies.txt into smaller chunks.
    2. Use OpenAI's Embedding model to create an embedding for each chunk.
    3. Insert all text chunks and their corresponding embedding
       into a Supabase database table.
 */

  const form = useForm({
    resolver: yupResolver(InputFormSchema),
    mode: "onTouched",
    reValidateMode: "onChange",
    defaultValues: {
      query: "",
    },
  });

  const processDocument = async () => {
    try {
      const chunks = await splitDocument();
      console.log(`Document split into ${chunks.length} chunks`);

      if (chunks.length > 0) {
        const embeddingsOutput = await embeddings(chunks);
        console.log(`Created embeddings for ${embeddingsOutput.length} chunks`);
      }
    } catch (error) {
      console.error("Error processing document:", error);
    }
  };

  const splitDocument = async () => {
    try {
      const response = await fetch("/movies.txt");
      if (!response.ok) {
        throw new Error("Failed to fetch document");
      }
      const fetchedText = await response.text();
      setText(fetchedText);
      const splitter = new RecursiveCharacterTextSplitter({
        chunkSize: 150,
        chunkOverlap: 15,
      });
      const output = await splitter.createDocuments([fetchedText]);
      setChunks(output);
      return output;
    } catch (error) {
      console.error("Error fetching or splitting document:", error);
      throw error;
    }
  };

  const embeddings = async (chunks) => {
    console.log(`Starting embedding creation for ${chunks.length} chunks`);
    const data = await Promise.all(
      chunks.map(async (chunk, index) => {
        try {
          const embeddingResponse = await openai.embeddings.create({
            model: "text-embedding-ada-002",
            input: chunk.pageContent,
          });
          console.log(
            `Created embedding for chunk ${index + 1}/${chunks.length}`
          );
          return {
            content: chunk.pageContent,
            embedding: embeddingResponse.data[0].embedding,
          };
        } catch (error) {
          console.error(
            `Error creating embedding for chunk ${index + 1}:`,
            error
          );
          return {
            content: chunk.pageContent,
            embedding: null,
            error: error.message,
          };
        }
      })
    );

    // Filter out any chunks that failed to get embeddings
    const validData = data.filter((item) => item.embedding !== null);

    // Add the valid data to Supabase
    if (validData.length > 0) {
      try {
        await addToSupabase(validData);
        console.log(`Added ${validData.length} chunks to Supabase`);
      } catch (error) {
        console.error("Error adding data to Supabase:", error);
      }
    } else {
      console.log("No valid data to add to Supabase");
    }

    return data;
  };

  const addToSupabase = async (data) => {
    const { data: insertedData, error } = await supabase
      .from("movies")
      .insert(data)
      .select();
    if (error) {
      console.error("Error inserting movies:", error);
      throw error; // Propagate the error
    } else {
      console.log("Supabase insert complete", insertedData);
      return insertedData;
    }
  };

  const findNearestMatches = async (query) => {
    const { data: matches, error } = await supabase.rpc('match_movies', {
      query_embedding: query,
      match_threshold: 0.5,
      match_count: 4,
    })
    if (error) {
      console.error('Error finding nearest matches:', error)
      return []
    }
    const match = matches.map((match) => match.content).join('\n');
    console.log("match", match);
    return match
  }

  const handleSubmit = form.handleSubmit(async (data) => {
    console.log("form data", data);
    const embedding = await openai.embeddings.create({
      model: "text-embedding-ada-002",
      input: data.query,
    });
    const embeddingData = {
      content: data.query,
      embedding: embedding.data[0].embedding,
    };

    console.log("embeddingData", embeddingData);
    const matches = await findNearestMatches(embeddingData.embedding);

    console.log("matches", matches);

    const response = await chatCompletion(matches, data.query);
    setAnswer(response);
    form.reset({});
  });

  const chatCompletion = useCallback(async (text, query) => {
    const userMessage = { role: "user", content: `"Movie Context": ${text} "User Question": ${query}` }
    
    const updatedMessages = [...chatMessages, userMessage]
    console.log('Adding user message:', updatedMessages)
    setChatMessages(updatedMessages)

    const chatCompletion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: updatedMessages,
    })

    const aiMessage = chatCompletion.choices[0].message

    const finalMessages = [...updatedMessages, aiMessage]
    console.log('Adding AI message:', finalMessages)
    setChatMessages(finalMessages)

    return aiMessage.content
  }, [chatMessages])

  return (
    <div>
      <h1>MovieLangChain</h1>
      <Button onClick={processDocument}>Process Document</Button>
      <Form {...form}>
        <form
          onSubmit={handleSubmit}
          className="w-full flex flex-col align-start"
        >
          <FormField
            name="query"
            render={({ field }) => (
              <FormItem>
                <FormLabel>query</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
              </FormItem>
            )}
          />
          <Button type="submit">Search</Button>
        </form>
      </Form>
      {answer && <p>Answer</p>}
      <p>{answer}</p>
      {/* <div>
        <h2>Chat History:</h2>
        {chatMessages.map((message, index) => (
          <div key={index}>
            <strong>{message.role}:</strong> {message.content}
          </div>
        ))}
      </div> */}
    </div>
  );
}
