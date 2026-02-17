import LegalPageLayout from '../../components/legal/LegalPageLayout';

function LegalImprint() {
  return (
    <LegalPageLayout
      title="Aviso legal"
      subtitle="Información identificativa y condiciones de acceso al sitio."
      lastUpdated="17 de febrero de 2026"
      sections={[
        {
          id: 'titular',
          title: '1. Identificación del titular',
          content: (
            <>
              <p>Marca comercial: Routeit.</p>
              <p>Razón social: pendiente de completar (placeholder).</p>
              <p>NIF/CIF/VAT: pendiente de completar (placeholder).</p>
              <p>Domicilio y contacto legal: pendientes de completar.</p>
            </>
          ),
        },
        {
          id: 'condiciones',
          title: '2. Condiciones generales de acceso',
          content: (
            <>
              <p>
                El acceso a Routeit implica aceptar las condiciones de uso vigentes, así como la normativa aplicable en
                cada jurisdicción.
              </p>
              <p>
                El titular puede actualizar contenidos y condiciones para mantener seguridad, disponibilidad y cumplimiento
                legal.
              </p>
            </>
          ),
        },
        {
          id: 'responsabilidad',
          title: '3. Responsabilidad sobre contenidos y enlaces',
          content: (
            <>
              <p>
                Routeit no garantiza ausencia total de errores o interrupciones, aunque aplica medidas razonables para
                prevenir incidencias.
              </p>
              <p>
                Los enlaces a sitios de terceros se facilitan con carácter informativo; Routeit no controla sus contenidos ni
                políticas externas.
              </p>
            </>
          ),
        },
      ]}
    />
  );
}

export default LegalImprint;

