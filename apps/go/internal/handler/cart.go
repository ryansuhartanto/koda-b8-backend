package handler

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/ryansuhartanto/koda-b8-backend/apps/go/internal/middleware"
	"github.com/ryansuhartanto/koda-b8-backend/apps/go/internal/model"
	"github.com/ryansuhartanto/koda-b8-backend/apps/go/internal/repository"
)

func Cart(r *gin.Engine, pool *pgxpool.Pool) {
	r.GET("/cart", middleware.Auth(), listCart(pool))
	r.POST("/cart", middleware.Auth(), setCartItem(pool))
	r.DELETE("/cart/:id_product", middleware.Auth(), deleteCartItem(pool))
}

// listCart godoc
// @Summary  List the caller's cart
// @Tags     cart
// @Produce  json
// @Security BearerAuth
// @Success  200 {array}  model.CartItem "OK"
// @Failure  401 {object} model.Problem  "Missing or invalid token"
// @Failure  500 {object} model.Problem  "Internal error"
// @Router   /cart [get]
func listCart(pool *pgxpool.Pool) gin.HandlerFunc {
	return func(ctx *gin.Context) {
		items, err := repository.CartItems(ctx, pool, ctx.GetInt64(middleware.ContextIDUser))
		if err != nil {
			model.AbortProblem(ctx, http.StatusInternalServerError, err.Error())
			return
		}

		model.JSON(ctx, http.StatusOK, items)
	}
}

// setCartItem godoc
// @Summary  Set the quantity of one cart line
// @Tags     cart
// @Produce  json
// @Security BearerAuth
// @Param    body body model.CartRequest true "Line"
// @Success  204 "No Content"
// @Failure  400 {object} model.Problem "Invalid body"
// @Failure  401 {object} model.Problem "Missing or invalid token"
// @Failure  404 {object} model.Problem "No such product"
// @Failure  500 {object} model.Problem "Internal error"
// @Router   /cart [post]
func setCartItem(pool *pgxpool.Pool) gin.HandlerFunc {
	return func(ctx *gin.Context) {
		var req model.CartRequest
		if err := ctx.ShouldBindJSON(&req); err != nil {
			model.AbortProblem(ctx, http.StatusBadRequest, err.Error())
			return
		}

		found, err := repository.SetCartItem(ctx, pool,
			ctx.GetInt64(middleware.ContextIDUser), req.IDProduct, req.Quantity)
		if err != nil {
			model.AbortProblem(ctx, http.StatusInternalServerError, err.Error())
			return
		}

		if !found {
			model.AbortProblem(ctx, http.StatusNotFound, "no such product")
			return
		}

		ctx.Status(http.StatusNoContent)
	}
}

// deleteCartItem godoc
// @Summary  Remove one product from the cart
// @Tags     cart
// @Produce  json
// @Security BearerAuth
// @Param    id_product path int true "Product id"
// @Success  204 "No Content"
// @Failure  400 {object} model.Problem "Invalid product id"
// @Failure  401 {object} model.Problem "Missing or invalid token"
// @Failure  500 {object} model.Problem "Internal error"
// @Router   /cart/{id_product} [delete]
func deleteCartItem(pool *pgxpool.Pool) gin.HandlerFunc {
	return func(ctx *gin.Context) {
		idProduct, err := strconv.ParseInt(ctx.Param("id_product"), 10, 64)
		if err != nil {
			model.AbortProblem(ctx, http.StatusBadRequest, "id_product must be an integer")
			return
		}

		// no 404 branch, because DELETE is idempotent
		if err := repository.DeleteCartItem(ctx, pool, ctx.GetInt64(middleware.ContextIDUser), idProduct); err != nil {
			model.AbortProblem(ctx, http.StatusInternalServerError, err.Error())
			return
		}

		ctx.Status(http.StatusNoContent)
	}
}
