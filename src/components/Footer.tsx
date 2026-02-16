import React from 'react';
import { CharteredEaseLogo } from './icons/EaseIndiaLogo';
import { useAppContext } from '../hooks/useAppContext';

const Footer: React.FC = () => {
  const { setPage } = useAppContext();
  
  return (
    <footer className="bg-gray-900 text-white border-t border-gray-800">
      <div className="container mx-auto px-6 py-12">
        <div className="flex flex-col md:flex-row justify-between items-center md:items-start text-center md:text-left gap-8">
            
            {/* Brand */}
            <div className="flex flex-col items-center md:items-start max-w-xs">
                <div className="flex items-center space-x-2 mb-4">
                    <div className="bg-white rounded-full p-1">
                        <CharteredEaseLogo className="h-8 w-8" />
                    </div>
                    <span className="font-bold text-xl tracking-wide">Chartered Ease</span>
                </div>
                <p className="text-gray-400 text-sm leading-relaxed">
                    Start, Grow and Comply with Ease. <br/>
                    Empowering Indian businesses with AI-driven compliance solutions.
                </p>
            </div>

            {/* Quick Links */}
            <div>
                <h4 className="font-bold text-gray-300 mb-4 uppercase text-xs tracking-wider">Platform Access</h4>
                <ul className="space-y-3 text-sm text-gray-400">
                    <li><button onClick={() => setPage('agent-login')} className="hover:text-white transition-colors">Partner / Agent Login</button></li>
                    <li><button onClick={() => setPage('associate-login')} className="hover:text-white transition-colors">Associate Login</button></li>
                    <li><button onClick={() => setPage('admin-login')} className="hover:text-white transition-colors">Admin Login</button></li>
                </ul>
            </div>

            {/* Contact */}
            <div>
                <h4 className="font-bold text-gray-300 mb-4 uppercase text-xs tracking-wider">Contact Us</h4>
                <div className="text-sm text-gray-400 space-y-2">
                    <p>
                        <span className="block text-gray-500 text-xs">Email</span>
                        <a href="mailto:aashray@charteredease.in" className="hover:text-white">aashray@charteredease.in</a>
                    </p>
                    <p>
                        <span className="block text-gray-500 text-xs">Phone</span>
                        <a href="tel:+917477282139" className="hover:text-white">+91 74772 82139</a>
                    </p>
                    <p>
                        <span className="block text-gray-500 text-xs">Location</span>
                        Pune, India
                    </p>
                </div>
            </div>
        </div>

        <div className="mt-12 pt-8 border-t border-gray-800 text-center text-xs text-gray-600">
          <p>&copy; {new Date().getFullYear()} Chartered Ease. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
