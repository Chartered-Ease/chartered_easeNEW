import React, { useState } from 'react';
import { useEmployeeAuth } from '../../hooks/useEmployeeAuth';
import { LoaderIcon } from '../icons/LoaderIcon';

const EmployeeLoginPage: React.FC = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const { login } = useEmployeeAuth();

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        setTimeout(() => {
            const success = login(email, password);
            if (!success) {
                setError('Invalid employee credentials.');
            }
            setIsLoading(false);
        }, 1000);
    };

    return (
        <div className="flex items-center justify-center min-h-[70vh] bg-gray-50 px-4 py-12">
            <div className="w-full max-w-sm p-8 space-y-6 bg-white rounded-lg shadow-xl">
                <div className="text-center">
                    <h1 className="text-3xl font-bold text-gray-800">Employee Panel</h1>
                    <p className="mt-2 text-gray-600">Please sign in to your work account.</p>
                </div>

                <form onSubmit={handleLogin} className="space-y-4">
                    <div>
                        <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                            Work Email
                        </label>
                        <input
                            id="email"
                            name="email"
                            type="email"
                            autoComplete="email"
                            required
                            className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-ease-blue focus:border-ease-blue"
                            placeholder="rohan@charteredease.in"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
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

                    <div>
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-ease-blue hover:bg-ease-blue/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ease-blue disabled:bg-ease-blue/50 disabled:cursor-not-allowed transition-colors"
                        >
                            {isLoading ? <LoaderIcon /> : 'Sign In'}
                        </button>
                    </div>
                     <p className="px-8 text-center text-xs text-gray-500">
                        This portal is for authorized Chartered Ease employees only.
                    </p>
                </form>
            </div>
        </div>
    );
};

export default EmployeeLoginPage;
