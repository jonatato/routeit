import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { acceptShareLink } from '../services/sharing';

function ShareAccept() {
  const [status, setStatus] = useState('Procesando invitación...');
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const run = async () => {
      const params = new URLSearchParams(location.search);
      const token = params.get('token');
      if (!token) {
        setStatus('Token inválido.');
        return;
      }
      try {
        await acceptShareLink(token);
        setStatus('Invitación aceptada.');
        setTimeout(() => navigate('/app/itineraries', { replace: true }), 1200);
      } catch (err) {
        setStatus(err instanceof Error ? err.message : 'No se pudo aceptar la invitación.');
      }
    };
    void run();
  }, [location.search, navigate]);

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-3xl flex-col items-center justify-center gap-4 px-4 text-center">
      <p className="text-sm text-mutedForeground">{status}</p>
      <Button variant="outline" onClick={() => navigate('/app/itineraries')}>
        Ir a mis viajes
      </Button>
    </div>
  );
}

export default ShareAccept;
