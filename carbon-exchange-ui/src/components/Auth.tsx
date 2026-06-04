import React, { useState } from 'react';
import { login, register } from '../services/auth';
import type { User } from '../types';

interface AuthProps {
    onLogin: (user: User) => void;
}

const Auth: React.FC<AuthProps> = ({ onLogin }) => {
    const [isLogin, setIsLogin] = useState(true);
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        try {
            const user = isLogin 
                ? await login(username, password)
                : await register(username, password);
            onLogin(user);
        } catch (err) {
            setError(isLogin ? 'Login failed' : 'Registration failed');
        }
    };

    return (
        <div className="auth-container panel">
            <h2>{isLogin ? 'Login' : 'Sign Up'}</h2>
            <form onSubmit={handleSubmit} className="trading-form">
                <div className="form-group">
                    <label>Username</label>
                    <input 
                        type="text" 
                        value={username} 
                        onChange={(e) => setUsername(e.target.value)} 
                        required 
                    />
                </div>
                <div className="form-group">
                    <label>Password</label>
                    <input 
                        type="password" 
                        value={password} 
                        onChange={(e) => setPassword(e.target.value)} 
                        required 
                    />
                </div>
                {error && <div className="error-message">{error}</div>}
                <button type="submit" className="submit-btn">
                    {isLogin ? 'Login' : 'Register'}
                </button>
            </form>
            <p className="auth-toggle">
                {isLogin ? "Don't have an account? " : "Already have an account? "}
                <button onClick={() => setIsLogin(!isLogin)} className="link-btn">
                    {isLogin ? 'Sign Up' : 'Login'}
                </button>
            </p>
        </div>
    );
};

export default Auth;
