import { useState, useCallback, useEffect } from 'react';
import { Button } from './ui/button';
import { ImagePlus } from 'lucide-react';

interface CloudinaryUploadProps {
  onUpload: (url: string) => void;
  currentImage?: string;
}

declare global {
  interface Window {
    cloudinary: any;
  }
}

export function CloudinaryUpload({ onUpload, currentImage }: CloudinaryUploadProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Esperar a que Cloudinary esté disponible
    const checkCloudinary = setInterval(() => {
      if (window.cloudinary) {
        setIsLoading(false);
        clearInterval(checkCloudinary);
      }
    }, 100);

    // Timeout de 5 segundos
    const timeout = setTimeout(() => {
      clearInterval(checkCloudinary);
      if (!window.cloudinary) {
        setError('Error cargando Cloudinary');
        setIsLoading(false);
      }
    }, 5000);

    return () => {
      clearInterval(checkCloudinary);
      clearTimeout(timeout);
    };
  }, []);

  const handleClick = useCallback(() => {
    if (!window.cloudinary) {
      setError('Cloudinary no está disponible');
      return;
    }

    try {
      const widget = window.cloudinary.createUploadWidget(
        {
          cloudName: 'dnx4veyec',
          uploadPreset: 'itinerary_images',
          sources: ['local', 'camera', 'unsplash', 'pexels'],
          folder: 'itinerary-images',
          cropping: true,
          multiple: false,
          maxFileSize: 10000000,
          resourceType: 'image',
        },
        (error: any, result: any) => {
          if (!error && result && result.event === 'success') {
            onUpload(result.info.secure_url);
          }
        }
      );

      widget.open();
    } catch (err) {
      console.error('Error opening Cloudinary widget:', err);
      setError('Error abriendo el widget');
    }
  }, [onUpload]);

  return (
    <div className="space-y-3">
      <Button
        type="button"
        onClick={handleClick}
        className="gap-2"
        variant="outline"
        disabled={isLoading}
      >
        <ImagePlus className="w-4 h-4" />
        {isLoading ? 'Cargando...' : currentImage ? 'Cambiar imagen' : 'Subir imagen hero'}
      </Button>

      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}

      {currentImage && (
        <div className="relative w-full h-48 rounded-lg overflow-hidden border border-border">
          <img
            src={currentImage}
            alt="Hero preview"
            className="w-full h-full object-cover"
          />
        </div>
      )}
    </div>
  );
}
