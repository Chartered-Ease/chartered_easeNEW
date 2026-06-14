import React, { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useAppContext } from '../hooks/useAppContext';
import { DocumentCheckIcon } from './icons/DocumentCheckIcon';
import { AiBotIcon } from './icons/AiBotIcon';
import { CheckCircleSolidIcon } from './icons/CheckCircleSolidIcon';
import { GstServiceIcon } from './icons/GstServiceIcon';
import { CompanyServiceIcon } from './icons/CompanyServiceIcon';
import { ItrServiceIcon } from './icons/ItrServiceIcon';
import { ClipboardListIcon } from './icons/ClipboardListIcon';
import { ClockIcon } from './icons/ClockIcon';
import CustomerLoginDropdown from './CustomerLoginDropdown';

const upcomingCompliances: Record<string, { date: number; title: string; category: string; progress: number }[]> = {
  'June 2024': [
    { date: 7, title: 'TDS/TCS Payment', category: 'Income Tax', progress: 78 },
    { date: 11, title: 'GSTR-1 Filing', category: 'GST', progress: 64 },
    { date: 15, title: 'Advance Tax Installment', category: 'Income Tax', progress: 52 },
    { date: 20, title: 'GSTR-3B Filing', category: 'GST', progress: 42 },
    { date: 30, title: 'ROC Form DPT-3', category: 'MCA', progress: 31 },
  ],
  'July 2024': [
    { date: 7, title: 'TDS Payment', category: 'Income Tax', progress: 88 },
    { date: 15, title: 'Quarterly TDS Return', category: 'Income Tax', progress: 58 },
    { date: 31, title: 'ITR Filing', category: 'Income Tax', progress: 36 },
  ],
};

const recentUpdates = [
  { title: 'GST filing completed', desc: 'Monthly GSTR-3B acknowledgement generated for client queue.', tag: 'GST' },
  { title: 'ITR review moved ahead', desc: 'AI pre-check found 3 deductions to review before final filing.', tag: 'ITR' },
  { title: 'TDS challan matched', desc: 'Challan reconciliation completed for Form 26Q workflow.', tag: 'TDS' },
  { title: 'ROC task assigned', desc: 'Board resolution workflow has moved to document verification.', tag: 'ROC' },
  { title: 'Notice summary ready', desc: 'AI notice reader generated a short response brief.', tag: 'AI' },
];

const serviceList = [
  {
    name: 'GST Command Center',
    desc: 'Registration, returns, reconciliation and smart document collection for active GSTINs.',
    icon: <GstServiceIcon />,
    page: 'gst-service-selection',
    accent: 'from-blue-500 to-cyan-400',
  },
  {
    name: 'Income Tax Filing',
    desc: 'Guided ITR flows for salary, capital gains, freelancers and business owners.',
    icon: <ItrServiceIcon />,
    page: 'itr-filing',
    accent: 'from-emerald-500 to-lime-400',
  },
  {
    name: 'Company OS',
    desc: 'Company, LLP, ROC and MCA workflows managed through one operational layer.',
    icon: <CompanyServiceIcon />,
    page: 'company-incorporation',
    accent: 'from-violet-500 to-fuchsia-400',
  },
  {
    name: 'TDS Workflow',
    desc: 'TDS returns, challans, deductee data and status tracking in a single flow.',
    icon: <ClipboardListIcon className="h-8 w-8 text-ease-blue" />,
    page: 'services',
    accent: 'from-orange-500 to-amber-300',
  },
];

const platformStats = [
  { value: '10,000+', label: 'Compliance Tasks Managed' },
  { value: '82%', label: 'Average Compliance Health' },
  { value: '4.8x', label: 'Faster Document Movement' },
];

const workflowSteps = [
  { label: 'Documents', value: 100, tone: 'bg-ease-electric' },
  { label: 'Review', value: 82, tone: 'bg-ease-purple' },
  { label: 'Filing', value: 68, tone: 'bg-orange-500' },
  { label: 'Complete', value: 42, tone: 'bg-ease-green' },
];

const pageVariants = {
  hidden: { opacity: 0, y: 22 },
  visible: { opacity: 1, y: 0 },
};

const formatMoney = (amount: number) => `Rs. ${amount.toLocaleString('en-IN')}`;

type FinancialYear = 'FY 2025-26' | 'FY 2024-25' | 'FY 2023-24';
type IncomeTypeKey = 'salary' | 'business' | 'capitalGain' | 'other';
type TaxSlab = { upto: number; rate: number };
type CalculatorTool = 'tax' | 'gst' | 'adv' | 'tds';
type TdsOption = {
  key: string;
  label: string;
  rate: number;
  note: string;
};

