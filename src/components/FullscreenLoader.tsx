import Lottie from 'lottie-react';
import loaderAnimation from '../assets/lottie/loader.json';

type FullscreenLoaderProps = {
  message?: string;
};

function FullscreenLoader({ message = 'Cargando...' }: FullscreenLoaderProps) {
  return (
    <div
      className="fixed inset-0 z-[9999] flex min-h-screen w-full items-center justify-center bg-background/85 backdrop-blur-sm dark:bg-background/92"
      aria-busy="true"
      aria-live="polite"
      role="status"
    >
      <div className="flex flex-col items-center gap-3 text-center">
        <div className="h-80 w-80">
          <Lottie animationData={loaderAnimation} loop />
        </div>
        <p className="text-sm font-medium text-mutedForeground">{message}</p>
      </div>
    </div>
  );
}

export default FullscreenLoader;
