import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import RequireAuth from './components/RequireAuth';
import MobileTabs from './components/MobileTabs';
import MobileHeader from './components/MobileHeader';
import WebSideMenu from './components/WebSideMenu';
import TopNavBar from './components/TopNavBar';
import ExpensesSidebar from './components/ExpensesSidebar';
import { PageTransition } from './components/PageTransition';
import { useIsMobileShell } from './hooks/useIsMobileShell';
import { Skeleton } from './components/ui/skeleton';
import Auth from './pages/Auth';

// Lazy load heavy components
const AdminItinerary = lazy(() => import('./pages/AdminItinerary'));
const AdminSections = lazy(() => import('./pages/AdminSections'));
const DynamicItinerary = lazy(() => import('./pages/DynamicItinerary'));
const MyBag = lazy(() => import('./pages/MyBag'));
const MyItineraries = lazy(() => import('./pages/MyItineraries'));
const PrivateHub = lazy(() => import('./pages/PrivateHub'));
const ShareAccept = lazy(() => import('./pages/ShareAccept'));
const Split = lazy(() => import('./pages/Split'));
const StaticItinerary = lazy(() => import('./pages/StaticItinerary'));
const Profile = lazy(() => import('./pages/Profile'));
const Analytics = lazy(() => import('./pages/Analytics'));
const Chat = lazy(() => import('./pages/Chat'));
const Favorites = lazy(() => import('./pages/Favorites'));
const Guide = lazy(() => import('./pages/Guide'));
const SearchPage = lazy(() => import('./pages/SearchPage'));

const LoadingFallback = () => (
  <div className="flex min-h-screen items-center justify-center">
    <Skeleton className="h-8 w-64" />
  </div>
);

