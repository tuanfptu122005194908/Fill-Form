import { useEffect, useRef } from 'react';

interface Petal {
  x: number;
  y: number;
  size: number;
  speedX: number;
  speedY: number;
  rotation: number;
  rotationSpeed: number;
  opacity: number;
  swayPhase: number;
  swaySpeed: number;
}

export default function SakuraEffect() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const petalsRef = useRef<Petal[]>([]);
  const animRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const createPetal = (): Petal => ({
      x: Math.random() * canvas.width,
      y: -20 - Math.random() * 100,
      size: 6 + Math.random() * 10,
      speedX: -0.5 + Math.random() * 1.5,
      speedY: 0.8 + Math.random() * 1.5,
      rotation: Math.random() * Math.PI * 2,
      rotationSpeed: (Math.random() - 0.5) * 0.03,
      opacity: 0.3 + Math.random() * 0.5,
      swayPhase: Math.random() * Math.PI * 2,
      swaySpeed: 0.01 + Math.random() * 0.02,
    });

    for (let i = 0; i < 30; i++) {
      const p = createPetal();
      p.y = Math.random() * canvas.height;
      petalsRef.current.push(p);
    }

    const drawPetal = (p: Petal) => {
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rotation);
      ctx.globalAlpha = p.opacity;

      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.bezierCurveTo(p.size * 0.3, -p.size * 0.5, p.size, -p.size * 0.3, p.size * 0.5, p.size * 0.2);
      ctx.bezierCurveTo(p.size * 0.3, p.size * 0.5, -p.size * 0.1, p.size * 0.3, 0, 0);
      
      const gradient = ctx.createRadialGradient(p.size * 0.25, 0, 0, p.size * 0.25, 0, p.size * 0.6);
      gradient.addColorStop(0, '#FFB7C5');
      gradient.addColorStop(0.5, '#FF8FA3');
      gradient.addColorStop(1, '#FFD6E0');
      ctx.fillStyle = gradient;
      ctx.fill();
      ctx.restore();
    };

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      petalsRef.current.forEach((p) => {
        p.x += p.speedX + Math.sin(p.swayPhase) * 0.8;
        p.y += p.speedY;
        p.rotation += p.rotationSpeed;
        p.swayPhase += p.swaySpeed;

        if (p.y > canvas.height + 20 || p.x < -20 || p.x > canvas.width + 20) {
          Object.assign(p, createPetal());
        }
        drawPetal(p);
      });

      animRef.current = requestAnimationFrame(animate);
    };
    animate();

    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-10"
      style={{ mixBlendMode: 'multiply' }}
    />
  );
}