const INCOME_TYPE_FIELDS: Array<{ key: IncomeTypeKey; label: string }> = [
  { key: 'salary', label: 'Salary Income' },
  { key: 'business', label: 'Business Income' },
  { key: 'capitalGain', label: 'Capital Gain Income' },
  { key: 'other', label: 'Other Income' },
];

const FINANCIAL_YEARS: FinancialYear[] = ['FY 2025-26', 'FY 2024-25', 'FY 2023-24'];
const CALCULATOR_TABS: Array<{ key: CalculatorTool; label: string }> = [
  { key: 'tax', label: 'Income Tax Calc' },
  { key: 'gst', label: 'GST Late Fee' },
  { key: 'adv', label: 'Advance Tax' },
  { key: 'tds', label: 'TDS Calc' },
];

const TDS_OPTIONS: TdsOption[] = [
  { key: '194c-individual', label: '194C Contractor - Individual/HUF', rate: 1, note: 'Works contract or labour contract paid to an individual or HUF contractor.' },
  { key: '194c-other', label: '194C Contractor - Other resident', rate: 2, note: 'Works contract or labour contract paid to a resident other than individual/HUF.' },
  { key: '194h', label: '194H Commission / Brokerage', rate: 2, note: 'Commission or brokerage, excluding insurance commission.' },
  { key: '194j-professional', label: '194J Professional Services', rate: 10, note: 'Professional fees, director fees, royalty and other 194J cases.' },
  { key: '194j-technical', label: '194J Technical Services', rate: 2, note: 'Technical services and specified royalty categories.' },
  { key: '194i-building', label: '194-I Rent - Land / Building', rate: 10, note: 'Rent for land, building, furniture or fittings.' },
  { key: '194i-machinery', label: '194-I Rent - Plant / Machinery', rate: 2, note: 'Rent for plant, machinery or equipment.' },
  { key: '194ia-property', label: '194-IA Property Purchase', rate: 1, note: 'Transfer of immovable property other than agricultural land.' },
  { key: '194a-interest', label: '194A Interest', rate: 10, note: 'Interest other than interest on securities.' },
  { key: '194t-partner', label: '194T Partner Remuneration / Interest', rate: 10, note: 'Partner salary, remuneration, commission, bonus or interest.' },
];

const OLD_REGIME_SLABS: TaxSlab[] = [
  { upto: 250000, rate: 0 },
  { upto: 500000, rate: 0.05 },
  { upto: 1000000, rate: 0.2 },
  { upto: Infinity, rate: 0.3 },
];

const TAX_CONFIG: Record<
  FinancialYear,
  {
    newRegime: { salaryStandardDeduction: number; rebateLimit: number; rebateMax: number; slabs: TaxSlab[] };
    oldRegime: { salaryStandardDeduction: number; rebateLimit: number; rebateMax: number; slabs: TaxSlab[] };
  }
> = {
  'FY 2025-26': {
    newRegime: {
      salaryStandardDeduction: 75000,
      rebateLimit: 1200000,
      rebateMax: 60000,
      slabs: [
        { upto: 400000, rate: 0 },
        { upto: 800000, rate: 0.05 },
        { upto: 1200000, rate: 0.1 },
        { upto: 1600000, rate: 0.15 },
        { upto: 2000000, rate: 0.2 },
        { upto: 2400000, rate: 0.25 },
        { upto: Infinity, rate: 0.3 },
      ],
    },
    oldRegime: {
      salaryStandardDeduction: 50000,
      rebateLimit: 500000,
      rebateMax: 12500,
      slabs: OLD_REGIME_SLABS,
    },
  },
  'FY 2024-25': {
    newRegime: {
      salaryStandardDeduction: 75000,
      rebateLimit: 700000,
      rebateMax: 25000,
      slabs: [
        { upto: 300000, rate: 0 },
        { upto: 700000, rate: 0.05 },
        { upto: 1000000, rate: 0.1 },
        { upto: 1200000, rate: 0.15 },
        { upto: 1500000, rate: 0.2 },
        { upto: Infinity, rate: 0.3 },
      ],
    },
    oldRegime: {
      salaryStandardDeduction: 50000,
      rebateLimit: 500000,
      rebateMax: 12500,
      slabs: OLD_REGIME_SLABS,
    },
  },
  'FY 2023-24': {
    newRegime: {
      salaryStandardDeduction: 50000,
      rebateLimit: 700000,
      rebateMax: 25000,
      slabs: [
        { upto: 300000, rate: 0 },
        { upto: 600000, rate: 0.05 },
        { upto: 900000, rate: 0.1 },
        { upto: 1200000, rate: 0.15 },
        { upto: 1500000, rate: 0.2 },
        { upto: Infinity, rate: 0.3 },
      ],
    },
    oldRegime: {
      salaryStandardDeduction: 50000,
      rebateLimit: 500000,
      rebateMax: 12500,
      slabs: OLD_REGIME_SLABS,
    },
  },
};

