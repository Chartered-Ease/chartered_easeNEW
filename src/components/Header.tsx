
import React from 'react';
import { motion } from 'framer-motion';
import { CharteredEaseLogo } from './icons/EaseIndiaLogo';
import { useAppContext } from '../hooks/useAppContext';
import { useAuth } from '../hooks/useAuth';
import { useAgentAuth } from '../hooks/useAgentAuth';
import { useCorporateAuth } from '../hooks/useCorporateAuth';
import { useAdminAuth } from '../hooks/useAdminAuth';
import { useAssociateAuth } from '../hooks/useAssociateAuth';
import CustomerLoginDropdown from './CustomerLoginDropdown';

const Header: React.FC = () => {
  const { page, setPage } = useAppContext();
  const customerAuth = useAuth();
  const agentAuth = useAgentAuth();
  const corporateAuth = useCorporateAuth();
  const adminAuth = useAdminAuth();
  const associateAuth = useAssociateAuth();

  const NavLink: React.FC<{ page: string; children: React.ReactNode }> = ({ page: targetPage, children }) => {
    const active = page === targetPage;
    return (
    <button
      onClick={() => setPage(targetPage)}
      className={`relative rounded-full px-3 py-2 text-sm font-semibold transition-colors ${active ? 'text-ease-blue' : 'text-slate-600 hover:text-ease-blue'}`}
    >
      {children}
      {active && (
        <motion.span
          layoutId="nav-active-pill"
          className="absolute inset-0 -z-10 rounded-full bg-ease-blue/10"
          transition={{ type: 'spring', stiffness: 420, damping: 34 }}
        />
      )}
      <span className="absolute inset-x-3 -bottom-0.5 h-px origin-left scale-x-0 bg-ease-electric transition-transform duration-300 hover:scale-x-100" />
    </button>
    );
  };

  const handleLogout = () => {
      if (customerAuth.isAuthenticated) void customerAuth.logout();
      if (agentAuth.isAgentAuthenticated) agentAuth.logout();
      if (corporateAuth.isCorporateAuthenticated) corporateAuth.logout();
      if (adminAuth.isAdminAuthenticated) adminAuth.logout();
      if (associateAuth.isAssociateAuthenticated) associateAuth.logout();
      setPage('home');
  }

  const getDashboardPage = () => {
    if (customerAuth.isAuthenticated) return 'user-dashboard';
    if (agentAuth.isAgentAuthenticated) return 'agent-dashboard';
    if (corporateAuth.isCorporateAuthenticated) return 'corporate-dashboard';
    if (adminAuth.isAdminAuthenticated) return 'admin-dashboard';
    if (associateAuth.isAssociateAuthenticated) return 'associate-dashboard';
    return 'home';
  };

  const getIsAnyAuthenticated = () => {
    return customerAuth.isAuthenticated || agentAuth.isAgentAuthenticated || corporateAuth.isCorporateAuthenticated || adminAuth.isAdminAuthenticated || associateAuth.isAssociateAuthenticated;
  };
  
  const isAnyAuthenticated = getIsAnyAuthenticated();

  return (
    <motion.header
      initial={{ y: -18, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.45, ease: 'easeOut' }}
      className="sticky top-0 z-50 border-b border-white/60 bg-white/75 shadow-[0_12px_40px_rgba(15,23,42,0.06)] backdrop-blur-2xl"
    >
      <nav className="container mx-auto px-4 sm:px-6 py-3 flex justify-between items-center">
        {/* Logo Section */}
        <button onClick={() => setPage('home')} className="flex items-center space-x-2 group">
          <div className="rounded-2xl bg-white p-1.5 shadow-lg shadow-ease-blue/10 transition duration-300 group-hover:scale-105 group-hover:shadow-ease-blue/20">
            <CharteredEaseLogo className="h-8 w-8" />
          </div>
          <div className="flex flex-col items-start">
            <span className="font-display font-bold text-xl text-ease-blue leading-none">Chartered Ease</span>
            <span className="text-[10px] text-slate-500 font-bold tracking-[0.12em]">START, GROW AND COMPLIANCE WITH EASE</span>
          </div>
        </button>

        {/* Navigation */}
        <div className="hidden md:flex items-center gap-2 rounded-full border border-white/70 bg-white/65 p-1 shadow-sm">
          {!isAnyAuthenticated && <NavLink page="home">Home</NavLink>}
          {isAnyAuthenticated ? (
             <NavLink page={getDashboardPage()}>Dashboard</NavLink>
          ) : (
             <NavLink page="services">Services</NavLink>
          )}
          <NavLink page="contact">Contact</NavLink>
        </div>

        {/* Login Action - Only show Logout if authenticated. Top-right Login removed for unauth users. */}
        <div className="flex items-center gap-3">
          {!isAnyAuthenticated && (
            <div className="hidden sm:inline-flex">
              <CustomerLoginDropdown />
            </div>
          )}
          {isAnyAuthenticated && (
            <button
              onClick={handleLogout}
              className="rounded-full bg-slate-900 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-slate-900/15 transition duration-300 hover:-translate-y-0.5 hover:bg-ease-blue"
            >
              Logout
            </button>
          )}
        </div>
      </nav>
    </motion.header>
  );
};

export default Header;
