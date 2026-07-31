export type OrderItem = {
	id: number;
	id_product: number;
	product_name: string;
	unit_price_idr: number;
	quantity: number;
};

export type Order = {
	id: number;
	created_at: string;
	status: string;
	payment_method: string;
	promo_code: string;
	discount_idr: number;
	subtotal_idr: number;
	ship_cost_idr: number;
	total_idr: number;
	ship_name: string;
	ship_phone: string;
	ship_email: string;
	ship_address: string;
	ship_city: string;
	ship_province: string;
	ship_postal_code: string;
	ship_method: string;
	ship_note: string;
	items: OrderItem[];
};

export type OrderRequest = {
	id_address: number;
	payment_method: string;
	ship_method: string;
	promo_code: string;
	ship_note: string;
};
