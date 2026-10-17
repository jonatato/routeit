import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import PreviewApp from './PreviewApp';

function render(path: string) {
  return renderToStaticMarkup(
    <MemoryRouter initialEntries={[path]}>
      <PreviewApp />
    </MemoryRouter>,
  );
}

describe('vista previa del viaje de Lisboa', () => {
  it('abre el sábado 17 a las 9:15 en la llegada', () => {
    const html = render('/preview');
    expect(html).toContain('Lisboa, fin de semana');
    expect(html).toContain('Ahora');
    expect(html).toContain('Llegada a Lisboa');
    expect(html).toContain('Siguiente');
    expect(html).toContain('Tranvía 28');
    expect(html).toContain('Falta el billete de Llegada a Lisboa.');
    expect(html).toContain('Sin marcar: Adaptador.');
    expect(html).toContain('Hay un saldo por saldar.');
  });

  it('muestra el plan, el saldo y la maleta', () => {
    expect(render('/preview/plan')).toContain('Añadir actividad');
    const money = render('/preview/money');
    expect(money).toContain('Time Out Market');
    expect(money).toContain('Ana paga a Luis');
    expect(render('/preview/more')).toContain('Hotel Baixa');
    expect(render('/preview/more')).toContain('Pasaporte');
  });
});
