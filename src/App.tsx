
import React, { useEffect } from 'react';
import { AuthProvider, useAuth } from './hooks/useAuth';
import { AppProvider, useAppContext } from './hooks/useAppContext';
import { AdminAuthProvider, useAdminAuth } from './hooks/useAdminAuth';
import { AssociateAuthProvider, useAssociateAuth } from './hooks/useAssociateAuth';
import { ClientProvider } from './hooks/useProfile';
import { AssociateProvider } from './hooks/useAssociateManager';
import { AgentAuthProvider, useAgentAuth } from './hooks/useAgentAuth';
import { CorporateAuthProvider, useCorporateAuth } from './hooks/useCorporateAuth';
import { DocumentProvider } from './context/DocumentContext';

import LoginPage from './components/LoginPage';
import HomePage from './components/HomePage';
import ServicesPage from './components/ServicesPage';
import AboutPage from './components/AboutPage';
import ContactPage from './components/ContactPage';
import Header from './components/Header';
import Footer from './components/Footer';
import LiveExperienceLayer from './components/LiveExperienceLayer';
import GstRegistrationPage from './components/services/GstRegistrationPage';
import ShopActRegistrationPage from './components/services/ShopActRegistrationPage';
import UdyamRegistrationPage from './components/services/UdyamRegistrationPage';
import CompanyIncorporationPage from './components/services/CompanyIncorporationPage';
import PtRegistrationPage from './components/services/PtRegistrationPage';
import ProfessionalTaxReturnPage from './components/services/ProfessionalTaxReturnPage';
import IncomeTaxFilingPage from './components/services/IncomeTaxFilingPage';
import GstReturnFilingPage from './components/services/GstReturnFilingPage';
import GstServiceSelectionPage from './components/services/GstServiceSelectionPage';
import AdminLoginPage from './components/admin/AdminLoginPage';
import AdminDashboardPage from './components/admin/AdminDashboardPage';
import ClientListPage from './components/ClientListPage';
import ClientDashboardPage from './components/ClientDashboardPage';
import PartnerDashboardPage from './components/partner/PartnerDashboardPage';
import AssociateLoginPage from './components/employee/AssociateLoginPage';
import AssociateDashboardPage from './components/employee/AssociateDashboardPage';
import AssociateTaskDetailPage from './components/employee/AssociateTaskDetailPage';
import AgentLoginPage from './components/AgentLoginPage';
import CorporateLoginPage from './components/CorporateLoginPage';
import CustomerDashboardPage from './components/CustomerDashboardPage';
import ClientDocumentVaultPage from './components/ClientDocumentVaultPage';
import CorporateDashboardPage from './components/CorporateDashboardPage';
import DocumentUploadPage from './components/partner/DocumentUploadPage';
import TrackStatusDashboardPage from './components/partner/TrackStatusDashboardPage';
import StatusTimelinePage from './components/partner/StatusTimelinePage';
import ProjectReportPage from './components/services/ProjectReportPage';
import TdsOnPropertyPage from './components/services/TdsOnPropertyPage';
import TdsFilingPage from './components/services/TdsFilingPage';
import PartnershipRegistrationPage from './components/services/PartnershipRegistrationPage';
import AccountingPage from './components/services/AccountingPage';
import PayrollServicesPage from './components/services/PayrollServicesPage';
import RocFilingPage from './components/services/RocFilingPage';
import BoardResolutionPage from './components/services/BoardResolutionPage';
import StartupIndiaRegistrationPage from './components/services/StartupIndiaRegistrationPage';
import TrademarkFilingPage from './components/services/TrademarkFilingPage';
import HufItrFilingPage from './components/services/HufItrFilingPage';
import HufDeedPage from './components/services/HufDeedPage';
import TaxPlanningPage from './components/services/TaxPlanningPage';
import TaxNoticesPage from './components/services/TaxNoticesPage';
import PanServicesPage from './components/services/PanServicesPage';
import LlpAnnualFilingPage from './components/services/LlpAnnualFilingPage';
import EntityOnboardingPage from './components/EntityOnboardingPage';
import './components/icons/DocumentCheckIcon';
import './components/icons/AiBotIcon';
import './components/icons/GstServiceIcon';
import './components/icons/CompanyServiceIcon';
import './components/icons/ItrServiceIcon';
import './components/icons/UdyamServiceIcon';
import './components/icons/ShopActServiceIcon';
import './components/icons/PtServiceIcon';
import './components/icons/PartnerIcon';
import './components/icons/UsersGroupIcon';


