
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { User, LogOut, Menu, X } from 'lucide-react';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className="bg-blue-600 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link to="/" className="flex items-center space-x-2">
            <div className="text-xl font-bold">VyapaarMitra</div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-4">
            {user ? (
              <>
                <Link to="/dashboard" className="hover:text-blue-200 px-3 py-2">Dashboard</Link>
                <Link to="/msme-bazaar" className="hover:text-blue-200 px-3 py-2">MSME Bazaar</Link>
                <Link to="/navarambh" className="hover:text-blue-200 px-3 py-2">Navarambh</Link>
                <Link to="/agent-hub" className="hover:text-blue-200 px-3 py-2">Agent Hub</Link>
                <Link to="/compliance" className="hover:text-blue-200 px-3 py-2">Compliance</Link>
                <Link to="/loans" className="hover:text-blue-200 px-3 py-2">Loans</Link>
                <Link to="/procurement" className="hover:text-blue-200 px-3 py-2">Procurement</Link>
                <div className="flex items-center space-x-2">
                  <User className="w-5 h-5" />
                  <span>{user.first_name}</span>
                  <button onClick={handleLogout} className="hover:text-blue-200">
                    <LogOut className="w-5 h-5" />
                  </button>
                </div>
              </>
            ) : (
              <>
                <Link to="/login" className="hover:text-blue-200 px-3 py-2">Login</Link>
                <Link to="/register" className="bg-blue-500 hover:bg-blue-400 px-4 py-2 rounded">Register</Link>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden"
          >
            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden pb-4">
            {user ? (
              <>
                <Link to="/dashboard" className="block py-2 hover:text-blue-200">Dashboard</Link>
                <Link to="/msme-bazaar" className="block py-2 hover:text-blue-200">MSME Bazaar</Link>
                <Link to="/navarambh" className="block py-2 hover:text-blue-200">Navarambh</Link>
                <Link to="/agent-hub" className="block py-2 hover:text-blue-200">Agent Hub</Link>
                <Link to="/compliance" className="block py-2 hover:text-blue-200">Compliance</Link>
                <Link to="/loans" className="block py-2 hover:text-blue-200">Loans</Link>
                <Link to="/procurement" className="block py-2 hover:text-blue-200">Procurement</Link>
                <div className="flex items-center space-x-2 py-2">
                  <User className="w-5 h-5" />
                  <span>{user.first_name}</span>
                  <button onClick={handleLogout} className="hover:text-blue-200">
                    <LogOut className="w-5 h-5" />
                  </button>
                </div>
              </>
            ) : (
              <>
                <Link to="/login" className="block py-2 hover:text-blue-200">Login</Link>
                <Link to="/register" className="block py-2 hover:text-blue-200">Register</Link>
              </>
            )}
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
