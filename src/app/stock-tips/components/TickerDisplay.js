import React from 'react';

export default function TickerDisplay({ tickers }) {
  return (
    <div className="ticker-choice-display">
      {tickers.map((ticker, index) => (
        <span key={index} className="ticker">{ticker}</span>
      ))}
    </div>
  );
}