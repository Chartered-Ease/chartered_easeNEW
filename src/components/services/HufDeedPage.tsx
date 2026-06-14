import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useAppContext } from '../../hooks/useAppContext';
import { useAgentAuth } from '../../hooks/useAgentAuth';
import { useClientManager } from '../../hooks/useProfile';
import ServiceDocumentUpload from './ServiceDocumentUpload';

type HufDeedMode = 'creation' | 'change';

const HUF_DEED_OPTIONS: Array<{
    id: HufDeedMode;
    title: string;
    eyebrow: string;
    description: string;
    serviceId: string;
    serviceName: string;
    timeline: string[];
    outputs: string[];
}> = [
    {
        id: 'creation',
        eyebrow: 'New deed',
        title: 'Create HUF Declaration Deed',
        description: 'Collect Karta, member and asset details to prepare a new HUF declaration deed workflow.',
        serviceId: 'huf-deed-creation',
        serviceName: 'HUF Deed Creation',
        timeline: ['Details Captured', 'Documents Uploaded', 'Draft Preparation', 'Client Review', 'Final Deed Shared'],
        outputs: ['Draft HUF declaration deed', 'Final deed copy', 'Execution guidance'],
    },
    {
        id: 'change',
        eyebrow: 'Modify deed',
        title: 'Changes in Existing HUF Deed',
        description: 'Request changes for Karta, members, address, assets or other details in an existing HUF deed.',
        serviceId: 'huf-deed-change',
        serviceName: 'HUF Deed Changes',
        timeline: ['Change Request Captured', 'Existing Deed Reviewed', 'Documents Verified', 'Draft Changes Prepared', 'Updated Deed Shared'],
        outputs: ['Change note', 'Updated deed draft', 'Final updated deed copy'],
    },
];

const changeTypes = ['Karta change', 'Member addition', 'Member removal', 'Address change', 'Asset / capital update', 'Other deed correction'];

