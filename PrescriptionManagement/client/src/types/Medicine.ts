export interface Medicine {
  _id: string;
  name: string;
  link: string;
  letter: string;
  manufacturer: string;
  image_url: string;
  description: string;
  uses: string;
  side_effects: string;
  composition: string;
  quick_tips: string;
  price: string;
  prescriptionRequired: boolean; 
  scraped_at: string;
  createdAt: string;
  updatedAt: string;
}

export interface MedicineResponse {
  success: boolean;
  data: Medicine[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalCount: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface MedicineDetailResponse {
  success: boolean;
  data: Medicine;
}
