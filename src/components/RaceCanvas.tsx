import React, { useEffect, useRef } from 'react';
import { CarState } from '../types';
import { RACE_DISTANCE } from '../constants';

interface RaceCanvasProps {
  cars: CarState[];
  playerProgress: number; // 0 to 1
  isBoosting: boolean;
  lastCorrectTime: number;
}

const RaceCanvas: React.FC<RaceCanvasProps> = ({ cars, playerProgress, isBoosting, lastCorrectTime }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestRef = useRef<number>(null);
  const imageCache = useRef<{ [key: string]: HTMLImageElement }>({});

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const render = () => {
      const width = canvas.width;
      const height = canvas.height;

      // Clear
      ctx.clearRect(0, 0, width, height);

      // Draw Background (Stadium Floor)
      ctx.fillStyle = '#1e293b'; // Dark Slate
      ctx.fillRect(0, 0, width, height);

      // Draw Digital Grid on floor
      ctx.strokeStyle = 'rgba(59, 130, 246, 0.2)';
      ctx.lineWidth = 1;
      for (let i = 0; i < width; i += 40) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i, height);
        ctx.stroke();
      }
      for (let j = 0; j < height; j += 40) {
        ctx.beginPath();
        ctx.moveTo(0, j);
        ctx.lineTo(width, j);
        ctx.stroke();
      }

      // Draw Central Poke Ball Logo (Large, subtle)
      ctx.save();
      ctx.translate(width / 2, height / 2);
      ctx.globalAlpha = 0.1;
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 10;
      ctx.beginPath();
      ctx.arc(0, 0, 80, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(-80, 0);
      ctx.lineTo(80, 0);
      ctx.stroke();
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.arc(0, 0, 20, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // Draw Lanes (Glowing Digital Lines)
      ctx.setLineDash([]);
      for (let i = 1; i < cars.length; i++) {
        const y = (height / cars.length) * i;
        
        // Outer Glow
        ctx.strokeStyle = 'rgba(59, 130, 246, 0.3)';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();

        // Inner Bright Line
        ctx.strokeStyle = '#60a5fa';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // Draw Goal Line (High-Tech Finish)
      const goalX = width * 0.9;
      const gradient = ctx.createLinearGradient(goalX, 0, goalX + 30, 0);
      gradient.addColorStop(0, 'rgba(59, 130, 246, 0.8)');
      gradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.9)');
      gradient.addColorStop(1, 'rgba(59, 130, 246, 0.8)');
      
      ctx.fillStyle = gradient;
      ctx.fillRect(goalX, 0, 30, height);
      
      // Goal Line Particles/Detail
      ctx.fillStyle = '#fff';
      for (let i = 0; i < height; i += 10) {
        if ((i / 10) % 2 === 0) {
          ctx.fillRect(goalX + 12, i, 6, 6);
        }
      }

      // Draw Shockwave Effect
      const timeSinceCorrect = Date.now() - lastCorrectTime;
      if (timeSinceCorrect < 400) {
        const progress = timeSinceCorrect / 400;
        const playerCar = cars.find(c => c.isPlayer);
        if (playerCar) {
          const playerX = (playerCar.position / RACE_DISTANCE) * (width * 0.9);
          const playerY = (height / cars.length) * cars.indexOf(playerCar) + (height / (cars.length * 2));
          
          ctx.strokeStyle = `rgba(255, 255, 255, ${1 - progress})`;
          ctx.lineWidth = 4;
          ctx.beginPath();
          ctx.arc(playerX, playerY, progress * 200, 0, Math.PI * 2);
          ctx.stroke();
        }
      }

      // Draw Cars
      cars.forEach((car, index) => {
        const laneY = (height / cars.length) * index + (height / (cars.length * 2));
        const x = (car.position / RACE_DISTANCE) * (width * 0.9); 

        // Draw Pokemon Image
        let img = imageCache.current[car.image];
        if (!img) {
          img = new Image();
          img.src = car.image;
          img.referrerPolicy = "no-referrer";
          imageCache.current[car.image] = img;
        }
        
        // Shake effect if recently hit
        let drawX = x;
        let drawY = laneY;
        if (!car.isPlayer && timeSinceCorrect < 400) {
          drawX += (Math.random() - 0.5) * 10;
          drawY += (Math.random() - 0.5) * 10;
        }

        if (img.complete) {
          ctx.drawImage(img, drawX - 30, drawY - 30, 60, 60);
        } else {
          // Fallback while loading
          ctx.fillStyle = '#FFD700';
          ctx.beginPath();
          ctx.arc(drawX, drawY, 20, 0, Math.PI * 2);
          ctx.fill();
        }

        // Boost effect
        if (car.isPlayer && isBoosting) {
          ctx.fillStyle = 'rgba(255, 165, 0, 0.5)';
          ctx.beginPath();
          ctx.moveTo(x - 35, laneY);
          ctx.lineTo(x - 80, laneY - 25);
          ctx.lineTo(x - 80, laneY + 25);
          ctx.closePath();
          ctx.fill();
        }

        // Name Tag
        ctx.fillStyle = '#FFF';
        ctx.font = 'bold 14px sans-serif';
        ctx.textAlign = 'center';
        ctx.shadowColor = 'rgba(0,0,0,0.5)';
        ctx.shadowBlur = 4;
        ctx.fillText(car.name, x, laneY - 35);
        ctx.shadowBlur = 0;
      });

      requestRef.current = requestAnimationFrame(render);
    };

    requestRef.current = requestAnimationFrame(render);
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [cars, isBoosting, lastCorrectTime]);

  return (
    <div className="w-full h-32 md:h-40 lg:h-48 bg-gray-800 rounded-xl overflow-hidden border-4 border-gray-700 shadow-inner relative">
      <canvas
        ref={canvasRef}
        width={800}
        height={192}
        className="w-full h-full object-contain"
      />
      {/* Progress Bar */}
      <div className="absolute top-2 left-1/2 -translate-x-1/2 w-1/2 h-2 bg-gray-600 rounded-full overflow-hidden">
        <div 
          className="h-full bg-yellow-400 transition-all duration-300"
          style={{ width: `${playerProgress * 100}%` }}
        />
      </div>
    </div>
  );
};

export default RaceCanvas;
