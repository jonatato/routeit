import { Plus, ExternalLink } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';

interface Document {
  id: string;
  type: 'passport' | 'flight' | 'hotel' | 'insurance' | 'other';
  title: string;
  subtitle?: string;
  expiryDate?: string;
  reference?: string;
  url?: string;
}

interface DocumentsWidgetProps {
  documents: Document[];
  onAddDocument?: () => void;
}

export function DocumentsWidget({ documents, onAddDocument }: DocumentsWidgetProps) {
  const getDocumentIcon = (type: string) => {
    switch (type) {
      case 'passport':
        return '📄';
      case 'flight':
        return '✈️';
      case 'hotel':
        return '🏨';
      case 'insurance':
        return '🛡️';
      default:
        return '📎';
    }
  };

  const getExpiryWarning = (expiryDate?: string) => {
    if (!expiryDate) return null;
    
    const expiry = new Date(expiryDate);
    const now = new Date();
    const daysUntilExpiry = Math.floor((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysUntilExpiry < 0) {
      return { text: 'Expirado', color: 'text-red-600 dark:text-red-400' };
    } else if (daysUntilExpiry < 90) {
      return { text: `Expira en ${daysUntilExpiry} días`, color: 'text-orange-600 dark:text-orange-400' };
    }
    return null;
  };

  return (
    <Card className="transition-all hover:shadow-md">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm">
          <span className="text-lg">🎫</span>
          Documentos & Reservas
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Documents List */}
        {documents.length > 0 ? (
          <div className="space-y-2 max-h-[400px] overflow-y-auto">
            {documents.map((doc) => {
              const warning = getExpiryWarning(doc.expiryDate);
              
              return (
                <div
                  key={doc.id}
                  className="group rounded-lg border border-border bg-card p-3 transition-all hover:border-primary/30 hover:bg-primary/5"
                >
                  <div className="flex items-start gap-3">
                    <div className="text-2xl">{getDocumentIcon(doc.type)}</div>
                    <div className="min-w-0 flex-1">
                      <div className="font-medium text-foreground">{doc.title}</div>
                      {doc.subtitle && (
                        <div className="text-xs text-muted-foreground">{doc.subtitle}</div>
                      )}
                      {doc.reference && (
                        <div className="mt-1 text-xs text-muted-foreground">
                          Ref: {doc.reference}
                        </div>
                      )}
                      {doc.expiryDate && (
                        <div className={`mt-1 text-xs ${warning ? warning.color : 'text-muted-foreground'}`}>
                          {warning ? warning.text : `Expira: ${new Date(doc.expiryDate).toLocaleDateString('es-ES')}`}
                        </div>
                      )}
                    </div>
                    {doc.url && (
                      <a
                        href={doc.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-shrink-0 rounded p-1 text-muted-foreground opacity-0 transition-all hover:bg-muted hover:text-primary group-hover:opacity-100"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="py-8 text-center">
            <div className="mb-2 text-4xl">📄</div>
            <div className="text-sm text-muted-foreground">
              No hay documentos añadidos
            </div>
          </div>
        )}

        {/* Add Document Button */}
        <Button
          onClick={onAddDocument}
          variant="outline"
          size="sm"
          className="w-full"
        >
          <Plus className="mr-2 h-4 w-4" />
          Añadir documento
        </Button>
      </CardContent>
    </Card>
  );
}
