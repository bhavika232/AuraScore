import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./AuthContext";
import ProtectedRoute from "./ProtectedRoute";
import Navbar from "./Navbar";
import "./globals.css";

import Landing from "./Landing";
import Login from "./Login";
import Signup from "./Signup";
import ForgotPassword from "./ForgotPassword";
import Dashboard from "./Dashboard";
import Interview from "./Interview";
import Results from "./Results";
import {
  VoiceAnalysis, BodyLanguage, EyeContact, ConfidenceScore,
  PracticeMode, TipsCoaching, History, About, Profile, NotFound
} from "./Modules";

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Navbar />
        <Routes>
          {/* Public */}
          <Route path="/"                 element={<Landing />} />
          <Route path="/login"            element={<Login />} />
          <Route path="/signup"           element={<Signup />} />
          <Route path="/forgot-password"  element={<ForgotPassword />} />
          <Route path="/about"            element={<About />} />

          {/* Protected */}
          <Route path="/dashboard"   element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/interview"   element={<ProtectedRoute><Interview /></ProtectedRoute>} />
          <Route path="/results"     element={<ProtectedRoute><Results /></ProtectedRoute>} />
          <Route path="/voice"       element={<ProtectedRoute><VoiceAnalysis /></ProtectedRoute>} />
          <Route path="/body"        element={<ProtectedRoute><BodyLanguage /></ProtectedRoute>} />
          <Route path="/eye-contact" element={<ProtectedRoute><EyeContact /></ProtectedRoute>} />
          <Route path="/confidence"  element={<ProtectedRoute><ConfidenceScore /></ProtectedRoute>} />
          <Route path="/practice"    element={<ProtectedRoute><PracticeMode /></ProtectedRoute>} />
          <Route path="/tips"        element={<ProtectedRoute><TipsCoaching /></ProtectedRoute>} />
          <Route path="/profile"     element={<ProtectedRoute><Profile /></ProtectedRoute>} />

          {/* 404 */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
