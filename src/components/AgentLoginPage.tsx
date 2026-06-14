import React, { useState } from 'react';
import { useAgentAuth } from '../hooks/useAgentAuth';
import { LoaderIcon } from './icons/LoaderIcon';
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
        <div className="relative min-h-screen overflow-hidden bg-ease-bg px-4 py-8 font-sans sm:px-6 lg:py-10">
            <div className="animated-grid pointer-events-none absolute inset-0 opacity-40" />
            <div className="pointer-events-none absolute -left-32 top-20 h-72 w-72 rounded-full bg-ease-electric/10 blur-3xl" />
            <div className="pointer-events-none absolute -right-24 bottom-10 h-80 w-80 rounded-full bg-purple-500/10 blur-3xl" />

            <button
                onClick={() => setPage('home')}
                className="relative z-10 inline-flex items-center rounded-full border border-white/70 bg-white/80 px-4 py-2 text-sm font-bold text-slate-600 shadow-sm backdrop-blur-xl transition hover:-translate-y-0.5 hover:text-ease-blue hover:shadow-lg"
            >
                &larr; Back to Home
            </button>

            <main className="relative z-10 mx-auto flex min-h-[calc(100vh-8rem)] w-full max-w-2xl items-center justify-center">
                <section className="w-full rounded-[2rem] border border-white/70 bg-white/70 p-6 shadow-[0_28px_90px_rgba(15,23,42,0.12)] backdrop-blur-2xl md:p-10">
                    <div className="w-full max-w-md">
                        <div className="mb-7 text-center">
                            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-ease-blue text-2xl font-black text-white shadow-xl shadow-ease-blue/20">
                                CE
                            </div>
                            <p className="mt-5 text-xs font-black uppercase tracking-[0.28em] text-ease-electric">Secure Partner Access</p>
                            <h2 className="mt-2 font-display text-3xl font-bold tracking-tight text-slate-950">Partner Login</h2>
                            <p className="mt-2 text-sm leading-6 text-slate-500">Sign in to review assigned clients, filings, status updates and team activity.</p>
                        </div>

                        <form onSubmit={handleLogin} className="glass-card space-y-5 p-5 md:p-6">
                            <div>
                                <label htmlFor="username" className="block text-sm font-black text-slate-700">
                                    Username
                                </label>
                                <input
                                    id="username"
                                    name="username"
                                    type="text"
                                    autoComplete="username"
                                    required
                                    className="input mt-2"
                                    placeholder="Enter your username"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                />
                            </div>

                            <div>
                                <label htmlFor="password" className="block text-sm font-black text-slate-700">
                                    Password
                                </label>
                                <input
                                    id="password"
                                    name="password"
                                    type="password"
                                    autoComplete="current-password"
                                    required
                                    className="input mt-2"
                                    placeholder="Enter your password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                            </div>

                            {error && (
                                <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-center text-sm font-bold text-red-700">
                                    {error}
                                </div>
                            )}

                            <div className="rounded-3xl border border-blue-100 bg-blue-50/70 p-4 text-center">
                                <p className="text-xs font-bold text-slate-500">For development access</p>
                                <p className="mt-1 font-mono text-sm font-black text-ease-blue">Partner / 1234</p>
                            </div>

                            <button
                                type="submit"
                                disabled={isLoading}
                                className="blue-glow-button flex w-full items-center justify-center disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                {isLoading ? <LoaderIcon /> : 'Enter Partner Workspace'}
                            </button>
                        </form>

                        <div className="mt-6 rounded-3xl border border-slate-100 bg-white/70 p-4 text-center text-sm text-slate-500 shadow-sm">
                            Need help?{' '}
                            <a href="mailto:support@charteredease.in" className="font-black text-ease-blue hover:underline">
                                support@charteredease.in
                            </a>
                        </div>
                    </div>
                </section>
            </main>
        </div>
    );
};

export default AgentLoginPage;
