
export interface McaComplianceDef {
    id: string;
    name: string;
    description: string;
    frequency: 'Annual' | 'Event-based';
    defaultDueDate: string; // MM-DD format
    requiredDocs: string[];
}

export const MCA_COMPLIANCES: McaComplianceDef[] = [
    {
        id: 'DIR-3-KYC',
        name: 'DIR-3 KYC',
        description: 'Annual KYC for all Directors holding a DIN.',
        frequency: 'Annual',
        defaultDueDate: '09-30',
        requiredDocs: ['Proof of Address', 'Mobile & Email OTP']
    },
    {
        id: 'AOC-4',
        name: 'Form AOC-4',
        description: 'Filing of Financial Statements with ROC.',
        frequency: 'Annual',
        defaultDueDate: '10-30', // 30 days from AGM (approx end Oct)
        requiredDocs: ['Audited Financial Statements', 'Board Report', 'Auditor Report']
    },
    {
        id: 'MGT-7',
        name: 'Form MGT-7 / MGT-7A',
        description: 'Annual Return filing containing shareholding details.',
        frequency: 'Annual',
        defaultDueDate: '11-29', // 60 days from AGM
        requiredDocs: ['List of Shareholders', 'List of Debenture Holders']
    },
    {
        id: 'ADT-1',
        name: 'Form ADT-1',
        description: 'Appointment of Auditor.',
        frequency: 'Event-based',
        defaultDueDate: '10-14', // 15 days from AGM
        requiredDocs: ['Auditor Consent Letter', 'Board Resolution']
    }
];
