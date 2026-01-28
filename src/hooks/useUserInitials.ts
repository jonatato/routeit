import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export function useUserInitials() {
  const [initials, setInitials] = useState('');

  useEffect(() => {
    const fetchInitials = async () => {
      const { data } = await supabase.auth.getUser();
      if (data.user?.email) {
        // Extraer las iniciales del email
        const email = data.user.email;
        const parts = email.split('@')[0].split(/[._-]/);
        
        if (parts.length >= 2) {
          // Si tiene nombre y apellido (ej: john.doe@email.com)
          setInitials(
            (parts[0][0] + parts[1][0]).toUpperCase()
          );
        } else {
          // Si solo tiene un nombre (ej: john@email.com)
          setInitials(
            email.substring(0, 2).toUpperCase()
          );
        }
      }
    };

    fetchInitials();
  }, []);

  return initials || 'US'; // Devuelve 'US' (User) por defecto si no hay iniciales
}
