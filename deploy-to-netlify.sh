#!/bin/bash

echo "=== DEPLOYING TO NETLIFY ==="

# Step 1: Create backup of current working version
echo "1. Creating backup..."
cp index.html index.html.local-backup

# Step 2: Convert paths for Netlify (relative paths)
echo "2. Converting paths to relative for Netlify..."
sed -i '
/<link/ {
  s|href="/_next/|href="_next/|g
  s|href="/icon|href="icon|g
  s|href="/apple-icon|href="apple-icon|g
  s|href="/images/|href="images/|g
  s|imageSrcSet="/images/|imageSrcSet="images/|g
  s|imageSrcSet="/flowers/|imageSrcSet="flowers/|g
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

# Step 3: Also fix the inline style with CSS url()
echo "3. Fixing envelope texture path..."
sed -i "s|url('/images/envelope-paper.webp|url('images/envelope-paper.webp|g" index.html

# Step 4: Git commit and push
echo "4. Committing changes..."
git add -A
git commit -m "Deploy: Convert paths for Netlify hosting"

echo "5. Pushing to GitHub..."
GIT_SSH_COMMAND='ssh -i ~/.ssh/github_fudign -o IdentitiesOnly=yes' git push origin main

echo ""
echo "=== DEPLOYMENT COMPLETE ==="
echo "Netlify will auto-deploy in ~30 seconds"
echo "Check: https://priglashenie-daniyar-aziza.netlify.app/"
echo ""
echo "To restore local version for testing:"
echo "  cp index.html.local-backup index.html"
