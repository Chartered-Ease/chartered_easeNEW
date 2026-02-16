
import React, { useState, useMemo } from 'react';
import { useAppContext } from '../hooks/useAppContext';
import { DocumentCheckIcon } from './icons/DocumentCheckIcon';
import { AiBotIcon } from './icons/AiBotIcon';
import { CheckCircleSolidIcon } from './icons/CheckCircleSolidIcon';
import { GstServiceIcon } from './icons/GstServiceIcon';
import { CompanyServiceIcon } from './icons/CompanyServiceIcon';
import { ItrServiceIcon } from './icons/ItrServiceIcon';
import { ClipboardListIcon } from './icons/ClipboardListIcon';
import { UsersGroupIcon } from './icons/UsersGroupIcon';
import { ClockIcon } from './icons/ClockIcon';

// --- MOCK DATA ---
const upcomingCompliances: Record<string, { date: number; title: string; category: string }[]> = {
  "June 2024": [
    { date: 7, title: "TDS/TCS Payment", category: "Income Tax" },
    { date: 11, title: "GSTR-1 Filing (Monthly)", category: "GST" },
    { date: 15, title: "Advance Tax Installment", category: "Income Tax" },
    { date: 20, title: "GSTR-3B Filing (Monthly)", category: "GST" },
    { date: 30, title: "ROC Form DPT-3", category: "MCA" },
  ],
  "July 2024": [
    { date: 7, title: "TDS Payment", category: "Income Tax" },
    { date: 15, title: "Quarterly TDS Return (Q1)", category: "Income Tax" },
    { date: 31, title: "ITR Filing (Individuals)", category: "Income Tax" },
  ]
};

const recentUpdates = [
  { 
    title: "New GST Portal Update", 
    desc: "The GST portal now allows for easier rectification of clerical errors in GSTR-1 filings through the new amendment tab.",
    tag: "GST"
  },
  { 
    title: "ITR Forms for AY 2024-25", 
    desc: "Income Tax department has released all ITR forms. Taxpayers can now start preparing their returns for the current year.",
    tag: "Income Tax"
  },
  { 
    title: "MSME Payment Rule (Sec 43B)", 
    desc: "Ensure all payments to MSME vendors are made within 45 days to avoid tax add-backs under the new income tax rule.",
    tag: "Compliance"
  }
];

const serviceList = [
    { 
      name: 'GST Registration & Returns', 
      sub: '', 
      desc: 'End-to-end GST registration, monthly/quarterly returns, and compliance.',
      icon: <GstServiceIcon />, 
      page: 'gst-service-selection' 
    },
    { 
      name: 'Company / LLP Incorporation', 
      sub: '', 
      desc: 'Start your business with guided incorporation and documentation support.',
      icon: <CompanyServiceIcon />, 
      page: 'company-incorporation' 
    },
    { 
      name: 'MCA Compliances', 
      sub: '', 
      desc: 'Annual and event-based ROC compliances handled professionally.',
      icon: <ClipboardListIcon className="h-8 w-8 text-ease-blue" />, 
      page: 'contact' 
    },
    { 
      name: 'Income Tax Return', 
      sub: '(Business)', 
      desc: 'Tax filing for proprietorships, firms, and companies.',
      icon: <ItrServiceIcon />, 
      page: 'itr-filing' 
    }
];

// --- CALCULATORS ---

