import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { CompareProvider } from './context/CompareContext';
import './i18n';

import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ProtectedRoute from './components/ProtectedRoute';
import CompareTray from './components/CompareTray';
import Landing from './pages/Landing';

const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const Profile = lazy(() => import('./pages/Profile'));
const Recommendations = lazy(() => import('./pages/Recommendations'));
const Schemes = lazy(() => import('./pages/Schemes'));
const SchemeDetails = lazy(() => import('./pages/SchemeDetails'));
const Compare = lazy(() => import('./pages/Compare'));
const Saved = lazy(() => import('./pages/Saved'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const AdminSchemes = lazy(() => import('./pages/AdminSchemes'));
const AdminSchemeForm = lazy(() => import('./pages/AdminSchemeForm'));
const AdminSuggestions = lazy(() => import('./pages/AdminSuggestions'));
const Suggest = lazy(() => import('./pages/Suggest'));
const Faq = lazy(() => import('./pages/Faq'));
const NotFound = lazy(() => import('./pages/NotFound'));

function RouteLoader() {
  return (
    <div className="max-w-[1140px] mx-auto px-4 sm:px-6 py-16">
      <div className="editorial-card p-8 space-y-4">
        <div className="h-6 w-44 rounded-full bg-[var(--line)]/70" />
        <div className="h-10 w-3/4 rounded-[12px] bg-[var(--line)]/50" />
        <div className="h-24 w-full rounded-[12px] bg-[var(--line)]/40" />
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <CompareProvider>
        <BrowserRouter>
          <div className="min-h-screen flex flex-col bg-[var(--cream)] text-[var(--navy)] relative">

            <a
              href="#main-content"
              className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 btn-accent-pill px-5 py-2.5 text-sm shadow-[var(--shadow-paper)]"
            >
              Skip to main content
            </a>

            <Navbar />

            <main id="main-content" className="flex-1">
              <Suspense fallback={<RouteLoader />}>
                <Routes>
                  {/* Public Routes */}
                  <Route path="/" element={<Landing />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/register" element={<Register />} />
                  <Route path="/schemes" element={<Schemes />} />
                  <Route path="/schemes/:id" element={<SchemeDetails />} />
                  <Route path="/compare" element={<Compare />} />
                  <Route path="/suggest" element={<Suggest />} />
                  <Route path="/faq" element={<Faq />} />

                  {/* Protected User Routes */}
                  <Route
                    path="/profile"
                    element={
                      <ProtectedRoute>
                        <Profile />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/recommendations"
                    element={
                      <ProtectedRoute>
                        <Recommendations />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/saved"
                    element={
                      <ProtectedRoute>
                        <Saved />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/dashboard"
                    element={
                      <ProtectedRoute>
                        <Dashboard />
                      </ProtectedRoute>
                    }
                  />

                  {/* Protected Admin Routes */}
                  <Route
                    path="/admin"
                    element={
                      <ProtectedRoute adminOnly>
                        <AdminSchemes />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/admin/new"
                    element={
                      <ProtectedRoute adminOnly>
                        <AdminSchemeForm />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/admin/edit/:id"
                    element={
                      <ProtectedRoute adminOnly>
                        <AdminSchemeForm />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/admin/suggestions"
                    element={
                      <ProtectedRoute adminOnly>
                        <AdminSuggestions />
                      </ProtectedRoute>
                    }
                  />

                  {/* 404 Fallback */}
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </Suspense>
            </main>

            <Footer />
            <CompareTray />
          </div>
        </BrowserRouter>
      </CompareProvider>
    </AuthProvider>
  );
}
