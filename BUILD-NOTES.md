# Build Notes - Photo Printer Pro

## Release Folder Behavior

### ⚠️ Important: The `release/` folder is automatically cleaned on each build

**This is expected behavior from electron-builder and ensures clean builds.**

### What happens during build:
1. When you run `npm run electron:build`, electron-builder **automatically deletes** the entire `release/` folder
2. Then it creates a fresh `release/` folder with new build artifacts
3. Final output: `release/Photo Printer Pro Setup 1.0.X.exe`

### ✅ Best Practices:

1. **DO NOT store important files in `release/` folder** - they will be deleted on next build
2. **Copy the final `.exe` file to a safe location** after building
3. The `release/` folder is in `.gitignore` and should not be committed to Git
4. Keep only the latest build artifacts in `release/`

### Build Process:
```bash
npm run electron:build
```

This command:
1. Runs Vite build → creates `dist/` folder
2. Generates icons → creates `build/` folder
3. Encrypts main.cjs → creates `main.enc`
4. **Cleans release/ folder** ← This is where files get deleted
5. Runs electron-builder → creates new `release/` folder with build outputs

### Release Workflow:
1. Build: `npm run electron:build`
2. Test the `.exe` file in `release/`
3. Copy the `.exe` to another folder for distribution
4. Or upload directly to GitHub releases
5. Next build will clean `release/` and create fresh files

---

## فۆڵدەری Release

### ⚠️ گرنگ: فۆڵدەری `release/` بە شێوەیەکی خودکار پاک دەکرێتەوە لەگەڵ هەر بیلدێک

**ئەمە ڕەفتاری ئاسایی electron-builder ە و دڵنیایی لە بیلدێکی پاک دەکاتەوە.**

### ئەوەی لە کاتی بیلد ڕوودەدات:
1. کاتێک `npm run electron:build` دەنووسیت، electron-builder بە شێوەیەکی خودکار **هەموو فۆڵدەری `release/` دەسڕێتەوە**
2. پاشان فۆڵدەرێکی نوێی `release/` دروست دەکات لەگەڵ فایلە نوێیەکانی بیلد
3. دەرچووی کۆتایی: `release/Photo Printer Pro Setup 1.0.X.exe`

### ✅ باشترین ڕێگاکان:

1. **فایلی گرنگ لە فۆڵدەری `release/` مەپارێزە** - لە بیلدی داهاتوو دەسڕدرێنەوە
2. **کۆپی فایلی `.exe` ی کۆتایی بکە بۆ شوێنێکی سەلامەت** دوای بیلدکردن
3. فۆڵدەری `release/` لە `.gitignore` دایە و نابێت بنێردرێت بۆ Git
4. تەنها فایلەکانی بیلدی کۆتایی لە `release/` بهێڵەرەوە

### پرۆسەی بیلد:
```bash
npm run electron:build
```

ئەم فەرمانە:
1. Vite build دەکات → فۆڵدەری `dist/` دروست دەکات
2. ئایکۆنەکان دروست دەکات → فۆڵدەری `build/` دروست دەکات  
3. main.cjs کۆدی دەکات → `main.enc` دروست دەکات
4. **فۆڵدەری release/ پاک دەکاتەوە** ← لێرەیە فایلەکان دەسڕدرێنەوە
5. electron-builder ڕۆن دەکات → فۆڵدەری نوێی `release/` دروست دەکات لەگەڵ فایلەکانی بیلد

### کارپێکردنی ڕیلیز:
1. بیلد بکە: `npm run electron:build`
2. فایلی `.exe` لە `release/` تاقی بکەرەوە
3. کۆپی `.exe` بکە بۆ فۆڵدەرێکی تر بۆ دابەشکردن
4. یان ڕاستەوخۆ بینێرە بۆ GitHub releases
5. بیلدی داهاتوو فۆڵدەری `release/` پاک دەکاتەوە و فایلی نوێ دروست دەکات

