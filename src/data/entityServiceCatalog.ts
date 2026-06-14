export type EntityTypeId =
    | 'individual'
    | 'proprietorship'
    | 'partnership'
    | 'llp'
    | 'private_limited'
    | 'huf';

export type ServiceMode = 'digital' | 'expert';

export interface EntityOption {
    id: EntityTypeId;
    name: string;
}

export interface V1Service {
    key: string;
    name: string;
    description: string;
    route: string;
    mode: ServiceMode;
}

export const V1_ENTITY_OPTIONS: EntityOption[] = [
    { id: 'individual', name: 'Individual (Salaried/Personal)' },
    { id: 'proprietorship', name: 'Proprietorship' },
    { id: 'partnership', name: 'Partnership Firm' },
    { id: 'llp', name: 'LLP (Limited Liability Partnership)' },
    { id: 'private_limited', name: 'Private Limited Company' },
    { id: 'huf', name: 'HUF (Hindu Undivided Family)' },
];

export const ENTITY_LABEL_BY_ID: Record<EntityTypeId, string> = V1_ENTITY_OPTIONS.reduce((acc, entity) => {
    acc[entity.id] = entity.name;
    return acc;
}, {} as Record<EntityTypeId, string>);

export const ENTITY_LABEL_LOOKUP: Record<string, string> = { ...ENTITY_LABEL_BY_ID };

