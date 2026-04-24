# 📚 Dokumentasi CI/CD - Bahasa Indonesia

Panduan lengkap setup GitHub Actions CI/CD untuk proyek JoJango CMS dalam Bahasa Indonesia.

## 🌍 Tersedia Dalam Dua Bahasa

- 🇬🇧 **Bahasa Inggris**: `.github/QUICKSTART.md`, `.github/GITHUB_ACTIONS_SETUP.md`
- 🇮🇩 **Bahasa Indonesia**: Lihat file di bawah ini

## 📖 Dokumentasi Indonesia

### 1. 🚀 [PANDUAN_SETUP_ID.md](./PANDUAN_SETUP_ID.md) - MULAI DI SINI
**Level**: Pemula  
**Waktu Baca**: 15 menit  
**Isi**:
- Gambaran umum pipeline CI/CD
- Penjelasan 6 workflows
- Instruksi setup lengkap (4 langkah)
- Workflow triggers dan manual triggers
- Best practices keamanan
- Troubleshooting umum

**Cocok untuk**: Developer baru yang ingin memahami pipeline secara keseluruhan.

### 2. ⚙️ [KONFIGURASI_SECRETS_ID.md](./KONFIGURASI_SECRETS_ID.md)
**Level**: Menengah  
**Waktu Baca**: 10 menit  
**Isi**:
- Template secrets yang diperlukan
- Cara generate SSH key
- Cara tambah secrets ke GitHub
- Best practices keamanan
- Debugging secrets issues

**Cocok untuk**: DevOps/Admin yang setup security dan credentials.

### 3. ✅ [CHECKLIST_SETUP_ID.md](./CHECKLIST_SETUP_ID.md)
**Level**: Pemula-Menengah  
**Waktu Baca**: 20 menit (untuk setup)  
**Isi**:
- 7 langkah setup dengan checkbox
- Pre-setup requirements
- Konfigurasi secrets
- Setup server production
- Test workflows
- Maintenance schedule

**Cocok untuk**: Checklist saat setup awal atau onboarding team member baru.

### 4. 📊 [RINGKASAN_CICD_ID.md](./RINGKASAN_CICD_ID.md)
**Level**: Semua  
**Waktu Baca**: 10 menit  
**Isi**:
- Quick overview komponen
- File structure
- Fitur yang sudah diimplementasikan
- Quick start 15 menit
- Tips & tricks
- Maintenance schedule

**Cocok untuk**: Gambaran cepat tentang apa yang sudah disetup.

### 5. 📦 [MANIFEST_INSTALASI_ID.md](./MANIFEST_INSTALASI_ID.md)
**Level**: Teknis  
**Waktu Baca**: 15 menit  
**Isi**:
- Daftar lengkap file yang dibuat
- Ringkasan masing-masing workflow
- Testing pipeline procedures
- Performance metrics
- Verification commands

**Cocok untuk**: Referensi teknis instalasi yang detail.

## 🎯 Pilih Dokumen Berdasarkan Kebutuhan Anda

### 📍 Saya Baru Pertama Kali
1. Mulai: [PANDUAN_SETUP_ID.md](./PANDUAN_SETUP_ID.md)
2. Lanjut: [CHECKLIST_SETUP_ID.md](./CHECKLIST_SETUP_ID.md)
3. Referensi: [KONFIGURASI_SECRETS_ID.md](./KONFIGURASI_SECRETS_ID.md)

### 🔧 Saya DevOps/Admin Setup
1. Baca: [KONFIGURASI_SECRETS_ID.md](./KONFIGURASI_SECRETS_ID.md)
2. Ikuti: [CHECKLIST_SETUP_ID.md](./CHECKLIST_SETUP_ID.md)
3. Verifikasi: [MANIFEST_INSTALASI_ID.md](./MANIFEST_INSTALASI_ID.md)