// Define access control lists
const customerOnlyPages = ['user-dashboard', 'entity-onboarding', 'document-vault'];
const agentOnlyPages = ['agent-dashboard', 'client-list', 'client-dashboard', 'document-upload', 'track-status', 'status-timeline'];
const corporateOnlyPages = ['corporate-dashboard'];
const adminOnlyPages = ['admin-dashboard'];
const associateOnlyPages = ['associate-dashboard', 'associate-task'];

// These pages are accessible by both customers and agents
const sharedCustomerAgentPages = [
    'gst-service-selection',
    'gst-registration',
    'gst-return-filing',
    'shop-act',
    'udyam-registration',
    'company-incorporation',
    'pt-registration',
    'pt-return',
    'itr-filing',
    'project-report-for-loan',
    'tds-filing',
    'tds-property',
    'partnership-registration',
    'accounting',
    'payroll-services',
    'roc-filing',
    'board-resolutions',
    'startup-india-registration',
    'trademark-filing',
    'huf-itr-filing',
    'huf-deed',
    'tax-planning',
    'tax-notices',
    'pan-services',
    'llp-annual-filing',
    'llp-roc-compliance'
];


const AppContent: React.FC = () => {
  const { isAuthenticated, isLoading: isUserLoading } = useAuth();
  const { isAgentAuthenticated, isLoading: isAgentLoading } = useAgentAuth();
  const { isCorporateAuthenticated, isLoading: isCorporateLoading } = useCorporateAuth();
  const { isAdminAuthenticated, isLoading: isAdminLoading } = useAdminAuth();
  const { isAssociateAuthenticated, isLoading: isAssociateLoading } = useAssociateAuth();
  const { page, setPage, selectedClientId } = useAppContext();

  const isLoading = isUserLoading || isAgentLoading || isCorporateLoading || isAdminLoading || isAssociateLoading;

  useEffect(() => {
    if (isAdminAuthenticated && page === 'admin-login') {
      setPage('admin-dashboard');
    }
  }, [isAdminAuthenticated, page, setPage]);

  useEffect(() => {
    if (isAssociateAuthenticated && page === 'associate-login') {
      setPage('associate-dashboard');
    }
  }, [isAssociateAuthenticated, page, setPage]);

  // Redirect logged-in users from home to their respective dashboards
  useEffect(() => {
    if (isAuthenticated && page === 'home') setPage('user-dashboard');
    if (isAgentAuthenticated && page === 'home') setPage('agent-dashboard');
    if (isCorporateAuthenticated && page === 'home') setPage('corporate-dashboard');
  }, [isAuthenticated, isAgentAuthenticated, isCorporateAuthenticated, page, setPage]);

  // Redirect direct customers away from client list
  useEffect(() => {
      if (isAuthenticated && !isAgentAuthenticated && page === 'client-list') {
          setPage('user-dashboard');
      }
  }, [isAuthenticated, isAgentAuthenticated, page, setPage]);


  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        {/* Full-page spinner can go here */}
      </div>
    );
  }

  // Authentication checks for role-specific pages
  if (customerOnlyPages.includes(page) && !isAuthenticated) return <LoginPage />;
  if (agentOnlyPages.includes(page.split('/')[0]) && !isAgentAuthenticated) return <AgentLoginPage />;
  if (corporateOnlyPages.includes(page) && !isCorporateAuthenticated) return <CorporateLoginPage />;
  if (adminOnlyPages.includes(page) && !isAdminAuthenticated) return <AdminLoginPage />;
  if (associateOnlyPages.includes(page.split('/')[0]) && !isAssociateAuthenticated) return <AssociateLoginPage />;

  // Authentication check for shared pages (accessible by customer or agent)
  if (sharedCustomerAgentPages.includes(page) && !isAuthenticated && !isAgentAuthenticated) {
    return <LoginPage />;
  }
  
  // Specific login page routes
  if (page === 'login') return <LoginPage />;
  if (page === 'agent-login') return <AgentLoginPage />;
  if (page === 'corporate-login') return <CorporateLoginPage />;
  if (page === 'admin-login') return <AdminLoginPage />;
  if (page === 'associate-login') return <AssociateLoginPage />;
  
  const renderPageContent = () => {
    if (page.startsWith('associate-task/')) {
        return <AssociateTaskDetailPage />;
    }

    switch (page) {
      case 'home':
        return <HomePage />;
      // Dashboards
      case 'user-dashboard':
        return <CustomerDashboardPage />;
      case 'document-vault':
        return <ClientDocumentVaultPage />;
      case 'agent-dashboard':
        return <PartnerDashboardPage />; // Reused for agents
      case 'corporate-dashboard':
        return <CorporateDashboardPage />;
      case 'admin-dashboard':
        return <AdminDashboardPage />;
      case 'associate-dashboard':
        return <AssociateDashboardPage />;
      
      // Other pages
      case 'entity-onboarding':
        return <EntityOnboardingPage />;
      case 'client-list':
        return <ClientListPage />;
      case 'client-dashboard':
        return selectedClientId ? <ClientDashboardPage /> : <ClientListPage />;
      case 'document-upload':
        return <DocumentUploadPage />;
      case 'track-status':
        return <TrackStatusDashboardPage />;
      case 'status-timeline':
        return <StatusTimelinePage />;
      case 'services':
        return <ServicesPage />;
      case 'about':
        return <AboutPage />;
      case 'contact':
        return <ContactPage />;
      
      // Service-specific pages
      case 'gst-service-selection': return <GstServiceSelectionPage />;
      case 'gst-registration': return <GstRegistrationPage />;
      case 'gst-return-filing': return <GstReturnFilingPage />;
      case 'shop-act': return <ShopActRegistrationPage />;
      case 'udyam-registration': return <UdyamRegistrationPage />;
      case 'company-incorporation': return <CompanyIncorporationPage />;
      case 'pt-registration': return <PtRegistrationPage />;
      case 'pt-return': return <ProfessionalTaxReturnPage />;
      case 'itr-filing': return <IncomeTaxFilingPage />;
      case 'project-report-for-loan': return <ProjectReportPage />;
      case 'tds-filing': return <TdsFilingPage />;
      case 'tds-property': return <TdsOnPropertyPage />;
      case 'partnership-registration': return <PartnershipRegistrationPage />;
      case 'accounting': return <AccountingPage />;
      case 'payroll-services': return <PayrollServicesPage />;
      case 'roc-filing': return <RocFilingPage />;
      case 'board-resolutions': return <BoardResolutionPage />;
      case 'startup-india-registration': return <StartupIndiaRegistrationPage />;
      case 'trademark-filing': return <TrademarkFilingPage />;
      case 'huf-itr-filing': return <HufItrFilingPage />;
      case 'huf-deed': return <HufDeedPage />;
      case 'tax-planning': return <TaxPlanningPage />;
      case 'tax-notices': return <TaxNoticesPage />;
      case 'pan-services': return <PanServicesPage />;
      case 'llp-roc-compliance': return <LlpAnnualFilingPage />;
      case 'llp-annual-filing': return <LlpAnnualFilingPage />;
      
      default:
        if (isAuthenticated) return <CustomerDashboardPage />;
        if (isAgentAuthenticated) return <PartnerDashboardPage />;
        if (isCorporateAuthenticated) return <CorporateDashboardPage />;
        return <HomePage />;
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Header />
      <main className="flex-grow">
        {renderPageContent()}
      </main>
      <Footer />
      <LiveExperienceLayer />
    </div>
  );
};

const App: React.FC = () => {
  return (
    <AppProvider>
      <ClientProvider>
        <AuthProvider>
          <AgentAuthProvider>
            <CorporateAuthProvider>
              <AdminAuthProvider>
                <AssociateAuthProvider>
                  <AssociateProvider>
                    <DocumentProvider>
                      <AppContent />
                    </DocumentProvider>
                  </AssociateProvider>
                </AssociateAuthProvider>
              </AdminAuthProvider>
            </CorporateAuthProvider>
          </AgentAuthProvider>
        </AuthProvider>
      </ClientProvider>
    </AppProvider>
  );
};

export default App;
