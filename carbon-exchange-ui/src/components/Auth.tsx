import React, { useState } from 'react';
import { Form, Button, Alert } from 'react-bootstrap';
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
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const user = isLogin 
                ? await login(username, password)
                : await register(username, password);
            onLogin(user);
        } catch (err) {
            setError(isLogin ? 'Login failed. Check credentials.' : 'Registration failed.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            <h5 className="mb-3 fw-bold text-body">{isLogin ? 'Login' : 'Create Account'}</h5>
            <Form onSubmit={handleSubmit}>
                <Form.Group className="mb-3">
                    <Form.Label className="small text-secondary fw-bold text-uppercase">Username</Form.Label>
                    <Form.Control 
                        type="text" 
                        value={username} 
                        onChange={(e) => setUsername(e.target.value)} 
                        required 
                        className="border-secondary"
                        size="sm"
                    />
                </Form.Group>
                <Form.Group className="mb-3">
                    <Form.Label className="small text-secondary fw-bold text-uppercase">Password</Form.Label>
                    <Form.Control 
                        type="password" 
                        value={password} 
                        onChange={(e) => setPassword(e.target.value)} 
                        required 
                        className="border-secondary"
                        size="sm"
                    />
                </Form.Group>
                
                {error && <Alert variant="danger" className="py-1 px-2 small">{error}</Alert>}
                
                <Button variant="primary" type="submit" className="w-100 fw-bold mb-3" disabled={loading} size="sm">
                    {loading ? 'Processing...' : (isLogin ? 'LOGIN' : 'REGISTER')}
                </Button>
            </Form>
            
            <div className="text-center small">
                <span className="text-secondary">
                    {isLogin ? "New to the platform?" : "Joined us before?"}
                </span>
                <Button variant="link" size="sm" onClick={() => setIsLogin(!isLogin)} className="text-info p-0 ms-1 fw-bold text-decoration-none">
                    {isLogin ? 'Create an account' : 'Sign in'}
                </Button>
            </div>
        </div>
    );
};

export default Auth;
