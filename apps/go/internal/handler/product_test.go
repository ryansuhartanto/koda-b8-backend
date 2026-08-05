package handler

import (
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"

	"github.com/ryansuhartanto/koda-b8-backend/apps/go/internal/sqid"
)

const testAlphabet = "k3G7QAe51FfL2rl4wRxyOzZbnucItJ8hgSpEmvNiHqKMWXdVaCDBjT0YoU6P9s"

func testCodec(t *testing.T) *sqid.Codec {
	t.Helper()

	c, err := sqid.New(testAlphabet)
	if err != nil {
		t.Fatal(err)
	}

	return c
}

func TestListProductsRejectsUnknownSort(t *testing.T) {
	gin.SetMode(gin.TestMode)

	r := gin.New()
	r.GET("/products", listProducts(nil, testCodec(t)))

	rec := httptest.NewRecorder()
	r.ServeHTTP(rec, httptest.NewRequest(http.MethodGet, "/products?sort=bogus", nil))

	if rec.Code != http.StatusBadRequest {
		t.Errorf("status = %d, want %d", rec.Code, http.StatusBadRequest)
	}

	if got := rec.Header().Get("Content-Type"); got != "application/problem+json; charset=utf-8" {
		t.Errorf("Content-Type = %q, want application/problem+json; charset=utf-8", got)
	}
}

func TestProductBySqidRejectsMalformed(t *testing.T) {
	gin.SetMode(gin.TestMode)

	codec := testCodec(t)

	r := gin.New()
	Product(r, nil, codec)

	valid, err := codec.Encode(1)
	if err != nil {
		t.Fatal(err)
	}

	for name, path := range map[string]string{
		"out of alphabet": "/products/!!!!!!",
		"too short":       "/products/a",
		"non-canonical":   "/products/" + testAlphabet[:1] + valid,
		"with a slug":     "/products/!!!!!!/kaos-polos",
	} {
		rec := httptest.NewRecorder()
		r.ServeHTTP(rec, httptest.NewRequest(http.MethodGet, path, nil))

		if rec.Code != http.StatusNotFound {
			t.Errorf("%s: status = %d, want %d", name, rec.Code, http.StatusNotFound)
		}

		if got := rec.Header().Get("Content-Type"); got != "application/problem+json; charset=utf-8" {
			t.Errorf("%s: Content-Type = %q, want application/problem+json; charset=utf-8", name, got)
		}
	}
}

func TestProductRoutesBothShapes(t *testing.T) {
	gin.SetMode(gin.TestMode)

	r := gin.New()
	Product(r, nil, testCodec(t))

	routes := map[string]bool{}
	for _, route := range r.Routes() {
		routes[route.Path] = true
	}

	for _, want := range []string{"/products", "/products/:sqid", "/products/:sqid/*slug"} {
		if !routes[want] {
			t.Errorf("route %q not registered", want)
		}
	}
}