const calculateSlabTax = (taxableIncome: number, slabs: TaxSlab[]) => {
  let tax = 0;
  let lowerLimit = 0;

  for (const slab of slabs) {
    if (taxableIncome <= lowerLimit) break;

    const incomeInSlab = Math.min(taxableIncome, slab.upto) - lowerLimit;
    tax += incomeInSlab * slab.rate;
    lowerLimit = slab.upto;
  }

  return tax;
};

const applyRebateAndCess = (tax: number, taxableIncome: number, rebateLimit: number, rebateMax: number) => {
  const taxAfterRebate = taxableIncome <= rebateLimit ? Math.max(0, tax - Math.min(tax, rebateMax)) : tax;
  return Math.round(taxAfterRebate * 1.04);
};

const parseAmount = (value: string) => Number(value.replace(/[^\d]/g, '')) || 0;

const SectionHeading = ({
  eyebrow,
  title,
  copy,
  inverted = false,
}: {
  eyebrow: string;
  title: string;
  copy?: string;
  inverted?: boolean;
}) => (
  <motion.div
    initial="hidden"
    whileInView="visible"
    viewport={{ once: true, margin: '-80px' }}
    variants={pageVariants}
    transition={{ duration: 0.55 }}
    className="mx-auto max-w-3xl text-center"
  >
    <p className="text-xs font-black uppercase tracking-[0.3em] text-ease-electric">{eyebrow}</p>
    <h2 className={`mt-3 font-display text-3xl font-bold tracking-tight md:text-5xl ${inverted ? 'text-white' : 'text-slate-950'}`}>{title}</h2>
    {copy && <p className={`mt-4 text-base leading-7 md:text-lg ${inverted ? 'text-slate-300' : 'text-slate-600'}`}>{copy}</p>}
  </motion.div>
);

const MiniProgress = ({ value, className = 'bg-ease-electric' }: { value: number; className?: string }) => (
  <div className="h-2 overflow-hidden rounded-full bg-slate-100">
    <motion.div
      initial={{ scaleX: 0 }}
      whileInView={{ scaleX: value / 100 }}
      viewport={{ once: true }}
      transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
      className={`h-full origin-left rounded-full ${className}`}
    />
  </div>
);

