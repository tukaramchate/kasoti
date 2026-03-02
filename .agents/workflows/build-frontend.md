---
description: Build and verify the Kasoti frontend for production
---

// turbo-all

# Build Kasoti Frontend for Production

## 1. Install dependencies (if not done)
```
cd c:\Users\sif-\Desktop\kasoti\frontend
npm install
```

## 2. Run a production build
```
cd c:\Users\sif-\Desktop\kasoti\frontend
npx react-scripts build
```
Output is in `frontend/build/`. Verify `Exit code: 0` at the end.

## 3. Verify build size
```
cd c:\Users\sif-\Desktop\kasoti\frontend
Get-ChildItem build\static\js\*.js | Sort-Object Length -Descending | Select-Object Name, Length
```

---

## Build Targets
- `build/static/js/main.*.js` — main bundle (should be < 200KB gzipped)
- `build/static/css/main.*.css` — styles
- `build/index.html` — HTML entry point

## Common Build Errors
| Error | Fix |
|-------|-----|
| Hooks after conditional return | Move all hooks before any `if (...) return` |
| Missing import | Add correct import path using `../../utils/styles` for shared utils |
| Eslint errors | Check for unused imports or variables |
