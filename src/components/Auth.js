import { useState } from 'react';
import { signUp, signIn, signOut, getCurrentUser } from '../lib/supabase';

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [user, setUser] = useState(null);
  
  // Check if user is already logged in
  useState(() => {
    const checkUser = async () => {
      const { user, error } = await getCurrentUser();
      if (user && !error) {
        setUser(user);
      }
    };
    
    checkUser();
  }, []);
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      if (isLogin) {
        // Login
        const { data, error } = await signIn(email, password);
        if (error) throw error;
        setUser(data.user);
      } else {
        // Sign up
        const { data, error } = await signUp(email, password, username);
        if (error) throw error;
        setUser(data.user);
      }
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };
  
  const handleSignOut = async () => {
    setLoading(true);
    try {
      const { error } = await signOut();
      if (error) throw error;
      setUser(null);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };
  
  // If user is logged in, show profile and sign out button
  if (user) {
    return (
      <div className="auth-container">
        <div className="user-profile">
          <h2>Welcome, {user.user_metadata?.username || 'Player'}</h2>
          <button onClick={handleSignOut} disabled={loading} className="control-button">
            {loading ? 'Signing out...' : 'Sign Out'}
          </button>
        </div>
        {error && <p className="error">{error}</p>}
        }
      </div>
    );
  }
  
  // If user is not logged in, show login/signup form
  return (
    <div className="auth-container">
      <h2>{isLogin ? 'Sign In' : 'Create Account'}</h2>
      <form onSubmit={handleSubmit}>
        {!isLogin && (
          <div className="form-group">
            <label htmlFor="username">Username</label>
            <input 
              type="text" 
              id="username" 
              value={username} 
              onChange={(e) => setUsername(e.target.value)} 
              required
            />
          </div>
        )}
        
        <div className="form-group">
          <label htmlFor="email">Email</label>
          <input 
            type="email" 
            id="email" 
            value={email} 
            onChange={(e) => setEmail(e.target.value)} 
            required
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="password">Password</label>
          <input 
            type="password" 
            id="password" 
            value={password} 
            onChange={(e) => setPassword(e.target.value)} 
            required
          />
        </div>
        
        <button type="submit" disabled={loading} className="control-button">
          {loading ? 'Processing...' : (isLogin ? 'Sign In' : 'Sign Up')}
        </button>
      </form>
      
      <p>
        {isLogin ? "Don't have an account? " : "Already have an account? "}
        <button 
          onClick={() => setIsLogin(!isLogin)} 
          className="link-button"
        >
          {isLogin ? 'Sign Up' : 'Sign In'}
        </button>
      </p>
      
      {error && <p className="error">{error}</p>}
      }
    </div>
  );
}