import React from 'react';
import { useAppContext } from '../../hooks/useAppContext';
import { GstServiceIcon } from '../icons/GstServiceIcon';
import { DocumentCheckIcon } from '../icons/DocumentCheckIcon';

const GstServiceSelectionPage: React.FC = () => {
  const { setPage } = useAppContext();

  return (
    <div className="py-12 bg-gray-50 min-h-screen font-sans">
      <div className="container mx-auto px-4 max-w-4xl">
        <button onClick={() => setPage('services')} className="text-sm text-gray-600 hover:text-ease-blue mb-6 inline-flex items-center">
          <span className="mr-2">&larr;</span>Back to Services
        </button>
        
        <div className="text-center mb-12">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-800">GST Services</h1>
            <p className="text-gray-600 mt-3 text-lg">Please select how you would like to proceed.</p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-3xl mx-auto">
            {/* Option 1: New Registration */}
            <div 
                onClick={() => setPage('gst-registration')}
                className="bg-white p-10 rounded-2xl shadow-md hover:shadow-xl transition-all cursor-pointer border-2 border-transparent hover:border-ease-blue group text-center flex flex-col items-center"
            >
                <div className="w-20 h-20 bg-blue-50 text-ease-blue rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                    <GstServiceIcon />
                </div>
                <h3 className="text-2xl font-bold text-gray-800 mb-3 group-hover:text-ease-blue transition-colors">New GST Registration</h3>
                <p className="text-gray-500 leading-relaxed">
                    Apply for a new GST number for your business. We handle the complete application process and documentation.
                </p>
                <button className="mt-8 text-ease-blue font-bold text-sm uppercase tracking-wide group-hover:underline">Proceed &rarr;</button>
            </div>

            {/* Option 2: Return Filing */}
            <div 
                onClick={() => setPage('gst-return-filing')}
                className="bg-white p-10 rounded-2xl shadow-md hover:shadow-xl transition-all cursor-pointer border-2 border-transparent hover:border-ease-green group text-center flex flex-col items-center"
            >
                <div className="w-20 h-20 bg-green-50 text-ease-green rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                    <DocumentCheckIcon />
                </div>
                <h3 className="text-2xl font-bold text-gray-800 mb-3 group-hover:text-ease-green transition-colors">GST Return Filing</h3>
                <p className="text-gray-500 leading-relaxed">
                    File your periodic GST returns (GSTR-1, GSTR-3B) or Annual Returns for an existing GST registration.
                </p>
                <button className="mt-8 text-ease-green font-bold text-sm uppercase tracking-wide group-hover:underline">Proceed &rarr;</button>
            </div>
        </div>
      </div>
    </div>
  );
};

export default GstServiceSelectionPage;