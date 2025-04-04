"use client";

import { useState, useEffect } from "react";
import { openai, supabase } from "../utils/clients";
import content from "../utils/content";
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

const InputFormSchema = Yup.object().shape({
  query: Yup.string().required("Text is required."),
});

function SupaBasePage() {
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState(null);
  const [answer, setAnswer] = useState("");

  const form = useForm({
    resolver: yupResolver(InputFormSchema),
    mode: "onTouched",
    reValidateMode: "onChange",
    defaultValues: {
      query: "",
    },
  });

  useEffect(() => {
    const initializeClients = async () => {
      try {
        // Test the OpenAI connection
        await openai.models.list();

        // Test the Supabase connection by checking if the 'documents' table exists
        const { error } = await supabase
          .from("documents")
          .select("id")
          .limit(1);
        if (error && error.code !== "PGRST116") {
          // PGRST116 means no results, which is fine for our check
          throw error;
        }

        setIsInitialized(true);
      } catch (err) {
        console.error("Error initializing clients:", err);
        setError(err.message);
      }
    };

    initializeClients();
  }, []);

  if (error) {
    return <div>Error: {error}</div>;
  }

  // creates an embedding and adds it to supabase databse
  const handleEmbeddingsAndSupaBase = async (input) => {
    try {
      // Convert single string to array if necessary
      // const inputArray = Array.isArray(input) ? input : [input];

      const data = await Promise.all(
        input.map(async (item) => {
          const embeddingResponse = await openai.embeddings.create({
            model: "text-embedding-ada-002",
            input: item,
          });
          return {
            content: item,
            embedding: embeddingResponse.data[0].embedding,
          };
        })
      );
      console.log("Embedding Complete");

      const { data: insertedData, error } = await supabase
        .from("documents")
        .insert(data)
        .select();

      if (error) {
        console.error("Error inserting documents:", error);
      } else {
        console.log("Supabase insert complete", insertedData);
        // Handle successful insertion (e.g., update UI, show success message)
      }
    } catch (err) {
      console.error("Error in handleEmbeddingsAndSupaBase:", err);
      // Handle any other errors that might occur
    }
  };

  const handleSubmit = form.handleSubmit(async (data) => {
    console.log(data);
    const embedding = await openai.embeddings.create({
      model: "text-embedding-ada-002",
      input: data.query,
    });
    const embeddingData = {
      content: data.query,
      embedding: embedding.data[0].embedding,
    }
    // const embeddingData = await handleEmbeddingsAndSupaBase(data.query);
    console.log("embeddingData", embeddingData);
    // match_documents is a function in supabase that takes in an embedding and returns the documents that are most similar
    const { data: matches, error } = await supabase.rpc('match_documents', {
      query_embedding: embeddingData.embedding,
      match_threshold: 0.5,
      match_count: 1
    })
    // console.log(embeddingData);
    console.log("matches", matches);
    // return matches;
    // return matches[0].content;
    const response = await chatCompletion(matches[0].content, data.query);
    console.log("response", response);
    setAnswer(response);
    
    form.reset({});
  });

// Use OpenAI to make the response conversational
const chatMessages = [{
  role: 'system',
  content: `You are an enthusiastic podcast expert who loves recommending podcasts to people. You will be given two pieces of information - some context about podcasts episodes and a question. Your main job is to formulate a short answer to the question using the provided context. If you are unsure and cannot find the answer in the context, say, "Sorry, I don't know the answer." Please do not make up the answer.` 
}];

const chatCompletion = async (text, query) => {
  console.log("text", text);
  console.log("query", query);
  chatMessages.push({
    role: 'user',
    content: `Context: ${text} Question: ${query}` 
  })
  console.log("chatMessages", chatMessages);
  const chatCompletion = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: chatMessages,
    temperature: 0.5,
    frequency_penalty: 0.5,
  })
  console.log(chatCompletion.choices[0].message.content);
  return chatCompletion.choices[0].message.content;
}

  return (
    <div>
      <h1>SupaBase and OpenAI Integration</h1>
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
              <Button type="submit" disabled={!isInitialized}>Search</Button>
            </form>
          </Form>
      {isInitialized ? (
        <div>
          <p>OpenAI and Supabase clients initialized successfully</p>
          <button onClick={() => handleEmbeddingsAndSupaBase(content)}>
            Embed Content
          </button>
        </div>
      ) : (
        <p>Initializing clients...</p>
      )}
      <p>{answer}</p>
    </div>
  );
}

export default SupaBasePage;
