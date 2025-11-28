import React, { useState } from 'react';
import './login.css';
import { Eye, EyeOff, LogIn, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({ username: '', password: '' });
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleClearFields = () => {
    setUsername('');
    setPassword('');
    setErrors({ username: '', password: '' });
  };

  const validateForm = () => {
    const newErrors = { username: '', password: '' };
    let isValid = true;
    if (!username.trim()) { newErrors.username = 'Username is required'; isValid = false; }
    if (!password) { newErrors.password = 'Password is required'; isValid = false; }
    setErrors(newErrors);
    return isValid;
  };

  const handleLogin = (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!validateForm()) return;
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      console.log('Login attempted with:', { username, password });
      // On successful login navigate to control center
      navigate('/controlcenter');
    }, 1200);
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
            <label className="lx-label" htmlFor="username">Username</label>
            <div className="lx-field">
              <input
                id="username"
                className={`lx-input ${errors.username ? 'lx-input-error' : ''}`}
                type="text"
                value={username}
                onChange={(e) => { setUsername(e.target.value); if (errors.username) setErrors({ ...errors, username: '' }); }}
                onKeyDown={handleKeyPress}
                placeholder="Enter your username"
                aria-label="username"
              />
              {errors.username && (
                <div className="lx-input-icon"><AlertCircle /></div>
              )}
            </div>
            {errors.username && <p className="lx-error-text">{errors.username}</p>}

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