export const V1_SERVICE_CATALOG: Record<EntityTypeId, V1Service[]> = {
    individual: [
        {
            key: 'individual-salary-itr',
            name: 'ITR Filing (Salary)',
            description: 'Salary return filing with Form 16, bank statements and deduction support.',
            route: 'itr-filing',
            mode: 'digital',
        },
        {
            key: 'individual-capital-gain-itr',
            name: 'Capital Gain ITR',
            description: 'Capital gains reporting for shares, mutual funds, property and other assets.',
            route: 'itr-filing',
            mode: 'digital',
        },
        {
            key: 'individual-freelancer-itr',
            name: 'Freelancer ITR',
            description: 'ITR filing for freelancers, consultants and professionals with project income.',
            route: 'itr-filing',
            mode: 'digital',
        },
        {
            key: 'individual-tax-planning',
            name: 'Tax Planning',
            description: 'Salary tax planning, old-vs-new regime comparison, deductions and TDS review.',
            route: 'tax-planning',
            mode: 'digital',
        },
        {
            key: 'individual-tax-notices',
            name: 'Tax Notices',
            description: 'Upload income-tax notice, ITR acknowledgement and computation for expert review.',
            route: 'tax-notices',
            mode: 'digital',
        },
        {
            key: 'individual-tds-on-property',
            name: 'TDS on Property',
            description: 'Section 194-IA TDS compliance and Form 26QB filing for property buyers.',
            route: 'tds-property',
            mode: 'digital',
        },
        {
            key: 'individual-pan-services',
            name: 'PAN Services',
            description: 'Apply for PAN, correct PAN details or link PAN with Aadhaar.',
            route: 'pan-services',
            mode: 'digital',
        },
    ],
    proprietorship: [
        {
            key: 'proprietorship-gst-registration',
            name: 'GST Registration',
            description: 'New GST registration for proprietors with document collection and filing.',
            route: 'gst-registration',
            mode: 'digital',
        },
        {
            key: 'proprietorship-gst-returns',
            name: 'GST Returns',
            description: 'Monthly, quarterly and annual GST return support for active GSTINs.',
            route: 'gst-return-filing',
            mode: 'digital',
        },
        {
            key: 'proprietorship-business-itr',
            name: 'Income Tax Return (Business)',
            description: 'Business ITR filing with financials, bank statements and tax computation.',
            route: 'itr-filing',
            mode: 'digital',
        },
        {
            key: 'proprietorship-udyam-registration',
            name: 'Udyam Registration',
            description: 'MSME Udyam registration for proprietorship benefits and recognition.',
            route: 'udyam-registration',
            mode: 'digital',
        },
        {
            key: 'proprietorship-shop-act-registration',
            name: 'Shop Act Registration',
            description: 'Shop and Establishment registration for local business compliance.',
            route: 'shop-act',
            mode: 'digital',
        },
        {
            key: 'proprietorship-pt-registration',
            name: 'Professional Tax Registration',
            description: 'Professional tax registration setup for applicable states.',
            route: 'pt-registration',
            mode: 'digital',
        },
        {
            key: 'proprietorship-pt-return',
            name: 'Professional Tax Return',
            description: 'Employer return filing, PT challans and professional tax working sheet support.',
            route: 'pt-return',
            mode: 'digital',
        },
        {
            key: 'proprietorship-tds-filing',
            name: 'TDS Filing',
            description: 'TDS return filing and challan reconciliation for proprietorships.',
            route: 'tds-filing',
            mode: 'digital',
        },
        {
            key: 'proprietorship-accounting',
            name: 'Accounting',
            description: 'Upload books data and generate draft P&L and Balance Sheet for the period.',
            route: 'accounting',
            mode: 'digital',
        },
        {
            key: 'proprietorship-payroll',
            name: 'Payroll Services',
            description: 'PF registration and monthly PF return filing workflows.',
            route: 'payroll-services',
            mode: 'digital',
        },
        {
            key: 'proprietorship-project-report-loan',
            name: 'Project Report for Loan',
            description: 'Bank-ready project report for loan and funding applications.',
            route: 'project-report-for-loan',
            mode: 'digital',
        },
    ],
    partnership: [
        {
            key: 'partnership-registration',
            name: 'Partnership Registration',
            description: 'Generate a partnership deed draft with partner KYC, profit ratio and notarization guidance.',
            route: 'partnership-registration',
            mode: 'digital',
        },
        {
            key: 'partnership-gst-registration',
            name: 'GST Registration',
            description: 'GST registration for partnership firms with partner documentation.',
            route: 'gst-registration',
            mode: 'digital',
        },
        {
            key: 'partnership-gst-returns',
            name: 'GST Returns',
            description: 'GST return filing and reconciliation for partnership businesses.',
            route: 'gst-return-filing',
            mode: 'digital',
        },
        {
            key: 'partnership-firm-itr',
            name: 'Firm ITR Filing',
            description: 'Income tax return filing for partnership firms.',
            route: 'itr-filing',
            mode: 'digital',
        },
        {
            key: 'partnership-tds-filing',
            name: 'TDS Filing',
            description: 'TDS returns, challan checks and compliance support.',
            route: 'tds-filing',
            mode: 'digital',
        },
        {
            key: 'partnership-pt-registration',
            name: 'Professional Tax Registration',
            description: 'Professional tax registration for applicable state laws.',
            route: 'pt-registration',
            mode: 'digital',
        },
        {
            key: 'partnership-pt-return',
            name: 'Professional Tax Return',
            description: 'Employer return filing, PT challans and professional tax working sheet support.',
            route: 'pt-return',
            mode: 'digital',
        },
        {
            key: 'partnership-accounting',
            name: 'Accounting',
            description: 'Upload firm records and generate draft P&L and Balance Sheet for review.',
            route: 'accounting',
            mode: 'digital',
        },
        {
            key: 'partnership-udyam-registration',
            name: 'Udyam Registration',
            description: 'Udyam registration for MSME benefits and procurement eligibility.',
            route: 'udyam-registration',
            mode: 'digital',
        },
        {
            key: 'partnership-shop-act',
            name: 'Shop Act',
            description: 'Shop and Establishment registration for firm premises.',
            route: 'shop-act',
            mode: 'digital',
        },
        {
            key: 'partnership-payroll',
            name: 'Payroll Services',
            description: 'PF registration and monthly PF return filing for partnership firms.',
            route: 'payroll-services',
            mode: 'digital',
        },
        {
            key: 'partnership-project-report',
            name: 'Project Report',
            description: 'Loan and funding project reports for partnership firms.',
            route: 'project-report-for-loan',
            mode: 'digital',
        },
    ],
    llp: [
        {
            key: 'llp-registration',
            name: 'LLP Registration',
            description: 'LLP incorporation workflow with partner and registered office documents.',
            route: 'company-incorporation',
            mode: 'digital',
        },
        {
            key: 'llp-gst-returns',
            name: 'GST Returns',
            description: 'GST return filing and reconciliation for LLPs.',
            route: 'gst-return-filing',
            mode: 'digital',
        },
        {
            key: 'llp-tds-filing',
            name: 'TDS Filing',
            description: 'TDS filing and compliance support for LLP deductions.',
            route: 'tds-filing',
            mode: 'digital',
        },
        {
            key: 'llp-pt-registration',
            name: 'Professional Tax Registration',
            description: 'Professional tax registration for applicable states.',
            route: 'pt-registration',
            mode: 'digital',
        },
        {
            key: 'llp-pt-return',
            name: 'Professional Tax Return',
            description: 'Employer return filing, PT challans and professional tax working sheet support.',
            route: 'pt-return',
            mode: 'digital',
        },
        {
            key: 'llp-accounting',
            name: 'Accounting',
            description: 'Upload LLP accounting records and generate draft financial statements.',
            route: 'accounting',
            mode: 'digital',
        },
        {
            key: 'llp-roc-compliance',
            name: 'ROC Compliance',
            description: 'LLP annual filing, Form 11, Form 8 and MCA compliance tracking.',
            route: 'llp-roc-compliance',
            mode: 'digital',
        },
        {
            key: 'llp-payroll',
            name: 'Payroll Services',
            description: 'PF registration and monthly PF return filing for LLPs.',
            route: 'payroll-services',
            mode: 'digital',
        },
        {
            key: 'llp-project-report',
            name: 'Project Report',
            description: 'Business project reports for loans and institutional funding.',
            route: 'project-report-for-loan',
            mode: 'digital',
        },
        {
            key: 'llp-trademark-filing',
            name: 'Trademark Filing',
            description: 'TM-A filing workflow with mark details, class selection and supporting documents.',
            route: 'trademark-filing',
            mode: 'digital',
        },
    ],
    private_limited: [
        {
            key: 'private-limited-company-registration',
            name: 'Company Registration',
            description: 'Private limited company incorporation with director and office documents.',
            route: 'company-incorporation',
            mode: 'digital',
        },
        {
            key: 'private-limited-roc-filing',
            name: 'ROC Filing',
            description: 'Annual and event-based ROC filings for companies.',
            route: 'roc-filing',
            mode: 'digital',
        },
        {
            key: 'private-limited-gst-filing',
            name: 'GST Filing',
            description: 'GST filing, reconciliation and periodic compliance for companies.',
            route: 'gst-return-filing',
            mode: 'digital',
        },
        {
            key: 'private-limited-tds-filing',
            name: 'TDS Filing',
            description: 'TDS return filing and deduction compliance for companies.',
            route: 'tds-filing',
            mode: 'digital',
        },
        {
            key: 'private-limited-pt-registration',
            name: 'Professional Tax Registration',
            description: 'Professional tax registration for company payroll and state compliance.',
            route: 'pt-registration',
            mode: 'digital',
        },
        {
            key: 'private-limited-pt-return',
            name: 'Professional Tax Return',
            description: 'Employer return filing, PT challans and professional tax working sheet support.',
            route: 'pt-return',
            mode: 'digital',
        },
        {
            key: 'private-limited-payroll-compliance',
            name: 'Payroll Services',
            description: 'PF registration and monthly PF return filing for companies.',
            route: 'payroll-services',
            mode: 'digital',
        },
        {
            key: 'private-limited-accounting',
            name: 'Accounting',
            description: 'Upload company books data and generate draft P&L and Balance Sheet.',
            route: 'accounting',
            mode: 'digital',
        },
        {
            key: 'private-limited-startup-india',
            name: 'Startup India Registration',
            description: 'DPIIT recognition workflow with KYC, business objective and proof of concept uploads.',
            route: 'startup-india-registration',
            mode: 'digital',
        },
        {
            key: 'private-limited-trademark-filing',
            name: 'Trademark Filing',
            description: 'TM-A filing workflow with mark details, class selection and supporting documents.',
            route: 'trademark-filing',
            mode: 'digital',
        },
        {
            key: 'private-limited-board-resolutions',
            name: 'Board Resolutions',
            description: 'Generate board resolution drafts for banking, GST, ROC and authorization purposes.',
            route: 'board-resolutions',
            mode: 'digital',
        },
        {
            key: 'private-limited-project-report',
            name: 'Project Report',
            description: 'Professional project reports for loans, funding and internal planning.',
            route: 'project-report-for-loan',
            mode: 'digital',
        },
    ],
    huf: [
        {
            key: 'huf-itr-filing',
            name: 'HUF ITR Filing',
            description: 'Income tax return filing for HUFs with Karta and HUF documentation.',
            route: 'huf-itr-filing',
            mode: 'digital',
        },
        {
            key: 'huf-deed-service',
            name: 'HUF Deed Creation / Changes',
            description: 'Create a new HUF declaration deed or request changes in an existing HUF deed.',
            route: 'huf-deed',
            mode: 'digital',
        },
        {
            key: 'huf-capital-gains-reporting',
            name: 'Capital Gains Reporting',
            description: 'Capital gains reporting for HUF-held shares, property and investments.',
            route: 'huf-itr-filing',
            mode: 'digital',
        },
    ],
};

