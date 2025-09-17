import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { User, LogOut, Dumbbell } from 'lucide-react';

const Navbar = () => {
  const { user, logout, isAuthenticated, isAdmin } = useAuth();

  return (
    <nav className="navbar">
      <div className="navbar-content">
        <Link to="/" className="navbar-brand">
          <Dumbbell size={24} style={{ marginRight: '8px', display: 'inline' }} />
          Fit-Track
        </Link>
        
        {isAuthenticated ? (
          <div className="navbar-nav">
            {isAdmin ? (
              <Link to="/admin" className="nav-link">Admin Dashboard</Link>
            ) : (
              <Link to="/dashboard" className="nav-link">Member Dashboard</Link>
            )}
            <div className="user-info">
              <User size={20} />
              <span className="user-name">
                {user?.fullName} {isAdmin && '(Admin)'}
              </span>
            </div>
            <button onClick={logout} className="logout-btn">
              <LogOut size={16} style={{ marginRight: '4px' }} />
              Logout
            </button>
          </div>
        ) : (
          <div className="navbar-nav">
            <Link to="/login" className="nav-link">Login</Link>
            <Link to="/register" className="nav-link">Register</Link>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