const IncomeTaxCalc = () => {
    const [income, setIncome] = useState<number>(0);
    const [deductions, setDeductions] = useState<number>(0);

    const calcTax = (inc: number, isNew: boolean) => {
        let tax = 0;
        const taxable = Math.max(0, inc - (isNew ? 0 : deductions));
        
        if (isNew) {
            // Simplified New Regime (Standard for AY 24-25)
            if (taxable <= 700000) return 0;
            if (taxable > 1500000) tax = (taxable - 1500000) * 0.3 + 150000;
            else if (taxable > 1200000) tax = (taxable - 1200000) * 0.2 + 90000;
            else if (taxable > 900000) tax = (taxable - 900000) * 0.15 + 45000;
            else if (taxable > 600000) tax = (taxable - 600000) * 0.1 + 15000;
            else if (taxable > 300000) tax = (taxable - 300000) * 0.05;
        } else {
            // Simplified Old Regime
            if (taxable <= 500000) return 0;
            if (taxable > 1000000) tax = (taxable - 1000000) * 0.3 + 112500;
            else if (taxable > 500000) tax = (taxable - 500000) * 0.2 + 12500;
            else if (taxable > 250000) tax = (taxable - 250000) * 0.05;
        }
        return Math.round(tax * 1.04); // Cess 4%
    };

    const oldTax = calcTax(income, false);
    const newTax = calcTax(income, true);

    return (
        <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Annual Income (₹)</label>
                    <input type="number" value={income} onChange={e => setIncome(Number(e.target.value))} className="input w-full" placeholder="e.g. 1200000" />
                </div>
                <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Deductions (₹) - Old Regime Only</label>
                    <input type="number" value={deductions} onChange={e => setDeductions(Number(e.target.value))} className="input w-full" placeholder="80C, 80D, HRA..." />
                </div>
            </div>
            <div className="grid grid-cols-2 gap-4 mt-6">
                <div className="bg-gray-50 p-4 rounded-lg text-center border border-gray-100">
                    <p className="text-xs text-gray-500 uppercase font-bold">Old Regime Tax</p>
                    <p className="text-xl font-bold text-gray-800 mt-1">₹ {oldTax.toLocaleString()}</p>
                </div>
                <div className="bg-blue-50 p-4 rounded-lg text-center border border-blue-100">
                    <p className="text-xs text-blue-600 uppercase font-bold">New Regime Tax</p>
                    <p className="text-xl font-bold text-ease-blue mt-1">₹ {newTax.toLocaleString()}</p>
                </div>
            </div>
            <p className="text-[10px] text-gray-400 text-center italic mt-2">*Indicative figures for individuals below 60 years. AY 2024-25.</p>
        </div>
    );
};

const GstLateFeeCalc = () => {
    const [days, setDays] = useState<number>(0);
    const [isNil, setIsNil] = useState<boolean>(false);

    const fee = isNil ? (days * 20) : (days * 50);
    const cappedFee = Math.min(fee, isNil ? 500 : 5000); // Simplified cap

    return (
        <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Days Delayed</label>
                    <input type="number" value={days} onChange={e => setDays(Number(e.target.value))} className="input w-full" placeholder="0" />
                </div>
                <div className="flex items-center space-x-3 h-full pt-4">
                    <label className="flex items-center cursor-pointer">
                        <input type="checkbox" checked={isNil} onChange={e => setIsNil(e.target.checked)} className="form-checkbox text-ease-blue h-5 w-5 rounded" />
                        <span className="ml-2 text-sm text-gray-700 font-medium">Nil Return?</span>
                    </label>
                </div>
            </div>
            <div className="bg-orange-50 p-6 rounded-lg text-center border border-orange-100 mt-4">
                <p className="text-xs text-orange-600 uppercase font-bold">Estimated Late Fee</p>
                <p className="text-3xl font-bold text-orange-700 mt-1">₹ {cappedFee.toLocaleString()}</p>
                <p className="text-xs text-orange-500 mt-2">Capped as per GST rules for small taxpayers.</p>
            </div>
        </div>
    );
};

const AdvanceTaxCalc = () => {
    const [taxAmount, setTaxAmount] = useState<number>(0);

    const installments = [
        { label: 'June 15th', percent: 15 },
        { label: 'Sept 15th', percent: 45 },
        { label: 'Dec 15th', percent: 75 },
        { label: 'Mar 15th', percent: 100 },
    ];

    return (
        <div className="space-y-4">
            <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Est. Yearly Tax Liability (₹)</label>
                <input type="number" value={taxAmount} onChange={e => setTaxAmount(Number(e.target.value))} className="input w-full" placeholder="e.g. 500000" />
            </div>
            <div className="grid grid-cols-2 gap-3 mt-4">
                {installments.map(inst => (
                    <div key={inst.label} className="bg-white border border-gray-200 p-3 rounded-lg shadow-sm">
                        <p className="text-[10px] text-gray-400 font-bold uppercase">{inst.label}</p>
                        <p className="text-xs text-gray-600 mt-0.5">Cumulative {inst.percent}%</p>
                        <p className="text-md font-bold text-gray-800 mt-1">₹ {Math.round(taxAmount * (inst.percent / 100)).toLocaleString()}</p>
                    </div>
                ))}
            </div>
        </div>
    );
};

