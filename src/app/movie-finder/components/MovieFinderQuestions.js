"use client";

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
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useCallback, useState } from 'react';
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";

const InputFormSchema = Yup.object().shape({
  favourite_movie: Yup.string().required("Text is required."),
  movie_era: Yup.string()
  .oneOf(["classic", "modern"], "Movie era is required.")
  .required("Movie era is required."),
  movie_type: Yup.string()
  .oneOf(["action", "comedy", "horror", "romance"], "Movie type is required.")
  .required("Movie type is required."),
});

export default function MovieFinderQuestions() {
  const [topRatedMovies, setTopRatedMovies] = useState('');
  const [chatMessages, setChatMessages] = useState([
    {
      role: "system",
      content: `You are an enthusiastic movie expert who loves recommending movies to people. You will be given two pieces of information - some "movie context" which comes from a vector database about a movie and a "user question" which is the text from the person using the tool. Ensure you differentiate from the movie context and the user question. Your main job is to formulate a short movie recommendation to the user question using the provided movie context. If the answer is not given in the context, find the answer in the conversation history if possible. If you are unsure and cannot find the answer, say, "Sorry, I don't know the answer." Please do not make up the answer. Always speak as if you were chatting to a friend.`,
    },
  ]);
  const form = useForm({
    resolver: yupResolver(InputFormSchema),
    mode: "onTouched",
    reValidateMode: "onChange",
    defaultValues: {
      favourite_movie: "",
      movie_era: "",
      movie_type: "",
    },
  });

  const handleTopRatedMovies = async () => {
    try {
      const response = await fetch("https://openai-api-worker.andrewwoods88.workers.dev/top-rated-movies", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });
      const result = await response.json(); // Change this to .json() instead of .text()
      setTopRatedMovies(result.movies);
      console.log("topRatedMovies", result.movies);
    } catch (error) {
      console.error("Error fetching top rated movies:", error);
      setTopRatedMovies('Error fetching top rated movies');
    }
  }

  const splitMovies = async () => {
    console.log("topRatedMovies", topRatedMovies)
    try {
      const splitter = new RecursiveCharacterTextSplitter({
        chunkSize: 150,
        chunkOverlap: 50,
      })

      // topRatedMovies is now a string, not an array
      const documents = await splitter.createDocuments([topRatedMovies])

      console.log('movies', documents)
      return documents
    } catch (error) {
      console.error('Error splitting movies:', error)
      return [] // Return an empty array if there's an error
    }
  }

  const embedChunks = async (chunks) => {
    try {
      const response = await fetch("https://openai-api-worker.andrewwoods88.workers.dev/embed-chunks", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ chunks }),
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        console.error('Server error:', result);
        throw new Error(`HTTP error! status: ${response.status}, message: ${result.error}`);
      }
      
      console.log('Embedding result:', result);
      return result;
    } catch (error) {
      console.error('Error embedding chunks:', error);
      return [];
    }
  }
  
  const processMovies = async () => {
    try {
      const chunks = await splitMovies();
      if (!chunks || chunks.length === 0) {
        console.log('No chunks to process');
        return;
      }
      console.log('Chunks to process:', chunks);
      const embeddingsOutput = await embedChunks(chunks);
      console.log(`Created embeddings for ${embeddingsOutput.embeddingsCreated} chunks`);
    } catch (error) {
      console.error('Error processing movies:', error);
    }
  }

  const chatCompletion = useCallback(async (text, query) => {
    console.log("text", text);
    console.log("query", query);
    const userMessage = { role: "user", content: `"Movie Context": ${text.result} "User Question": ${query}` }
    
    const updatedMessages = [...chatMessages, userMessage]
    console.log('Adding user message:', updatedMessages)
    setChatMessages(updatedMessages)

    try {
      const response = await fetch("https://openai-api-worker.andrewwoods88.workers.dev/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updatedMessages),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log("API response:", result);

      if (!result.role || !result.content) {
        throw new Error('Unexpected response format from API');
      }

      const aiMessage = {
        role: result.role,
        content: result.content
      }
      console.log("aiMessage", aiMessage);

      const finalMessages = [...updatedMessages, aiMessage];
      console.log('Adding AI message:', finalMessages);
      setChatMessages(finalMessages);

      return aiMessage.content;
    } catch (error) {
      console.error("Error in chatCompletion:", error);
      // Handle the error appropriately, maybe set an error state or return a default message
      return "Sorry, there was an error processing your request.";
    }
  }, [chatMessages])

  const getMovieMatch = async (prompt) => {
    console.log("prompt", prompt);
    try {
      const response = await fetch("https://openai-api-worker.andrewwoods88.workers.dev/handle-matching", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ prompt }),
      });
      const result = await response.json();
      const movieMatch = await chatCompletion(result, prompt.content);
      console.log("movieMatch", movieMatch);
    } catch (error) {
      console.error("Error getting movie match:", error);
    }
  }
  const onSubmit = async (data) => {
    console.log(data);
    const combinedData = `User'sfavourite movie: ${data.favourite_movie} movie era: ${data.movie_era} movie type: ${data.movie_type}`;
    console.log("combinedData", combinedData);
    
    try {
      const embeddingResponse = await fetch("https://openai-api-worker.andrewwoods88.workers.dev/handle-embedding", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ input: combinedData }),
      });
      const embeddingResult = await embeddingResponse.json();
      console.log("embeddingResult", embeddingResult);
      getMovieMatch(embeddingResult);

    } catch (error) {
      console.error("Error embedding data:", error);
    }
  };

  return (
    <div>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <FormField
            name="favourite_movie"
            render={({ field }) => (
              <FormItem>
                <FormLabel>What is your favourite movie and why?</FormLabel>
                <FormControl>
                  <Textarea {...field} />
                </FormControl>
              </FormItem>
            )}
          />
          <FormField
            name="movie_era"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  Do you want something from the olden days or more modern?
                </FormLabel>
                <FormControl>
                  <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="flex">
                  <FormItem className="flex items-center space-x-3 space-y-0 mr-7">
                      <FormControl>
                        <RadioGroupItem value="classic" />
                      </FormControl>
                      <FormLabel className="font-normal">Classic</FormLabel>
                    </FormItem>
                    <FormItem className="flex items-center space-x-3 space-y-0 mr-7">
                      <FormControl>
                        <RadioGroupItem value="modern" />
                      </FormControl>
                      <FormLabel className="font-normal">Modern</FormLabel>
                    </FormItem>
                  </RadioGroup>
                </FormControl>
              </FormItem>
            )}
          />
          <FormField
            name="movie_type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  Do you want something from the olden days or more modern?
                </FormLabel>
                <FormControl>
                  <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="flex">
                  <FormItem className="flex items-center space-x-3 space-y-0 mr-7">
                      <FormControl>
                        <RadioGroupItem value="action" />
                      </FormControl>
                      <FormLabel className="font-normal">Action</FormLabel>
                    </FormItem>
                    <FormItem className="flex items-center space-x-3 space-y-0 mr-7">
                      <FormControl>
                        <RadioGroupItem value="comedy" />
                      </FormControl>
                      <FormLabel className="font-normal">comedy</FormLabel>
                    </FormItem>
                    <FormItem className="flex items-center space-x-3 space-y-0 mr-7">
                      <FormControl>
                        <RadioGroupItem value="horror" />
                      </FormControl>
                      <FormLabel className="font-normal">horror</FormLabel>
                    </FormItem>
                    <FormItem className="flex items-center space-x-3 space-y-0 mr-7">
                      <FormControl>
                        <RadioGroupItem value="romance" />
                      </FormControl>
                      <FormLabel className="font-normal">romance</FormLabel>
                    </FormItem>
                  </RadioGroup>
                </FormControl>
              </FormItem>
            )}
          />
          <Button type="submit">Search</Button>
        </form>
      </Form>
      <Button onClick={handleTopRatedMovies}>Top Rated Movies</Button>
      {topRatedMovies && (
        <div className="mt-4">
          <h3 className="text-lg font-semibold">Top Rated Movies:</h3>
          <p>{topRatedMovies}</p>
         
          <Button onClick={processMovies}>Process Movies</Button>
        </div>
      )}
      {chatMessages.map((message, index) => (
        <div key={index}>{message.content}</div>
      ))}
    </div>
  );
}
