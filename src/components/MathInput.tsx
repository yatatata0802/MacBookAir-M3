import React, { useState, useEffect } from 'react';
import { Problem } from '../types';
import { motion, AnimatePresence } from 'motion/react';

interface MathInputProps {
  problem: Problem;
  onAnswer: (answer: number) => void;
  useNumpad: boolean;
}

const MathInput: React.FC<MathInputProps> = ({ problem, onAnswer, useNumpad }) => {
  const [inputValue, setInputValue] = useState('');

  useEffect(() => {
    setInputValue('');
  }, [problem]);

  const handleNumpadClick = (val: string) => {
    if (val === 'けす') {
      setInputValue(prev => prev.slice(0, -1));
    } else if (val === 'OK') {
      if (inputValue !== '') {
        onAnswer(parseInt(inputValue));
      }
    } else {
      if (inputValue.length < 3) {
        setInputValue(prev => prev + val);
      }
    }
  };

  return (
    <div className="flex flex-col items-center justify-center w-full max-w-2xl mx-auto p-2 md:p-4">
      <div className="bg-white rounded-2xl p-4 md:p-8 shadow-xl border-4 md:border-8 border-blue-400 mb-4 md:mb-6 w-full text-center">
        <div className="text-4xl md:text-6xl font-bold text-gray-800 tracking-widest">
          {problem.question} = {useNumpad ? (
            <span className="inline-block min-w-[60px] md:min-w-[80px] border-b-4 border-gray-400 text-blue-600">
              {inputValue || '?'}
            </span>
          ) : '?'}
        </div>
      </div>

      <AnimatePresence mode="wait">
        {!useNumpad ? (
          <motion.div 
            key="choices"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="grid grid-cols-2 gap-4 md:gap-6 w-full max-w-lg"
          >
            {problem.options.map((opt) => (
              <button
                key={opt}
                onClick={() => onAnswer(opt)}
                className="bg-yellow-400 hover:bg-yellow-500 active:scale-95 transition-all text-white text-3xl md:text-5xl font-bold py-6 md:py-10 rounded-2xl md:rounded-3xl shadow-[0_6px_0_rgb(202,138,4)] md:shadow-[0_10px_0_rgb(202,138,4)] border-2 md:border-4 border-white"
              >
                {opt}
              </button>
            ))}
          </motion.div>
        ) : (
          <motion.div 
            key="numpad"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="grid grid-cols-4 gap-3 w-full"
          >
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 0].map((num) => (
              <button
                key={num}
                onClick={() => handleNumpadClick(num.toString())}
                className="bg-green-400 hover:bg-green-500 active:scale-95 transition-all text-white text-3xl font-bold py-4 rounded-xl shadow-[0_6px_0_rgb(22,163,74)] border-2 border-white"
              >
                {num}
              </button>
            ))}
            <button
              onClick={() => handleNumpadClick('けす')}
              className="bg-red-400 hover:bg-red-500 active:scale-95 transition-all text-white text-xl font-bold py-4 rounded-xl shadow-[0_6px_0_rgb(220,38,38)] border-2 border-white col-span-1"
            >
              けす
            </button>
            <button
              onClick={() => handleNumpadClick('OK')}
              className="bg-blue-500 hover:bg-blue-600 active:scale-95 transition-all text-white text-2xl font-bold py-4 rounded-xl shadow-[0_6px_0_rgb(37,99,235)] border-2 border-white col-span-1"
            >
              OK
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default MathInput;
