import { useState, useRef } from 'react';
import { Button } from './ui/button';
import { ImagePlus } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useToast } from '../hooks/useToast';

interface CloudinaryUploadProps {
  onUpload: (url: string) => void;
  currentImage?: string;
}

export function CloudinaryUpload({ onUpload, currentImage }: CloudinaryUploadProps) {
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { success, error: showError } = useToast();

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validar que sea imagen
    if (!file.type.startsWith('image/')) {
      showError('Solo se permiten imágenes');
      return;
    }

    // Validar tamaño (máx 10MB)
    if (file.size > 10 * 1024 * 1024) {
      showError('La imagen debe ser menor a 10MB');
      return;
    }

    setIsLoading(true);
    try {
      const fileName = `hero-${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${file.type.split('/')[1]}`;
      const filePath = `itinerary-images/${fileName}`;

      const { error: uploadError, data } = await supabase.storage
        .from('images')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) {
        throw uploadError;
      }

      // Obtener URL pública
      const { data: urlData } = supabase.storage.from('images').getPublicUrl(filePath);
      
      if (urlData?.publicUrl) {
        onUpload(urlData.publicUrl);
        success('Imagen subida exitosamente');
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      showError('Error al subir la imagen');
    } finally {
      setIsLoading(false);
      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <div className="space-y-3">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
        disabled={isLoading}
      />

      <Button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        className="gap-2"
        variant="outline"
        disabled={isLoading}
      >
        <ImagePlus className="w-4 h-4" />
        {isLoading ? 'Subiendo...' : currentImage ? 'Cambiar imagen' : 'Subir imagen hero'}
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