export const V1_ALL_SERVICES = Object.values(V1_SERVICE_CATALOG).flat();

export const V1_APPLICATION_SERVICE_NAMES = Array.from(
    new Set([
        ...V1_ALL_SERVICES.map(service => service.name),
        'GST Return Filing',
        'Professional Tax (PT) Registration',
        'Professional Tax Return Filing (Employer)',
        'Professional Tax Enrollment (Self Employed)',
        'TDS Filing - Form 24Q',
        'TDS Filing - Form 26Q',
        'TDS Filing - Form 27Q',
        'TDS/TCS Filing - Form 27EQ',
        'Shop Act License',
        'Udyam (MSME) Registration',
        'Company / LLP Incorporation',
        'Income Tax Filing',
        'Project Report for Loan',
    ])
);

export const isV1EntityType = (entityType?: string | null): entityType is EntityTypeId => {
    return Boolean(entityType && entityType in V1_SERVICE_CATALOG);
};

export const getEntityLabel = (entityType?: string | null) => {
    if (!entityType) return '';
    return ENTITY_LABEL_LOOKUP[entityType] || entityType;
};

export const getServicesForEntity = (entityType?: string | null) => {
    return isV1EntityType(entityType) ? V1_SERVICE_CATALOG[entityType] : [];
};

export const getServiceByKey = (serviceKey?: string | null) => {
    if (!serviceKey) return undefined;
    return V1_ALL_SERVICES.find(service => service.key === serviceKey);
};
