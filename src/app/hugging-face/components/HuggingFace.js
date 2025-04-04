"use client"
import { useState, useEffect } from 'react';
import { HfInference } from "@huggingface/inference";
import { Button } from "@/components/ui/button";
import Image from 'next/image'
import { blobToBase64 } from '@/utils/blob';
import ListHuggingFaceModels from './ListHuggingFaceModels';

const getHfInference = () => {
  const apiKey = process.env.NEXT_PUBLIC_HUGGINGFACE_API_KEY;
  return new HfInference(apiKey);
};

function HuggingFace() {
  const [generatedText, setGeneratedText] = useState('');
  const [classifications, setClassifications] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [translations, setTranslations] = useState([]);
  const [audio, setAudio] = useState(null);
  const [textToImage, settextToImage] = useState(null);
  const [imageToImage, setImageToImage] = useState(null);
  useEffect(() => {

  }, []);

  const generateText = async () => {
    const hf = getHfInference();
    try {
      setLoading(true);
      const result = await hf.textGeneration({
        model: "HuggingFaceH4/zephyr-7b-beta",
        inputs: "Hello, how are you?",
      });
      setGeneratedText(result.generated_text);
    } catch (error) {
      setError('An error occurred while generating text.', error);
    } finally {
      setLoading(false);
    }
  };

  const classifyText = async () => {
    const hf = getHfInference();
    try { 
      const result = await hf.textClassification({
        // model: "distilbert-base-uncased-finetuned-sst-2-english",
        model: "SamLowe/roberta-base-go_emotions",
        inputs: "I love programming in Python!",
      });
      setClassifications(result);
    } catch (error) {
      setError('An error occurred while classifying text.', error);
    } finally {
      setLoading(false);
    }
  };

  const translateText = async () => {
    const hf = getHfInference();
    try { 
      setLoading(true);
      const result = await hf.translation({
        model: "facebook/mbart-large-50-many-to-many-mmt",
        inputs: "I love programming in Python!",
        parameters: {
          src_lang: "en_XX",
          tgt_lang: "fr_XX",
        },
      });
      setTranslations([result]); // Wrap the result in an array
    } catch (error) {
      setError('An error occurred while translating text.', error);
    } finally {
      setLoading(false);
    }
  };

  const textToSpeech = async () => {
    const hf = getHfInference();
    try { 
      setLoading(true);
      const result = await hf.textToSpeech({
        model: "espnet/kan-bayashi_ljspeech_vits",
        inputs: "I love programming in Python!",
      });
      // Create a URL for the blob
      const audioUrl = URL.createObjectURL(result);
      setAudio(audioUrl);
    } catch (error) {
      setError('An error occurred while converting text to speech.', error);
    } finally {
      setLoading(false);
    }
  };

  // const image = "https://placehold.co/600x400";
  // const image2 = "images/old-photo.jpeg";


  const handleTextToImage = async () => {
    const hf = getHfInference()
    try {
      setLoading(true)
      
      // Specify the path to your local image
      const imagePath = '/images/old-photo.jpeg'

      // Fetch the image from the public directory
      const imageResponse = await fetch(imagePath)
      const imageBlob = await imageResponse.blob()

      // Convert blob to base64
      const base64Image = await blobToBase64(imageBlob)
      // Remove the data URL prefix
      const base64Data = base64Image.split(',')[1]

      const result = await hf.textToImage({
        model: 'stabilityai/stable-diffusion-2-1',
        inputs: 'without changing the image contents, add color to the image',
        parameters: {
          negative_prompt: 'blurry, bad quality',
          image: base64Data,
        },
      })
      const newBase64Image = await blobToBase64(result)
      settextToImage(newBase64Image)
    } catch (error) {
      console.error('Detailed error:', error.response ? error.response.data : error)
      setError('An error occurred while converting image to image.')
    } finally {
      setLoading(false)
    }
  };

  const handleImageToImage = async () => {
    const hf = getHfInference()
    const imagePath = '/images/old-photo.jpeg'
    const imageResponse = await fetch(imagePath)
    const imageBlob = await imageResponse.blob()
    const prompt = "An elderly couple walks together on a gravel path with green grass and trees on each side. Wearing neutral-colored clothes, they face awayfrom the camera as they carry their bags.";
    try {
      setLoading(true)
      const result = await hf.imageToImage({
        model: 'ghoskno/Color-Canny-Controlnet-model',
        inputs: imageBlob,
        parameters: {
          prompt: prompt,
          negative_prompt: 'Black and white photo. text, bad anatomy, blurry, low quality',
          strength: 0.8,
        }
      })
      setImageToImage(URL.createObjectURL(result))
    } catch (error) {
      console.error('Detailed error:', error.response ? error.response.data : error)
      setError('An error occurred while converting image to image.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <h1>HuggingFace</h1>
      <div className="space-x-2">
        <Button onClick={generateText}>Generate Text</Button>
        <Button onClick={classifyText}>Classify Text</Button>
        <Button onClick={translateText}>Translate Text</Button>
        <Button onClick={textToSpeech}>Text to Speech</Button>
        <Button onClick={handleTextToImage}>textto Image</Button>
        <Button onClick={handleImageToImage}>Image to Image</Button>
      </div>
      {error && (
        <p>Error: {error}</p>
      )} {generatedText && (
        <p>Generated Text: {generatedText}</p>
      )}  { loading && (
        <p>Loading...</p>
      )}
      {classifications.map((classification, index) => (
        <p key={index}>{classification.label}: {classification.score}</p>
      ))}
      {translations.length > 0 && (
        <p>Translated Text: {translations[0].translation_text}</p>
      )}
      {audio && (
        <audio controls>
          <source src={audio} type="audio/wav" />
          Your browser does not support the audio element.
        </audio>
      )}
        {textToImage && (
          <Image src={textToImage} alt="Image to Image" width={600} height={400} />
        )}
        {imageToImage && (
          <Image src={imageToImage} alt="Image to Image" width={600} height={400} />
        )}

        <ListHuggingFaceModels />
    </div>
  );
}

export default HuggingFace;