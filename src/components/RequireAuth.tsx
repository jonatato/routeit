import { useEffect, useState, type ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import FullscreenLoader from './FullscreenLoader';

type RequireAuthProps = {
  children: ReactNode;
};

function RequireAuth({ children }: RequireAuthProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasSession, setHasSession] = useState(false);
  const location = useLocation();

  useEffect(() => {
    let isMounted = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!isMounted) return;
      setHasSession(Boolean(data.session));
      setIsLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setHasSession(Boolean(session));
    });

    return () => {
      isMounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  if (isLoading) {
    return <FullscreenLoader message="Validando sesion..." />;
  }

  if (!hasSession) {
    const from = `${location.pathname}${location.search}${location.hash}`;
    return <Navigate to="/login" replace state={{ from }} />;
  }

  return <>{children}</>;
}

export default RequireAuth;
