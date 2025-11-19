# Push Project to GitHub

## Step 1: Add MP4 to .gitignore

```bash
cd "C:\Users\shaun\OneDrive\Desktop\GEMAssign"
echo "*.mp4" >> .gitignore
```

## Step 2: Initialize and commit

```bash
git init
git add .
git commit -m "Initial commit: Real-Time Pairs Trading Analytics Platform"
```

## Step 3: Create GitHub repo

1. Go to https://github.com/new
2. Name it (e.g., `pairs-trading-analytics`)
3. Don't initialize with README
4. Create repository

## Step 4: Push

Replace `YOUR_USERNAME` and `REPO_NAME`:

```bash
git remote add origin https://github.com/YOUR_USERNAME/REPO_NAME.git
git branch -M main
git push -u origin main
```

Use Personal Access Token as password (Settings → Developer settings → Personal access tokens)

## Step 5: Upload MP4 manually

1. Go to your repo on GitHub
2. "Add file" → "Upload files"
3. Upload: `Dashboard Implementation video - Made with Clipchamp_1763533456467.mp4`
4. Commit

Done.
