
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
    }
};
