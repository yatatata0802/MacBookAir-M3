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
    <div className="flex flex-col items-center justify-center w-full max-w-2xl mx-auto p-4">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 md:p-8 shadow-2xl border-4 border-white/20 mb-6 w-full text-center -skew-x-6 relative overflow-hidden"
      >
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-white to-red-500" />
        <div className="text-5xl md:text-7xl font-black text-white tracking-tighter italic drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]">
          {problem.question} = {useNumpad ? (
            <span className="inline-block min-w-[60px] md:min-w-[90px] border-b-8 border-blue-400 text-yellow-300">
              {inputValue || '?'}
            </span>
          ) : '?'}
        </div>
      </motion.div>

      <AnimatePresence mode="wait">
        {!useNumpad ? (
          <motion.div 
            key="choices"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="grid grid-cols-2 gap-4 md:gap-6 w-full max-w-lg"
          >
            {problem.options.map((opt, i) => (
              <button
                key={opt}
                onClick={() => onAnswer(opt)}
                className={`
                  ${i % 4 === 0 ? 'bg-red-500 hover:bg-red-400 shadow-[0_8px_0_rgb(153,27,27)]' : 
                    i % 4 === 1 ? 'bg-blue-500 hover:bg-blue-400 shadow-[0_8px_0_rgb(30,58,138)]' :
                    i % 4 === 2 ? 'bg-yellow-500 hover:bg-yellow-400 shadow-[0_8px_0_rgb(161,98,7)]' :
                    'bg-green-500 hover:bg-green-400 shadow-[0_8px_0_rgb(21,128,61)]'}
                  active:scale-95 active:translate-y-2 active:shadow-none transition-all text-white text-4xl md:text-6xl font-black py-6 md:py-10 rounded-2xl border-4 border-white/30 -skew-x-6 italic
                `}
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
                className="bg-white/10 hover:bg-white/20 active:scale-95 transition-all text-white text-4xl font-black py-6 rounded-2xl shadow-xl border-2 border-white/20 -skew-x-6 italic"
              >
                {num}
              </button>
            ))}
            <button
              onClick={() => handleNumpadClick('けす')}
              className="bg-red-600 hover:bg-red-500 active:scale-95 transition-all text-white text-2xl font-black py-6 rounded-2xl shadow-xl border-2 border-white/20 col-span-1 -skew-x-6 italic"
            >
              DEL
            </button>
            <button
              onClick={() => handleNumpadClick('OK')}
              className="bg-blue-600 hover:bg-blue-500 active:scale-95 transition-all text-white text-3xl font-black py-6 rounded-2xl shadow-xl border-2 border-white/20 col-span-1 -skew-x-6 italic"
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
