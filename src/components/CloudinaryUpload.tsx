import { CldUploadWidget } from 'next-cloudinary';
import { Button } from './ui/button';
import { ImagePlus } from 'lucide-react';

interface CloudinaryUploadProps {
  onUpload: (url: string) => void;
  currentImage?: string;
}

export function CloudinaryUpload({ onUpload, currentImage }: CloudinaryUploadProps) {
  return (
    <div className="space-y-3">
      <CldUploadWidget
        uploadPreset="itinerary_images"
        onSuccess={(result: any) => {
          if (result.event === 'success') {
            onUpload(result.info.secure_url);
          }
        }}
      >
        {({ open }) => (
          <Button
            type="button"
            onClick={() => open()}
            className="gap-2"
            variant="outline"
          >
            <ImagePlus className="w-4 h-4" />
            {currentImage ? 'Cambiar imagen' : 'Subir imagen hero'}
          </Button>
        )}
      </CldUploadWidget>

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
