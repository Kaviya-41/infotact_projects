/**
 * useCanvasRenderer.ts – Canvas render loop manager structurally prepared for Week 3 Canvas API
 */

import { useEffect, useRef, useCallback } from 'react';

type DrawFn = (ctx: CanvasRenderingContext2D, width: number, height: number, frame: number) => void;

interface CanvasRendererOptions {
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  draw: DrawFn;
}

export const useCanvasRenderer = ({ canvasRef, draw }: CanvasRendererOptions) => {
  const animRef = useRef(0);
  const frameRef = useRef(0);

  const resize = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const parent = canvas.parentElement;
    if (!parent) return;

    canvas.width = parent.clientWidth;
    canvas.height = parent.clientHeight;
  }, [canvasRef]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    resize();
    window.addEventListener('resize', resize);

    const loop = () => {
      const parent = canvas.parentElement;
      if (!parent) return;

      ctx.clearRect(0, 0, parent.clientWidth, parent.clientHeight);
      draw(ctx, parent.clientWidth, parent.clientHeight, frameRef.current);
      frameRef.current++;
      animRef.current = requestAnimationFrame(loop);
    };

    loop();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animRef.current);
    };
  }, [canvasRef, draw, resize]);
};