const DashboardPreview = () => (
  <motion.div
    initial={{ opacity: 0, x: 28, rotate: 1.5 }}
    animate={{ opacity: 1, x: 0, rotate: 0 }}
    transition={{ duration: 0.8, ease: 'easeOut', delay: 0.15 }}
    className="relative"
  >
    <div className="glass-card relative overflow-hidden p-4 md:p-5">
      <div className="absolute inset-0 animated-grid opacity-45" />
      <div className="relative rounded-[1.25rem] border border-slate-100 bg-white p-4 shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.22em] text-ease-blue">Live dashboard</p>
            <h3 className="mt-1 text-xl font-black text-slate-950">Compliance Command</h3>
          </div>
          <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-700">82% healthy</span>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          {[
            ['GST', 'Return due in 4 days', 'bg-blue-50 text-ease-blue'],
            ['ITR', 'Review pending', 'bg-purple-50 text-ease-purple'],
            ['ROC', '2 tasks assigned', 'bg-orange-50 text-orange-700'],
            ['TDS', 'Challan matched', 'bg-emerald-50 text-emerald-700'],
          ].map(([label, copy, tone], index) => (
            <motion.div
              key={label}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 + index * 0.08 }}
              className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4"
            >
              <div className="flex items-center justify-between">
                <span className={`rounded-full px-2.5 py-1 text-xs font-black ${tone}`}>{label}</span>
                <span className="h-2 w-2 rounded-full bg-ease-green animate-pulse-ring" />
              </div>
              <p className="mt-4 text-sm font-bold text-slate-800">{copy}</p>
            </motion.div>
          ))}
        </div>

        <div className="mt-5 rounded-2xl bg-slate-950 p-4 text-white">
          <div className="flex items-center justify-between">
            <p className="text-sm font-bold">Filing timeline</p>
            <span className="text-xs text-slate-300">Real-time</span>
          </div>
          <div className="mt-4 space-y-3">
            {workflowSteps.map(step => (
              <div key={step.label}>
                <div className="mb-1.5 flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-200">{step.label}</span>
                  <span className="text-slate-400">{step.value}%</span>
                </div>
                <MiniProgress value={step.value} className={step.tone} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>

    <motion.div
      animate={{ y: [0, -8, 0] }}
      transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
      className="absolute -top-6 left-8 hidden rounded-2xl border border-white/70 bg-white/90 p-4 shadow-2xl backdrop-blur md:block"
    >
      <p className="text-xs font-black uppercase tracking-wide text-slate-400">AI assistant</p>
      <p className="mt-1 text-sm font-bold text-slate-900">3 notices summarized</p>
    </motion.div>

    <motion.div
      animate={{ y: [0, 10, 0] }}
      transition={{ duration: 4.6, repeat: Infinity, ease: 'easeInOut' }}
      className="absolute -right-3 bottom-10 hidden rounded-2xl border border-white/70 bg-white/90 p-4 shadow-2xl backdrop-blur md:block"
    >
      <p className="text-xs font-black uppercase tracking-wide text-slate-400">Queue</p>
      <p className="mt-1 text-sm font-bold text-slate-900">17 filings moving</p>
    </motion.div>
  </motion.div>
);

const IncomeTaxCalc = () => {
  const [financialYear, setFinancialYear] = useState<FinancialYear>('FY 2025-26');
  const [incomeTypes, setIncomeTypes] = useState<Record<IncomeTypeKey, number>>({
    salary: 0,
    business: 0,
    capitalGain: 0,
    other: 0,
  });
  const [deductions, setDeductions] = useState<number>(0);

  const totalIncome = INCOME_TYPE_FIELDS.reduce((sum, field) => sum + Number(incomeTypes[field.key] || 0), 0);

  const updateIncomeType = (key: IncomeTypeKey, value: number) => {
    setIncomeTypes(prev => ({ ...prev, [key]: value }));
  };

  const taxConfig = TAX_CONFIG[financialYear];
  const newTaxableIncome = Math.max(0, totalIncome - Math.min(incomeTypes.salary, taxConfig.newRegime.salaryStandardDeduction));
  const oldTaxableIncome = Math.max(0, totalIncome - Math.min(incomeTypes.salary, taxConfig.oldRegime.salaryStandardDeduction) - deductions);
  const oldTax = applyRebateAndCess(
    calculateSlabTax(oldTaxableIncome, taxConfig.oldRegime.slabs),
    oldTaxableIncome,
    taxConfig.oldRegime.rebateLimit,
    taxConfig.oldRegime.rebateMax
  );
  const newTax = applyRebateAndCess(
    calculateSlabTax(newTaxableIncome, taxConfig.newRegime.slabs),
    newTaxableIncome,
    taxConfig.newRegime.rebateLimit,
    taxConfig.newRegime.rebateMax
  );
  const suggestedRegime = oldTax === newTax ? 'Either regime' : oldTax < newTax ? 'Old regime' : 'New regime';

  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_300px]">
      <div className="space-y-5">
        <div className="grid gap-4 sm:grid-cols-[220px_1fr]">
          <label>
            <span className="mb-2 block text-xs font-black uppercase tracking-wide text-slate-500">Financial year</span>
            <select value={financialYear} onChange={event => setFinancialYear(event.target.value as FinancialYear)} className="input">
              {FINANCIAL_YEARS.map(year => (
                <option key={year}>{year}</option>
              ))}
            </select>
          </label>
          <div className="rounded-3xl border border-blue-100 bg-blue-50/70 p-4">
            <p className="text-xs font-black uppercase tracking-wide text-ease-blue">Income mix</p>
            <p className="mt-1 text-sm font-bold text-slate-600">Salary standard deduction and rebate limits are applied automatically.</p>
          </div>
        </div>

        <div>
          <p className="mb-3 text-xs font-black uppercase tracking-wide text-slate-500">Types of income</p>
          <div className="grid gap-4 sm:grid-cols-2">
            {INCOME_TYPE_FIELDS.map(({ key, label }) => (
              <label key={key}>
                <span className="mb-2 block text-xs font-black uppercase tracking-wide text-slate-500">{label}</span>
                <input
                  type="text"
                  inputMode="numeric"
                  value={incomeTypes[key]}
                  onChange={event => updateIncomeType(key, parseAmount(event.target.value))}
                  className="input"
                  placeholder="0"
                />
              </label>
            ))}
          </div>
        </div>

        <label>
          <span className="mb-2 block text-xs font-black uppercase tracking-wide text-slate-500">Deductions</span>
          <input type="text" inputMode="numeric" value={deductions} onChange={event => setDeductions(parseAmount(event.target.value))} className="input" placeholder="80C, 80D, HRA" />
        </label>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-1">
        <motion.div key={`income-${totalIncome}-${financialYear}`} initial={{ scale: 0.96 }} animate={{ scale: 1 }} className="rounded-3xl border border-slate-100 bg-white p-4 shadow-sm">
          <p className="text-xs font-black uppercase tracking-wide text-slate-400">{financialYear}</p>
          <p className="mt-2 text-2xl font-black text-slate-900">{formatMoney(totalIncome)}</p>
          <p className="mt-1 text-xs font-bold text-slate-500">Total annual income</p>
        </motion.div>
        <motion.div key={`old-${oldTax}`} initial={{ scale: 0.96 }} animate={{ scale: 1 }} className="rounded-3xl border border-slate-100 bg-white p-4 shadow-sm">
          <p className="text-xs font-black uppercase tracking-wide text-slate-400">Old regime</p>
          <p className="mt-2 text-2xl font-black text-slate-900">{formatMoney(oldTax)}</p>
        </motion.div>
        <motion.div key={`new-${newTax}`} initial={{ scale: 0.96 }} animate={{ scale: 1 }} className="rounded-3xl border border-blue-100 bg-blue-50 p-4 shadow-sm">
          <p className="text-xs font-black uppercase tracking-wide text-ease-blue">New regime</p>
          <p className="mt-2 text-2xl font-black text-ease-blue">{formatMoney(newTax)}</p>
        </motion.div>
        <div className="col-span-2 rounded-3xl border border-emerald-100 bg-emerald-50 p-4 lg:col-span-1">
          <p className="text-xs font-black uppercase tracking-wide text-emerald-700">Quick signal</p>
          <p className="mt-2 text-lg font-black text-emerald-800">{suggestedRegime}</p>
          <p className="mt-1 text-xs font-semibold text-emerald-700">Indicative only. Capital gains may need special-rate review.</p>
        </div>
      </div>
    </div>
  );
};

