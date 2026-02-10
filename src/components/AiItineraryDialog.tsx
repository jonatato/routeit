import { useMemo, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import type { AiItineraryAnswers } from '../services/aiItinerary';

type AiItineraryDialogProps = {
  isOpen: boolean;
  isLoading: boolean;
  onClose: () => void;
  onGenerate: (answers: AiItineraryAnswers) => void;
};

const budgetOptions = [
  { value: 'economy', label: 'Economico' },
  { value: 'mid', label: 'Comodo' },
  { value: 'premium', label: 'Premium' },
] as const;

const paceOptions = [
  { value: 'relaxed', label: 'Relajado' },
  { value: 'balanced', label: 'Balanceado' },
  { value: 'intense', label: 'Intenso' },
] as const;

const groupOptions = [
  { value: 'solo', label: 'Solo' },
  { value: 'pareja', label: 'Pareja' },
  { value: 'familia', label: 'Familia' },
  { value: 'amigos', label: 'Amigos' },
  { value: 'trabajo', label: 'Trabajo' },
] as const;


export function AiItineraryDialog({ isOpen, isLoading, onClose, onGenerate }: AiItineraryDialogProps) {
  const [destination, setDestination] = useState('');
  const [startDate, setStartDate] = useState('');
  const [days, setDays] = useState(5);
  const [groupType, setGroupType] = useState<(typeof groupOptions)[number]['value']>('pareja');
  const [travelersCount, setTravelersCount] = useState(2);
  const [budget, setBudget] = useState<AiItineraryAnswers['budget']>('mid');
  const [pace, setPace] = useState<AiItineraryAnswers['pace']>('balanced');
  const [interestsInput, setInterestsInput] = useState('comida, cultura, fotografia');
  const [mustDo, setMustDo] = useState('');
  const [constraints, setConstraints] = useState('');

  const interests = useMemo(
    () => interestsInput.split(',').map(item => item.trim()).filter(Boolean),
    [interestsInput],
  );

  const isValid = destination.trim() && startDate && days > 0 && travelersCount > 0 && interests.length > 0;

  const handleGenerate = () => {
    if (!isValid) return;
    onGenerate({
      destination: destination.trim(),
      startDate,
      days,
      travelers: { count: travelersCount, groupType },
      budget,
      pace,
      interests,
      mustDo: mustDo.trim() || undefined,
      constraints: constraints.trim() || undefined,
      language: 'es',
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Crea un viaje con IA</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className={isLoading ? 'pointer-events-none opacity-50' : undefined}>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Destino principal</label>
              <input
                value={destination}
                onChange={event => setDestination(event.target.value)}
                placeholder="Ej: Tokio, Kioto y Osaka"
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Fecha de inicio</label>
              <input
                type="date"
                value={startDate}
                onChange={event => setStartDate(event.target.value)}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                disabled={isLoading}
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Cantidad de dias</label>
              <input
                type="number"
                min={1}
                value={days}
                onChange={event => setDays(Number(event.target.value))}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Tipo de grupo</label>
              <select
                value={groupType}
                onChange={event => setGroupType(event.target.value as typeof groupType)}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                disabled={isLoading}
              >
                {groupOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Numero de viajeros</label>
              <input
                type="number"
                min={1}
                value={travelersCount}
                onChange={event => setTravelersCount(Number(event.target.value))}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Presupuesto</label>
              <select
                value={budget}
                onChange={event => setBudget(event.target.value as AiItineraryAnswers['budget'])}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                disabled={isLoading}
              >
                {budgetOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Ritmo del viaje</label>
              <select
                value={pace}
                onChange={event => setPace(event.target.value as AiItineraryAnswers['pace'])}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                disabled={isLoading}
              >
                {paceOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Intereses (separados por coma)</label>
              <input
                value={interestsInput}
                onChange={event => setInterestsInput(event.target.value)}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                disabled={isLoading}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Imprescindibles (opcional)</label>
            <textarea
              value={mustDo}
              onChange={event => setMustDo(event.target.value)}
              placeholder="Ej: estudio Ghibli, museos, restaurantes Michelin"
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
              rows={2}
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Restricciones (opcional)</label>
            <textarea
              value={constraints}
              onChange={event => setConstraints(event.target.value)}
              placeholder="Ej: sin actividades muy fisicas, dieta vegetariana"
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
              rows={2}
              disabled={isLoading}
            />
          </div>
        </div>
        </div>

        <div className="flex gap-2 justify-end pt-4">
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Cancelar
          </Button>
          <Button onClick={handleGenerate} disabled={!isValid || isLoading}>
            {isLoading ? 'Generando...' : 'Generar viaje'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