// --- MAIN HOME PAGE COMPONENT ---

const HomePage: React.FC = () => {
  const { setPage } = useAppContext();
  const [activeTool, setActiveTool] = useState<'tax' | 'gst' | 'adv'>('tax');
  const [selectedMonth, setSelectedMonth] = useState<string>("June 2024");

  return (
    <div className="bg-white font-sans selection:bg-ease-blue selection:text-white">
      
      {/* SECTION 1: HERO */}
      <section className="relative pt-20 pb-16 lg:pt-32 lg:pb-24 bg-white overflow-hidden">
        <div className="container mx-auto px-6 relative z-10 text-center">
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold text-ease-blue tracking-tight mb-4 animate-fade-in">
              Chartered Ease
            </h1>
            <h2 className="text-2xl md:text-3xl font-semibold text-gray-700 mb-6">
              Start, Grow and Comply with Ease
            </h2>
            <p className="text-lg text-gray-500 max-w-2xl mx-auto mb-10">
              Simplify Indian compliance with AI automation. <br/>
              <span className="text-sm text-gray-400">Trusted by modern businesses & high-income individuals.</span>
            </p>
            
            <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
              <button
                onClick={() => setPage('login')}
                className="w-full sm:w-auto bg-ease-blue text-white font-bold py-3.5 px-10 rounded-full shadow-lg hover:shadow-xl hover:bg-ease-blue/90 transition-all transform hover:-translate-y-0.5 text-lg"
              >
                Customer Login
              </button>
            </div>
        </div>
        
        {/* Subtle background decoration */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none opacity-30">
            <div className="absolute -top-20 -right-20 w-96 h-96 bg-blue-50 rounded-full blur-3xl"></div>
            <div className="absolute top-40 -left-20 w-72 h-72 bg-green-50 rounded-full blur-3xl"></div>
        </div>
      </section>

      {/* SECTION 2: INTERACTIVE TAX TOOLS */}
      <section className="py-16 bg-gray-50 border-y border-gray-100">
          <div className="container mx-auto px-6">
              <div className="max-w-4xl mx-auto">
                  <div className="text-center mb-10">
                      <h2 className="text-3xl font-bold text-gray-800">Free Compliance Tools</h2>
                      <p className="text-gray-500 mt-2">Quickly estimate your tax and compliance costs.</p>
                  </div>

                  <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100">
                      {/* Tool Tabs */}
                      <div className="flex border-b border-gray-100 bg-gray-50/50">
                          <button 
                            onClick={() => setActiveTool('tax')}
                            className={`flex-1 py-4 text-sm font-bold transition-all ${activeTool === 'tax' ? 'bg-white text-ease-blue border-b-2 border-ease-blue' : 'text-gray-500 hover:text-gray-700'}`}
                          >
                              Income Tax Calc
                          </button>
                          <button 
                            onClick={() => setActiveTool('gst')}
                            className={`flex-1 py-4 text-sm font-bold transition-all ${activeTool === 'gst' ? 'bg-white text-ease-blue border-b-2 border-ease-blue' : 'text-gray-500 hover:text-gray-700'}`}
                          >
                              GST Late Fee
                          </button>
                          <button 
                            onClick={() => setActiveTool('adv')}
                            className={`flex-1 py-4 text-sm font-bold transition-all ${activeTool === 'adv' ? 'bg-white text-ease-blue border-b-2 border-ease-blue' : 'text-gray-500 hover:text-gray-700'}`}
                          >
                              Advance Tax
                          </button>
                      </div>

                      {/* Tool Content */}
                      <div className="p-8 min-h-[340px]">
                          {activeTool === 'tax' && <IncomeTaxCalc />}
                          {activeTool === 'gst' && <GstLateFeeCalc />}
                          {activeTool === 'adv' && <AdvanceTaxCalc />}
                      </div>
                  </div>
              </div>
          </div>
      </section>

      {/* SECTION 3: COMPLIANCE CALENDAR */}
      <section className="py-20 bg-white">
          <div className="container mx-auto px-6">
              <div className="flex flex-col lg:flex-row gap-16 max-w-6xl mx-auto">
                  
                  {/* Calendar View */}
                  <div className="flex-1">
                      <div className="flex justify-between items-end mb-8">
                          <div>
                              <h2 className="text-3xl font-bold text-gray-800">Deadlines Tracker</h2>
                              <p className="text-gray-500 mt-1">Don't miss out on important filing dates.</p>
                          </div>
                          <div className="flex bg-gray-100 rounded-lg p-1">
                              {Object.keys(upcomingCompliances).map(m => (
                                  <button 
                                    key={m} 
                                    onClick={() => setSelectedMonth(m)}
                                    className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all ${selectedMonth === m ? 'bg-white text-ease-blue shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                                  >
                                      {m.split(' ')[0]}
                                  </button>
                              ))}
                          </div>
                      </div>

                      <div className="space-y-4">
                          {upcomingCompliances[selectedMonth].map((item, idx) => (
                              <div key={idx} className="flex items-center group p-4 rounded-2xl hover:bg-gray-50 border border-transparent hover:border-gray-100 transition-all">
                                  <div className="w-14 h-14 bg-ease-blue text-white rounded-2xl flex flex-col items-center justify-center font-bold shadow-md group-hover:scale-105 transition-transform">
                                      <span className="text-lg leading-none">{item.date}</span>
                                      <span className="text-[10px] uppercase opacity-80">{selectedMonth.slice(0,3)}</span>
                                  </div>
                                  <div className="ml-6 flex-1">
                                      <p className="text-xs font-bold text-ease-blue uppercase tracking-widest">{item.category}</p>
                                      <h4 className="text-lg font-bold text-gray-800 mt-0.5">{item.title}</h4>
                                  </div>
                                  <div className="hidden sm:block">
                                      <span className="text-xs bg-orange-100 text-orange-700 px-3 py-1 rounded-full font-bold">Upcoming</span>
                                  </div>
                              </div>
                          ))}
                      </div>
                      
                      <div className="mt-10 p-6 bg-ease-blue/5 rounded-3xl border border-ease-blue/10 text-center">
                          <p className="text-gray-600 mb-4 font-medium">Get personalized SMS & Email reminders for your business.</p>
                          <button onClick={() => setPage('login')} className="bg-ease-blue text-white px-8 py-2.5 rounded-full font-bold shadow hover:shadow-lg transition-all">
                              Activate Reminders
                          </button>
                      </div>
                  </div>

                  {/* Recent Updates */}
                  <div className="lg:w-80 space-y-8">
                      <div>
                          <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center">
                              <ClockIcon className="mr-2 h-5 w-5 text-ease-blue" />
                              Latest Updates
                          </h3>
                          <div className="space-y-6">
                              {recentUpdates.map((update, idx) => (
                                  <div key={idx} className="relative pl-6 border-l-2 border-gray-100 pb-2">
                                      <div className="absolute -left-1.5 top-0 w-3 h-3 rounded-full bg-ease-blue"></div>
                                      <span className="text-[10px] font-bold text-ease-blue uppercase px-2 py-0.5 bg-blue-50 rounded">{update.tag}</span>
                                      <h4 className="font-bold text-gray-800 mt-2 mb-1">{update.title}</h4>
                                      <p className="text-sm text-gray-500 leading-relaxed">{update.desc}</p>
                                  </div>
                              ))}
                          </div>
                      </div>
                      
                      <div className="bg-gray-900 text-white p-6 rounded-3xl shadow-xl">
                          <h4 className="font-bold text-lg mb-2">Expert Consultation</h4>
                          <p className="text-gray-400 text-sm mb-6">Need dedicated support for complex tax matters?</p>
                          <button onClick={() => setPage('contact')} className="w-full bg-white text-gray-900 font-bold py-2.5 rounded-xl hover:bg-gray-100 transition-colors">
                              Talk to Expert
                          </button>
                      </div>
                  </div>
              </div>
          </div>
      </section>

      {/* SECTION 4: PROCESS (3 Cards) */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
              <h2 className="text-3xl font-bold text-gray-800">Compliance as a Service</h2>
              <p className="text-gray-500 mt-2">Professional expertise met with AI efficiency.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="bg-white p-10 rounded-3xl shadow-sm border border-gray-100 text-center hover:shadow-xl transition-all group">
              <div className="w-16 h-16 bg-blue-50 text-ease-blue rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:rotate-6 transition-transform">
                <DocumentCheckIcon />
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-3">Upload Documents</h3>
              <p className="text-gray-600 text-sm leading-relaxed">Securely upload your files. Our AI sorts and validates them instantly to ensure zero errors.</p>
            </div>

            <div className="bg-white p-10 rounded-3xl shadow-sm border border-gray-100 text-center hover:shadow-xl transition-all group">
              <div className="w-16 h-16 bg-blue-50 text-ease-blue rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:rotate-6 transition-transform">
                <AiBotIcon />
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-3">We Process & Prepare</h3>
              <p className="text-gray-600 text-sm leading-relaxed">Expert review combined with automation ensures 100% accuracy and maximum tax savings.</p>
            </div>

            <div className="bg-white p-10 rounded-3xl shadow-sm border border-gray-100 text-center hover:shadow-xl transition-all group">
              <div className="w-16 h-16 bg-green-50 text-ease-green rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:rotate-6 transition-transform">
                <CheckCircleSolidIcon />
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-3">Compliance Done</h3>
              <p className="text-gray-600 text-sm leading-relaxed">Filings submitted, acknowledgements generated. You stay stress-free while we manage the portal.</p>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 5: SERVICES GRID */}
      <section className="py-24 bg-white">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-800 tracking-tight">Our Core Services</h2>
            <p className="text-gray-500 mt-4 max-w-2xl mx-auto text-lg">Comprehensive, tech-driven solutions for individuals and businesses to manage compliance effortlessly.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
            {serviceList.map((service, idx) => (
              <div 
                key={idx} 
                onClick={() => setPage(service.page)}
                className="group bg-white border border-gray-100 rounded-3xl p-8 hover:shadow-2xl hover:border-ease-blue/20 cursor-pointer transition-all duration-500 flex flex-col h-full relative overflow-hidden"
              >
                <div className="mb-6 transform group-hover:scale-110 transition-transform duration-500 origin-left">
                    {service.icon}
                </div>
                <h3 className="text-xl font-bold text-gray-800 group-hover:text-ease-blue transition-colors mb-1">
                    {service.name}
                </h3>
                {service.sub && <p className="text-sm text-gray-400 font-medium mb-3">{service.sub}</p>}
                
                <p className="text-gray-600 text-sm leading-relaxed mb-8 flex-grow">
                    {service.desc}
                </p>

                <div className="mt-auto">
                    <span className="text-ease-blue font-bold text-sm flex items-center group-hover:translate-x-2 transition-transform duration-500">
                        Get Started &rarr;
                    </span>
                </div>
                
                <div className="absolute top-0 right-0 w-24 h-24 bg-blue-50 rounded-bl-full -mr-12 -mt-12 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              </div>
            ))}
          </div>
          
          <div className="text-center mt-16">
             <button onClick={() => setPage('services')} className="bg-gray-100 text-gray-700 font-bold py-3 px-8 rounded-full hover:bg-gray-200 transition-all">
                 View All 20+ Services &rarr;
             </button>
          </div>
        </div>
      </section>

    </div>
  );
};

export default HomePage;
