
import { Type } from '@google/genai';

export interface DocumentInfo {
    label: string;
    description: string;
    prompt: string;
    schema: any;
}

export const DOCUMENT_MAP: Record<string, DocumentInfo> = {
    // Standard Docs
    Aadhaar: { 
        label: "Aadhaar Card", 
        description: "Front and back side.",
        prompt: "Extract name, father's name, DOB, and address from Aadhaar.",
        schema: {
            type: Type.OBJECT,
            properties: {
                name: { type: Type.STRING },
                fatherName: { type: Type.STRING },
                dob: { type: Type.STRING },
                address: { type: Type.STRING },
            }
        }
    },
    PAN: { 
        label: "PAN Card",
        description: "Clear image of the front side.",
        prompt: "Extract name, father's name, DOB, and PAN number.",
        schema: {
            type: Type.OBJECT,
            properties: {
                name: { type: Type.STRING },
                fatherName: { type: Type.STRING },
                dob: { type: Type.STRING },
                pan: { type: Type.STRING },
            }
        }
    },
    BankProof: { 
        label: "Bank Proof (Passbook / Cheque)",
        description: "Cancelled cheque or first page of passbook/statement.",
        prompt: "Extract account holder name, bank name, account number, and IFSC.",
        schema: {
            type: Type.OBJECT,
            properties: {
                bankAccountName: { type: Type.STRING },
                bankName: { type: Type.STRING },
                bankAccountNumber: { type: Type.STRING },
                bankIfsc: { type: Type.STRING },
            }
        }
    },
    ElectricityBill: { 
        label: "Business Address Proof (Electricity/Utility Bill)",
        description: "Recent utility bill for the business premises.",
        prompt: "Extract the full address for the service location.",
        schema: {
            type: Type.OBJECT,
            properties: {
                businessAddress: { type: Type.STRING },
            }
        }
    },
    Photo: { 
        label: "Photo",
        description: "Clear, front-facing recent photograph.",
        prompt: "This is a photo. No data extraction needed.",
        schema: {}
    },
    Signature: { 
        label: "Signature",
        description: "Signature on a plain white paper.",
        prompt: "This is a signature. No data extraction needed.",
        schema: {}
    },
    RentAgreement: { 
        label: "Rent Agreement",
        description: "If the business address is rented.",
        prompt: "This is a rent agreement. No data extraction needed.",
        schema: {}
    },
    NOC: {
        label: "No Objection Certificate (NOC)",
        description: "From property owner if premises are rented/consented.",
        prompt: "This is a NOC. No data extraction needed.",
        schema: {}
    },
    ShopActLicense: {
        label: "Shop Act License (Gumasta)",
        description: "State-specific Shop and Establishment registration.",
        prompt: "This is a Shop Act License. No data extraction needed.",
        schema: {}
    },
    // Partnership Docs
    PartnershipDeed: {
        label: "Registered Partnership Deed",
        description: "The legal document outlining the partnership terms.",
        prompt: "This is a Partnership Deed. No data extraction needed.",
        schema: {}
    },
    FirmPAN: {
        label: "Firm's PAN Card",
        description: "PAN card issued in the name of the Partnership Firm.",
        prompt: "Extract the firm name and PAN number.",
        schema: {
            type: Type.OBJECT,
            properties: {
                firmName: { type: Type.STRING },
                firmPan: { type: Type.STRING },
            }
        }
    },
    AuthorizationLetter: {
        label: "Authorization Letter",
        description: "Letter authorizing one person as the authorized signatory.",
        prompt: "This is an authorization letter. No data extraction needed.",
        schema: {}
    },
    // LLP & Company Docs
    IncorporationCertificate: {
        label: "Certificate of Incorporation",
        description: "Issued by the Ministry of Corporate Affairs (MCA).",
        prompt: "This is a Certificate of Incorporation. No data extraction needed.",
        schema: {}
    },
    LLPAgreement: {
        label: "Registered LLP Agreement",
        description: "The agreement filed with the MCA.",
        prompt: "This is an LLP Agreement. No data extraction needed.",
        schema: {}
    },
    LLPPAN: {
        label: "LLP's PAN Card",
        description: "PAN card issued in the name of the LLP.",
        prompt: "Extract the LLP name and PAN number.",
        schema: {
            type: Type.OBJECT,
            properties: {
                llpName: { type: Type.STRING },
                llpPan: { type: Type.STRING },
            }
        }
    },
    CompanyPAN: {
        label: "Company's PAN Card",
        description: "PAN card issued in the name of the Private Limited Company.",
        prompt: "Extract company name and PAN.",
        schema: {
            type: Type.OBJECT,
            properties: {
                companyName: { type: Type.STRING },
                companyPan: { type: Type.STRING },
            }
        }
    },
    MOA: {
        label: "Memorandum of Association (MOA)",
        description: "As filed with the MCA.",
        prompt: "This is an MOA. No data extraction needed.",
        schema: {}
    },
    AOA: {
        label: "Articles of Association (AOA)",
        description: "As filed with the MCA.",
        prompt: "This is an AOA. No data extraction needed.",
        schema: {}
    },
    BoardResolution: {
        label: "Board Resolution",
        description: "Resolution for appointing an authorized signatory for GST.",
        prompt: "This is a Board Resolution. No data extraction needed.",
        schema: {}
    },
    // HUF Docs
    HUFPAN: {
        label: "HUF's PAN Card",
        description: "PAN card in the name of the Hindu Undivided Family.",
        prompt: "Extract HUF name and PAN.",
        schema: {
            type: Type.OBJECT,
            properties: {
                hufName: { type: Type.STRING },
                hufPan: { type: Type.STRING },
            }
        }
    },
    HUFDeclaration: {
        label: "HUF Declaration Deed",
        description: "Deed containing names of Karta and members.",
        prompt: "This is an HUF Declaration. No data extraction needed.",
        schema: {}
    },
    HUFMemberDetails: {
        label: "HUF Member Details Sheet",
        description: "Names, relationship, date of birth and share/family details of HUF members.",
        prompt: "This is an HUF member detail sheet. No data extraction needed.",
        schema: {}
    },
    HUFChangeRequest: {
        label: "HUF Deed Change Request",
        description: "Written note explaining the required change in the existing HUF deed.",
        prompt: "This is an HUF deed change request. No data extraction needed.",
        schema: {}
    },
    HUFAssetDetails: {
        label: "HUF Asset / Capital Details",
        description: "Details of ancestral property, capital contribution, bank account or assets held by HUF.",
        prompt: "This is an HUF asset detail document. No data extraction needed.",
        schema: {}
    },
    // Society/Trust Docs
    SocietyRegistration: {
        label: "Society Registration Certificate",
        description: "Certificate issued by the Registrar of Societies.",
        prompt: "This is a Society Registration Certificate. No data extraction needed.",
        schema: {}
    },
    SocietyPAN: {
        label: "Society's PAN Card",
        description: "PAN card issued in the name of the Society.",
        prompt: "Extract society name and PAN.",
        schema: {
            type: Type.OBJECT,
            properties: {
                societyName: { type: Type.STRING },
                societyPan: { type: Type.STRING },
            }
        }
    },
    CommitteeResolution: {
        label: "Resolution for Authorized Signatory",
        description: "Resolution from the managing committee.",
        prompt: "This is a committee resolution. No data extraction needed.",
        schema: {}
    },
    TrustRegistration: {
        label: "Trust Registration Certificate",
        description: "Certificate issued by the relevant authority.",
        prompt: "This is a Trust Registration Certificate. No data extraction needed.",
        schema: {}
    },
    TrustPAN: {
        label: "Trust's PAN Card",
        description: "PAN card issued in the name of the Trust.",
        prompt: "Extract trust name and PAN.",
        schema: {
            type: Type.OBJECT,
            properties: {
                trustName: { type: Type.STRING },
                trustPan: { type: Type.STRING },
            }
        }
    },
    TrustDeed: {
        label: "Registered Trust Deed",
        description: "The legal document outlining the trust's objectives.",
        prompt: "This is a Trust Deed. No data extraction needed.",
        schema: {}
    },
    Certificate80G: {
        label: "80G Certificate",
        description: "Certificate for tax exemption on donations.",
        prompt: "This is an 80G Certificate. No data extraction needed.",
        schema: {}
    },
    Certificate12AA: {
        label: "12A/12AA/12AB Certificate",
        description: "Certificate for income tax exemption for the trust.",
        prompt: "This is a 12A/12AA/12AB Certificate. No data extraction needed.",
        schema: {}
    },
    // New Docs
    OwnerPhotoInWorkplace: {
        label: "Photo of Owner Inside Workplace",
        description: "A photo of the proprietor at their place of business.",
        prompt: "This is a photo. No data extraction needed.",
        schema: {}
    },
    ShopBoardPhoto: {
        label: "Shop Board Photo",
        description: "Clear photo of the shop's name board/signage.",
        prompt: "This is a photo. No data extraction needed.",
        schema: {}
    },
    ShopInteriorPhoto: {
        label: "Shop Interior Photo",
        description: "Photo showing the interior of the shop.",
        prompt: "This is a photo. No data extraction needed.",
        schema: {}
    },
    DIN: {
        label: "DIN Details",
        description: "Director Identification Number details, if available.",
        prompt: "This is a DIN document. No data extraction needed.",
        schema: {}
    },
    ITR_Credentials: {
        label: "Income Tax Portal Credentials",
        description: "Securely provide your login details. Your User ID is your PAN.",
        prompt: "This is a credentials document. No data extraction needed.",
        schema: {}
    },
    BankStatement: {
        label: "Bank Statement",
        description: "Upload your bank statement for the relevant period.",
        prompt: "This is a bank statement. No data extraction needed.",
        schema: {}
    },
    // GST Return Docs
    SalesRegister: {
        label: "Sales Register / Invoices",
        description: "Details of all sales made during the period.",
        prompt: "This is a sales register. No data extraction needed.",
        schema: {}
    },
    PurchaseRegister: {
        label: "Purchase Register / Invoices",
        description: "Details of all purchases made during the period.",
        prompt: "This is a purchase register. No data extraction needed.",
        schema: {}
    },
    GST_Credentials: {
        label: "GST Portal Credentials",
        description: "Username and Password for GST Portal access.",
        prompt: "This is a credentials document. No data extraction needed.",
        schema: {}
    },
    // TDS Return Docs
    TANCertificate: {
        label: "TAN Details / TAN Certificate",
        description: "TAN number or TAN allotment/certificate details.",
        prompt: "This is a TAN document. No data extraction needed.",
        schema: {}
    },
    TDSChallans: {
        label: "TDS Challans Paid",
        description: "Paid TDS challans for the return period.",
        prompt: "This is a TDS challan. No data extraction needed.",
        schema: {}
    },
    DeducteeDetails: {
        label: "Deductee Details",
        description: "Deductee-wise PAN, amount paid, TDS deducted and section details.",
        prompt: "This is a deductee detail sheet. No data extraction needed.",
        schema: {}
    },
    PaymentRegister: {
        label: "Payment Register / Expense Ledger",
        description: "Payment details for the relevant TDS return period.",
        prompt: "This is a payment register. No data extraction needed.",
        schema: {}
    },
    NonResidentDeducteeDetails: {
        label: "Non-Resident Deductee Details",
        description: "NRI/non-resident deductee details with payment and tax deduction data.",
        prompt: "This is a non-resident deductee detail sheet. No data extraction needed.",
        schema: {}
    },
    Form15CA15CB: {
        label: "Form 15CA / 15CB",
        description: "Applicable foreign remittance forms or certificate, if available.",
        prompt: "This is a Form 15CA/15CB document. No data extraction needed.",
        schema: {}
    },
    TCSCollectionDetails: {
        label: "TCS Collection Details",
        description: "Buyer/collectee-wise TCS collection details for the return period.",
        prompt: "This is a TCS collection detail sheet. No data extraction needed.",
        schema: {}
    },
    TCSChallans: {
        label: "TCS Challans Paid",
        description: "Paid TCS challans for the return period.",
        prompt: "This is a TCS challan. No data extraction needed.",
        schema: {}
    },
    PreviousTDSReturn: {
        label: "Previous TDS Return",
        description: "Previously filed TDS/TCS return, if available.",
        prompt: "This is a previous TDS return. No data extraction needed.",
        schema: {}
    },
    // Professional Tax Docs
    EmployeeList: {
        label: "Employee List",
        description: "List of employees covered for the filing period.",
        prompt: "This is an employee list. No data extraction needed.",
        schema: {}
    },
    SalaryRegister: {
        label: "Salary Register",
        description: "Salary register for the relevant professional tax period.",
        prompt: "This is a salary register. No data extraction needed.",
        schema: {}
    },
    AttendanceData: {
        label: "Attendance Data",
        description: "Attendance or working day data for employees.",
        prompt: "This is attendance data. No data extraction needed.",
        schema: {}
    },
    PTWorkingSheet: {
        label: "PT Working Sheet",
        description: "Professional tax calculation working sheet.",
        prompt: "This is a PT working sheet. No data extraction needed.",
        schema: {}
    },
    PreviousPTReturn: {
        label: "Previous PT Return",
        description: "Previously filed professional tax return, if available.",
        prompt: "This is a previous PT return. No data extraction needed.",
        schema: {}
    },
    PTChallansPaid: {
        label: "PT Challans Paid",
        description: "Paid professional tax challans for the return period.",
        prompt: "This is a PT challan. No data extraction needed.",
        schema: {}
    },
    PTRCLoginCredentials: {
        label: "PTRC Login Credentials",
        description: "Professional Tax Registration Certificate portal login details.",
        prompt: "This is a credentials document. No data extraction needed.",
        schema: {}
    },
    PayrollReport: {
        label: "Payroll Report",
        description: "Payroll report for the relevant period.",
        prompt: "This is a payroll report. No data extraction needed.",
        schema: {}
    },
    SalaryStructure: {
        label: "Salary Structure",
        description: "Employee salary structure or component breakup.",
        prompt: "This is a salary structure. No data extraction needed.",
        schema: {}
    },
    GSTCertificate: {
        label: "GST Certificate",
        description: "GST registration certificate, if available.",
        prompt: "This is a GST certificate. No data extraction needed.",
        schema: {}
    },
    AuditedFinancialStatements: {
        label: "Audited Financial Statements",
        description: "Signed balance sheet, profit and loss account and schedules.",
        prompt: "This is an audited financial statement. No data extraction needed.",
        schema: {}
    },
    BalanceSheet: {
        label: "Balance Sheet",
        description: "Balance sheet for the relevant financial year.",
        prompt: "This is a balance sheet. No data extraction needed.",
        schema: {}
    },
    ProfitAndLoss: {
        label: "Profit and Loss Statement",
        description: "Profit and loss statement for the relevant financial year.",
        prompt: "This is a profit and loss statement. No data extraction needed.",
        schema: {}
    },
    AuditReport: {
        label: "Auditor Report",
        description: "Auditor report and notes to accounts, if applicable.",
        prompt: "This is an auditor report. No data extraction needed.",
        schema: {}
    },
    BoardReport: {
        label: "Board Report",
        description: "Board report approved by the Board of Directors.",
        prompt: "This is a board report. No data extraction needed.",
        schema: {}
    },
    AGMNotice: {
        label: "AGM Notice",
        description: "Notice of Annual General Meeting.",
        prompt: "This is an AGM notice. No data extraction needed.",
        schema: {}
    },
    AGMMinutes: {
        label: "AGM Minutes",
        description: "Minutes of Annual General Meeting.",
        prompt: "This is AGM minutes. No data extraction needed.",
        schema: {}
    },
    ShareholdingDetails: {
        label: "Shareholding Details",
        description: "Shareholding pattern, member list and share transfer details.",
        prompt: "This is shareholding data. No data extraction needed.",
        schema: {}
    },
    DirectorDetails: {
        label: "Director Details",
        description: "Director list, DIN details and appointment/resignation details.",
        prompt: "This is director details. No data extraction needed.",
        schema: {}
    },
    DirectorKycDetails: {
        label: "Director KYC Details",
        description: "DIN, personal details, mobile number and email for director KYC.",
        prompt: "This is director KYC information. No data extraction needed.",
        schema: {}
    },
    DIR3Declaration: {
        label: "DIR-3 Declaration / Consent",
        description: "Declaration, consent and supporting papers for DIN application.",
        prompt: "This is DIR-3 declaration documentation. No data extraction needed.",
        schema: {}
    },
    AddressProof: {
        label: "Address Proof",
        description: "Latest residential address proof of the director.",
        prompt: "This is address proof. No data extraction needed.",
        schema: {}
    },
    MobileEmailOtpProof: {
        label: "Mobile / Email OTP Confirmation",
        description: "Mobile and email confirmation details for DIR-3 KYC.",
        prompt: "This is OTP confirmation information. No data extraction needed.",
        schema: {}
    },
    MGT8Certificate: {
        label: "MGT-8 Certificate",
        description: "Practicing professional certificate, where applicable.",
        prompt: "This is an MGT-8 certificate. No data extraction needed.",
        schema: {}
    },
    ADT1Consent: {
        label: "Auditor Consent and Eligibility",
        description: "Auditor consent letter, eligibility certificate and appointment details.",
        prompt: "This is auditor consent documentation. No data extraction needed.",
        schema: {}
    },
    CommencementDeclaration: {
        label: "Commencement Declaration",
        description: "Declaration and supporting documents for INC-20A.",
        prompt: "This is commencement declaration documentation. No data extraction needed.",
        schema: {}
    },
    BankProofCapital: {
        label: "Bank Proof of Capital Receipt",
        description: "Bank statement or proof showing subscription money received.",
        prompt: "This is capital receipt bank proof. No data extraction needed.",
        schema: {}
    },
    AllotmentList: {
        label: "Allotment List",
        description: "List of allottees and share allotment details.",
        prompt: "This is allotment data. No data extraction needed.",
        schema: {}
    },
    ValuationReport: {
        label: "Valuation Report",
        description: "Valuation report, if applicable for the issue.",
        prompt: "This is a valuation report. No data extraction needed.",
        schema: {}
    },
    LLPPartnerDetails: {
        label: "Partner / Designated Partner Details",
        description: "Partner list, DPIN/DIN, contribution, appointment and resignation details.",
        prompt: "This is LLP partner detail data. No data extraction needed.",
        schema: {}
    },
    LLPCapitalContribution: {
        label: "Contribution and Profit Sharing Details",
        description: "Partner-wise capital contribution and profit sharing ratio details.",
        prompt: "This is LLP contribution data. No data extraction needed.",
        schema: {}
    },
    LLPSolvencyStatement: {
        label: "Statement of Solvency",
        description: "Solvency declaration or supporting statement for Form 8 filing.",
        prompt: "This is an LLP solvency statement. No data extraction needed.",
        schema: {}
    },
    LLPFinancialStatements: {
        label: "LLP Financial Statements",
        description: "Signed financial statements, schedules and notes for the financial year.",
        prompt: "This is LLP financial statement data. No data extraction needed.",
        schema: {}
    },
    DesignatedPartnerDSC: {
        label: "Designated Partner DSC Details",
        description: "Digital signature details of designated partner authorized for MCA filing.",
        prompt: "This is DSC information. No data extraction needed.",
        schema: {}
    },
    PreviousLLPFiling: {
        label: "Previous LLP Filing Acknowledgement",
        description: "Previous Form 8, Form 11 or MCA acknowledgement, if available.",
        prompt: "This is a previous LLP filing acknowledgement. No data extraction needed.",
        schema: {}
    }
};

