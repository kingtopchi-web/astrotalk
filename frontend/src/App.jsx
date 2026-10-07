import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

// Public/User Pages
import Home from './pages/Home';
import BookConsultation from './pages/BookConsultation';
import LiveSession from './pages/LiveSession';
import WalletRecharge from './pages/WalletRecharge';
import Login from './pages/Login';
import Register from './pages/Register';
import Experts from './pages/Experts';
import Market from './pages/Market';
import Bookings from './pages/Bookings';
import Profile from './pages/Profile';
import UserDashboard from './pages/UserDashboard';
import ExpertPublicProfile from './pages/ExpertProfile';
import About from './pages/About';
import Contact from './pages/Contact';
import ForgotPassword from './pages/ForgotPassword';
import Settings from './pages/Settings';
import Support from './pages/Support';
import Messages from './pages/Messages';

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

import './index.css';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/expert/login" element={<ExpertLogin />} />
          <Route path="/expert/register" element={<ExpertRegister />} />

          {/* Semi-Public Routes (content available after login) */}
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/experts" element={<Experts />} />
          <Route path="/expert/:id" element={<ExpertPublicProfile />} />
          <Route path="/market" element={<Market />} />

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
            </Route>
          </Route>

        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
