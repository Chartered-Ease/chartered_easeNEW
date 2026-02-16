
import React from 'react';
import { CharteredEaseLogo } from './icons/EaseIndiaLogo';
import { useAppContext } from '../hooks/useAppContext';
import { useAuth } from '../hooks/useAuth';
import { useAgentAuth } from '../hooks/useAgentAuth';
import { useCorporateAuth } from '../hooks/useCorporateAuth';
import { useAdminAuth } from '../hooks/useAdminAuth';
import { useAssociateAuth } from '../hooks/useAssociateAuth';

const Header: React.FC = () => {
  const { setPage } = useAppContext();
  const customerAuth = useAuth();
  const agentAuth = useAgentAuth();
  const corporateAuth = useCorporateAuth();
  const adminAuth = useAdminAuth();
  const associateAuth = useAssociateAuth();

  const NavLink: React.FC<{ page: string; children: React.ReactNode }> = ({ page, children }) => (
    <button
      onClick={() => setPage(page)}
      className="text-gray-600 hover:text-ease-blue transition-colors font-medium text-sm md:text-base"
    >
      {children}
    </button>
  );

  const handleLogout = () => {
      if (customerAuth.isAuthenticated) customerAuth.logout();
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
    <header className="bg-white/90 backdrop-blur-sm sticky top-0 z-50 border-b border-gray-100 shadow-sm">
      <nav className="container mx-auto px-6 py-3 flex justify-between items-center">
        {/* Logo Section */}
        <button onClick={() => setPage('home')} className="flex items-center space-x-2 group">
          <CharteredEaseLogo className="h-10 w-10" />
          <div className="flex flex-col items-start">
            <span className="font-bold text-xl text-ease-blue leading-none">Chartered Ease</span>
            <span className="text-[10px] text-gray-500 font-medium tracking-wider">COMPLIANCE SIMPLIFIED</span>
          </div>
        </button>

        {/* Navigation */}
        <div className="hidden md:flex items-center space-x-8">
          <NavLink page="home">Home</NavLink>
          {isAnyAuthenticated ? (
             <NavLink page={getDashboardPage()}>Dashboard</NavLink>
          ) : (
             <NavLink page="services">Services</NavLink>
          )}
          <NavLink page="contact">Contact</NavLink>
        </div>

        {/* Login Action - Only show Logout if authenticated. Top-right Login removed for unauth users. */}
        <div>
          {isAnyAuthenticated && (
            <button
              onClick={handleLogout}
              className="bg-gray-100 text-gray-700 px-5 py-2 rounded-full font-semibold text-sm hover:bg-gray-200 transition-all"
            >
              Logout
            </button>
          )}
        </div>
      </nav>
    </header>
  );
};

export default Header;
