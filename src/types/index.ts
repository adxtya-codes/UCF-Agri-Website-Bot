export interface User {
    phone: string;
    name: string;
    email?: string;
    is_premium: boolean;
    premium_expiry_date?: string;
    conversation_state?: string;
    location?: {
        latitude?: number;
        longitude?: number;
    };
    last_interaction?: string;
    phone_numeric?: string;
}

export interface Receipt {
    id?: string;
    phone: string;
    retailer_name: string;
    purchase_date: string;
    ucf_products: string[];
    total_amount: number;
    hash: string;
    verified_at?: string;
    status?: 'pending' | 'approved' | 'rejected' | 'on_hold';
    rejection_reason?: string;
    image?: string;
}

export interface Product {
    id: string;
    name: string;
    composition: {
        N: number;
        P: number;
        K: number;
    };
    description: string;
    function: string[];
    crop_usage: string[];
    benefits: string[];
    soil_type: string;
    application_timing: string;
}

export interface Shop {
    id: string;
    name: string;
    address: string;
    phone: string;
    email?: string;
    owner: string;
    timing: string;
    latitude: number;
    longitude: number;
}

export interface Tip {
    id: string;
    title: string;
    content: string;
    created_at: string;
    send_date?: string; // Date when tip will be sent
    send_time?: string; // Time when tip will be sent (HH:MM format)
    image_url?: string;
}

export interface ExclusivePDF {
    id: number;
    title: string;
    description: string;
    filename: string;
    url: string;
    category: string;
    size: string;
    pages: number;
    created_date: string;
}

export interface FertilizerCalc {
    crop: string;
    compound_at_planting: string;
    rate_at_planting: string;
    compound_top_dressing: string | null;
    rate_top_dressing: string;
    timing: string;
    remarks: string;
}

export interface CropDiagnosis {
    id?: string;
    phone: string;
    created_at: string;
    image: string;
    diagnosis?: string;
    status?: 'pending' | 'diagnosed' | 'on_hold';
}

export interface SoilAnalysis {
    id?: string;
    phone: string;
    created_at: string;
    image: string;
    analysis?: string;
    status?: 'pending' | 'analyzed' | 'on_hold';
    ph?: number;
    nitrogen?: string;
    phosphorus?: string;
    potassium?: string;
    recommendations?: string;
}