const GstLateFeeCalc = () => {
  const [days, setDays] = useState<number>(0);
  const [isNil, setIsNil] = useState(false);
  const fee = Math.min(days * (isNil ? 20 : 50), isNil ? 500 : 5000);

  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_280px]">
      <div className="grid gap-4 sm:grid-cols-2">
        <label>
          <span className="mb-2 block text-xs font-black uppercase tracking-wide text-slate-500">Days delayed</span>
          <input type="number" value={days} onChange={event => setDays(Number(event.target.value))} className="input" placeholder="0" />
        </label>
        <label className="flex items-center rounded-3xl border border-slate-100 bg-white/80 px-4 py-3 shadow-sm">
          <input type="checkbox" checked={isNil} onChange={event => setIsNil(event.target.checked)} className="h-5 w-5 rounded text-ease-blue" />
          <span className="ml-3 text-sm font-bold text-slate-700">Nil return</span>
        </label>
      </div>

      <motion.div key={fee} initial={{ scale: 0.96 }} animate={{ scale: 1 }} className="rounded-3xl border border-orange-100 bg-orange-50 p-5 shadow-sm">
        <p className="text-xs font-black uppercase tracking-wide text-orange-600">Estimated late fee</p>
        <p className="mt-2 text-3xl font-black text-orange-700">{formatMoney(fee)}</p>
        <p className="mt-2 text-xs font-semibold text-orange-600">Indicative fee cap applied.</p>
      </motion.div>
    </div>
  );
};

