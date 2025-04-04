"use client";

import { useState, useEffect, useRef } from "react";
import Image from 'next/image'

const ObjectDetection = () => {
  const [result, setResult] = useState(null);
  const [status, setStatus] = useState('Initializing...');
  const [imageUrl, setImageUrl] = useState('/images/road.jpeg');
  const imageRef = useRef(null);
  const containerRef = useRef(null);
  const worker = useRef(null);

  useEffect(() => {
    if (!worker.current) {
      console.log('Creating worker...')
      worker.current = new Worker(new URL("../workers/worker.js", import.meta.url), {
        type: "module",
      })
      console.log('Worker created')

      worker.current.onmessage = (event) => {
        console.log('Received message from worker:', event.data)
        const { status, output, message } = event.data;
        switch (status) {
          case "progress":
            setStatus(message);
            break;
          case "ready":
            setStatus("Ready");
            break;
          case "complete":
            setResult(output);
            setStatus("Detection complete");
            break;
          case "error":
            setStatus(`Error: ${message}`);
            console.error('Worker error:', message);
            break;
          default:
            console.log('Unhandled worker message:', event.data);
        }
      };

      worker.current.onerror = (error) => {
        console.error('Worker error:', error)
      }
    }

    // Cleanup function
    return () => {
      if (worker.current) {
        console.log('Terminating worker...')
        worker.current.terminate()
        worker.current = null
      }
    }
  }, []);

  const detectObjects = () => {
    if (worker.current && imageRef.current) {
      console.log('Sending image to worker for detection')
      setStatus("Detecting objects...")
      worker.current.postMessage({ image: imageRef.current.src });
    } else {
      console.log('Worker or image reference not available')
    }
  };

  useEffect(() => {
    if (result && containerRef.current) {
      console.log('Received detection results:', result)
      // Clear previous bounding boxes
      const existingBoxes = containerRef.current.querySelectorAll('.bounding-box')
      existingBoxes.forEach(box => box.remove())
      
      result.forEach(drawObjectBox);
    }
  }, [result]);

  const drawObjectBox = (detectedObject) => {
    console.log('Drawing box for object:', detectedObject)
    const { label, score, box } = detectedObject
    const { xmax, xmin, ymax, ymin } = box

    const color = '#' + Math.floor(Math.random() * 0xFFFFFF).toString(16).padStart(6, 0)
    
    const boxElement = document.createElement('div')
    boxElement.className = 'bounding-box absolute border-2 pointer-events-none'
    
    // Get the actual dimensions of the displayed image
    const imageElement = imageRef.current
    const displayedWidth = imageElement.width
    const displayedHeight = imageElement.height

    Object.assign(boxElement.style, {
      borderColor: color,
      left: `${displayedWidth * xmin}px`,
      top: `${displayedHeight * ymin}px`,
      width: `${displayedWidth * (xmax - xmin)}px`,
      height: `${displayedHeight * (ymax - ymin)}px`,
    })

    const labelElement = document.createElement('span')
    labelElement.textContent = `${label}: ${Math.floor(score * 100)}%`
    labelElement.className = 'absolute top-0 left-0 bg-red-500 text-white text-xs px-1'
    labelElement.style.backgroundColor = color

    boxElement.appendChild(labelElement)
    containerRef.current.appendChild(boxElement)
  };

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Object Detection</h1>
      <div className="relative" ref={containerRef}>
        <Image 
          ref={imageRef}
          src={imageUrl} 
          alt="Object Detection" 
          width={500} 
          height={500}
          onLoadingComplete={(img) => {
            imageRef.current = img
          }}
        />
      </div>
      <button 
        onClick={detectObjects}
        className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        disabled={status !== 'Ready'}
      >
        Detect Objects
      </button>
      <p className="mt-2">{status}</p>
    </div>
  );
}

export default ObjectDetection;