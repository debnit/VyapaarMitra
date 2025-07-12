
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from 'react-query';
import { Toaster } from 'react-hot-toast';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import MSMEBazaar from './pages/MSMEBazaar';
import Navarambh from './pages/Navarambh';
import AgentHub from './pages/AgentHub';
import Compliance from './pages/Compliance';
import Loans from './pages/Loans';
import Procurement from './pages/Procurement';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import './App.css';

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router>
          <div className="App">
            <Navbar />
            <main className="main-content">
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/dashboard" element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                } />
                <Route path="/msme-bazaar" element={
                  <ProtectedRoute>
                    <MSMEBazaar />
                  </ProtectedRoute>
                } />
                <Route path="/navarambh" element={
                  <ProtectedRoute>
                    <Navarambh />
                  </ProtectedRoute>
                } />
                <Route path="/agent-hub" element={
                  <ProtectedRoute>
                    <AgentHub />
                  </ProtectedRoute>
                } />
                <Route path="/compliance" element={
                  <ProtectedRoute>
                    <Compliance />
                  </ProtectedRoute>
                } />
                <Route path="/loans" element={
                  <ProtectedRoute>
                    <Loans />
                  </ProtectedRoute>
                } />
                <Route path="/procurement" element={
                  <ProtectedRoute>
                    <Procurement />
                  </ProtectedRoute>
                } />
              </Routes>
            </main>
            <Toaster position="top-right" />
          </div>
        </Router>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
