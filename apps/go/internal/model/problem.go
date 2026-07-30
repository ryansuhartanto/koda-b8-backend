package model

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

// RFC 9457 application/problem+json
type Problem struct {
	Title  string `json:"title" binding:"required"`
	Status int    `json:"status" binding:"required"`
	Detail string `json:"detail,omitempty"`
} // @name Problem

func AbortProblem(ctx *gin.Context, status int, detail string) {
	ctx.Header("Content-Type", "application/problem+json")
	ctx.AbortWithStatusJSON(status, &Problem{
		Title:  http.StatusText(status),
		Status: status,
		Detail: detail,
	})
}
