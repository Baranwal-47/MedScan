// types/Cart.ts
export interface CartItem {
  medicine: {
    _id: string;
    name: string;
    price: string;
    image_url: string;
    prescriptionRequired: boolean;
    composition: string;
    manufacturer: string;
  };
  quantity: number;
  price: string;
}

export interface Cart {
  _id: string;
  user: string;
  items: CartItem[];
  totalAmount: number;
}

