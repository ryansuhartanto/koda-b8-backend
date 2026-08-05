target "tools-meta" {}

target "go-meta" {}

target "js-meta" {}

group "default" {
  targets = ["tools", "go", "js"]
}

target "tools" {
  inherits = ["tools-meta"]
  target   = "tools"
}

target "go" {
  inherits = ["go-meta"]
  target   = "go"
}

target "js" {
  inherits = ["js-meta"]
  target   = "js"
}
