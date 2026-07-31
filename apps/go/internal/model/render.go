package model

import (
	"bytes"
	"encoding/json"
	"net/http"

	"github.com/gin-gonic/gin"
)

// gin's JSON escapes &, < and >, and its PureJSON trails a newline; JSON.stringify on the
// JS side does neither, and nothing in the spec test can see the difference
func render(ctx *gin.Context, status int, contentType string, data any) {
	buf := bytes.Buffer{}
	encoder := json.NewEncoder(&buf)
	encoder.SetEscapeHTML(false)

	if err := encoder.Encode(data); err != nil {
		ctx.AbortWithStatus(http.StatusInternalServerError)
		return
	}

	ctx.Data(status, contentType, bytes.TrimSuffix(buf.Bytes(), []byte("\n")))
}

func JSON(ctx *gin.Context, status int, data any) {
	render(ctx, status, "application/json; charset=utf-8", data)
}
