import { useEffect, useMemo, useState } from 'react';
import Lottie from 'lottie-react';
import { AnimatePresence, motion } from 'framer-motion';
import { Dialog, DialogContent } from './ui/dialog';
import routeAnimation from '../assets/lottie/route.json';

type AiItineraryLoadingModalProps = {
  isOpen: boolean;
};

const loadingPhrases = [
  'Estamos haciendo malabares con el mapa 🗺️',
  'Mezclando planes como si fuera un cocktail 🍹',
  'Dandole vueltas al globo terráqueo…',
  'Poniendo orden al caos viajero…',
  'Improvisando… pero bien 😉',
  'Atando cabos, vuelos y hoteles…',
  'Pensando donde comer primero 🤔🍜',
  'Haciendo Tetris con tus dias 🧩',
  'Buscando el equilibrio entre “verlo todo” y “descansar”…',
  'Convenciendo al mapa de que coopere…',
  'Consultando a nuestros expertos imaginarios…',
  'Preguntandole al GPS que opina…',
  'Sobornando al algoritmo con cafe ☕',
  'Evitando planes imposibles (tipo 7 ciudades en 1 dia)',
  'Quitando lo “meh”, dejando lo epico ✨',
  'Ajustando expectativas vs realidad 😅',
  'Haciendo magia sin capa ni varita 🪄',
  'Comprobando que no acabes agotado el dia 2…',
  'Prometemos que esto tiene sentido…',
  'Transformando “no se” en “vamos alla”',
  'El algoritmo esta pensando fuerte 🤯',
  'Calculando… recalculando… recalculado.',
  '0% prisa, 100% buen plan',
  'Procesando vibes viajeras 🌍',
  'El sistema dice: esto va a molar',
  'Entrenando a la IA para que no te haga madrugar demasiado',
  'Buscando planes que no sean trampas para turistas 😉',
  'Generando viaje (sin spoilers)',
  'Debuggeando tu aventura…',
  'Todo bajo control… mas o menos 😎',
  'Un segundo y despegamos ✈️',
  'Ajustando el rumbo…',
  'Cargando aventuras…',
  'Preparando el “wow”',
  'Casi, casi…',
  'Afinando el plan 🔧',
  'En modo explorador 🧭',
  'Dandole forma…',
  'A punto de viajar',
  'Que empiece lo bueno 😏',
];

const shuffle = (values: string[]) => {
  const copy = [...values];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
};

export function AiItineraryLoadingModal({ isOpen }: AiItineraryLoadingModalProps) {
  const shuffled = useMemo(() => shuffle(loadingPhrases), []);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (!isOpen) return;
    const interval = setInterval(() => {
      setIndex(prev => (prev + 1) % shuffled.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [isOpen, shuffled.length]);

  return (
    <Dialog open={isOpen}>
      <DialogContent className="max-w-5xl">
        <div className="flex flex-col items-center gap-6 py-10 text-center">
          <div className="h-72 w-72">
            <Lottie animationData={routeAnimation} loop />
          </div>
          <p className="text-xl font-semibold text-foreground sm:text-2xl">Generando viaje...</p>
          <div className="relative h-16 w-full overflow-hidden">
            <AnimatePresence mode="wait">
              <motion.p
                key={shuffled[index]}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -14 }}
                transition={{ duration: 0.4, ease: 'easeOut' }}
                className="text-lg text-mutedForeground sm:text-xl"
              >
                {shuffled[index]}
              </motion.p>
            </AnimatePresence>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