export const serviceDocuments: Record<string, any> = {
    'gst-registration': {
        proprietorship: {
            required: ['Aadhaar', 'PAN', 'Photo', 'Signature', 'BankProof', 'ElectricityBill', 'NOC', 'ShopActLicense'],
            optional: ['RentAgreement']
        },
        partnership: {
            required: ['PartnershipDeed', 'FirmPAN', 'AuthorizationLetter', 'ElectricityBill', 'NOC'],
            optional: ['RentAgreement'],
            individual: { label: 'Partner', documents: ['Aadhaar', 'PAN', 'Photo'] }
        },
        llp: {
            required: ['IncorporationCertificate', 'LLPAgreement', 'LLPPAN', 'AuthorizationLetter', 'ElectricityBill', 'NOC'],
            optional: ['RentAgreement'],
            individual: { label: 'Designated Partner', documents: ['Aadhaar', 'PAN', 'Photo'] }
        },
        private_limited: {
            required: ['IncorporationCertificate', 'CompanyPAN', 'MOA', 'AOA', 'BoardResolution', 'ElectricityBill', 'NOC'],
            optional: ['RentAgreement'],
            individual: { label: 'Director', documents: ['Aadhaar', 'PAN', 'Photo'] }
        },
        huf: {
            required: ['HUFPAN', 'Aadhaar', 'PAN', 'Photo', 'HUFDeclaration', 'BankProof', 'ElectricityBill', 'NOC'],
            optional: ['RentAgreement']
        },
        society: {
            required: ['SocietyRegistration', 'SocietyPAN', 'CommitteeResolution', 'ElectricityBill', 'NOC'],
            optional: ['RentAgreement'],
            individual: { label: 'Committee Member', documents: ['Aadhaar', 'PAN', 'Photo'] }
        },
        trust: {
            required: ['TrustRegistration', 'TrustPAN', 'TrustDeed', 'CommitteeResolution', 'Certificate80G', 'Certificate12AA', 'ElectricityBill', 'NOC'],
            optional: ['RentAgreement'],
            individual: { label: 'Trustee', documents: ['Aadhaar', 'PAN', 'Photo'] }
        }
    },
    'gst-return': {
        required: ['SalesRegister', 'PurchaseRegister', 'GST_Credentials'],
        optional: ['BankStatement']
    },
    'tds-form-24q': {
        groups: [
            {
                title: "Deductor Details",
                required: ['TANCertificate']
            },
            {
                title: "Employee & Salary Data",
                required: ['EmployeeList', 'SalaryRegister']
            },
            {
                title: "Tax Data",
                required: ['TDSChallans'],
                optional: ['PreviousTDSReturn']
            }
        ]
    },
    'tds-form-26q': {
        groups: [
            {
                title: "Deductor Details",
                required: ['TANCertificate']
            },
            {
                title: "Deductee & Payment Data",
                required: ['DeducteeDetails', 'PaymentRegister']
            },
            {
                title: "Tax Data",
                required: ['TDSChallans'],
                optional: ['PreviousTDSReturn']
            }
        ]
    },
    'tds-form-27q': {
        groups: [
            {
                title: "Deductor Details",
                required: ['TANCertificate']
            },
            {
                title: "Non-Resident Payment Data",
                required: ['NonResidentDeducteeDetails', 'PaymentRegister']
            },
            {
                title: "Tax Data",
                required: ['TDSChallans'],
                optional: ['Form15CA15CB', 'PreviousTDSReturn']
            }
        ]
    },
    'tds-form-27eq': {
        groups: [
            {
                title: "Collector Details",
                required: ['TANCertificate']
            },
            {
                title: "TCS Data",
                required: ['TCSCollectionDetails', 'TCSChallans'],
                optional: ['PreviousTDSReturn']
            }
        ]
    },
    'udyam-registration': {
        proprietorship: {
            required: ['Aadhaar', 'PAN', 'BankProof', 'ElectricityBill', 'ShopActLicense'],
            optional: ['RentAgreement', 'NOC']
        },
        partnership: {
            required: ['Aadhaar', 'PAN', 'BankProof', 'ElectricityBill', 'ShopActLicense', 'PartnershipDeed'],
            optional: ['RentAgreement', 'NOC']
        },
        llp: {
            required: ['Aadhaar', 'PAN', 'BankProof', 'ElectricityBill', 'ShopActLicense', 'IncorporationCertificate', 'LLPAgreement'],
            optional: ['RentAgreement', 'NOC']
        },
        private_limited: {
            required: ['Aadhaar', 'PAN', 'BankProof', 'ElectricityBill', 'ShopActLicense', 'IncorporationCertificate', 'MOA', 'AOA'],
            optional: ['RentAgreement', 'NOC']
        },
        huf: {
            required: ['HUFPAN', 'Aadhaar', 'PAN', 'BankProof', 'ElectricityBill', 'ShopActLicense', 'HUFDeclaration'],
            optional: ['RentAgreement', 'NOC']
        },
        society: {
            required: ['SocietyPAN', 'Aadhaar', 'PAN', 'BankProof', 'ElectricityBill', 'ShopActLicense', 'SocietyRegistration'],
            optional: ['RentAgreement', 'NOC']
        },
        trust: {
            required: ['TrustPAN', 'Aadhaar', 'PAN', 'BankProof', 'ElectricityBill', 'ShopActLicense', 'TrustRegistration', 'TrustDeed'],
            optional: ['RentAgreement', 'NOC']
        }
    },
    'shop-act': {
        proprietorship: {
            required: ['Aadhaar', 'PAN', 'Photo', 'Signature', 'ElectricityBill', 'OwnerPhotoInWorkplace', 'ShopBoardPhoto', 'ShopInteriorPhoto', 'BankProof'],
            optional: ['RentAgreement', 'NOC']
        },
        partnership: {
            required: ['Aadhaar', 'PAN', 'Photo', 'Signature', 'ElectricityBill', 'OwnerPhotoInWorkplace', 'ShopBoardPhoto', 'ShopInteriorPhoto', 'BankProof', 'PartnershipDeed'],
            optional: ['RentAgreement', 'NOC']
        },
        llp: {
            required: ['Aadhaar', 'PAN', 'Photo', 'Signature', 'ElectricityBill', 'OwnerPhotoInWorkplace', 'ShopBoardPhoto', 'ShopInteriorPhoto', 'BankProof', 'IncorporationCertificate', 'LLPAgreement'],
            optional: ['RentAgreement', 'NOC']
        },
        private_limited: {
            required: ['Aadhaar', 'PAN', 'Photo', 'Signature', 'ElectricityBill', 'OwnerPhotoInWorkplace', 'ShopBoardPhoto', 'ShopInteriorPhoto', 'BankProof', 'IncorporationCertificate', 'MOA', 'AOA'],
            optional: ['RentAgreement', 'NOC']
        }
    },
    'company-incorporation': {
        groups: [
            {
                title: "Documents for each Director",
                individual: { label: 'Director', documents: ['Aadhaar', 'PAN', 'Photo', 'Signature'] }
            },
            {
                title: "Documents for Registered Office",
                required: ['ElectricityBill', 'NOC'],
                optional: ['RentAgreement']
            }
        ]
    },
    'roc-aoc-4': {
        groups: [
            {
                title: "Financial Statements",
                required: ['AuditedFinancialStatements', 'BalanceSheet', 'ProfitAndLoss']
            },
            {
                title: "Audit and Board Documents",
                required: ['AuditReport', 'BoardReport', 'BoardResolution'],
                optional: ['AGMNotice', 'AGMMinutes']
            }
        ]
    },
    'roc-mgt-7': {
        groups: [
            {
                title: "Annual Return Data",
                required: ['ShareholdingDetails', 'DirectorDetails']
            },
            {
                title: "Meeting and Approval Documents",
                required: ['AGMNotice', 'AGMMinutes', 'BoardResolution'],
                optional: ['MGT8Certificate']
            }
        ]
    },
    'roc-mgt-7a': {
        groups: [
            {
                title: "Small Company / OPC Annual Return",
                required: ['ShareholdingDetails', 'DirectorDetails', 'AGMMinutes'],
                optional: ['BoardResolution']
            }
        ]
    },
    'roc-adt-1': {
        groups: [
            {
                title: "Auditor Appointment",
                required: ['ADT1Consent', 'BoardResolution'],
                optional: ['AGMMinutes']
            }
        ]
    },
    'roc-inc-20a': {
        groups: [
            {
                title: "Commencement of Business",
                required: ['CommencementDeclaration', 'BankProofCapital', 'BoardResolution'],
                optional: ['BankStatement']
            }
        ]
    },
    'roc-dir-12': {
        groups: [
            {
                title: "Director Change Filing",
                required: ['DirectorDetails', 'BoardResolution', 'PAN', 'Aadhaar'],
                optional: ['Photo']
            }
        ]
    },
    'roc-dir-3': {
        groups: [
            {
                title: "DIN Application",
                required: ['PAN', 'Aadhaar', 'Photo', 'AddressProof', 'DIR3Declaration'],
                optional: ['BoardResolution']
            }
        ]
    },
    'roc-dir-3-kyc': {
        groups: [
            {
                title: "Director KYC Filing",
                required: ['DirectorKycDetails', 'PAN', 'Aadhaar', 'AddressProof', 'MobileEmailOtpProof'],
                optional: ['Photo']
            }
        ]
    },
    'roc-pas-3': {
        groups: [
            {
                title: "Share Allotment Filing",
                required: ['AllotmentList', 'BoardResolution', 'ShareholdingDetails'],
                optional: ['ValuationReport', 'BankProofCapital']
            }
        ]
    },
    'llp-annual-package': {
        groups: [
            {
                title: "LLP Master Documents",
                required: ['IncorporationCertificate', 'LLPPAN', 'LLPAgreement']
            },
            {
                title: "Form 11 - Annual Return",
                required: ['LLPPartnerDetails', 'LLPCapitalContribution', 'DesignatedPartnerDSC'],
                optional: ['PreviousLLPFiling']
            },
            {
                title: "Form 8 - Statement of Account and Solvency",
                required: ['LLPFinancialStatements', 'BalanceSheet', 'ProfitAndLoss', 'LLPSolvencyStatement'],
                optional: ['BankStatement', 'AuditReport']
            }
        ]
    },
    'llp-form-11': {
        groups: [
            {
                title: "LLP Master Documents",
                required: ['IncorporationCertificate', 'LLPPAN', 'LLPAgreement']
            },
            {
                title: "Annual Return Data",
                required: ['LLPPartnerDetails', 'LLPCapitalContribution', 'DesignatedPartnerDSC'],
                optional: ['PreviousLLPFiling']
            }
        ]
    },
    'llp-form-8': {
        groups: [
            {
                title: "LLP Master Documents",
                required: ['IncorporationCertificate', 'LLPPAN', 'LLPAgreement']
            },
            {
                title: "Financial Statements and Solvency",
                required: ['LLPFinancialStatements', 'BalanceSheet', 'ProfitAndLoss', 'LLPSolvencyStatement'],
                optional: ['BankStatement', 'AuditReport', 'PreviousLLPFiling']
            }
        ]
    },
    'itr-filing': {
        individual_salaried: {
            required: ['ITR_Credentials', 'BankStatement'],
            optional: []
        },
        business_proprietorship: {
            required: ['ITR_Credentials', 'BankStatement'],
            optional: []
        }
    },
    'pt-registration': {
        proprietorship: {
            required: ['PAN', 'Aadhaar', 'Photo', 'Signature', 'ElectricityBill', 'NOC', 'ShopActLicense', 'BankProof'],
            optional: ['RentAgreement']
        },
        partnership: {
            required: ['PAN', 'Aadhaar', 'Photo', 'Signature', 'ElectricityBill', 'NOC', 'ShopActLicense', 'BankProof', 'PartnershipDeed'],
            optional: ['RentAgreement']
        },
        llp: {
            required: ['PAN', 'Aadhaar', 'Photo', 'Signature', 'ElectricityBill', 'NOC', 'ShopActLicense', 'BankProof', 'IncorporationCertificate', 'LLPAgreement'],
            optional: ['RentAgreement']
        },
        private_limited: {
            required: ['PAN', 'Aadhaar', 'Photo', 'Signature', 'ElectricityBill', 'NOC', 'ShopActLicense', 'BankProof', 'IncorporationCertificate', 'MOA', 'AOA', 'BoardResolution'],
            optional: ['RentAgreement']
        }
    },
    'pt-return-filing': {
        groups: [
            {
                title: "Employee Data",
                required: ['EmployeeList', 'SalaryRegister', 'AttendanceData']
            },
            {
                title: "Tax Data",
                required: ['PTWorkingSheet', 'PreviousPTReturn', 'PTChallansPaid']
            },
            {
                title: "Business Details",
                required: ['PTRCLoginCredentials']
            },
            {
                title: "Optional",
                optional: ['PayrollReport', 'SalaryStructure']
            }
        ]
    },
    'pt-enrollment': {
        required: ['PAN', 'Aadhaar', 'ElectricityBill', 'Photo'],
        optional: ['GSTCertificate']
    },
    'huf-deed-creation': {
        groups: [
            {
                title: "Karta and HUF Details",
                required: ['Aadhaar', 'PAN', 'AddressProof'],
                optional: ['HUFPAN', 'BankProof']
            },
            {
                title: "Deed Inputs",
                required: ['HUFMemberDetails'],
                optional: ['HUFAssetDetails']
            },
            {
                title: "Member KYC",
                individual: { label: 'HUF Member', documents: ['Aadhaar', 'PAN'] }
            }
        ]
    },
    'huf-deed-change': {
        groups: [
            {
                title: "Existing HUF Records",
                required: ['HUFDeclaration', 'HUFChangeRequest', 'Aadhaar', 'PAN'],
                optional: ['HUFPAN', 'BankProof']
            },
            {
                title: "Updated Member / Asset Details",
                optional: ['HUFMemberDetails', 'HUFAssetDetails']
            },
            {
                title: "Affected Member KYC",
                individual: { label: 'Affected Member', documents: ['Aadhaar', 'PAN'] }
            }
        ]
    }
};