function App() {
  const isMobileShell = useIsMobileShell();
  const location = useLocation();
  const showSideMenu = !isMobileShell && location.pathname !== '/login' && location.pathname !== '/static';
  const showTopNav = !isMobileShell && location.pathname !== '/login' && location.pathname !== '/static';
  const showExpensesSidebar = !isMobileShell && location.pathname === '/app';
  const showMobileHeader = isMobileShell && location.pathname !== '/login' && location.pathname !== '/static';
  
  return (
    <>
      {isMobileShell ? (
        <div className="min-h-screen pb-14">
          {showMobileHeader && <MobileHeader />}
          <Routes>
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="/static" element={<StaticItinerary />} />
            <Route path="/login" element={<Auth />} />
            <Route
              path="/app"
              element={
                <RequireAuth>
                  <Suspense fallback={<LoadingFallback />}>
                    <PageTransition>
                      <DynamicItinerary />
                    </PageTransition>
                  </Suspense>
                </RequireAuth>
              }
            />
            <Route
              path="/app/private"
              element={
                <RequireAuth>
                  <Suspense fallback={<LoadingFallback />}>
                    <PageTransition>
                      <PrivateHub />
                    </PageTransition>
                  </Suspense>
                </RequireAuth>
              }
            />
            <Route
              path="/app/itineraries"
              element={
                <RequireAuth>
                  <Suspense fallback={<LoadingFallback />}>
                    <PageTransition>
                      <MyItineraries />
                    </PageTransition>
                  </Suspense>
                </RequireAuth>
              }
            />
            <Route
              path="/app/bag"
              element={
                <RequireAuth>
                  <Suspense fallback={<LoadingFallback />}>
                    <PageTransition>
                      <MyBag />
                    </PageTransition>
                  </Suspense>
                </RequireAuth>
              }
            />
            <Route
              path="/app/split"
              element={
                <RequireAuth>
                  <Suspense fallback={<LoadingFallback />}>
                    <PageTransition>
                      <Split />
                    </PageTransition>
                  </Suspense>
                </RequireAuth>
              }
            />
            <Route
              path="/app/share"
              element={
                <RequireAuth>
                  <Suspense fallback={<LoadingFallback />}>
                    <PageTransition>
                      <ShareAccept />
                    </PageTransition>
                  </Suspense>
                </RequireAuth>
              }
            />
            <Route
              path="/app/admin"
              element={
                <RequireAuth>
                  <Suspense fallback={<LoadingFallback />}>
                    <PageTransition>
                      <AdminItinerary />
                    </PageTransition>
                  </Suspense>
                </RequireAuth>
              }
            />
            <Route
              path="/app/admin/sections"
              element={
                <RequireAuth>
                  <Suspense fallback={<LoadingFallback />}>
                    <PageTransition>
                      <AdminSections />
                    </PageTransition>
                  </Suspense>
                </RequireAuth>
              }
            />
            <Route
              path="/app/profile"
              element={
                <RequireAuth>
                  <Suspense fallback={<LoadingFallback />}>
                    <PageTransition>
                      <Profile />
                    </PageTransition>
                  </Suspense>
                </RequireAuth>
              }
            />
            <Route
              path="/app/analytics"
              element={
                <RequireAuth>
                  <Suspense fallback={<LoadingFallback />}>
                    <PageTransition>
                      <Analytics />
                    </PageTransition>
                  </Suspense>
                </RequireAuth>
              }
            />
            <Route
              path="/app/chat"
              element={
                <RequireAuth>
                  <Suspense fallback={<LoadingFallback />}>
                    <PageTransition>
                      <Chat />
                    </PageTransition>
                  </Suspense>
                </RequireAuth>
              }
            />
            <Route
              path="/app/favorites"
              element={
                <RequireAuth>
                  <Suspense fallback={<LoadingFallback />}>
                    <PageTransition>
                      <Favorites />
                    </PageTransition>
                  </Suspense>
                </RequireAuth>
              }
            />
            <Route
              path="/app/guide"
              element={
                <RequireAuth>
                  <Suspense fallback={<LoadingFallback />}>
                    <PageTransition>
                      <Guide />
                    </PageTransition>
                  </Suspense>
                </RequireAuth>
              }
            />
            <Route
              path="/app/search"
              element={
                <RequireAuth>
                  <Suspense fallback={<LoadingFallback />}>
                    <PageTransition>
                      <SearchPage />
                    </PageTransition>
                  </Suspense>
                </RequireAuth>
              }
            />
            <Route path="*" element={<Navigate to="/static" replace />} />
          </Routes>
          {location.pathname !== '/login' && location.pathname !== '/static' && <MobileTabs />}
        </div>
      ) : (
        <div className="min-h-screen">
          {showTopNav && <TopNavBar />}
          <div className="mx-auto flex w-full">
            {showSideMenu && <WebSideMenu />}
            <div className="flex-1">
              <Routes>
                <Route path="/" element={<Navigate to="/login" replace />} />
                <Route
                  path="/static"
                  element={
                    <Suspense fallback={<LoadingFallback />}>
                      <PageTransition>
                        <StaticItinerary />
                      </PageTransition>
                    </Suspense>
                  }
                />
                <Route path="/login" element={<Auth />} />
                <Route
                  path="/app"
                  element={
                    <RequireAuth>
                      <Suspense fallback={<LoadingFallback />}>
                        <PageTransition>
                          <DynamicItinerary />
                        </PageTransition>
                      </Suspense>
                    </RequireAuth>
                  }
                />
                <Route
                  path="/app/private"
                  element={
                    <RequireAuth>
                      <Suspense fallback={<LoadingFallback />}>
                        <PageTransition>
                          <PrivateHub />
                        </PageTransition>
                      </Suspense>
                    </RequireAuth>
                  }
                />
                <Route
                  path="/app/itineraries"
                  element={
                    <RequireAuth>
                      <Suspense fallback={<LoadingFallback />}>
                        <PageTransition>
                          <MyItineraries />
                        </PageTransition>
                      </Suspense>
                    </RequireAuth>
                  }
                />
                <Route
                  path="/app/bag"
                  element={
                    <RequireAuth>
                      <Suspense fallback={<LoadingFallback />}>
                        <PageTransition>
                          <MyBag />
                        </PageTransition>
                      </Suspense>
                    </RequireAuth>
                  }
                />
                <Route
                  path="/app/split"
                  element={
                    <RequireAuth>
                      <Suspense fallback={<LoadingFallback />}>
                        <PageTransition>
                          <Split />
                        </PageTransition>
                      </Suspense>
                    </RequireAuth>
                  }
                />
                <Route
                  path="/app/share"
                  element={
                    <RequireAuth>
                      <Suspense fallback={<LoadingFallback />}>
                        <PageTransition>
                          <ShareAccept />
                        </PageTransition>
                      </Suspense>
                    </RequireAuth>
                  }
                />
                <Route
                  path="/app/admin"
                  element={
                    <RequireAuth>
                      <Suspense fallback={<LoadingFallback />}>
                        <PageTransition>
                          <AdminItinerary />
                        </PageTransition>
                      </Suspense>
                    </RequireAuth>
                  }
                />
                <Route
                  path="/app/profile"
                  element={
                    <RequireAuth>
                      <Suspense fallback={<LoadingFallback />}>
                        <PageTransition>
                          <Profile />
                        </PageTransition>
                      </Suspense>
                    </RequireAuth>
                  }
                />
                <Route
                  path="/app/analytics"
                  element={
                    <RequireAuth>
                      <Suspense fallback={<LoadingFallback />}>
                        <PageTransition>
                          <Analytics />
                        </PageTransition>
                      </Suspense>
                    </RequireAuth>
                  }
                />
                <Route
                  path="/app/chat"
                  element={
                    <RequireAuth>
                      <Suspense fallback={<LoadingFallback />}>
                        <PageTransition>
                          <Chat />
                        </PageTransition>
                      </Suspense>
                    </RequireAuth>
                  }
                />
                <Route
                  path="/app/favorites"
                  element={
                    <RequireAuth>
                      <Suspense fallback={<LoadingFallback />}>
                        <PageTransition>
                          <Favorites />
                        </PageTransition>
                      </Suspense>
                    </RequireAuth>
                  }
                />
                <Route
                  path="/app/guide"
                  element={
                    <RequireAuth>
                      <Suspense fallback={<LoadingFallback />}>
                        <PageTransition>
                          <Guide />
                        </PageTransition>
                      </Suspense>
                    </RequireAuth>
                  }
                />
                <Route
                  path="/app/search"
                  element={
                    <RequireAuth>
                      <Suspense fallback={<LoadingFallback />}>
                        <PageTransition>
                          <SearchPage />
                        </PageTransition>
                      </Suspense>
                    </RequireAuth>
                  }
                />
                <Route path="*" element={<Navigate to="/static" replace />} />
              </Routes>
            </div>
            {showExpensesSidebar && <ExpensesSidebar />}
          </div>
        </div>
      )}
    </>
  );
}

export default App;

