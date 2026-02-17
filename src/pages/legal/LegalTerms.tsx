import LegalPageLayout from '../../components/legal/LegalPageLayout';

function LegalTerms() {
  return (
    <LegalPageLayout
      title="Términos de uso"
      subtitle="Condiciones generales para el uso de Routeit en el marco de la UE."
      lastUpdated="17 de febrero de 2026"
      sections={[
        {
          id: 'objeto',
          title: '1. Objeto del servicio',
          content: (
            <>
              <p>
                Routeit ofrece herramientas de planificación de viajes, colaboración entre usuarios y funciones asociadas
                a recordatorios, checklists y organización de información.
              </p>
              <p>
                Estos términos regulan el acceso y uso de la plataforma por parte de personas físicas o jurídicas.
              </p>
            </>
          ),
        },
        {
          id: 'reglas',
          title: '2. Reglas de uso',
          content: (
            <>
              <p>
                El usuario se compromete a usar Routeit conforme a la ley, la buena fe y sin vulnerar derechos de terceros.
              </p>
              <p>
                Queda prohibido usar la plataforma para actividades ilícitas, introducir contenido malicioso o intentar
                alterar la seguridad del servicio.
              </p>
            </>
          ),
        },
        {
          id: 'cuenta',
          title: '3. Cuenta y seguridad',
          content: (
            <>
              <p>
                El usuario es responsable de mantener la confidencialidad de sus credenciales y de cualquier actividad en
                su cuenta.
              </p>
              <p>
                Routeit puede suspender cuentas cuando detecte fraude, uso abusivo o incumplimiento grave de estos términos.
              </p>
            </>
          ),
        },
        {
          id: 'propiedad',
          title: '4. Propiedad intelectual',
          content: (
            <>
              <p>
                El software, diseño, marca y contenidos propios de Routeit están protegidos por normativa de propiedad
                intelectual e industrial.
              </p>
              <p>
                Salvo autorización expresa, no se permite copiar, transformar ni explotar dichos elementos fuera del uso
                permitido por la plataforma.
              </p>
            </>
          ),
        },
        {
          id: 'responsabilidad',
          title: '5. Limitación de responsabilidad',
          content: (
            <>
              <p>
                Routeit se ofrece “tal cual”, sin garantía de disponibilidad ininterrumpida o de adecuación a necesidades
                particulares de cada usuario.
              </p>
              <p>
                En la medida permitida por ley, Routeit no responde por daños indirectos derivados del uso de la plataforma.
              </p>
            </>
          ),
        },
        {
          id: 'modificaciones',
          title: '6. Modificaciones',
          content: (
            <>
              <p>
                Routeit puede actualizar estos términos por cambios legales, técnicos o de producto. Se informará de cambios
                relevantes en la web o por canales habituales.
              </p>
              <p>La continuidad en el uso de la plataforma implica aceptación de la versión vigente de los términos.</p>
            </>
          ),
        },
        {
          id: 'ley',
          title: '7. Ley aplicable y jurisdicción',
          content: (
            <>
              <p>
                Estos términos se rigen por normativa de la Unión Europea y la legislación nacional que resulte aplicable
                según el titular legal definitivo.
              </p>
              <p>
                Jurisdicción y fuero: pendiente de completar por el titular legal de Routeit (placeholder legal).
              </p>
            </>
          ),
        },
      ]}
    />
  );
}

export default LegalTerms;

