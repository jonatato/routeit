import LegalPageLayout from '../../components/legal/LegalPageLayout';

function LegalPrivacy() {
  return (
    <LegalPageLayout
      title="Política de privacidad"
      subtitle="Información sobre tratamiento de datos personales conforme al RGPD."
      lastUpdated="17 de febrero de 2026"
      sections={[
        {
          id: 'responsable',
          title: '1. Responsable del tratamiento',
          content: (
            <>
              <p>Responsable: Routeit (razón social pendiente de completar).</p>
              <p>Email de privacidad: privacy@routeit.example (placeholder).</p>
              <p>Domicilio legal: pendiente de completar por el titular legal.</p>
            </>
          ),
        },
        {
          id: 'datos',
          title: '2. Datos tratados',
          content: (
            <>
              <p>
                Podemos tratar datos de registro (email), uso del servicio, preferencias de cuenta y contenido aportado por
                el usuario para crear y gestionar itinerarios.
              </p>
              <p>No se solicitan categorías especiales de datos salvo que el usuario las incluya voluntariamente.</p>
            </>
          ),
        },
        {
          id: 'finalidades',
          title: '3. Finalidades y base jurídica',
          content: (
            <>
              <p>
                Finalidades principales: prestación del servicio, seguridad de la cuenta, soporte, mejora del producto y
                comunicaciones operativas.
              </p>
              <p>
                Bases jurídicas: ejecución del contrato, cumplimiento de obligaciones legales, interés legítimo y, cuando
                corresponda, consentimiento del usuario.
              </p>
            </>
          ),
        },
        {
          id: 'conservacion',
          title: '4. Conservación',
          content: (
            <>
              <p>
                Conservamos los datos mientras exista relación activa con el usuario y durante los plazos legales exigibles
                para atender responsabilidades.
              </p>
              <p>Los datos pueden anonimizarse para fines estadísticos y de mejora continua del producto.</p>
            </>
          ),
        },
        {
          id: 'destinatarios',
          title: '5. Cesiones y encargados',
          content: (
            <>
              <p>
                Routeit puede trabajar con proveedores tecnológicos (hosting, analítica, infraestructura) en calidad de
                encargados del tratamiento, bajo acuerdos contractuales adecuados.
              </p>
              <p>No se ceden datos a terceros para fines propios sin base legal válida.</p>
            </>
          ),
        },
        {
          id: 'transferencias',
          title: '6. Transferencias internacionales',
          content: (
            <>
              <p>
                Si existen transferencias fuera del EEE, se aplicarán garantías apropiadas conforme al RGPD, como cláusulas
                contractuales tipo u otros mecanismos válidos.
              </p>
            </>
          ),
        },
        {
          id: 'derechos',
          title: '7. Derechos ARSULIPO',
          content: (
            <>
              <p>
                El usuario puede ejercer derechos de acceso, rectificación, supresión, limitación, portabilidad y oposición,
                así como retirar consentimiento cuando aplique.
              </p>
              <p>
                También puede presentar reclamación ante la autoridad de control competente en materia de protección de
                datos.
              </p>
            </>
          ),
        },
        {
          id: 'contacto',
          title: '8. Contacto DPO/privacidad',
          content: (
            <>
              <p>
                Para solicitudes de privacidad, ejercer derechos o consultas RGPD, usar el canal de contacto legal:
                <strong> privacy@routeit.example</strong>.
              </p>
              <p>Contacto de DPO, en su caso: pendiente de completar por el titular legal.</p>
            </>
          ),
        },
      ]}
    />
  );
}

export default LegalPrivacy;

