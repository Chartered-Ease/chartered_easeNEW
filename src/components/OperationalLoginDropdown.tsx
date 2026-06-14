import React, { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { LoaderIcon } from './icons/LoaderIcon';
import { useAgentAuth } from '../hooks/useAgentAuth';
import { useAssociateAuth } from '../hooks/useAssociateAuth';
import { useAdminAuth } from '../hooks/useAdminAuth';

type PortalRole = 'partner' | 'associate' | 'admin';

interface Props {
  role: PortalRole;
  label: string;
  buttonClassName?: string;
}

const roleConfig: Record<PortalRole, {
  eyebrow: string;
  title: string;
  copy: string;
  usernameLabel: string;
  demoUser: string;
  error: string;
  cta: string;
  tone: string;
}> = {
  partner: {
    eyebrow: 'Partner access',
    title: 'Partner / Agent Login',
    copy: 'Manage clients, service workflows and filing status.',
    usernameLabel: 'Username',
    demoUser: 'Partner',
    error: 'Invalid partner credentials.',
    cta: 'Enter Partner Workspace',
    tone: 'from-blue-600 to-cyan-500',
  },
  associate: {
    eyebrow: 'Associate access',
    title: 'Associate Login',
    copy: 'Open assigned tasks, document reviews and acknowledgements.',
    usernameLabel: 'User ID or Email',
    demoUser: 'Associate',
    error: 'Invalid associate credentials.',
    cta: 'Enter Associate Workspace',
    tone: 'from-purple-600 to-blue-500',
  },
  admin: {
    eyebrow: 'Admin access',
    title: 'Admin Portal',
    copy: 'Manage platform users, agents, services and operational controls.',
    usernameLabel: 'User ID or Email',
    demoUser: 'Admin',
    error: 'Invalid admin credentials.',
    cta: 'Enter Admin Console',
    tone: 'from-slate-950 to-blue-700',
  },
};

const OperationalLoginDropdown: React.FC<Props> = ({
  role,
  label,
  buttonClassName = 'text-left text-gray-400 transition-colors hover:text-white',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const partnerAuth = useAgentAuth();
  const associateAuth = useAssociateAuth();
  const adminAuth = useAdminAuth();
  const config = roleConfig[role];

  useEffect(() => {
    const handleClickAway = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsOpen(false);
    };

    document.addEventListener('mousedown', handleClickAway);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickAway);
      document.removeEventListener('keydown', handleEscape);
    };
  }, []);

  const runLogin = () => {
    if (role === 'partner') return partnerAuth.login(username, password);
    if (role === 'associate') return associateAuth.login(username, password);
    return adminAuth.login(username, password);
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setIsLoading(true);

    setTimeout(() => {
      const success = runLogin();
      if (success) {
        setIsOpen(false);
        setUsername('');
        setPassword('');
      } else {
        setError(config.error);
      }
      setIsLoading(false);
    }, 550);
  };

  return (
    <div ref={wrapperRef} className="relative inline-flex justify-center md:justify-start">
      <button
        type="button"
        onClick={() => setIsOpen(prev => !prev)}
        className={buttonClassName}
        aria-expanded={isOpen}
      >
        {label}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            transition={{ duration: 0.22 }}
            className="absolute bottom-full left-1/2 z-[90] mb-3 w-[min(22rem,calc(100vw-2rem))] -translate-x-1/2 overflow-hidden rounded-[1.4rem] border border-white/80 bg-white/95 text-left text-slate-900 shadow-2xl shadow-slate-950/25 backdrop-blur-xl md:left-0 md:translate-x-0"
          >
            <div className={`bg-gradient-to-br ${config.tone} p-4 text-white`}>
              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-blue-100">{config.eyebrow}</p>
              <h3 className="mt-2 text-xl font-black">{config.title}</h3>
              <p className="mt-1 text-sm leading-5 text-blue-100">{config.copy}</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3 p-4">
              <div>
                <label htmlFor={`${role}-username`} className="block text-xs font-black uppercase tracking-wide text-slate-500">
                  {config.usernameLabel}
                </label>
                <input
                  id={`${role}-username`}
                  name={`${role}-username`}
                  type="text"
                  autoComplete="username"
                  required
                  className="input mt-2 py-3 text-sm font-bold"
                  placeholder={config.demoUser}
                  value={username}
                  onChange={(event) => {
                    setUsername(event.target.value);
                    setError('');
                  }}
                />
              </div>

              <div>
                <label htmlFor={`${role}-password`} className="block text-xs font-black uppercase tracking-wide text-slate-500">
                  Password
                </label>
                <input
                  id={`${role}-password`}
                  name={`${role}-password`}
                  type="password"
                  autoComplete="current-password"
                  required
                  className="input mt-2 py-3 text-sm font-bold"
                  placeholder="Enter password"
                  value={password}
                  onChange={(event) => {
                    setPassword(event.target.value);
                    setError('');
                  }}
                />
              </div>

              <div className="rounded-2xl border border-blue-100 bg-blue-50 p-3 text-center">
                <p className="text-[11px] font-bold text-slate-500">Development access</p>
                <p className="mt-1 font-mono text-xs font-black text-ease-blue">{config.demoUser} / 1234</p>
              </div>

              {error && (
                <p className="rounded-2xl border border-red-100 bg-red-50 p-3 text-sm font-bold text-red-700">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="flex w-full justify-center rounded-2xl bg-ease-blue px-4 py-3 text-sm font-black text-white shadow-lg shadow-ease-blue/20 transition hover:-translate-y-0.5 hover:bg-ease-electric disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isLoading ? <LoaderIcon /> : config.cta}
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default OperationalLoginDropdown;
