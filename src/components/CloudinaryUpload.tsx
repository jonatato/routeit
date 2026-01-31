import { useEffect, useRef } from 'react';
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
  const widgetRef = useRef<any>(null);

  useEffect(() => {
    // Cargar el script de Cloudinary si no está ya cargado
    if (!window.cloudinary) {
      const script = document.createElement('script');
      script.src = 'https://upload-widget.cloudinary.com/latest/CloudinaryUploadWidget.js';
      script.async = true;
      script.onload = () => {
        initWidget();
      };
      document.body.appendChild(script);
    } else {
      initWidget();
    }
  }, []);

  const initWidget = () => {
    if (window.cloudinary) {
      widgetRef.current = window.cloudinary.createUploadWidget(
        {
          cloudName: 'dnx4veyec',
          uploadPreset: 'itinerary_images',
          sources: ['local', 'camera', 'unsplash', 'pexels'],
          folder: 'itinerary-images',
          cropping: true,
          showAdvancedOptions: true,
          multiple: false,
          maxFileSize: 10000000, // 10MB
        },
        (error: any, result: any) => {
          if (!error && result && result.event === 'success') {
            onUpload(result.info.secure_url);
          }
        }
      );
    }
  };

  const handleClick = () => {
    if (widgetRef.current) {
      widgetRef.current.open();
    }
  };

  return (
    <div className="space-y-3">
      <Button
        type="button"
        onClick={handleClick}
        className="gap-2"
        variant="outline"
      >
        <ImagePlus className="w-4 h-4" />
        {currentImage ? 'Cambiar imagen' : 'Subir imagen hero'}
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