const HufDeedPage: React.FC = () => {
    const { setPage, selectedClientId } = useAppContext();
    const { isAgentAuthenticated } = useAgentAuth();
    const { getClient } = useClientManager();
    const client = selectedClientId ? getClient(selectedClientId) : null;
    const [selectedMode, setSelectedMode] = useState<HufDeedMode | null>(null);
    const [detailsSubmitted, setDetailsSubmitted] = useState(false);
    const [error, setError] = useState('');
    const [memberCount, setMemberCount] = useState(2);
    const [details, setDetails] = useState({
        hufName: '',
        kartaName: '',
        kartaFatherName: '',
        address: '',
        deedDate: '',
        changeType: changeTypes[0],
        changeSummary: '',
        specialInstructions: '',
    });

    const selectedOption = HUF_DEED_OPTIONS.find(option => option.id === selectedMode);
    const backPage = isAgentAuthenticated ? 'client-dashboard' : 'user-dashboard';

    useEffect(() => {
        if (!selectedClientId) setPage(isAgentAuthenticated ? 'client-list' : 'user-dashboard');
    }, [isAgentAuthenticated, selectedClientId, setPage]);

    const updateDetails = (key: keyof typeof details, value: string) => {
        setDetails(prev => ({ ...prev, [key]: value }));
    };

    const validateDetails = () => {
        if (!details.hufName.trim()) return 'Please enter the HUF name.';
        if (!details.kartaName.trim()) return 'Please enter the Karta name.';
        if (!details.address.trim()) return 'Please enter the HUF address.';
        if (selectedMode === 'change' && !details.changeSummary.trim()) return 'Please explain what needs to be changed in the HUF deed.';
        return '';
    };

    const continueToUploads = () => {
        const validationMessage = validateDetails();
        if (validationMessage) {
            setError(validationMessage);
            return;
        }
        setError('');
        setDetailsSubmitted(true);
    };

    if (selectedOption && detailsSubmitted) {
        return (
            <div>
                <div className="mx-auto max-w-7xl px-4 pt-8 sm:px-6">
                    <button onClick={() => setDetailsSubmitted(false)} className="rounded-full bg-white px-4 py-2 text-xs font-black uppercase tracking-wide text-slate-600 shadow-sm transition hover:text-ease-blue">
                        Back to deed details
                    </button>
                </div>
                <ServiceDocumentUpload
                    serviceId={selectedOption.serviceId}
                    serviceName={selectedOption.serviceName}
                    numberOfIndividuals={memberCount}
                    additionalData={{
                        deedMode: selectedOption.title,
                        hufDetails: details,
                        memberCount,
                        expectedOutputs: selectedOption.outputs,
                        timeline: selectedOption.timeline,
                    }}
                    entityType={client?.entityType}
                />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-ease-bg px-4 py-8 sm:px-6">
            <div className="mx-auto max-w-7xl space-y-6">
                <section className="glass-card overflow-hidden">
                    <div className="mesh-surface p-6 text-white md:p-8">
                        <button onClick={() => setPage(backPage)} className="mb-5 rounded-full bg-white/10 px-4 py-2 text-xs font-black uppercase tracking-wide text-blue-50 transition hover:bg-white/20">
                            Back to dashboard
                        </button>
                        <p className="text-xs font-black uppercase tracking-[0.3em] text-blue-100">HUF deed workflow</p>
                        <h1 className="mt-3 font-display text-4xl font-bold tracking-tight md:text-5xl">Create or update HUF deed</h1>
                        <p className="mt-3 max-w-2xl text-sm leading-6 text-blue-100">
                            Capture Karta, family and deed change details, upload supporting documents and track the deed preparation status.
                        </p>
                    </div>
                </section>

                {!selectedOption ? (
                    <div className="grid gap-5 lg:grid-cols-2">
                        {HUF_DEED_OPTIONS.map((option, index) => (
                            <motion.button
                                key={option.id}
                                initial={{ opacity: 0, y: 16 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.06 }}
                                whileHover={{ y: -6 }}
                                onClick={() => setSelectedMode(option.id)}
                                className="glass-card flex min-h-[280px] flex-col p-6 text-left transition hover:border-ease-electric/30 hover:shadow-2xl"
                            >
                                <span className="w-max rounded-full bg-blue-50 px-3 py-1 text-xs font-black uppercase tracking-wide text-ease-blue">{option.eyebrow}</span>
                                <h2 className="mt-5 flex-1 font-display text-3xl font-bold text-slate-950">{option.title}</h2>
                                <span className="mt-6 inline-flex w-full items-center justify-center rounded-full bg-ease-green px-5 py-3 text-sm font-black text-white shadow-lg shadow-green-700/15 transition hover:bg-green-700">
                                    Get Started
                                </span>
                            </motion.button>
                        ))}
                    </div>
                ) : (
                    <section className="glass-card p-5 md:p-7">
                        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                            <div>
                                <p className="text-xs font-black uppercase tracking-[0.3em] text-ease-electric">{selectedOption.eyebrow}</p>
                                <h2 className="mt-2 font-display text-3xl font-bold text-slate-950">{selectedOption.title}</h2>
                                <p className="mt-2 text-sm leading-6 text-slate-500">{selectedOption.description}</p>
                            </div>
                            <button onClick={() => setSelectedMode(null)} className="rounded-full bg-slate-100 px-4 py-2 text-xs font-black uppercase tracking-wide text-slate-600 transition hover:text-ease-blue">
                                Change option
                            </button>
                        </div>

                        <div className="mt-6 grid gap-4 md:grid-cols-2">
                            <label>
                                <span className="mb-2 block text-xs font-black uppercase tracking-wide text-slate-500">HUF name</span>
                                <input value={details.hufName} onChange={(event) => updateDetails('hufName', event.target.value)} className="input" placeholder="e.g. Sharma HUF" />
                            </label>
                            <label>
                                <span className="mb-2 block text-xs font-black uppercase tracking-wide text-slate-500">Karta name</span>
                                <input value={details.kartaName} onChange={(event) => updateDetails('kartaName', event.target.value)} className="input" placeholder="Name of Karta" />
                            </label>
                            <label>
                                <span className="mb-2 block text-xs font-black uppercase tracking-wide text-slate-500">Karta father's name</span>
                                <input value={details.kartaFatherName} onChange={(event) => updateDetails('kartaFatherName', event.target.value)} className="input" placeholder="Optional but useful for deed draft" />
                            </label>
                            <label>
                                <span className="mb-2 block text-xs font-black uppercase tracking-wide text-slate-500">No. of members / affected members</span>
                                <input type="text" inputMode="numeric" value={memberCount} onChange={(event) => setMemberCount(Math.max(1, Number(event.target.value.replace(/\D/g, '')) || 1))} className="input" />
                            </label>
                            <label className="md:col-span-2">
                                <span className="mb-2 block text-xs font-black uppercase tracking-wide text-slate-500">HUF address</span>
                                <textarea value={details.address} onChange={(event) => updateDetails('address', event.target.value)} className="input min-h-[96px]" placeholder="Principal address of HUF" />
                            </label>
                            {selectedMode === 'change' ? (
                                <>
                                    <label>
                                        <span className="mb-2 block text-xs font-black uppercase tracking-wide text-slate-500">Type of change</span>
                                        <select value={details.changeType} onChange={(event) => updateDetails('changeType', event.target.value)} className="input">
                                            {changeTypes.map(type => <option key={type}>{type}</option>)}
                                        </select>
                                    </label>
                                    <label>
                                        <span className="mb-2 block text-xs font-black uppercase tracking-wide text-slate-500">Existing deed date</span>
                                        <input type="date" value={details.deedDate} onChange={(event) => updateDetails('deedDate', event.target.value)} className="input" />
                                    </label>
                                    <label className="md:col-span-2">
                                        <span className="mb-2 block text-xs font-black uppercase tracking-wide text-slate-500">Change summary</span>
                                        <textarea value={details.changeSummary} onChange={(event) => updateDetails('changeSummary', event.target.value)} className="input min-h-[110px]" placeholder="Explain what needs to be changed in the HUF deed." />
                                    </label>
                                </>
                            ) : (
                                <label className="md:col-span-2">
                                    <span className="mb-2 block text-xs font-black uppercase tracking-wide text-slate-500">Special instructions</span>
                                    <textarea value={details.specialInstructions} onChange={(event) => updateDetails('specialInstructions', event.target.value)} className="input min-h-[110px]" placeholder="Mention assets, bank account, family details or wording preferences if any." />
                                </label>
                            )}
                        </div>

                        {error && <p className="mt-5 rounded-2xl bg-red-50 px-4 py-3 text-sm font-bold text-red-600">{error}</p>}

                        <button onClick={continueToUploads} className="mt-6 w-full rounded-full bg-ease-blue px-5 py-4 text-sm font-black text-white shadow-lg shadow-ease-blue/20 transition hover:-translate-y-0.5 hover:bg-ease-electric">
                            Continue to Documents
                        </button>
                    </section>
                )}
            </div>
        </div>
    );
};

export default HufDeedPage;
