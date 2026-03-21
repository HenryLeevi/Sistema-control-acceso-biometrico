import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Camera, Trash2, Check } from 'lucide-react';

export function WebcamCapture({ 
  onSave, 
  maxPhotos = 3 
}: { 
  onSave: (files: File[]) => void, 
  maxPhotos?: number 
}) {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [photos, setPhotos] = useState<File[]>([]);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'user' } 
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      console.error("Camera access denied:", err);
      alert("No se pudo acceder a la cámara.");
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };

  useEffect(() => {
    return () => stopCamera();
  }, [stream]);

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const width = videoRef.current.videoWidth;
      const height = videoRef.current.videoHeight;
      const canvas = canvasRef.current;
      canvas.width = width;
      canvas.height = height;
      
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0, width, height);
        canvas.toBlob((blob) => {
          if (blob) {
            const file = new File([blob], `photo_${Date.now()}.jpg`, { type: 'image/jpeg' });
            setPhotos(prev => [...prev, file]);
          }
        }, 'image/jpeg', 0.9);
      }
    }
  };

  const removePhoto = (index: number) => {
    setPhotos(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-4">
      {!stream ? (
        <Button onClick={startCamera} variant="outline" className="w-full">
          <Camera className="w-4 h-4 mr-2" />
          Encender Cámara
        </Button>
      ) : (
        <div className="space-y-2">
          <div className="relative rounded-lg overflow-hidden bg-black aspect-video flex-center">
            <video 
              ref={videoRef} 
              autoPlay 
              playsInline 
              muted 
              className="w-full h-full object-cover"
            />
            {photos.length < maxPhotos && (
              <Button 
                onClick={capturePhoto} 
                className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full h-12 px-6"
              >
                Capturar Foto ({photos.length}/{maxPhotos})
              </Button>
            )}
          </div>
          <Button onClick={stopCamera} variant="ghost" className="w-full text-xs">
            Apagar Cámara
          </Button>
        </div>
      )}

      {/* Hidden canvas for taking snapshots */}
      <canvas ref={canvasRef} className="hidden" />

      {photos.length > 0 && (
        <div className="space-y-2 border-t pt-4 mt-4">
          <p className="text-sm font-medium">Fotos capturadas ({photos.length}):</p>
          <div className="flex gap-2 overflow-x-auto pb-2">
            {photos.map((file, i) => (
              <div key={i} className="relative w-24 h-24 flex-shrink-0 group rounded bg-slate-100 overflow-hidden">
                <img 
                  src={URL.createObjectURL(file)} 
                  alt={`Captura ${i + 1}`} 
                  className="w-full h-full object-cover"
                />
                <button 
                  onClick={() => removePhoto(i)}
                  className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>

          <Button 
            onClick={() => onSave(photos)} 
            className="w-full"
            disabled={photos.length === 0}
          >
            <Check className="w-4 h-4 mr-2" />
            Usar estas fotos
          </Button>
        </div>
      )}
    </div>
  );
}
