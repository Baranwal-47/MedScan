// types/Order.ts
export interface OrderItem {
  medicine: {
    _id: string;
    name: string;
    price: string;
    image_url: string;
    composition: string;
    manufacturer: string;
  };
  quantity: number;
  price: string;
  prescriptionRequired: boolean;
}

export interface ShippingAddress {
  name: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
}

export interface Order {
  _id: string;
  orderNumber: string;
  user: {
    _id: string;
    name: string;
    email: string;
    phone?: string;
  };
  items: OrderItem[];
  totalAmount: number;
  status: 'pending_approval' | 'confirmed' | 'shipped' | 'out_for_delivery' | 'delivered' | 'cancelled';
  prescriptionRequired: boolean;
  doctorName?: string;
  shippingAddress: ShippingAddress;
  paymentStatus: 'pending' | 'completed' | 'failed';
  paymentMethod: 'card' | 'upi' | 'cod';
  orderDate: string;
  estimatedDelivery: string;
  createdAt: string;
  updatedAt: string;
}