const AdvanceTaxCalc = () => {
  const [taxAmount, setTaxAmount] = useState<number>(0);
  const installments = [
    { label: 'Jun 15', percent: 15 },
    { label: 'Sep 15', percent: 45 },
    { label: 'Dec 15', percent: 75 },
    { label: 'Mar 15', percent: 100 },
  ];

  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_1.25fr]">
      <label>
        <span className="mb-2 block text-xs font-black uppercase tracking-wide text-slate-500">Yearly tax liability</span>
        <input type="text" inputMode="numeric" value={taxAmount} onChange={event => setTaxAmount(parseAmount(event.target.value))} className="input" placeholder="e.g. 500000" />
      </label>
      <div className="grid grid-cols-2 gap-3">
        {installments.map((item, index) => (
          <motion.div
            key={item.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.06 }}
            className="rounded-3xl border border-slate-100 bg-white p-4 shadow-sm"
          >
            <p className="text-xs font-black uppercase tracking-wide text-slate-400">{item.label}</p>
            <p className="mt-2 text-lg font-black text-slate-900">{formatMoney(Math.round(taxAmount * (item.percent / 100)))}</p>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

const TdsCalc = () => {
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [selectedKey, setSelectedKey] = useState(TDS_OPTIONS[0].key);
  const [hasPan, setHasPan] = useState(true);
  const selectedOption = TDS_OPTIONS.find(option => option.key === selectedKey) ?? TDS_OPTIONS[0];
  const effectiveRate = hasPan ? selectedOption.rate : Math.max(selectedOption.rate, 20);
  const tdsAmount = Math.round(paymentAmount * (effectiveRate / 100));
  const netPayable = Math.max(0, paymentAmount - tdsAmount);

  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
      <div className="space-y-5">
        <label>
          <span className="mb-2 block text-xs font-black uppercase tracking-wide text-slate-500">TDS section</span>
          <select value={selectedKey} onChange={event => setSelectedKey(event.target.value)} className="input">
            {TDS_OPTIONS.map(option => (
              <option key={option.key} value={option.key}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <div className="grid gap-4 sm:grid-cols-[1fr_220px]">
          <label>
            <span className="mb-2 block text-xs font-black uppercase tracking-wide text-slate-500">Payment amount</span>
            <input
              type="text"
              inputMode="numeric"
              value={paymentAmount}
              onChange={event => setPaymentAmount(parseAmount(event.target.value))}
              className="input"
              placeholder="e.g. 100000"
            />
          </label>
          <div>
            <span className="mb-2 block text-xs font-black uppercase tracking-wide text-slate-500">PAN available</span>
            <div className="grid grid-cols-2 rounded-2xl bg-slate-100 p-1">
              {[true, false].map(value => (
                <button
                  key={String(value)}
                  type="button"
                  onClick={() => setHasPan(value)}
                  className={`rounded-xl px-3 py-3 text-sm font-black transition ${hasPan === value ? 'bg-white text-ease-blue shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
                >
                  {value ? 'Yes' : 'No'}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-blue-100 bg-blue-50/70 p-4">
          <p className="text-xs font-black uppercase tracking-wide text-ease-blue">Selected rule</p>
          <p className="mt-1 text-sm font-bold text-slate-700">{selectedOption.note}</p>
          {!hasPan && <p className="mt-2 text-xs font-black text-orange-700">PAN not available: higher 20% deduction logic applied.</p>}
        </div>
      </div>

      <div className="grid gap-3">
        <motion.div key={`rate-${effectiveRate}-${selectedKey}-${hasPan}`} initial={{ scale: 0.96 }} animate={{ scale: 1 }} className="rounded-3xl border border-slate-100 bg-white p-4 shadow-sm">
          <p className="text-xs font-black uppercase tracking-wide text-slate-400">Effective TDS rate</p>
          <p className="mt-2 text-3xl font-black text-slate-950">{effectiveRate}%</p>
        </motion.div>
        <motion.div key={`tds-${tdsAmount}`} initial={{ scale: 0.96 }} animate={{ scale: 1 }} className="rounded-3xl border border-blue-100 bg-blue-50 p-4 shadow-sm">
          <p className="text-xs font-black uppercase tracking-wide text-ease-blue">TDS to deduct</p>
          <p className="mt-2 text-2xl font-black text-ease-blue">{formatMoney(tdsAmount)}</p>
        </motion.div>
        <motion.div key={`net-${netPayable}`} initial={{ scale: 0.96 }} animate={{ scale: 1 }} className="rounded-3xl border border-emerald-100 bg-emerald-50 p-4 shadow-sm">
          <p className="text-xs font-black uppercase tracking-wide text-emerald-700">Net payable</p>
          <p className="mt-2 text-2xl font-black text-emerald-800">{formatMoney(netPayable)}</p>
        </motion.div>
      </div>
    </div>
  );
};

const HomePage: React.FC = () => {
  const { setPage } = useAppContext();
  const [activeTool, setActiveTool] = useState<CalculatorTool>('tax');
  const [selectedMonth, setSelectedMonth] = useState('June 2024');

  return (
    <div className="overflow-hidden bg-ease-bg font-sans selection:bg-ease-blue selection:text-white">
      <section className="relative isolate z-20 overflow-visible mesh-surface">
        <div className="absolute inset-0 animated-grid opacity-25" />
        <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-ease-bg to-transparent" />

        <div className="container relative z-10 mx-auto grid min-h-[680px] items-center gap-10 px-4 py-14 sm:px-6 lg:grid-cols-[1.02fr_0.98fr] lg:py-20">
          <motion.div initial="hidden" animate="visible" variants={pageVariants} transition={{ duration: 0.65 }} className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs font-black uppercase tracking-[0.25em] text-blue-100 backdrop-blur">
              <span className="h-2 w-2 rounded-full bg-ease-green animate-pulse-ring" />
              AI-Powered Compliance OS
            </div>

            <h1 className="mt-6 font-display text-5xl font-bold leading-[0.95] tracking-tight text-white text-balance md:text-7xl">
              Compliance that moves like a fintech product.
            </h1>

            <p className="mt-6 max-w-2xl text-lg leading-8 text-blue-100 md:text-xl">
              Chartered Ease turns filings, documents, deadlines and expert work into one live operating system for Indian compliance.
            </p>

            <div className="relative z-50 mt-8 flex flex-col gap-3 sm:flex-row">
              <CustomerLoginDropdown buttonClassName="blue-glow-button" align="left" />
              <CustomerLoginDropdown label="Track Filing" buttonClassName="soft-button bg-white/95" align="left" />
              <button onClick={() => setPage('services')} className="soft-button border-white/20 bg-white/10 text-white hover:bg-white hover:text-ease-blue">Explore Services</button>
            </div>

            <div className="mt-10 grid gap-3 sm:grid-cols-3">
              {platformStats.map((stat, index) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.25 + index * 0.08 }}
                  className="rounded-3xl border border-white/12 bg-white/10 p-4 backdrop-blur"
                >
                  <p className="font-display text-2xl font-bold text-white">{stat.value}</p>
                  <p className="mt-1 text-xs font-semibold leading-5 text-blue-100">{stat.label}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>

          <DashboardPreview />
        </div>
      </section>

      <section className="relative z-0 -mt-10 px-4 sm:px-6">
        <div className="container mx-auto">
          <div className="glass-card grid gap-4 p-5 md:grid-cols-4">
            {[
              ['Compliance Score', '82%', 'Healthy and improving', 'bg-ease-green'],
              ['Active Workflows', '47', 'Across GST, ITR, TDS, ROC', 'bg-ease-electric'],
              ['Pending Tasks', '12', 'Awaiting client documents', 'bg-orange-500'],
              ['AI Automations', '19', 'Notice and document checks', 'bg-ease-purple'],
            ].map(([label, value, copy, tone]) => (
              <div key={label} className="rounded-3xl border border-slate-100 bg-white/75 p-4">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-black uppercase tracking-wide text-slate-400">{label}</p>
                  <span className={`h-2.5 w-2.5 rounded-full ${tone}`} />
                </div>
                <p className="mt-3 font-display text-3xl font-bold text-slate-950">{value}</p>
                <p className="mt-1 text-sm text-slate-500">{copy}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 md:py-20">
        <div className="container mx-auto px-4 sm:px-6">
          <SectionHeading
            eyebrow="Interactive compliance tools"
            title="Compliance Calculators"
          />

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.55 }}
            className="glass-card mx-auto mt-10 max-w-5xl overflow-hidden p-2"
          >
            <div className="grid gap-2 rounded-[1.3rem] bg-slate-100/70 p-2 sm:grid-cols-4">
              {CALCULATOR_TABS.map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => setActiveTool(key)}
                  className={`relative rounded-2xl px-4 py-3 text-sm font-black transition ${activeTool === key ? 'text-ease-blue' : 'text-slate-500 hover:text-slate-800'}`}
                >
                  {activeTool === key && <motion.span layoutId="tool-active" className="absolute inset-0 rounded-2xl bg-white shadow-sm" />}
                  <span className="relative">{label}</span>
                </button>
              ))}
            </div>

            <div className="min-h-[290px] p-5 md:p-8">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTool}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.25 }}
                >
                  {activeTool === 'tax' && <IncomeTaxCalc />}
                  {activeTool === 'gst' && <GstLateFeeCalc />}
                  {activeTool === 'adv' && <AdvanceTaxCalc />}
                  {activeTool === 'tds' && <TdsCalc />}
                </motion.div>
              </AnimatePresence>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="bg-white/55 py-16 md:py-20">
        <div className="container mx-auto grid gap-10 px-4 sm:px-6 lg:grid-cols-[1fr_360px]">
          <div>
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.3em] text-ease-electric">Live deadline tracker</p>
                <h2 className="mt-3 font-display text-3xl font-bold tracking-tight text-slate-950 md:text-5xl">A calendar that behaves like a workflow feed.</h2>
              </div>
              <div className="flex rounded-full bg-slate-100 p-1">
                {Object.keys(upcomingCompliances).map(month => (
                  <button
                    key={month}
                    onClick={() => setSelectedMonth(month)}
                    className={`rounded-full px-4 py-2 text-xs font-black transition ${selectedMonth === month ? 'bg-white text-ease-blue shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
                  >
                    {month.split(' ')[0]}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-8 space-y-4">
              <AnimatePresence mode="popLayout">
                {upcomingCompliances[selectedMonth].map((item, index) => (
                  <motion.div
                    key={`${selectedMonth}-${item.title}`}
                    initial={{ opacity: 0, x: -18 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 12 }}
                    transition={{ delay: index * 0.04 }}
                    className="group glass-card p-4 transition duration-300 hover:-translate-y-1 hover:border-ease-electric/30 hover:shadow-[0_24px_80px_rgba(37,99,235,0.12)]"
                  >
                    <div className="flex gap-4">
                      <div className="flex h-16 w-16 shrink-0 flex-col items-center justify-center rounded-3xl bg-ease-blue text-white shadow-lg shadow-ease-blue/20">
                        <span className="text-xl font-black leading-none">{item.date}</span>
                        <span className="mt-1 text-[10px] font-bold uppercase tracking-wide text-blue-100">{selectedMonth.slice(0, 3)}</span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <p className="text-xs font-black uppercase tracking-wide text-ease-blue">{item.category}</p>
                          <span className="rounded-full bg-orange-50 px-3 py-1 text-xs font-black text-orange-700">Upcoming</span>
                        </div>
                        <h4 className="mt-1 text-lg font-black text-slate-900">{item.title}</h4>
                        <div className="mt-3">
                          <MiniProgress value={item.progress} className="bg-ease-electric" />
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>

          <div className="glass-card overflow-hidden p-5">
            <div className="flex items-center justify-between">
              <h3 className="flex items-center text-lg font-black text-slate-950">
                <ClockIcon className="mr-2 h-5 w-5 text-ease-blue" />
                Latest Updates
              </h3>
              <span className="rounded-full bg-ease-green/10 px-3 py-1 text-xs font-black text-ease-green">Live</span>
            </div>
            <div className="relative mt-5 h-[360px] overflow-hidden">
              <div className="animate-feed-scroll space-y-4 pr-1">
                {[...recentUpdates, ...recentUpdates].map((update, index) => (
                  <div key={`${update.title}-${index}`} className="rounded-3xl border border-slate-100 bg-white/85 p-4 shadow-sm">
                    <span className="rounded-full bg-blue-50 px-2.5 py-1 text-[10px] font-black uppercase tracking-wide text-ease-blue">{update.tag}</span>
                    <h4 className="mt-3 font-black text-slate-900">{update.title}</h4>
                    <p className="mt-1 text-sm leading-6 text-slate-500">{update.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 md:py-20">
        <div className="container mx-auto px-4 sm:px-6">
          <SectionHeading
            eyebrow="Compliance workflow engine"
            title="Progress psychology for serious filings."
            copy="Every task feels visible, trackable and moving. Clients see progress. Operators see ownership. Nobody is left guessing."
          />

          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {[
              { title: 'Upload', copy: 'Smart document intake, typed credentials and file validation.', icon: <DocumentCheckIcon />, tone: 'bg-blue-50 text-ease-blue' },
              { title: 'AI Review', copy: 'Summaries, notice reading and classification support.', icon: <AiBotIcon />, tone: 'bg-purple-50 text-ease-purple' },
              { title: 'Filed', copy: 'Acknowledgements and outputs stored inside the workflow.', icon: <CheckCircleSolidIcon />, tone: 'bg-emerald-50 text-ease-green' },
            ].map((step, index) => (
              <motion.div
                key={step.title}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-80px' }}
                transition={{ delay: index * 0.08 }}
                whileHover={{ y: -8, rotateX: 2 }}
                className="glass-card will-3d p-7"
              >
                <div className={`mb-6 flex h-14 w-14 items-center justify-center rounded-3xl ${step.tone}`}>{step.icon}</div>
                <h3 className="text-2xl font-black text-slate-950">{step.title}</h3>
                <p className="mt-3 text-sm leading-6 text-slate-600">{step.copy}</p>
                <div className="relative mt-6 h-1 overflow-hidden rounded-full bg-slate-100">
                  <span className="absolute inset-y-0 left-0 w-2/3 rounded-full bg-ease-electric animate-shimmer-line" />
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-slate-950 py-16 text-white md:py-20">
        <div className="container mx-auto px-4 sm:px-6">
          <SectionHeading
            eyebrow="Core services"
            title="One operating layer for every compliance line."
            copy="Service cards now behave like app modules, not brochure blocks."
            inverted
          />

          <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
            {serviceList.map((service, index) => (
              <motion.button
                key={service.name}
                onClick={() => setPage(service.page)}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-80px' }}
                transition={{ delay: index * 0.06 }}
                whileHover={{ y: -10, rotate: -0.6 }}
                whileTap={{ scale: 0.98 }}
                className="group relative overflow-hidden rounded-[1.6rem] border border-white/10 bg-white/[0.06] p-6 text-left shadow-2xl shadow-black/20 transition duration-300 hover:border-ease-electric/50 hover:bg-white/[0.09]"
              >
                <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${service.accent}`} />
                <div className="mb-7 flex h-14 w-14 items-center justify-center rounded-3xl bg-white text-ease-blue shadow-lg transition duration-300 group-hover:scale-110">
                  {service.icon}
                </div>
                <h3 className="text-xl font-black text-white">{service.name}</h3>
                <p className="mt-3 min-h-[96px] text-sm leading-6 text-slate-300">{service.desc}</p>
                <span className="mt-6 inline-flex items-center text-sm font-black text-blue-200 transition duration-300 group-hover:translate-x-1 group-hover:text-white">
                  Get Started <span className="ml-2 transition duration-300 group-hover:translate-x-1">-&gt;</span>
                </span>
              </motion.button>
            ))}
          </div>

          <div className="mt-12 text-center">
            <button onClick={() => setPage('services')} className="soft-button bg-white text-slate-950 hover:text-ease-blue">
              View Entity-wise Services
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
