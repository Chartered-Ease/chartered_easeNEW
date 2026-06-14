
export interface TaxComplianceDef {
    id: string;
    name: string;
    taxType: 'GST' | 'TDS' | 'IncomeTax';
    frequency: 'Monthly' | 'Quarterly' | 'Annual';
    // Offset in months from the start of the period (April) for due date calculation
    // e.g., April Return (Index 0) due in May -> offset 1.
    dueDateDay: number; 
    requiredDocs: string[];
    description?: string;
}

export const GST_MONTHLY_COMPLIANCES: TaxComplianceDef[] = [
    {
        id: 'GSTR-1',
        name: 'GSTR-1 (Sales)',
        taxType: 'GST',
        frequency: 'Monthly',
        dueDateDay: 11, // 11th of next month
        requiredDocs: ['Sales Register', 'Invoices']
    },
    {
        id: 'GSTR-3B',
        name: 'GSTR-3B (Summary)',
        taxType: 'GST',
        frequency: 'Monthly',
        dueDateDay: 20, // 20th of next month
        requiredDocs: ['Purchase Register', 'Input Tax Credit Data']
    }
];

export const GST_QRMP_COMPLIANCES: TaxComplianceDef[] = [
    {
        id: 'IFF',
        name: 'Invoice Furnishing Facility (IFF)',
        taxType: 'GST',
        frequency: 'Monthly', // Only for first 2 months of quarter
        dueDateDay: 13,
        requiredDocs: ['B2B Invoices']
    },
    {
        id: 'GSTR-1-Q',
        name: 'GSTR-1 (Quarterly)',
        taxType: 'GST',
        frequency: 'Quarterly',
        dueDateDay: 13, // 13th of month after quarter
        requiredDocs: ['Sales Register']
    },
    {
        id: 'GSTR-3B-Q',
        name: 'GSTR-3B (Quarterly)',
        taxType: 'GST',
        frequency: 'Quarterly',
        dueDateDay: 22, // 22nd or 24th usually
        requiredDocs: ['Purchase Register', 'ITC Data']
    }
];

export const GST_ANNUAL_COMPLIANCES: TaxComplianceDef[] = [
    {
        id: 'GSTR-9',
        name: 'GSTR-9 (Annual Return)',
        taxType: 'GST',
        frequency: 'Annual',
        dueDateDay: 31, // Dec 31st
        requiredDocs: ['Audited Financials', 'Sales/Purchase Register', 'GSTR-1/3B Summary']
    },
    {
        id: 'GSTR-9C',
        name: 'GSTR-9C (Reconciliation)',
        taxType: 'GST',
        frequency: 'Annual',
        dueDateDay: 31, // Dec 31st
        requiredDocs: ['Audited Financials', 'Reconciliation Statement']
    }
];

export const TDS_COMPLIANCES: TaxComplianceDef[] = [
    {
        id: '24Q',
        name: 'Form 24Q (Salary)',
        taxType: 'TDS',
        frequency: 'Quarterly',
        dueDateDay: 31, // 31st of month after quarter
        requiredDocs: ['Salary Sheet', 'Deduction Details']
    },
    {
        id: '26Q',
        name: 'Form 26Q (Non-Salary)',
        taxType: 'TDS',
        frequency: 'Quarterly',
        dueDateDay: 31,
        requiredDocs: ['Vendor Payments', 'Challans']
    }
];

export const INCOME_TAX_COMPLIANCES: TaxComplianceDef[] = [
    {
        id: 'ADV-TAX-Q1',
        name: 'Advance Tax (15%)',
        taxType: 'IncomeTax',
        frequency: 'Quarterly',
        dueDateDay: 15, // Jun 15
        requiredDocs: ['Estimated P&L', 'Bank Statement']
    },
    {
        id: 'ADV-TAX-Q2',
        name: 'Advance Tax (45%)',
        taxType: 'IncomeTax',
        frequency: 'Quarterly',
        dueDateDay: 15, // Sep 15
        requiredDocs: ['Estimated P&L']
    },
    {
        id: 'ADV-TAX-Q3',
        name: 'Advance Tax (75%)',
        taxType: 'IncomeTax',
        frequency: 'Quarterly',
        dueDateDay: 15, // Dec 15
        requiredDocs: ['Estimated P&L']
    },
    {
        id: 'ADV-TAX-Q4',
        name: 'Advance Tax (100%)',
        taxType: 'IncomeTax',
        frequency: 'Quarterly',
        dueDateDay: 15, // Mar 15
        requiredDocs: ['Estimated P&L']
    },
    {
        id: 'ITR-6',
        name: 'ITR Filing (Form ITR-6)',
        taxType: 'IncomeTax',
        frequency: 'Annual',
        dueDateDay: 31, // Oct 31 (Audit cases)
        requiredDocs: ['Audited Balance Sheet', 'Profit & Loss A/c', 'Form 26AS', 'AIS/TIS']
    }
];

export const MONTHS = [
    'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December', 'January', 'February', 'March'
];

export const QUARTERS = [
    { name: 'Q1 (Apr-Jun)', months: [0, 1, 2], endMonthIndex: 2 },
    { name: 'Q2 (Jul-Sep)', months: [3, 4, 5], endMonthIndex: 5 },
    { name: 'Q3 (Oct-Dec)', months: [6, 7, 8], endMonthIndex: 8 },
    { name: 'Q4 (Jan-Mar)', months: [9, 10, 11], endMonthIndex: 11 }
];
