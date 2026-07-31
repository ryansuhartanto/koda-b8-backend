export type Product = {
	id: number;
	slug: string;
	name: string;
	brand: string;
	category: string;
	img: string;
	summary: string;
	price_idr: number;
	original_price_idr: number;
	stock: number;
	rating: number;
	rating_count: number;
	tags: string[];
};
