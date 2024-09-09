import React, { useState } from 'react';

export default function TickerInput({ addTicker }) {
  const [inputValue, setInputValue] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (inputValue.length > 2) {
      addTicker(inputValue);
      setInputValue('');
      setError('');
    } else {
      setError('You must add at least one ticker. A ticker is a 3 letter or more code for a stock. E.g TSLA for Tesla.');
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <label style={{ color: error ? 'red' : 'inherit' }}>
        {error || 'Enter a stock ticker:'}
      </label>
      <input
        type="text"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
      />
      <button type="submit">Add Ticker</button>
    </form>
  );
}