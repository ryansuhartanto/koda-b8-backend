package handler

import (
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/gin-gonic/gin"
)

func TestSetCartItemRejectsZeroQuantity(t *testing.T) {
	gin.SetMode(gin.TestMode)

	r := gin.New()
	// binding fails before the pool is touched, so a nil pool never gets dereferenced
	r.POST("/cart", setCartItem(nil))

	req := httptest.NewRequest(http.MethodPost, "/cart", strings.NewReader(`{"id_product":1,"quantity":0}`))
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
