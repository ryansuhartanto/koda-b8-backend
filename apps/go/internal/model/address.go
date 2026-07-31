package model

type Address struct {
	ID         int64  `json:"id" binding:"required"`
	Label      string `json:"label" binding:"required"`
	Name       string `json:"name" binding:"required"`
	Phone      string `json:"phone" binding:"required"`
	Address    string `json:"address" binding:"required"`
	City       string `json:"city" binding:"required"`
	Province   string `json:"province" binding:"required"`
	PostalCode string `json:"postal_code" binding:"required"`
	IsDefault  bool   `json:"is_default" binding:"required"`
} // @name Address

type AddressRequest struct {
	Label      string `json:"label" binding:"required"`
	Name       string `json:"name" binding:"required"`
	Phone      string `json:"phone" binding:"required"`
	Address    string `json:"address" binding:"required"`
	City       string `json:"city" binding:"required"`
	Province   string `json:"province" binding:"required"`
	PostalCode string `json:"postal_code" binding:"required"`
	IsDefault  bool   `json:"is_default"`
} // @name AddressRequest
