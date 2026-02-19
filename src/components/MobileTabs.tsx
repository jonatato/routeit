import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MapPin, Receipt, ShoppingBag, Plane, Store } from 'lucide-react';

type Tab = {
  key: string;
  label: string;
  path: string;
  icon: React.ComponentType<{ className?: string }>;
};

function MobileTabs() {
  const location = useLocation();

  const tabs: Tab[] = [
    { 
      key: 'split', 
      label: 'Gastos', 
      path: '/app/split', 
      icon: Receipt,
    },
    { 
      key: 'bag', 
      label: 'Maleta', 
      path: '/app/bag', 
      icon: ShoppingBag,
    },
    { 
      key: 'itinerary', 
      label: 'Inicio', 
      path: '/app', 
      icon: MapPin,
    },
    { 
      key: 'store', 
      label: 'Tienda', 
      path: '/app/store', 
      icon: Store,
    },
    { 
      key: 'itineraries', 
      label: 'Viajes', 
      path: '/app/itineraries', 
      icon: Plane,
    },
  ];
  
  const isItineraryActive = () => {
    return location.pathname === '/app' || location.pathname.startsWith('/app?');
  };

  const isTabActive = (tab: Tab) => (tab.key === 'itinerary' ? isItineraryActive() : location.pathname === tab.path);
  
  return (
    <nav className="fixed inset-x-0 bottom-0 z-[70] bg-card pb-[calc(var(--safe-area-inset-bottom)+0.12rem)] pl-safe pr-safe shadow-sm backdrop-blur-md border-t border-border/20">
      <div className="mx-auto flex h-[64px] w-full max-w-[460px] items-center justify-around px-4">
        {tabs.map((tab) => {
            const isActive = isTabActive(tab);
            const Icon = tab.icon;

            return (
              <Link
                key={tab.key}
                to={tab.path}
                className="relative flex flex-col items-center justify-center"
              >
                {/* Background badge with color */}
                <motion.div
                  className="absolute bottom-1 left-1/2 h-[44px] w-[44px] -translate-x-1/2 rounded-full"
                  style={{
                    backgroundColor: 'transparent',
                  }}
                  animate={{
                    scale: isActive ? 1 : 0,
                    opacity: 0,
                  }}
                  transition={{
                    type: 'spring',
                    stiffness: 300,
                    damping: 25,
                  }}
                />

                {/* Icon container */}
                <div className="relative z-[10] flex h-[50px] w-[50px] items-center justify-center">
                  {/* Outline version */}
                  <motion.div
                    animate={{
                      opacity: isActive ? 0 : 1,
                    }}
                    transition={{
                      duration: 0.25,
                      ease: 'easeOut',
                    }}
                    className="absolute flex items-center justify-center"
                  >
                    <Icon
                      className="h-[28px] w-[28px] text-muted-foreground"
                      style={{
                        fill: 'none',
                        stroke: 'currentColor',
                        strokeWidth: 1.5,
                      }}
                    />
                  </motion.div>

                  {/* Filled version */}
                  <motion.div
                    animate={{
                      opacity: isActive ? 1 : 0,
                    }}
                    transition={{
                      duration: 0.25,
                      ease: 'easeOut',
                    }}
                    className="absolute flex items-center justify-center"
                  >
                    <Icon
                      className="h-[28px] w-[28px] text-primary"
                      style={{
                        fill: 'none',
                        stroke: 'currentColor',
                        strokeWidth: 1.5,
                      }}
                    />
                  </motion.div>
                </div>
              </Link>
            );
          })}
      </div>
    </nav>
  );
}

export default MobileTabs;


