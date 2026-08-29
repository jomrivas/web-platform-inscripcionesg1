import React, { useRef, useEffect, useState } from 'react';

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
    ctx.strokeStyle = '#ccc';
    ctx.lineWidth = 2;
    ctx.strokeRect(0, 0, canvas.width, canvas.height);
  }, [mode]);

  // Manejo de dibujo en canvas
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (mode !== 'canvas') return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

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

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#000';
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
    ctx.strokeStyle = '#ccc';
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

  return (
    <div className="signature-pad-container p-4 border rounded-lg bg-gray-50">
      <label className="block text-sm font-semibold mb-3">{label}</label>

      {/* Selector de modo */}
      <div className="flex gap-4 mb-4">
        <button
          type="button"
          onClick={() => setMode('canvas')}
          className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
            mode === 'canvas'
              ? 'bg-blue-500 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          ✏️ Dibujar
        </button>
        <button
          type="button"
          onClick={() => setMode('upload')}
          className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
            mode === 'upload'
              ? 'bg-blue-500 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          📁 Subir imagen
        </button>
      </div>

      {/* Modo Canvas */}
      {mode === 'canvas' && (
        <div>
          <canvas
            ref={canvasRef}
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
            className="border-2 border-gray-300 rounded cursor-crosshair bg-white w-full"
            style={{ maxWidth: '100%', height: 'auto' }}
          />
          <div className="flex gap-2 mt-3">
            <button
              type="button"
              onClick={clearCanvas}
              className="px-3 py-2 text-sm bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
            >
              Limpiar
            </button>
            <button
              type="button"
              onClick={saveSignature}
              className="px-3 py-2 text-sm bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
            >
              Guardar firma
            </button>
          </div>
        </div>
      )}

      {/* Modo Upload */}
      {mode === 'upload' && (
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
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
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
          >
            Seleccionar imagen de firma
          </button>
          <p className="text-gray-500 text-sm mt-2">
            Soporta: JPG, PNG, GIF
          </p>
        </div>
      )}

      {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
    </div>
  );
};

export default SignaturePad;
