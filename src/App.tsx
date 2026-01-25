import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import RequireAuth from './components/RequireAuth';
import MobileTabs from './components/MobileTabs';
import WebSideMenu from './components/WebSideMenu';
import { useIsMobileShell } from './hooks/useIsMobileShell';
import Auth from './pages/Auth';
import AdminItinerary from './pages/AdminItinerary';
import AdminSections from './pages/AdminSections';
import DynamicItinerary from './pages/DynamicItinerary';
import MyBag from './pages/MyBag';
import MyItineraries from './pages/MyItineraries';
import PrivateHub from './pages/PrivateHub';
import ShareAccept from './pages/ShareAccept';
import Split from './pages/Split';
import StaticItinerary from './pages/StaticItinerary';

function App() {
  const isMobileShell = useIsMobileShell();
  const location = useLocation();
  const showSideMenu = !isMobileShell && location.pathname !== '/login' && location.pathname !== '/static';
  return (
    <>
      {isMobileShell ? (
        <div className="min-h-screen pb-14">
          <Routes>
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="/static" element={<StaticItinerary />} />
            <Route path="/login" element={<Auth />} />
            <Route
              path="/app"
              element={
                <RequireAuth>
                  <DynamicItinerary />
                </RequireAuth>
              }
            />
            <Route
              path="/app/private"
              element={
                <RequireAuth>
                  <PrivateHub />
                </RequireAuth>
              }
            />
            <Route
              path="/app/itineraries"
              element={
                <RequireAuth>
                  <MyItineraries />
                </RequireAuth>
              }
            />
            <Route
              path="/app/bag"
              element={
                <RequireAuth>
                  <MyBag />
                </RequireAuth>
              }
            />
            <Route
              path="/app/split"
              element={
                <RequireAuth>
                  <Split />
                </RequireAuth>
              }
            />
            <Route
              path="/app/share"
              element={
                <RequireAuth>
                  <ShareAccept />
                </RequireAuth>
              }
            />
            <Route
              path="/app/admin"
              element={
                <RequireAuth>
                  <AdminItinerary />
                </RequireAuth>
              }
            />
            <Route
              path="/app/admin/sections"
              element={
                <RequireAuth>
                  <AdminSections />
                </RequireAuth>
              }
            />
            <Route path="*" element={<Navigate to="/static" replace />} />
          </Routes>
          {location.pathname !== '/login' && location.pathname !== '/static' && <MobileTabs />}
        </div>
      ) : (
        <div className="min-h-screen">
          <div className="mx-auto flex w-full max-w-6xl">
            {showSideMenu && <WebSideMenu />}
            <div className="flex-1">
              <Routes>
                <Route path="/" element={<Navigate to="/login" replace />} />
                <Route path="/static" element={<StaticItinerary />} />
                <Route path="/login" element={<Auth />} />
                <Route
                  path="/app"
                  element={
                    <RequireAuth>
                      <DynamicItinerary />
                    </RequireAuth>
                  }
                />
                <Route
                  path="/app/private"
                  element={
                    <RequireAuth>
                      <PrivateHub />
                    </RequireAuth>
                  }
                />
                <Route
                  path="/app/itineraries"
                  element={
                    <RequireAuth>
                      <MyItineraries />
                    </RequireAuth>
                  }
                />
                <Route
                  path="/app/bag"
                  element={
                    <RequireAuth>
                      <MyBag />
                    </RequireAuth>
                  }
                />
                <Route
                  path="/app/split"
                  element={
                    <RequireAuth>
                      <Split />
                    </RequireAuth>
                  }
                />
                <Route
                  path="/app/share"
                  element={
                    <RequireAuth>
                      <ShareAccept />
                    </RequireAuth>
                  }
                />
                <Route
                  path="/app/admin"
                  element={
                    <RequireAuth>
                      <AdminItinerary />
                    </RequireAuth>
                  }
                />
                <Route path="*" element={<Navigate to="/static" replace />} />
              </Routes>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default App;
