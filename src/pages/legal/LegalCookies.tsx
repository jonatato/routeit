import { openCookiePreferences } from '../../hooks/useCookieConsent';
import LegalPageLayout from '../../components/legal/LegalPageLayout';

function LegalCookies() {
  return (
    <LegalPageLayout
      title="Política de cookies"
      subtitle="Uso de cookies y tecnologías similares en Routeit."
      lastUpdated="17 de febrero de 2026"
      sections={[
        {
          id: 'que-son',
          title: '1. Qué son las cookies',
          content: (
            <>
              <p>
                Las cookies son archivos que se almacenan en tu dispositivo para recordar información de navegación y
                mejorar la experiencia de uso.
              </p>
            </>
          ),
        },
        {
          id: 'tipos',
          title: '2. Tipologías de cookies',
          content: (
            <>
              <p><strong>Técnicas:</strong> necesarias para funcionamiento básico y seguridad.</p>
              <p><strong>Analítica:</strong> permiten medir uso y rendimiento de la plataforma.</p>
              <p><strong>Preferencia:</strong> recuerdan opciones de configuración del usuario.</p>
              <p><strong>Marketing:</strong> personalizan comunicaciones o contenidos promocionales, si aplican.</p>
            </>
          ),
        },
        {
          id: 'tabla',
          title: '3. Tabla de cookies actual',
          content: (
            <>
              <p>La tabla detallada de cookies por proveedor, duración y finalidad está pendiente de publicación final.</p>
              <p>Placeholder: completar con inventario técnico definitivo en producción.</p>
            </>
          ),
        },
        {
          id: 'consentimiento',
          title: '4. Gestión y revocación del consentimiento',
          content: (
            <>
              <p>
                Puedes aceptar, rechazar o configurar cookies no esenciales desde el banner inicial o cambiarlo en
                cualquier momento desde “Preferencias de cookies”.
              </p>
              <button
                type="button"
                onClick={openCookiePreferences}
                className="text-sm font-semibold text-primary transition hover:text-primary/80"
              >
                Abrir preferencias de cookies
              </button>
            </>
          ),
        },
      ]}
    />
  );
}

export default LegalCookies;

