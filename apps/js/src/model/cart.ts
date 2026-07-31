export type CartItem = {
	id_product: number;
	slug: string;
	name: string;
	img: string;
	price_idr: number;
	quantity: number;
};

export type CartRequest = {
	id_product: number;
	quantity: number;
};
