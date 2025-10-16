import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Dumbbell, Users, BookOpen, Calendar, Award, TrendingUp } from 'lucide-react';

function Home() {
  const { isAuthenticated, isAdmin, user } = useAuth();

  const getDashboardLink = () => {
    if (!isAuthenticated) return '/login';
    if (isAdmin) return '/admin';
    if (user?.role === 'trainer') return '/trainer-dashboard';
    return '/dashboard';
  };

  return (
    <div className="home-page">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-content">
          <h1 className="hero-title">Transform Your Body, Transform Your Life</h1>
          <p className="hero-subtitle">
            Join our fitness community and achieve your health goals with expert guidance,
            personalized workouts, and nutrition plans.
          </p>
          <div className="hero-buttons">
            {!isAuthenticated ? (
              <>
                <Link to="/register" className="btn btn-primary btn-large">
                  Get Started
                </Link>
                <Link to="/login" className="btn btn-secondary btn-large">
                  Login
                </Link>
              </>
            ) : (
              <Link to={getDashboardLink()} className="btn btn-primary btn-large">
                Go to Dashboard
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features-section">
        <h2 className="section-title">Why Choose Us</h2>
        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon">
              <Dumbbell size={40} />
            </div>
            <h3>Personalized Workouts</h3>
            <p>Track your progress with customized workout plans tailored to your fitness goals.</p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">
              <Users size={40} />
            </div>
            <h3>Expert Trainers</h3>
            <p>Work with certified trainers who specialize in various fitness disciplines.</p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">
              <BookOpen size={40} />
            </div>
            <h3>Nutrition Guidance</h3>
            <p>Access healthy recipes and nutrition plans to complement your fitness journey.</p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">
              <Calendar size={40} />
            </div>
            <h3>Fitness Events</h3>
            <p>Participate in community events, challenges, and group activities.</p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">
              <Award size={40} />
            </div>
            <h3>Track Progress</h3>
            <p>Monitor your achievements and stay motivated with detailed progress tracking.</p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">
              <TrendingUp size={40} />
            </div>
            <h3>Continuous Growth</h3>
            <p>Access blogs, tips, and resources to keep improving your fitness knowledge.</p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <div className="cta-content">
          <h2>Ready to Start Your Fitness Journey?</h2>
          <p>Join thousands of members who have transformed their lives with us.</p>
          {!isAuthenticated && (
            <Link to="/register" className="btn btn-primary btn-large">
              Sign Up Now
            </Link>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="footer-content">
          <div className="footer-grid">
            <div className="footer-section">
              <h3>About Us</h3>
              <p>
                We're dedicated to helping you achieve your fitness goals with expert guidance,
                personalized plans, and a supportive community.
              </p>
            </div>

            <div className="footer-section">
              <h3>Quick Links</h3>
              <ul className="footer-links">
                {isAuthenticated ? (
                  <>
                    <li><Link to="/recipes">Recipes</Link></li>
                    <li><Link to="/blog">Blog</Link></li>
                    <li><Link to="/events">Events</Link></li>
                    <li><Link to="/book-trainer">Book a Trainer</Link></li>
                  </>
                ) : (
                  <>
                    <li><Link to="/login">Login to Access Features</Link></li>
                    <li><Link to="/register">Create Account</Link></li>
                  </>
                )}
              </ul>
            </div>

            <div className="footer-section">
              <h3>Contact</h3>
              <p>Email: info@fit-track.com</p>
              <p>Phone: 0712345678</p>
              <p>Address: 123 Fitness St, Fit-track City</p>
            </div>

            <div className="footer-section">
              <h3>Hours</h3>
              <p>Weekdays : 8:00 AM - 10:00 PM</p>
              <p>Weekends : 8:00 AM - 8:00 PM</p>
            </div>
          </div>

          <div className="footer-bottom">
            <p>&copy; {new Date().getFullYear()} Fitness Center. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default Home;
