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
  const [topRatedMovies, setTopRatedMovies] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [currentRecommendationIndex, setCurrentRecommendationIndex] = useState(0);
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
      const response = await fetch("https://openai-api-worker.andrewwoods88.workers.dev/top-rated-movies-formatted", {
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

  const processMoviesObjects = async () => {
    console.log("topRatedMovies", topRatedMovies)
    try {
      const response = await fetch("https://openai-api-worker.andrewwoods88.workers.dev/embed-movies", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(topRatedMovies),
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

  const chatCompletion = useCallback(async (messages) => {
    console.log('Sending messages to API:', messages)

    try {
      const response = await fetch("https://openai-api-worker.andrewwoods88.workers.dev/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(messages),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log("API response:", result);

      if (!result.content) {
        throw new Error('Unexpected response format from API');
      }

      return result.content;
    } catch (error) {
      console.error("Error in chatCompletion:", error);
      return "Sorry, there was an error processing your request.";
    }
  }, [])

  const getMovieMatch = async (prompt) => {
    console.log('prompt', prompt)
    try {
      const response = await fetch('https://openai-api-worker.andrewwoods88.workers.dev/handle-matching-object', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt }),
      })
      const movies = await response.json()
      console.log('matched movies', movies)

      const movieMatchesWithRecommendations = await Promise.all(
        movies.result.map(async (movie) => {
          const messages = [
            {
              role: "system",
              content: `You are an enthusiastic movie expert who loves recommending movies to people. You will be given a movie overview and your job is to write a fun recommendation based on the overview of the movie you were given. Always speak as if you were chatting to a friend.`,
            },
            {
              role: "user",
              content: `Movie title: ${movie.title} Movie overview: ${movie.content || 'No overview available'}`
            }
          ]
          const chatResponse = await chatCompletion(messages)
          return {
            ...movie,
            recommendation: chatResponse
          }
        })
      )

      console.log('movies with recommendations', movieMatchesWithRecommendations)
      setRecommendations(movieMatchesWithRecommendations)
      setCurrentRecommendationIndex(0)
    } catch (error) {
      console.error('Error getting movie match:', error)
    }
  }

  const showNextRecommendation = () => {
    setCurrentRecommendationIndex((prevIndex) => 
      prevIndex < recommendations.length - 1 ? prevIndex + 1 : prevIndex
    )
  }

  const showPreviousRecommendation = () => {
    setCurrentRecommendationIndex((prevIndex) => 
      prevIndex > 0 ? prevIndex - 1 : prevIndex
    )
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
      <h2>Movie Finder Formatter</h2>
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
      <Button onClick={handleTopRatedMovies}>Get Top Rated Movies</Button>
      {topRatedMovies && (
        <div className="mt-4">
          <h3 className="text-lg font-semibold">Top Rated Movies:</h3>
          {topRatedMovies.map((movie, index) => (
            <div key={index}>
              <div>{movie.title}</div>
              <div>{movie.overview}</div>
              <div>{movie.releaseYear}</div>
            </div>

          ))}
         
          <Button onClick={processMoviesObjects}>Process Movies</Button>
        </div>
      )}
      {recommendations.length > 0 && (
        <div className="mt-4">
          <h3 className="text-lg font-semibold">Movie Recommendation:</h3>
          <img src={recommendations[currentRecommendationIndex].posterUrl} alt={recommendations[currentRecommendationIndex].title} />
          <div>
            <h4>{recommendations[currentRecommendationIndex].title}</h4>
            <p>{recommendations[currentRecommendationIndex].recommendation}</p>
          </div>
          <Button 
            onClick={showPreviousRecommendation}
            disabled={currentRecommendationIndex === 0}
          >
            Previous Recommendation
          </Button>          
          <Button 
            onClick={showNextRecommendation}
            disabled={currentRecommendationIndex === recommendations.length - 1}
          >
            Next Recommendation
          </Button>
 
        </div>
      )}
    </div>
  );
}