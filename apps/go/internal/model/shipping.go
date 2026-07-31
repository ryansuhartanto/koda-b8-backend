package model

type ShippingMethod struct {
	ID      int64  `json:"id" binding:"required"`
	Name    string `json:"name" binding:"required"`
	CostIdr int64  `json:"cost_idr" binding:"required"`
} // @name ShippingMethod
