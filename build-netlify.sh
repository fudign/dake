#!/bin/bash
cp index.html index.html.backup
sed -i '
/<link/ {
  s|href="/_next/|href="_next/|g
  s|href="/icon|href="icon|g
  s|href="/apple-icon|href="apple-icon|g
  s|href="/images/|href="images/|g
}
/<script[^>]*src=/ {
  s|src="/_next/|src="_next/|g
}
/<img/ {
  s|src="/images/|src="images/|g
  s|srcSet="/images/|srcSet="images/|g
  s|src="/flowers/|src="flowers/|g
  s|srcSet="/flowers/|srcSet="flowers/|g
}
/<audio/ {
  s|src="/audio/|src="audio/|g
}
' index.html
echo "Build complete"
