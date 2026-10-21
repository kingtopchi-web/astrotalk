import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { PlatformSettingsProvider } from './context/PlatformSettingsContext';
import ProtectedRoute from './components/ProtectedRoute';
import ScrollToTop from './components/ScrollToTop';

// Public/User Pages
import Home from './pages/Home';
import BookConsultation from './pages/BookConsultation';
import LiveSession from './pages/LiveSession';
import WalletRecharge from './pages/WalletRecharge';
import Login from './pages/Login';
import Register from './pages/Register';
import Experts from './pages/Experts';
import Categories from './pages/Categories';
import FreeServices from './pages/FreeServices';
import Blog from './pages/Blog';
import Notifications from './pages/Notifications';
import Bookings from './pages/Bookings';
import Profile from './pages/Profile';
import UserDashboard from './pages/UserDashboard';
import ExpertPublicProfile from './pages/ExpertProfile';
import About from './pages/About';
import Contact from './pages/Contact';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Settings from './pages/Settings';
import Support from './pages/Support';
import Messages from './pages/Messages';
import HowItWorks from './pages/HowItWorks';
import TrustAndSafety from './pages/TrustAndSafety';
import Careers from './pages/Careers';
import Press from './pages/Press';
import Partners from './pages/Partners';
import HelpCenter from './pages/HelpCenter';
import Community from './pages/Community';
import PrivacyPolicy from './pages/PrivacyPolicy';
import TermsOfService from './pages/TermsOfService';

// Expert Pages
import ExpertLogin from './pages/expert/ExpertLogin';
import ExpertRegister from './pages/expert/ExpertRegister';
import ExpertDashboard from './pages/expert/ExpertDashboard';
import ExpertProfileEdit from './pages/expert/ExpertProfileEdit';

import ExpertLayout from './layouts/ExpertLayout';
import ExpertConsultations from './pages/expert/ExpertConsultations';
import ExpertSchedule from './pages/expert/ExpertSchedule';
import ExpertMessages from './pages/expert/ExpertMessages';
import ExpertEarnings from './pages/expert/ExpertEarnings';
import ExpertServices from './pages/expert/ExpertServices';
import ExpertClients from './pages/expert/ExpertClients';
import ExpertSettings from './pages/expert/ExpertSettings';
import ExpertNotifications from './pages/expert/ExpertNotifications';

import './index.css';

import { useLocation } from 'react-router-dom';

function ThemeManager() {
  const location = useLocation();

  useEffect(() => {
    // Only Home page ('/') can use the dark theme system.
    // User dashboard and Expert portal must NEVER have a black background theme.
    const isDashboardOrPortal = 
      location.pathname.startsWith('/dashboard') ||
      location.pathname.startsWith('/expert') ||
      location.pathname.startsWith('/bookings') ||
      location.pathname.startsWith('/wallet') ||
      location.pathname.startsWith('/settings') ||
      location.pathname.startsWith('/profile') ||
      location.pathname.startsWith('/support') ||
      location.pathname.startsWith('/messages') ||
      location.pathname.startsWith('/free-services') ||
      location.pathname.startsWith('/notifications');

    if (isDashboardOrPortal) {
      document.documentElement.classList.add('light-theme');
    } else if (location.pathname === '/') {
      const homeTheme = localStorage.getItem('home_theme');
      if (homeTheme === 'dark') {
        document.documentElement.classList.remove('light-theme');
      } else {
        document.documentElement.classList.add('light-theme');
      }
    } else {
      document.documentElement.classList.add('light-theme');
    }
  }, [location.pathname]);
  
  return null;
}

function App() {
  return (
    <AuthProvider>
      <PlatformSettingsProvider>
        <Router>
          <ScrollToTop />
          <ThemeManager />
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/expert/login" element={<ExpertLogin />} />
          <Route path="/expert/register" element={<ExpertRegister />} />

          {/* Semi-Public / Public Pages */}
          <Route path="/" element={<Home />} />
          <Route path="/categories" element={<Categories />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password/:token" element={<ResetPassword />} />
          <Route path="/resetpassword/:token" element={<ResetPassword />} />
          <Route path="/how-it-works" element={<HowItWorks />} />
          <Route path="/trust-and-safety" element={<TrustAndSafety />} />
          <Route path="/careers" element={<Careers />} />
          <Route path="/press" element={<Press />} />
          <Route path="/blog" element={<Blog />} />
          <Route path="/partners" element={<Partners />} />
          <Route path="/help-center" element={<HelpCenter />} />
          <Route path="/community" element={<Community />} />
          <Route path="/privacy-policy" element={<PrivacyPolicy />} />
          <Route path="/terms-of-service" element={<TermsOfService />} />

          <Route element={<ProtectedRoute allowedRoles={['USER', 'EXPERT', 'ADMIN']} />}>
            <Route path="/experts" element={<Experts />} />
            <Route path="/free-services" element={<FreeServices />} />
            <Route path="/notifications" element={<Notifications />} />
            <Route path="/expert/:id" element={<ExpertPublicProfile />} />
          </Route>

          {/* User Protected Routes */}
          <Route element={<ProtectedRoute allowedRoles={['USER']} />}>
            <Route path="/dashboard" element={<UserDashboard />} />
            <Route path="/book/:id" element={<BookConsultation />} />
            <Route path="/wallet" element={<WalletRecharge />} />
            <Route path="/bookings" element={<Bookings />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/support" element={<Support />} />
            <Route path="/messages" element={<Messages />} />
          </Route>
          
          <Route element={<ProtectedRoute allowedRoles={['USER', 'EXPERT']} />}>
            <Route path="/live/:id" element={<LiveSession />} />
          </Route>


          {/* Expert Protected Routes */}
          <Route element={<ProtectedRoute allowedRoles={['EXPERT']} />}>
            <Route element={<ExpertLayout />}>
              <Route path="/expert/dashboard" element={<ExpertDashboard />} />
              <Route path="/expert/consultations" element={<ExpertConsultations />} />
              <Route path="/expert/schedule" element={<ExpertSchedule />} />
              <Route path="/expert/messages" element={<ExpertMessages />} />
              <Route path="/expert/earnings" element={<ExpertEarnings />} />
              <Route path="/expert/services" element={<ExpertServices />} />
              <Route path="/expert/profile" element={<ExpertProfileEdit />} />
              <Route path="/expert/profile/edit" element={<ExpertProfileEdit />} />
              <Route path="/expert/clients" element={<ExpertClients />} />
              <Route path="/expert/settings" element={<ExpertSettings />} />
              <Route path="/expert/notifications" element={<ExpertNotifications />} />
            </Route>
          </Route>

        </Routes>
      </Router>
      </PlatformSettingsProvider>
    </AuthProvider>
  );
}

export default App;
