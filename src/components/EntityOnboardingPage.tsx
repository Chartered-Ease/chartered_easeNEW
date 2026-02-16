
import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useAppContext } from '../hooks/useAppContext';
import { LoaderIcon } from './icons/LoaderIcon';
import { CharteredEaseLogo } from './icons/EaseIndiaLogo';

const entityOptions = [
    { id: 'proprietorship', label: 'Proprietorship' },
    { id: 'individual', label: 'Individual (Salaried/Personal)' },
    { id: 'partnership', label: 'Partnership Firm' },
    { id: 'llp', label: 'Limited Liability Partnership (LLP)' },
    { id: 'private_limited', label: 'Private Limited Company' },
    { id: 'huf', label: 'HUF (Hindu Undivided Family)' },
];

const EntityOnboardingPage: React.FC = () => {
    const { user, createEntity } = useAuth();
    const { setPage } = useAppContext();
    
    const [name, setName] = useState('');
    const [entityType, setEntityType] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim() || !entityType) {
            setError('Please enter Entity Name and select Type.');
            return;
        }
        
        setIsSubmitting(true);
        setTimeout(() => {
            createEntity(name, entityType);
            setPage('user-dashboard');
        }, 800);
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
            <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 animate-fade-in">
                <div className="text-center mb-8">
                    <CharteredEaseLogo className="h-12 w-12 mx-auto mb-4" />
                    <h1 className="text-2xl font-bold text-gray-800">Setup Your Profile</h1>
                    <p className="text-gray-600 mt-2 text-sm">
                        Create a profile to manage your business or personal compliance. You can add more entities later.
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Entity / Individual Name</label>
                        <input 
                            type="text" 
                            className="input w-full" 
                            placeholder="e.g. ABC Enterprises or Rahul Kumar" 
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            autoFocus
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Entity Type</label>
                        <select 
                            className="input w-full" 
                            value={entityType}
                            onChange={(e) => setEntityType(e.target.value)}
                        >
                            <option value="">Select Type...</option>
                            {entityOptions.map(opt => (
                                <option key={opt.id} value={opt.id}>{opt.label}</option>
                            ))}
                        </select>
                    </div>

                    {error && <p className="text-red-500 text-sm text-center">{error}</p>}

                    <button 
                        type="submit" 
                        disabled={isSubmitting}
                        className="w-full bg-ease-blue text-white py-3 rounded-lg font-semibold hover:bg-ease-blue/90 disabled:opacity-70 flex justify-center"
                    >
                        {isSubmitting ? <LoaderIcon /> : 'Create Profile & Continue'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default EntityOnboardingPage;
