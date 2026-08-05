package handler

import (
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/gin-gonic/gin"
)

func TestCreateOrderRejectsMissingAddress(t *testing.T) {
	gin.SetMode(gin.TestMode)

	r := gin.New()
	r.POST("/orders", createOrder(nil, testCodec(t)))

	req := httptest.NewRequest(http.MethodPost, "/orders", strings.NewReader(`{"payment_method":"BCA","ship_method":"JNE Reguler"}`))
	req.Header.Set("Content-Type", "application/json")

	rec := httptest.NewRecorder()
	r.ServeHTTP(rec, req)

	if rec.Code != http.StatusBadRequest {
		t.Errorf("status = %d, want %d", rec.Code, http.StatusBadRequest)
	}

	if got := rec.Header().Get("Content-Type"); got != "application/problem+json; charset=utf-8" {
		t.Errorf("Content-Type = %q, want application/problem+json; charset=utf-8", got)
	}
}
