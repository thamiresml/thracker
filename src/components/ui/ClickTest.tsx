'use client';

import { useState } from 'react';

export default function ClickTest() {
  const [count, setCount] = useState(0);
  
  return (
    <div className="p-4 bg-white rounded-lg shadow-sm mb-4">
      <h3 className="font-medium text-lg mb-2">Click Test</h3>
      <p className="mb-2">Count: {count}</p>
      <button 
        onClick={() => setCount(count + 1)}
        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
      >
        Click Me
      </button>
    </div>
  );
} 