### 👥 Saya Team Member yang Sudah Setup
1. Quick Overview: [RINGKASAN_CICD_ID.md](./RINGKASAN_CICD_ID.md)
2. Cara Deploy: [PANDUAN_SETUP_ID.md](./PANDUAN_SETUP_ID.md#proses-deployment)
3. Troubleshoot: [PANDUAN_SETUP_ID.md](./PANDUAN_SETUP_ID.md#monitoring--debugging)

### ❓ Saya Punya Error/Masalah
1. Cek: [PANDUAN_SETUP_ID.md](./PANDUAN_SETUP_ID.md#monitoring--debugging)
2. Debug: [CHECKLIST_SETUP_ID.md](./CHECKLIST_SETUP_ID.md#troubleshooting)
3. Referensi: [KONFIGURASI_SECRETS_ID.md](./KONFIGURASI_SECRETS_ID.md#debugging-secrets-issues)

## 📋 Quick Reference

### File Structure
```
.github/
├── workflows/              # 6 workflow files
├── PANDUAN_SETUP_ID.md     # ← Mulai di sini!
├── KONFIGURASI_SECRETS_ID.md
├── CHECKLIST_SETUP_ID.md
├── RINGKASAN_CICD_ID.md
└── MANIFEST_INSTALASI_ID.md
```

### Shortcuts
- **Setup awal**: `./setup-secrets.sh` atau `.\setup-secrets.bat`
- **Lihat status**: `gh run list`
- **Lihat logs**: `gh run view -j backend-tests --log`
- **Deploy manual**: Go to GitHub Actions tab → Deploy to Production

### Common Commands
```bash
# Test SSH
ssh -i ~/.ssh/deploy_key -p 22 deploy@server.com "echo OK"

# List secrets
gh secret list

# Check workflow
gh run view <run-id>

# Create release
git tag v1.0.0 && git push origin v1.0.0
```

## 🔄 Workflow Timeline

| Stage | Time | File | Status |
|-------|------|------|--------|
| **Push Code** | - | Workflow dipicu | 🟢 Otomatis |
| **CI Tests** | 2-5 min | `ci.yml` | 🟢 Berjalan |
| **Build Docker** | 5-10 min | `build.yml` | 🟢 Otomatis |
| **Deploy** | 5-15 min | `deploy.yml` | 🟡 Manual atau Otomatis |
| **Total** | 15-30 min | - | ✅ Done |

## 🚀 Setup Cepat (5 Menit)

1. **Setup secrets**:
   ```bash
   ./setup-secrets.sh
   ```

2. **Konfigurasi environment**:
   ```bash
   cp .env.example .env.prod
   nano .env.prod
   ```

3. **Commit & push**:
   ```bash
   git add .
   git commit -m "chore: add CI/CD"
   git push origin main
   ```

4. **Monitor**:
   - Pergi ke GitHub Actions tab
   - Lihat workflow berjalan

## 📞 Butuh Bantuan?

| Pertanyaan | Referensi |
|-----------|-----------|
| Bagaimana setup awal? | [PANDUAN_SETUP_ID.md](./PANDUAN_SETUP_ID.md) |
| Apa saja secrets yang diperlukan? | [KONFIGURASI_SECRETS_ID.md](./KONFIGURASI_SECRETS_ID.md) |
| Bagaimana checklist setup? | [CHECKLIST_SETUP_ID.md](./CHECKLIST_SETUP_ID.md) |
| Ringkasan implementasi? | [RINGKASAN_CICD_ID.md](./RINGKASAN_CICD_ID.md) |
| Detail teknis? | [MANIFEST_INSTALASI_ID.md](./MANIFEST_INSTALASI_ID.md) |

## ✅ Indikator Sukses Setup

- [x] Repository dibuat
- [x] GitHub Actions tersetup
- [ ] Secrets ditambah
- [ ] Environment dikonfigurasi
- [ ] First workflow berhasil
- [ ] Docker images built
- [ ] Deployment sukses
- [ ] Aplikasi live

## 🔐 Keamanan Penting

⚠️ **JANGAN LUPA**:
- ❌ Jangan commit `.env.prod` ke git
- ❌ Jangan share private SSH key
- ❌ Jangan hardcode secrets dalam code
- ✅ Gunakan GitHub Secrets untuk sensitive data
- ✅ Rotate SSH keys setiap 90 hari
- ✅ Enable 2FA di GitHub account

## 📈 Maintenance

### Harian
- Monitor workflow runs di Actions tab

### Mingguan
- Cek untuk failed deployments
- Review error logs

### Bulanan
- Update dependencies
- Check code coverage

### Quarterly
- Rotate SSH keys
- Security audit

## 🌐 Bahasa

Dokumentasi tersedia dalam:
- 🇬🇧 **English**: `.github/QUICKSTART.md` (5 menit)
- 🇮🇩 **Indonesia**: File-file di folder ini (detail lengkap)

## 📚 Dokumentasi Lengkap

Untuk referensi lebih detail, buka file-file markdown di folder `.github/`:

1. [PANDUAN_SETUP_ID.md](./PANDUAN_SETUP_ID.md) - Panduan lengkap
2. [KONFIGURASI_SECRETS_ID.md](./KONFIGURASI_SECRETS_ID.md) - Secrets & keamanan
3. [CHECKLIST_SETUP_ID.md](./CHECKLIST_SETUP_ID.md) - Step-by-step checklist
4. [RINGKASAN_CICD_ID.md](./RINGKASAN_CICD_ID.md) - Ringkasan implementasi
5. [MANIFEST_INSTALASI_ID.md](./MANIFEST_INSTALASI_ID.md) - Detail teknis

## 🎓 Learning Path

1. **Pemula** (20 menit)
   - Baca: [RINGKASAN_CICD_ID.md](./RINGKASAN_CICD_ID.md)
   - Ikuti: [PANDUAN_SETUP_ID.md](./PANDUAN_SETUP_ID.md) (langkah 1-4)

2. **Menengah** (1 jam)
   - Baca: [PANDUAN_SETUP_ID.md](./PANDUAN_SETUP_ID.md) (selengkapnya)
   - Ikuti: [CHECKLIST_SETUP_ID.md](./CHECKLIST_SETUP_ID.md)
   - Setup: Secrets dengan [KONFIGURASI_SECRETS_ID.md](./KONFIGURASI_SECRETS_ID.md)

3. **Advanced** (2 jam)
   - Pelajari: [MANIFEST_INSTALASI_ID.md](./MANIFEST_INSTALASI_ID.md)
   - Explore: Workflow files di `.github/workflows/`
   - Customize: Sesuaikan untuk kebutuhan project

## 📞 Support

Jika ada pertanyaan:
1. Cek dokumentasi yang relevan
2. Lihat tab Actions untuk logs
3. Test lokal dengan `./setup-secrets.sh`
4. Check GitHub Actions documentation

---

**Dokumentasi Versi**: 1.0  
**Bahasa**: 🇮🇩 Bahasa Indonesia  
**Last Updated**: 24 April 2026  
**Status**: ✅ Ready for Production

**Mulai Setup Sekarang**: 👉 [PANDUAN_SETUP_ID.md](./PANDUAN_SETUP_ID.md)
