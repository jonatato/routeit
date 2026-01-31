import { useEffect, useRef, useState } from 'react';
import { Button } from './ui/button';
import { ImagePlus } from 'lucide-react';
import { useToast } from '../hooks/useToast';

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
  const [isReady, setIsReady] = useState(false);
  const widgetRef = useRef<any>(null);
  const { success, error: showError } = useToast();

  useEffect(() => {
    // Cargar el script de Cloudinary
    const script = document.createElement('script');
    script.src = 'https://upload-widget.cloudinary.com/latest/CloudinaryUploadWidget.js';
    script.type = 'text/javascript';
    script.async = true;
    
    script.onload = () => {
      setIsReady(true);
    };

    script.onerror = () => {
      console.error('Failed to load Cloudinary widget script');
      showError('Error cargando el widget de imágenes');
    };

    document.head.appendChild(script);

    return () => {
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };
  }, [showError]);

  const handleClick = () => {
    if (!isReady) {
      showError('El widget aún se está cargando');
      return;
    }

    if (!window.cloudinary) {
      showError('Cloudinary no disponible');
      return;
    }

    try {
      widgetRef.current = window.cloudinary.createUploadWidget(
        {
          cloudName: 'dnx4veyec',
          uploadPreset: 'itinerary_images',
          sources: ['local', 'url', 'camera', 'unsplash', 'pexels'],
          folder: 'itinerary-images',
          cropping: true,
          multiple: false,
          maxFileSize: 20000000,
          resourceType: 'image',
        },
        (error: any, result: any) => {
          if (!error && result && result.event === 'success') {
            onUpload(result.info.secure_url);
            success('Imagen seleccionada exitosamente');
          }
        }
      );

      widgetRef.current.open();
    } catch (err) {
      console.error('Error opening widget:', err);
      showError('Error abriendo el widget');
    }
  };

  return (
    <div className="space-y-3">
      <Button
        type="button"
        onClick={handleClick}
        className="gap-2"
        variant="outline"
        disabled={!isReady}
      >
        <ImagePlus className="w-4 h-4" />
        {!isReady ? 'Cargando...' : currentImage ? 'Cambiar imagen' : 'Buscar imagen hero'}
      </Button>

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
