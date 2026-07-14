'use client';

import { useEffect, useRef } from 'react';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  alpha: number;
  color: string;
  gravity: number;
  size: number;
  type: 'spark' | 'star' | 'trail';
  rotation?: number;
  rotationSpeed?: number;
}

interface Rocket {
  x: number;
  y: number;
  targetY: number;
  vy: number;
  color: string;
  trail: { x: number; y: number; alpha: number }[];
}

export default function FireworksPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const particles: Particle[] = [];
    const rockets: Rocket[] = [];
    const colors = [
      '#ff0844',
      '#ffb199',
      '#ffd23f',
      '#00d9ff',
      '#bf00ff',
      '#ff006e',
      '#8338ec',
      '#3a86ff',
      '#fb5607',
      '#ffbe0b',
    ];

    const drawStar = (ctx: CanvasRenderingContext2D, x: number, y: number, size: number, rotation: number) => {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(rotation);
      ctx.beginPath();
      for (let i = 0; i < 5; i++) {
        const angle = (Math.PI * 2 * i) / 5 - Math.PI / 2;
        const nextAngle = (Math.PI * 2 * (i + 2)) / 5 - Math.PI / 2;
        if (i === 0) {
          ctx.moveTo(Math.cos(angle) * size, Math.sin(angle) * size);
        }
        ctx.lineTo(Math.cos(angle) * size, Math.sin(angle) * size);
        ctx.lineTo(Math.cos(nextAngle) * size, Math.sin(nextAngle) * size);
      }
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    };

    const createFirework = (x: number, y: number) => {
      const particleCount = 80;
      const color = colors[Math.floor(Math.random() * colors.length)];
      const secondaryColor = colors[Math.floor(Math.random() * colors.length)];
      const type = Math.random();

      // Ring explosion
      if (type < 0.3) {
        for (let i = 0; i < particleCount; i++) {
          const angle = (Math.PI * 2 * i) / particleCount;
          const velocity = 3 + Math.random() * 2;
          particles.push({
            x,
            y,
            vx: Math.cos(angle) * velocity,
            vy: Math.sin(angle) * velocity,
            alpha: 1,
            color: i % 2 === 0 ? color : secondaryColor,
            gravity: 0.08,
            size: 3,
            type: 'spark',
          });
        }
      }
      // Star burst
      else if (type < 0.6) {
        for (let i = 0; i < particleCount; i++) {
          const angle = (Math.PI * 2 * i) / particleCount;
          const velocity = 2 + Math.random() * 3;
          particles.push({
            x,
            y,
            vx: Math.cos(angle) * velocity,
            vy: Math.sin(angle) * velocity,
            alpha: 1,
            color,
            gravity: 0.05,
            size: 2 + Math.random() * 2,
            type: 'star',
            rotation: Math.random() * Math.PI * 2,
            rotationSpeed: (Math.random() - 0.5) * 0.2,
          });
        }
      }
      // Willow effect
      else {
        for (let i = 0; i < particleCount * 1.5; i++) {
          const angle = (Math.PI * 2 * i) / (particleCount * 1.5);
          const velocity = 1.5 + Math.random() * 2;
          particles.push({
            x,
            y,
            vx: Math.cos(angle) * velocity,
            vy: Math.sin(angle) * velocity - 1,
            alpha: 1,
            color,
            gravity: 0.15,
            size: 2,
            type: 'trail',
          });
        }
      }
    };

    const launchRocket = () => {
      const x = Math.random() * canvas.width;
      const targetY = Math.random() * (canvas.height * 0.4) + canvas.height * 0.1;
      rockets.push({
        x,
        y: canvas.height,
        targetY,
        vy: -8 - Math.random() * 4,
        color: colors[Math.floor(Math.random() * colors.length)],
        trail: [],
      });
    };

    const animate = () => {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Update and draw rockets
      for (let i = rockets.length - 1; i >= 0; i--) {
        const r = rockets[i];
        r.y += r.vy;
        r.vy += 0.15; // Gravity on rocket

        // Add trail
        r.trail.push({ x: r.x, y: r.y, alpha: 1 });
        if (r.trail.length > 20) r.trail.shift();

        // Draw trail
        for (let j = 0; j < r.trail.length; j++) {
          const t = r.trail[j];
          t.alpha -= 0.05;
          ctx.save();
          ctx.globalAlpha = t.alpha;
          ctx.fillStyle = r.color;
          ctx.beginPath();
          ctx.arc(t.x, t.y, 2, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }

        // Draw rocket
        ctx.save();
        ctx.fillStyle = r.color;
        ctx.shadowBlur = 15;
        ctx.shadowColor = r.color;
        ctx.beginPath();
        ctx.arc(r.x, r.y, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        // Explode when reaching target
        if (r.y <= r.targetY) {
          createFirework(r.x, r.y);
          rockets.splice(i, 1);
        }
      }

      // Update and draw particles
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];

        p.x += p.vx;
        p.y += p.vy;
        p.vy += p.gravity;
        p.vx *= 0.99; // Air resistance
        p.alpha -= 0.008;

        if (p.rotation !== undefined && p.rotationSpeed !== undefined) {
          p.rotation += p.rotationSpeed;
        }

        if (p.alpha <= 0) {
          particles.splice(i, 1);
          continue;
        }

        ctx.save();
        ctx.globalAlpha = p.alpha;
        ctx.fillStyle = p.color;
        ctx.shadowBlur = 10;
        ctx.shadowColor = p.color;

        if (p.type === 'star' && p.rotation !== undefined) {
          drawStar(ctx, p.x, p.y, p.size, p.rotation);
        } else if (p.type === 'trail') {
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();
          // Draw motion blur trail
          ctx.globalAlpha = p.alpha * 0.3;
          ctx.beginPath();
          ctx.arc(p.x - p.vx, p.y - p.vy, p.size * 0.5, 0, Math.PI * 2);
          ctx.fill();
        } else {
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.restore();
      }

      requestAnimationFrame(animate);
    };

    const interval = setInterval(launchRocket, 600);
    launchRocket();
    animate();

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    window.addEventListener('resize', handleResize);

    return () => {
      clearInterval(interval);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <div className="relative w-full h-screen overflow-hidden bg-black">
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />

      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center z-10">
          <div className="relative inline-block">
            <div className="relative">
              <span className="absolute left-[4%] -top-12 text-6xl animate-bounce" style={{ animationDelay: '0s' }}>
                ❤️
              </span>
              <span className="absolute left-[92%] -top-12 text-6xl animate-bounce" style={{ animationDelay: '0.2s' }}>
                ❤️
              </span>
              <h1
                className="text-9xl font-bold mb-4 animate-pulse"
                style={{
                  background: 'linear-gradient(45deg, #ff0844, #ffb199, #ffd23f, #00d9ff, #bf00ff)',
                  backgroundSize: '400% 400%',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                  animation: 'gradient 3s ease infinite',
                  textShadow: '0 0 40px rgba(255, 255, 255, 0.5)',
                }}
              >
                ISHANVI
              </h1>
            </div>
          </div>
          <p className="text-white text-2xl font-light tracking-widest opacity-80">
            ✨ CELEBRATION ✨
          </p>
        </div>
      </div>

      <style jsx>{`
        @keyframes gradient {
          0% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
          100% {
            background-position: 0% 50%;
          }
        }
      `}</style>
    </div>
  );
}
