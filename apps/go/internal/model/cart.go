package model

type CartItem struct {
	IDProduct int64  `json:"id_product" binding:"required"`
	Slug      string `json:"slug" binding:"required"`
	Name      string `json:"name" binding:"required"`
	Img       string `json:"img" binding:"required"`
	PriceIdr  int64  `json:"price_idr" binding:"required"`
	Quantity  int    `json:"quantity" binding:"required"`
} // @name CartItem

type CartRequest struct {
	IDProduct int64 `json:"id_product" binding:"required"`
	Quantity  int   `json:"quantity" binding:"required,min=1"`
} // @name CartRequest
