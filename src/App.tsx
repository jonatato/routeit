import { lazy, Suspense, type ReactNode } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import RequireAuth from './components/RequireAuth';
import MobileTabs from './components/MobileTabs';
import MobileHeader from './components/MobileHeader';
import WebSideMenu from './components/WebSideMenu';
import WidgetsSidebar from './components/WidgetsSidebar';
import { PageTransition } from './components/PageTransition';
import { useIsMobileShell } from './hooks/useIsMobileShell';
import FullscreenLoader from './components/FullscreenLoader';
import Auth from './pages/Auth';
import { DeepLinkHandler } from './components/DeepLinkHandler';
import { NotificationIntentHandler } from './components/NotificationIntentHandler';
import { SessionLifecycleHandler } from './components/SessionLifecycleHandler';

// Lazy load heavy components
const AdminItinerary = lazy(() => import('./pages/AdminItinerary'));
const AdminSections = lazy(() => import('./pages/AdminSections'));
const DynamicItinerary = lazy(() => import('./pages/DynamicItinerary'));
const MyBag = lazy(() => import('./pages/MyBag'));
const MyItineraries = lazy(() => import('./pages/MyItineraries'));
const ShareAccept = lazy(() => import('./pages/ShareAccept'));
const Split = lazy(() => import('./pages/Split'));
const Profile = lazy(() => import('./pages/Profile'));
const Analytics = lazy(() => import('./pages/Analytics'));
const SearchPage = lazy(() => import('./pages/SearchPage'));
const SocialVideos = lazy(() => import('./pages/SocialVideos'));
const Landing = lazy(() => import('./pages/Landing'));
const Pricing = lazy(() => import('./pages/Pricing'));
const ResetPassword = lazy(() => import('./pages/ResetPassword'));
const Store = lazy(() => import('./pages/Store'));
const TodayItinerary = lazy(() => import('./pages/TodayItinerary'));

const LoadingFallback = () => <FullscreenLoader />;

type AppRoute = {
  path: string;
  element: ReactNode;
  requiresAuth?: boolean;
  useTransition?: boolean;
};

const appRoutes: AppRoute[] = [
  { path: '/', element: <Landing /> },
  { path: '/pricing', element: <Pricing /> },
  { path: '/store', element: <Store /> },
  { path: '/reset', element: <ResetPassword /> },
  { path: '/login', element: <Auth /> },
  { path: '/app', element: <DynamicItinerary />, requiresAuth: true, useTransition: true },
  { path: '/app/today', element: <TodayItinerary />, requiresAuth: true, useTransition: true },
  { path: '/app/itineraries', element: <MyItineraries />, requiresAuth: true, useTransition: true },
  { path: '/app/store', element: <Store />, requiresAuth: true, useTransition: true },
  { path: '/app/bag', element: <MyBag />, requiresAuth: true, useTransition: true },
  { path: '/app/split', element: <Split />, requiresAuth: true, useTransition: true },
  { path: '/app/share', element: <ShareAccept />, requiresAuth: true, useTransition: true },
  { path: '/app/admin', element: <AdminItinerary />, requiresAuth: true, useTransition: true },
  { path: '/app/admin/sections', element: <AdminSections />, requiresAuth: true, useTransition: true },
  { path: '/app/profile', element: <Profile />, requiresAuth: true, useTransition: true },
  { path: '/app/analytics', element: <Analytics />, requiresAuth: true, useTransition: true },
  { path: '/app/memories', element: <SocialVideos />, requiresAuth: true, useTransition: true },
  { path: '/app/search', element: <SearchPage />, requiresAuth: true, useTransition: true },
];

const renderRouteElement = ({ element, requiresAuth, useTransition }: AppRoute) => {
  const wrappedElement = useTransition ? <PageTransition>{element}</PageTransition> : element;
  const suspenseWrapped = <Suspense fallback={<LoadingFallback />}>{wrappedElement}</Suspense>;
  if (!requiresAuth) return suspenseWrapped;
  return <RequireAuth>{suspenseWrapped}</RequireAuth>;
};

const AppRoutes = () => (
  <Routes>
    {appRoutes.map(route => (
      <Route key={route.path} path={route.path} element={renderRouteElement(route)} />
    ))}
    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes>
);

function App() {
  const isMobileShell = useIsMobileShell();
  const location = useLocation();
  const isAppRoute = location.pathname.startsWith('/app');
  const showSideMenu = !isMobileShell && isAppRoute;
  const showWidgetsSidebar = !isMobileShell && (location.pathname === '/app' || location.search.includes('itineraryId='));
  const showMobileHeader = isMobileShell && isAppRoute;
  
  return (
    <>
      <DeepLinkHandler />
      <NotificationIntentHandler />
      <SessionLifecycleHandler />
      {isMobileShell ? (
        <div className="min-h-screen pb-14">
          {showMobileHeader && <MobileHeader />}
          <AppRoutes />
          {isAppRoute && <MobileTabs />}
        </div>
      ) : (
        <div className="min-h-screen">
          <div className="mx-auto flex w-full">
            {showSideMenu && <WebSideMenu />}
            <div className="flex-1">
              <AppRoutes />
            </div>
            {showWidgetsSidebar && <WidgetsSidebar />}
          </div>
        </div>
      )}
    </>
  );
}

export default App;
