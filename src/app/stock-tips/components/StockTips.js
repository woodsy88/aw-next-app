"use client"
import React, { useState } from 'react';
import TickerInput from './TickerInput';
import TickerDisplay from './TickerDisplay';
import ReportGenerator from './ReportGenerator';

export default function StockTips() {
  const [tickers, setTickers] = useState([]);

  const addTicker = (newTicker) => {
    setTickers([...tickers, newTicker.toUpperCase()]);
  };

  return (
    <div>
      <TickerInput addTicker={addTicker} />
      <TickerDisplay tickers={tickers} />
      <ReportGenerator tickers={tickers} />
    </div>
  );
}
