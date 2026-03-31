import React, { useEffect, useRef } from 'react';
import { CarState } from '../types';
import { RACE_DISTANCE } from '../constants';

interface RaceCanvasProps {
  cars: CarState[];
  playerProgress: number; // 0 to 1
  isBoosting: boolean;
}

const RaceCanvas: React.FC<RaceCanvasProps> = ({ cars, playerProgress, isBoosting }) => {
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

      // Draw Road
      ctx.fillStyle = '#333';
      ctx.fillRect(0, 0, width, height);

      // Draw Lanes
      ctx.strokeStyle = '#FFF';
      ctx.setLineDash([20, 20]);
      ctx.lineWidth = 2;
      for (let i = 1; i < 3; i++) {
        const y = (height / 3) * i;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }
      ctx.setLineDash([]);

      // Draw Goal Line
      const goalX = width * 0.9;
      ctx.fillStyle = '#FFF';
      ctx.fillRect(goalX, 0, 10, height);
      ctx.fillStyle = '#000';
      for (let i = 0; i < height; i += 20) {
        if ((i / 20) % 2 === 0) {
          ctx.fillRect(goalX, i, 10, 10);
          ctx.fillRect(goalX + 10, i + 10, 10, 10);
        }
      }

      // Draw Cars
      cars.forEach((car, index) => {
        const laneY = (height / 3) * index + (height / 6);
        const x = (car.position / RACE_DISTANCE) * (width * 0.9); 

        // Draw Pokemon Image
        let img = imageCache.current[car.image];
        if (!img) {
          img = new Image();
          img.src = car.image;
          img.referrerPolicy = "no-referrer";
          imageCache.current[car.image] = img;
        }
        
        if (img.complete) {
          ctx.drawImage(img, x - 30, laneY - 30, 60, 60);
        } else {
          // Fallback while loading
          ctx.fillStyle = '#FFD700';
          ctx.beginPath();
          ctx.arc(x, laneY, 20, 0, Math.PI * 2);
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
  }, [cars, isBoosting]);

  return (
    <div className="w-full h-48 bg-gray-800 rounded-xl overflow-hidden border-4 border-gray-700 shadow-inner relative">
      <canvas
        ref={canvasRef}
        width={800}
        height={192}
        className="w-full h-full"
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
