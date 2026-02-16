
import React, { useState } from 'react';
import { useAgentAuth } from '../hooks/useAgentAuth';
import { LoaderIcon } from './icons/LoaderIcon';
import { CharteredEaseLogo } from './icons/EaseIndiaLogo';
import { useAppContext } from '../hooks/useAppContext';

const AgentLoginPage: React.FC = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const { login } = useAgentAuth();
    const { setPage } = useAppContext();

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        setTimeout(() => {
            const success = login(username, password);
            if (!success) {
                setError('Invalid agent credentials.');
            }
            setIsLoading(false);
        }, 1000);
    };

    return (
        <div className="min-h-screen bg-[#f5f6f9] flex flex-col items-center justify-center p-4 font-sans">
            <div className="text-center mb-8">
                <CharteredEaseLogo className="h-16 w-16 mx-auto mb-4" />
                <h1 className="text-2xl font-bold text-gray-800">Chartered Ease Partner Portal</h1>
                <p className="text-md text-gray-500 mt-1">Partner Login – Access your Chartered Ease Partner Dashboard.</p>
            </div>

            <div className="w-full max-w-md p-10 space-y-6 bg-white rounded-2xl shadow-lg animate-fade-in">
                <div className="text-center">
                    <h2 className="text-3xl font-bold text-gray-800">Partner Login</h2>
                    <p className="mt-2 text-gray-600">Please sign in to your partner account.</p>
                </div>

                <form onSubmit={handleLogin} className="space-y-5">
                    <div>
                        <label htmlFor="username" className="block text-sm font-medium text-gray-700">
                            Username
                        </label>
                        <input
                            id="username"
                            name="username"
                            type="text"
                            autoComplete="username"
                            required
                            className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-ease-blue focus:border-ease-blue"
                            placeholder="Enter your username"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                        />
                    </div>

                    <div>
                        <label htmlFor="password"className="block text-sm font-medium text-gray-700">
                            Password
                        </label>
                        <input
                            id="password"
                            name="password"
                            type="password"
                            autoComplete="current-password"
                            required
                            className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-ease-blue focus:border-ease-blue"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                    </div>
                    
                    {error && <p className="text-sm text-red-600 text-center">{error}</p>}
                    
                    <p className="text-center text-xs text-gray-400 pt-2">For development, use: <span className="font-mono font-bold text-gray-600">Partner</span> / <span className="font-mono font-bold text-gray-600">1234</span></p>

                    <div>
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-ease-blue hover:bg-ease-blue/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ease-blue disabled:bg-ease-blue/50 disabled:cursor-not-allowed transition-colors"
                        >
                            {isLoading ? <LoaderIcon /> : 'Sign In'}
                        </button>
                    </div>
                </form>

                <div className="text-center text-sm text-gray-500 pt-6 space-y-3">
                    <p>
                        Need help?{' '}
                        <a href="mailto:support@charteredease.in" className="font-semibold text-ease-blue hover:underline">
                            support@charteredease.in
                        </a>
                    </p>
                    <button onClick={() => setPage('home')} className="hover:underline text-gray-600">
                        &larr; Back to Home
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AgentLoginPage;
