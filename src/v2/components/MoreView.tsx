import { Link } from 'react-router-dom';
import type { BagItem, TripDocument } from '../sampleTrip';

type MoreViewProps = {
  bag: BagItem[];
  documents: TripDocument[];
  onToggleBag?: (id: string) => void;
  onReset?: () => void;
  links: Array<{ label: string; to: string }>;
};

export function MoreView({ bag, documents, onToggleBag, onReset, links }: MoreViewProps) {
  return (
    <div className="mx-auto flex w-full max-w-xl flex-col gap-8">
      <section className="grid gap-2">
        <h2 className="text-sm font-semibold">Maleta</h2>
        {bag.length === 0 && <p className="text-sm text-mutedForeground">La lista de este viaje está vacía.</p>}
        <ul className="grid gap-2">
          {bag.map(item => (
            <li key={item.id}>
              <label className="flex items-center gap-3 text-sm">
                <input
                  type="checkbox"
                  checked={item.packed}
                  onChange={() => onToggleBag?.(item.id)}
                />
                <span className={item.packed ? 'text-mutedForeground line-through' : ''}>{item.name}</span>
              </label>
            </li>
          ))}
        </ul>
      </section>
      <section className="grid gap-2">
        <h2 className="text-sm font-semibold">Papeles</h2>
        {documents.length === 0 && <p className="text-sm text-mutedForeground">No hay documentos en este viaje.</p>}
        <ul className="grid gap-2 text-sm">
          {documents.map(document => (
            <li key={document.id} className="rounded-lg border border-border px-3 py-2">
              <span className="font-medium">{document.title}</span>
              <span className="text-mutedForeground"> · {document.kind}</span>
            </li>
          ))}
        </ul>
      </section>
      {links.length > 0 && (
        <section className="grid gap-2">
          <h2 className="text-sm font-semibold">Cuenta</h2>
          {links.map(link => (
            <Link key={link.to} to={link.to} className="text-sm underline">{link.label}</Link>
          ))}
        </section>
      )}
      {onReset && (
        <button type="button" onClick={onReset} className="w-fit text-sm underline">
          Reiniciar el viaje de prueba
        </button>
      )}
    </div>
  );
}
