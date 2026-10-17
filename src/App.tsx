import { lazy, Suspense, useEffect, useState, type ReactNode } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import RequireAuth from './components/RequireAuth';
import { PageTransition } from './components/PageTransition';
import { useIsMobileShell } from './hooks/useIsMobileShell';
import { TabPageSkeleton } from './components/TabPageSkeleton';
import Auth from './pages/Auth';
import { supabase } from './lib/supabase';
import { DeepLinkHandler } from './components/DeepLinkHandler';
import { NotificationIntentHandler } from './components/NotificationIntentHandler';
import { SessionLifecycleHandler } from './components/SessionLifecycleHandler';
import CookieConsentBanner from './components/CookieConsentBanner';
import MarketingFooter from './components/MarketingFooter';
import { BiometricGate } from './components/BiometricGate';

// Lazy load heavy components
const MyBag = lazy(() => import('./pages/MyBag'));
const MyItineraries = lazy(() => import('./pages/MyItineraries'));
const ShareAccept = lazy(() => import('./pages/ShareAccept'));
const Profile = lazy(() => import('./pages/Profile'));
const Documents = lazy(() => import('./pages/Documents'));
const Landing = lazy(() => import('./pages/Landing'));
const Pricing = lazy(() => import('./pages/Pricing'));
const ResetPassword = lazy(() => import('./pages/ResetPassword'));
const LiveApp = lazy(() => import('./v2/LiveApp'));
const PreviewApp = lazy(() => import('./v2/PreviewApp'));
const LegalTerms = lazy(() => import('./pages/legal/LegalTerms'));
const LegalPrivacy = lazy(() => import('./pages/legal/LegalPrivacy'));
const LegalCookies = lazy(() => import('./pages/legal/LegalCookies'));
const LegalImprint = lazy(() => import('./pages/legal/LegalImprint'));
const LegalContact = lazy(() => import('./pages/legal/LegalContact'));

const LoadingFallback = () => <TabPageSkeleton />;

function RootEntryRoute() {
  const isMobileShell = useIsMobileShell();
  const [isLoading, setIsLoading] = useState(true);
  const [hasSession, setHasSession] = useState(false);

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

  if (!isMobileShell) {
    return <Landing />;
  }

  if (isLoading) {
    return <LoadingFallback />;
  }

  return <Navigate to={hasSession ? '/app' : '/login'} replace />;
}

type AppRoute = {
  path: string;
  element: ReactNode;
  requiresAuth?: boolean;
  useTransition?: boolean;
};

const appRoutes: AppRoute[] = [
  { path: '/', element: <RootEntryRoute /> },
  { path: '/pricing', element: <Pricing /> },
  { path: '/store', element: <Navigate to="/pricing" replace /> },
  { path: '/preview', element: <PreviewApp /> },
  { path: '/preview/*', element: <PreviewApp /> },
  { path: '/legal/terms', element: <LegalTerms /> },
  { path: '/legal/privacy', element: <LegalPrivacy /> },
  { path: '/legal/cookies', element: <LegalCookies /> },
  { path: '/legal/imprint', element: <LegalImprint /> },
  { path: '/legal/contact', element: <LegalContact /> },
  { path: '/reset', element: <ResetPassword /> },
  { path: '/login', element: <Auth /> },
  { path: '/app/today', element: <Navigate to="/app" replace /> },
  { path: '/app/store', element: <Navigate to="/app/more" replace /> },
  { path: '/app/split', element: <Navigate to="/app/money" replace /> },
  { path: '/app/admin', element: <Navigate to="/app/plan" replace /> },
  { path: '/app/admin/sections', element: <Navigate to="/app/plan" replace /> },
  { path: '/app/analytics', element: <Navigate to="/app" replace /> },
  { path: '/app/memories', element: <Navigate to="/app" replace /> },
  { path: '/app/search', element: <Navigate to="/app/plan" replace /> },
];

const renderRouteElement = ({ element, requiresAuth, useTransition }: AppRoute) => {
  const wrappedElement = useTransition ? <PageTransition>{element}</PageTransition> : element;
  const suspenseWrapped = <Suspense fallback={<LoadingFallback />}>{wrappedElement}</Suspense>;
  if (!requiresAuth) return suspenseWrapped;
  return <RequireAuth>{suspenseWrapped}</RequireAuth>;
};

const shellSlot = <span className="sr-only">RouteIt</span>;

const AppRoutes = () => (
  <Routes>
    {appRoutes.map(route => (
      <Route key={route.path} path={route.path} element={renderRouteElement(route)} />
    ))}
    <Route element={<RequireAuth><Suspense fallback={<LoadingFallback />}><LiveApp /></Suspense></RequireAuth>}>
      <Route path="/app" element={shellSlot} />
      <Route path="/app/plan" element={shellSlot} />
      <Route path="/app/money" element={shellSlot} />
      <Route path="/app/more" element={shellSlot} />
      <Route path="/app/itineraries" element={<Suspense fallback={<LoadingFallback />}><PageTransition><MyItineraries /></PageTransition></Suspense>} />
      <Route path="/app/bag" element={<Suspense fallback={<LoadingFallback />}><PageTransition><MyBag /></PageTransition></Suspense>} />
      <Route path="/app/share" element={<Suspense fallback={<LoadingFallback />}><PageTransition><ShareAccept /></PageTransition></Suspense>} />
      <Route path="/app/profile" element={<Suspense fallback={<LoadingFallback />}><PageTransition><Profile /></PageTransition></Suspense>} />
      <Route path="/app/documents" element={<Suspense fallback={<LoadingFallback />}><PageTransition><Documents /></PageTransition></Suspense>} />
    </Route>
    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes>
);

function App() {
  const isMobileShell = useIsMobileShell();
  const location = useLocation();
  const isAppRoute = location.pathname.startsWith('/app');
  const isPreview = location.pathname.startsWith('/preview');

  return (
    <>
      <DeepLinkHandler />
      <NotificationIntentHandler />
      <SessionLifecycleHandler />
      <BiometricGate />
      {isAppRoute || isPreview ? (
        <AppRoutes />
      ) : isMobileShell ? (
        <div className="mobile-shell-safe flex flex-col">
          <main className="flex-1">
            <AppRoutes />
          </main>
        </div>
      ) : (
        <div className="min-h-screen">
          <main className="flex-1">
            <AppRoutes />
          </main>
          <MarketingFooter />
        </div>
      )}
      <CookieConsentBanner />
    </>
  );
}

export default App;
