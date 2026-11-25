import React, { useRef, useEffect, useState } from 'react';

// Colores del canvas desde los tokens de diseño (spec 005, A1).
const token = (name: string, fallback: string) =>
  (typeof window !== 'undefined' &&
    getComputedStyle(document.documentElement).getPropertyValue(name).trim()) ||
  fallback;

interface SignaturePadProps {
  onSignatureCapture: (data: string, type: 'canvas' | 'image') => void;
  label?: string;
  error?: string;
}

const SignaturePad: React.FC<SignaturePadProps> = ({ 
  onSignatureCapture, 
  label = 'Firma', 
  error 
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [isEmpty, setIsEmpty] = useState(true);
  const [mode, setMode] = useState<'canvas' | 'upload'>('canvas');

  // Inicializar canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Configurar tamaño del canvas
    canvas.width = 500;
    canvas.height = 200;

    // Fondo blanco
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Borde
    ctx.strokeStyle = token('--color-line', 'gainsboro');
    ctx.lineWidth = 2;
    ctx.strokeRect(0, 0, canvas.width, canvas.height);
  }, [mode]);

  const getCanvasPos = (
    canvas: HTMLCanvasElement,
    clientX: number,
    clientY: number
  ) => {
    const rect = canvas.getBoundingClientRect();
    // Escala coordenadas CSS → coordenadas internas del canvas (500x200)
    return {
      x: ((clientX - rect.left) / rect.width) * canvas.width,
      y: ((clientY - rect.top) / rect.height) * canvas.height,
    };
  };

  // Manejo de dibujo en canvas (mouse + táctil)
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (mode !== 'canvas') return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { x, y } = getCanvasPos(canvas, e.clientX, e.clientY);

    setIsDrawing(true);
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || mode !== 'canvas') return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { x, y } = getCanvasPos(canvas, e.clientX, e.clientY);

    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = token('--color-ink', 'black');
    ctx.lineTo(x, y);
    ctx.stroke();

    setIsEmpty(false);
  };

  const startTouch = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (mode !== 'canvas') return;
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const touch = e.touches[0];
    const { x, y } = getCanvasPos(canvas, touch.clientX, touch.clientY);
    setIsDrawing(true);
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const drawTouch = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing || mode !== 'canvas') return;
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const touch = e.touches[0];
    const { x, y } = getCanvasPos(canvas, touch.clientX, touch.clientY);
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = token('--color-ink', 'black');
    ctx.lineTo(x, y);
    ctx.stroke();
    setIsEmpty(false);
  };

  const stopDrawing = () => {
    if (!isDrawing) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.closePath();
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = token('--color-line', 'gainsboro');
    ctx.lineWidth = 2;
    ctx.strokeRect(0, 0, canvas.width, canvas.height);
    setIsEmpty(true);
  };

  const saveSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas || isEmpty) {
      alert('Por favor dibuja una firma');
      return;
    }

    const dataUrl = canvas.toDataURL('image/png');
    onSignatureCapture(dataUrl, 'canvas');
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      onSignatureCapture(dataUrl, 'image');
    };
    reader.readAsDataURL(file);
  };

  const modeBtn = (active: boolean) =>
    `h-11 rounded-[10px] px-3.5 text-sm transition-colors ${
      active
        ? 'bg-surface font-extrabold text-brand shadow-card'
        : 'font-bold text-ink-soft hover:text-ink'
    }`;

  return (
    <div className="signature-pad-container flex flex-col gap-3 rounded-card border-[1.5px] border-line bg-surface p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <span className="text-[15px] font-extrabold">{label}</span>
        {/* Selector de modo */}
        <div className="flex gap-1 rounded-xl bg-canvas p-1">
          <button
            type="button"
            onClick={() => setMode('canvas')}
            aria-pressed={mode === 'canvas'}
            className={modeBtn(mode === 'canvas')}
          >
            Dibujar
          </button>
          <button
            type="button"
            onClick={() => setMode('upload')}
            aria-pressed={mode === 'upload'}
            className={modeBtn(mode === 'upload')}
          >
            Subir imagen
          </button>
        </div>
      </div>

      {/* Modo Canvas */}
      {mode === 'canvas' && (
        <div className="flex flex-col gap-3">
          <canvas
            ref={canvasRef}
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
            onTouchStart={startTouch}
            onTouchMove={drawTouch}
            onTouchEnd={stopDrawing}
            aria-label={`${label}: firma con el dedo o el mouse dentro del recuadro`}
            className="w-full cursor-crosshair touch-none rounded-control border-[1.5px] border-dashed border-on-brand-muted bg-canvas"
            style={{ maxWidth: '100%', height: 'auto' }}
          />
          <p className="text-[13px] text-muted">Firma con el dedo dentro del recuadro y toca «Guardar firma».</p>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={clearCanvas}
              className="h-11 rounded-control border-[1.5px] border-line bg-surface text-sm font-extrabold text-ink-soft hover:bg-canvas"
            >
              Limpiar
            </button>
            <button
              type="button"
              onClick={saveSignature}
              className="h-11 rounded-control bg-brand text-sm font-extrabold text-on-brand hover:bg-brand-hover"
            >
              Guardar firma
            </button>
          </div>
        </div>
      )}

      {/* Modo Upload */}
      {mode === 'upload' && (
        <div className="flex flex-col items-center gap-2 rounded-control border-[1.5px] border-dashed border-on-brand-muted bg-canvas p-6 text-center">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="h-11 rounded-control bg-brand px-5 text-sm font-extrabold text-on-brand hover:bg-brand-hover"
          >
            Seleccionar imagen de firma
          </button>
          <p className="text-[13px] text-muted">Formatos: JPG, PNG o GIF</p>
        </div>
      )}

      {error && <p className="text-[13px] font-bold text-danger">{error}</p>}
    </div>
  );
};

export default SignaturePad;
