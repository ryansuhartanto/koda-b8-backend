package model

type Product struct {
	ID               int64    `json:"id" binding:"required"`
	Slug             string   `json:"slug" binding:"required"`
	Name             string   `json:"name" binding:"required"`
	Brand            string   `json:"brand" binding:"required"`
	Category         string   `json:"category" binding:"required"`
	Img              string   `json:"img" binding:"required"`
	Summary          string   `json:"summary" binding:"required"`
	PriceIdr         int64    `json:"price_idr" binding:"required"`
	OriginalPriceIdr int64    `json:"original_price_idr" binding:"required"`
	Stock            int      `json:"stock" binding:"required"`
	Rating           float64  `json:"rating" binding:"required"`
	RatingCount      int      `json:"rating_count" binding:"required"`
	Tags             []string `json:"tags" binding:"required"`
} // @name Product
