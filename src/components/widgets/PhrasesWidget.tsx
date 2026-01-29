import { Volume2, ArrowRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import type { Phrase } from '../../data/itinerary';

interface PhrasesWidgetProps {
  phrases: Phrase[];
  onViewAll?: () => void;
}

export function PhrasesWidget({ phrases, onViewAll }: PhrasesWidgetProps) {
  // Show only top 3-5 most essential phrases
  const essentialPhrases = phrases.slice(0, 5);

  return (
    <Card className="transition-all hover:shadow-md">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm">
          <span className="text-lg">🍜</span>
          Frases Útiles
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Phrases List */}
        {essentialPhrases.length > 0 ? (
          <div className="space-y-3">
            {essentialPhrases.map((phrase, idx) => (
              <div
                key={idx}
                className="rounded-lg border border-border bg-gradient-to-r from-orange-50/50 to-transparent p-3 transition-colors hover:from-orange-50 dark:from-orange-950/10 dark:hover:from-orange-950/20"
              >
                <div className="mb-1 text-sm font-medium text-foreground">
                  {phrase.spanish}
                </div>
                <div className="text-lg font-semibold text-orange-700 dark:text-orange-400">
                  {phrase.chinese}
                </div>
                <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                  <Volume2 className="h-3 w-3" />
                  <span className="italic">{phrase.pinyin}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-8 text-center">
            <div className="mb-2 text-4xl">💬</div>
            <div className="text-sm text-muted-foreground">
              No hay frases añadidas
            </div>
          </div>
        )}

        {/* View All Button */}
        {phrases.length > 5 && onViewAll && (
          <button
            onClick={onViewAll}
            className="flex w-full items-center justify-center gap-1 text-sm text-primary transition-colors hover:underline"
          >
            Ver más frases ({phrases.length - 5} más)
            <ArrowRight className="h-4 w-4" />
          </button>
        )}
      </CardContent>
    </Card>
  );
}
