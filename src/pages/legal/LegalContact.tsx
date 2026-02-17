import LegalPageLayout from '../../components/legal/LegalPageLayout';

function LegalContact() {
  return (
    <LegalPageLayout
      title="Contacto legal"
      subtitle="Canales para solicitudes legales, privacidad y ejercicio de derechos."
      lastUpdated="17 de febrero de 2026"
      sections={[
        {
          id: 'canal',
          title: '1. Canal legal y de privacidad',
          content: (
            <>
              <p>Email legal general: legal@routeit.example (placeholder).</p>
              <p>Email privacidad RGPD: privacy@routeit.example (placeholder).</p>
              <p>Dirección postal para notificaciones legales: pendiente de completar.</p>
            </>
          ),
        },
        {
          id: 'derechos',
          title: '2. Formato recomendado para ejercer derechos',
          content: (
            <>
              <p>Incluye en tu solicitud:</p>
              <ul className="list-disc space-y-1 pl-5">
                <li>Nombre y medio de contacto.</li>
                <li>Derecho que deseas ejercer (acceso, rectificación, etc.).</li>
                <li>Descripción del contexto de la solicitud.</li>
                <li>Información para verificar identidad cuando sea necesario.</li>
              </ul>
            </>
          ),
        },
        {
          id: 'plazos',
          title: '3. Plazos de respuesta',
          content: (
            <>
              <p>
                Routeit responderá dentro de los plazos establecidos por la normativa aplicable, en especial el RGPD para
                solicitudes de datos personales.
              </p>
              <p>
                Si no estás conforme con la respuesta, puedes acudir a la autoridad de control competente.
              </p>
            </>
          ),
        },
      ]}
    />
  );
}

export default LegalContact;

