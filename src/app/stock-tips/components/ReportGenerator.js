"use client"
import React, { useState } from 'react';
import { dates } from "@/utils/dates";

export default function ReportGenerator({ tickers }) {
  const [isLoading, setIsLoading] = useState(false);
  const [report, setReport] = useState('');
  const [error, setError] = useState('');

  const fetchStockData = async () => {
    setIsLoading(true);
    setError('');
    try {
      const stockData = await Promise.all(
        tickers.map(async (ticker) => {
          const url = new URL('https://polygon-api-worker.andrewwoods88.workers.dev/');
          url.searchParams.append('ticker', ticker);
          url.searchParams.append('startDate', dates.startDate);
          url.searchParams.append('endDate', dates.endDate);
          
          const response = await fetch(url.toString());
          const data = await response.json();
          
          if (response.status === 200) {
            delete data.request_id;
            return JSON.stringify(data);
          } else {
            throw new Error(`Error fetching data for ${ticker}: ${response.status}`);
          }
        })
      );
      await fetchReport(stockData.join(""));
    } catch (error) {
      setError(`There was an error fetching stock data: ${error.message}`);
      console.error("error: ", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchReport = async (data) => {
    const messages = [
      { 
        role: "system",
        content: "You are a trading guru. Given data on share prices over the past 3 days, write a report of no more than 150 words describing the stocks performance and recommending whether to buy, hold or sell. Use the examples provided between ### to set the style of your response.",
      },
      {
        role: "user",
        content: `Here is the stock data: ${data}.`,
      },
    ];

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
      setReport(result.content);
    } catch (error) {
      setError(`There was an error fetching the report: ${error.message}`);
      console.error("Error fetching report:", error);
    }
  };

  return (
    <div>
      <button onClick={fetchStockData} disabled={tickers.length === 0 || isLoading}>
        Generate Report
      </button>
      {isLoading && <div className="loading-panel">Loading...</div>}
      {error && <div className="error-message">{error}</div>}
      {report && <div className="output-panel">{report}</div>}
    </div>
  );
}