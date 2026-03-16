import { useEffect, useRef, useState } from 'react';
import { Button } from './ui/button';
import { ImagePlus } from 'lucide-react';
import { useToast } from '../hooks/useToast';

interface CloudinaryUploadProps {
  onUpload: (url: string) => void;
  currentImage?: string;
  uploadPreset?: string;
  folder?: string;
  resourceType?: 'image' | 'raw' | 'auto';
  sources?: string[];
  cropping?: boolean;
  multiple?: boolean;
  maxFileSize?: number;
  clientAllowedFormats?: string[];
  buttonLabel?: string;
  changeButtonLabel?: string;
  successMessage?: string;
  previewType?: 'image' | 'none';
}

type CloudinaryUploadResult = {
  event?: string;
  info?: { secure_url?: string };
};

type CloudinaryWidget = {
  open: () => void;
};

type CloudinaryGlobal = {
  createUploadWidget: (
    options: Record<string, unknown>,
    callback: (error: unknown, result: CloudinaryUploadResult) => void,
  ) => CloudinaryWidget;
};

declare global {
  interface Window {
    cloudinary?: CloudinaryGlobal;
  }
}

export function CloudinaryUpload({
  onUpload,
  currentImage,
  uploadPreset = 'itinerary_images',
  folder = 'itinerary-images',
  resourceType = 'image',
  sources = ['local', 'url', 'camera', 'unsplash', 'pexels'],
  cropping = true,
  multiple = false,
  maxFileSize = 20000000,
  clientAllowedFormats,
  buttonLabel = 'Buscar portada',
  changeButtonLabel = 'Cambiar portada',
  successMessage = 'Imagen seleccionada exitosamente',
  previewType = 'image',
}: CloudinaryUploadProps) {
  const [isReady, setIsReady] = useState(false);
  const widgetRef = useRef<CloudinaryWidget | null>(null);
  const { success, error: showError } = useToast();

  useEffect(() => {
    // Load Cloudinary widget script from official CDN
    // Using the correct URL from official documentation
    const script = document.createElement('script');
    script.src = 'https://upload-widget.cloudinary.com/latest/global/all.js';
    script.type = 'text/javascript';
    script.async = true;
    
    script.onload = () => {
      // Widget is loaded and ready to use
      if (window.cloudinary) {
        setIsReady(true);
      } else {
        console.error('Cloudinary not found after script load');
        showError('Error cargando el widget de imágenes');
      }
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
          uploadPreset,
          sources,
          folder,
          cropping,
          multiple,
          maxFileSize,
          resourceType,
          clientAllowedFormats,
        },
        (error: unknown, result: CloudinaryUploadResult) => {
          if (!error && result && result.event === 'success' && result.info?.secure_url) {
            onUpload(result.info.secure_url);
            success(successMessage);
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
        {!isReady ? 'Cargando...' : currentImage ? changeButtonLabel : buttonLabel}
      </Button>

      {currentImage && previewType === 'image' && (
        <div className="relative w-full h-48 rounded-lg overflow-hidden border border-border">
          <img
            src={currentImage}
            alt="Cover preview"
            className="w-full h-full object-cover"
          />
        </div>
      )}
    </div>
  );
}
