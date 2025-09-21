import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { User, LogOut, Dumbbell } from 'lucide-react';

const Navbar = () => {
  const { user, logout, isAuthenticated, isAdmin } = useAuth();
  const isTrainer = user?.role === 'trainer';

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
            ) : isTrainer ? (
              <Link to="/trainer-dashboard" className="nav-link">Trainer Dashboard</Link>
            ) : (
              <Link to="/dashboard" className="nav-link">Member Dashboard</Link>
            )}
            <Link to="/blog" className="nav-link">Blog</Link>
            <Link to="/book-trainer" className="nav-link">Book a Trainer</Link>
            <Link to="/recipes" className="nav-link">Recipes</Link>
            <Link to="/events" className="nav-link">Events</Link>
            <div className="user-info">
              <User size={20} />
              <span className="user-name">
                {user?.fullName} {isAdmin && '(Admin)'} {isTrainer && '(Trainer)'}
              </span>
            </div>
            <button onClick={logout} className="logout-btn">
              <LogOut size={16} style={{ marginRight: '4px' }} />
              Logout
            </button>
          </div>
        ) : (
          <div className="navbar-nav">
            <Link to="/blog" className="nav-link">Blog</Link>
            <Link to="/book-trainer" className="nav-link">Book a Trainer</Link>
            <Link to="/recipes" className="nav-link">Recipes</Link>
            <Link to="/events" className="nav-link">Events</Link>
            <Link to="/login" className="nav-link">Login</Link>
            <Link to="/register" className="nav-link">Register</Link>
            <Link to="/register-trainer" className="nav-link" style={{ 
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              padding: '0.5rem 1rem',
              borderRadius: '6px',
              textDecoration: 'none',
              fontWeight: '500'
            }}>
              Register as Trainer
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
