import React, { useState } from 'react';
import './login.css';
import { Eye, EyeOff, LogIn, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from './firebase-config';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({ email: '', password: '' });
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleClearFields = () => {
    setEmail('');
    setPassword('');
    setErrors({ email: '', password: '' });
  };

  const validateForm = () => {
    const newErrors = { email: '', password: '' };
    let isValid = true;
    if (!email.trim()) { newErrors.email = 'Email is required'; isValid = false; }
    if (!password) { newErrors.password = 'Password is required'; isValid = false; }
    setErrors(newErrors);
    return isValid;
  };

  const handleLogin = (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!validateForm()) return;
    setIsLoading(true);
    signInWithEmailAndPassword(auth, email, password)
      .then((userCredential) => {
        setIsLoading(false);
        // userCredential.user contains user info
        console.log('Firebase login successful:', userCredential.user);
        navigate('/controlcenter');
      })
      .catch((error) => {
        setIsLoading(false);
        const code = error.code || '';
        let message = 'Login failed. Please try again.';
        if (code === 'auth/invalid-email') message = 'Invalid email address.';
        else if (code === 'auth/user-not-found') message = 'No account found for that email.';
        else if (code === 'auth/wrong-password') message = 'Incorrect password.';
        else if (error.message) message = error.message;
        setErrors({ ...errors, password: message });
        console.error('Firebase login error:', error);
      });
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') handleLogin(e);
  };

  return (
    <div className="lx-background">
      <div className="lx-blob lx-blob--1" aria-hidden></div>
      <div className="lx-blob lx-blob--2" aria-hidden></div>
      <div className="lx-blob lx-blob--3" aria-hidden></div>

      <div className="lx-container">
        <div className="lx-card">
          <div className="lx-logos">
            <div className="lx-left-logo">
              <img src="/shs_logo.png" alt="Senior High School logo" className="lx-left-img" />
            </div>

            <div className="lx-main-logo">
              <img src="/alertx_logo.png" alt="AlertX logo" className="lx-main-img" />
            </div>
          </div>

          <div className="lx-welcome">
            <h2 className="lx-title">Welcome Back</h2>
            <p className="lx-sub">Sign in to continue to AlertX</p>
          </div>

          <form className="lx-form" onSubmit={handleLogin}>
            <label className="lx-label" htmlFor="email">Email</label>
            <div className="lx-field">
              <input
                id="email"
                className={`lx-input ${errors.email ? 'lx-input-error' : ''}`}
                type="email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); if (errors.email) setErrors({ ...errors, email: '' }); }}
                onKeyDown={handleKeyPress}
                placeholder="Enter your email"
                aria-label="email"
              />
              {errors.email && (
                <div className="lx-input-icon"><AlertCircle /></div>
              )}
            </div>
            {errors.email && <p className="lx-error-text">{errors.email}</p>}

            <label className="lx-label" htmlFor="password">Password</label>
            <div className="lx-field">
              <input
                id="password"
                className={`lx-input ${errors.password ? 'lx-input-error' : ''}`}
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => { setPassword(e.target.value); if (errors.password) setErrors({ ...errors, password: '' }); }}
                onKeyDown={handleKeyPress}
                placeholder="Enter your password"
                aria-label="password"
              />
              <button type="button" className="lx-toggle" onClick={() => setShowPassword(!showPassword)} aria-label="toggle password visibility">
                {showPassword ? <EyeOff /> : <Eye />}
              </button>
            </div>
            {errors.password && <p className="lx-error-text">{errors.password}</p>}

            <div className="lx-forgot">
              <button type="button" className="lx-forgot-btn">Forgot password?</button>
            </div>

            <div className="lx-buttons">
              <button type="button" className="lx-clear" onClick={handleClearFields}>Clear Fields</button>
              <button type="button" className="lx-login" onClick={handleLogin} disabled={isLoading}>
                {isLoading ? (
                  <span className="lx-spinner" aria-hidden />
                ) : (
                  <>
                    <span>Login</span>
                    <LogIn />
                  </>
                )}
              </button>
            </div>
          </form>

          <div className="lx-footer">
            <p className="lx-footer-text">Don't have an account? <button className="lx-signup">Sign up</button></p>
          </div>
        </div>

        <div className="lx-bottom-text">© 2024 Senior High School & AlertX. All rights reserved.</div>
      </div>
    </div>
  );
}

export default Login;
