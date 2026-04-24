# GitHub Actions CI/CD - Panduan Cepat

Jalankan pipeline CI/CD proyek Anda dalam 5 menit!

## Prasyarat

- Repository GitHub sudah dibuat
- GitHub CLI terinstal (perintah `gh` tersedia)
- Akses SSH ke server produksi/staging
- Docker terinstal di server target

## Setup Cepat (5 menit)

### 1. Generate SSH Key (jika belum ada)

**Di Linux/macOS:**
```bash
ssh-keygen -t rsa -b 4096 -f ~/.ssh/jojango_deploy -N ""
cat ~/.ssh/jojango_deploy.pub | ssh user@server "cat >> ~/.ssh/authorized_keys"
```

**Di Windows (PowerShell):**
```powershell
# Salin public key ke server secara manual atau gunakan PuTTY Key Generator
ssh-keyscan -p 22 your-server.com >> $env:USERPROFILE\.ssh\known_hosts
```

### 2. Tambah GitHub Secrets (Otomatis)

**Di Linux/macOS:**
```bash
chmod +x setup-secrets.sh
./setup-secrets.sh
```

**Di Windows (PowerShell):**
```powershell
# Jalankan setup-secrets.bat
.\setup-secrets.bat
```

**Atau secara manual melalui GitHub Web UI:**
1. Pergi ke: **Settings → Secrets and variables → Actions**
2. Klik **New repository secret** untuk masing-masing:
   - `PRODUCTION_HOST` → IP/hostname server Anda
   - `PRODUCTION_USER` → user deploy
   - `PRODUCTION_SSH_KEY` → paste seluruh private key
   - `PRODUCTION_SSH_PORT` → port SSH (biasanya 22)
   - `PRODUCTION_DEPLOY_PATH` → `/home/deploy/app`

### 3. Konfigurasi Environment Produksi

1. Di server produksi Anda:
```bash
git clone https://github.com/yourusername/jojangocms3-modelform.git
cd jojangocms3-modelform
cp .env.example .env.prod
nano .env.prod  # Isi dengan nilai Anda
```

2. Test konektivitas Docker:
```bash
docker --version
docker-compose --version
docker ps
```

### 4. Push Code & Trigger CI

```bash
# Commit workflow files
git add .github/
git commit -m "chore: add GitHub Actions CI/CD"
git push origin main

# Monitor CI di tab Actions
# Tunggu semua checks berhasil (2-3 menit)
```

### 5. Test Deploy Manual

```bash
# Opsi 1: Push ke main trigger deployment otomatis
git commit --allow-empty -m "trigger deployment"
git push origin main

# Opsi 2: Deployment manual via GitHub
# Pergi ke: Actions > Deploy to Production > Run workflow
```

## Ringkasan Workflow

```
Push Code
    ↓
CI Checks (tests, lint) ✓
    ↓
Docker Build ✓
    ↓
Deploy ke Produksi ✓
```

## Perintah Umum

```bash
# Lihat status workflow
gh run list --workflow=ci.yml

# Lihat log run terbaru
gh run view -j backend-tests --log

# Trigger workflow secara manual
gh workflow run deploy.yml -f environment=production

# Buat release
git tag v1.0.0
git push origin v1.0.0
```

## Verifikasi Deployment

Setelah deployment selesai:

```bash
# SSH ke produksi
ssh deploy@your-server.com

# Cek container yang berjalan
docker ps

# Lihat logs
docker-compose -f docker-compose.prod.yml logs -f

# Test health endpoint
curl http://localhost/health
```

## Troubleshooting

### ❌ "SSH connection refused"
```bash
# Test konektivitas SSH
ssh -i ~/.ssh/jojango_deploy -p 22 deploy@your-server.com "echo OK"

# Jika gagal: cek host, port, dan permissions key
chmod 600 ~/.ssh/jojango_deploy
```

### ❌ "Tests gagal di CI tapi lokal sukses"
```bash
# CI menggunakan PostgreSQL - pastikan tests gunakan database benar
# Cek: backend/pytest.ini dan settings untuk test database

# Jalankan test lokal dengan test settings
python backend/manage.py test --settings=core.settings_test
```

### ❌ "Docker image push gagal"
```bash
# Pastikan Anda login
echo ${{ secrets.GITHUB_TOKEN }} | docker login ghcr.io -u ${{ github.actor }} --password-stdin

# Cek Docker image tags cocok
docker images | grep jojango
```

### ❌ "Deployment mengatakan 'health check failed'"
```bash
# SSH ke server dan debug
docker-compose -f docker-compose.prod.yml logs nginx
docker-compose -f docker-compose.prod.yml logs backend

# Cek jika services berjalan
docker ps -a
```

## Langkah Selanjutnya

Setelah setup awal berhasil:

1. **Konfigurasi Branch Protection**
   - Pergi ke: Settings → Branches → Add rule
   - Require semua CI checks pass sebelum merge

2. **Enable Notifications**
   - Tambah `SLACK_WEBHOOK` secret untuk update Slack
   - Konfigurasi email notifications di GitHub

3. **Setup Monitoring**
   - Monitor production logs: `docker-compose logs -f`
   - Setup alerts untuk deployment failures

4. **Buat Release Strategy**
   - Tag releases: `git tag v1.0.0 && git push origin v1.0.0`
   - Releases trigger automatic changelog generation

## Struktur File

```
.github/
├── workflows/
│   ├── ci.yml              # Tests & code quality
│   ├── build.yml           # Docker image building
│   ├── deploy.yml          # Production deployment
│   ├── release.yml         # Release management
│   ├── lint.yml            # Linting checks
│   └── schedule.yml        # Scheduled tasks
├── GITHUB_ACTIONS_SETUP.md # Panduan setup detail
├── SECRETS_CONFIGURATION.md # Referensi secrets
└── SETUP_CHECKLIST.md      # Checklist lengkap

.env.example               # Environment template
setup-secrets.sh          # Automated setup script
setup-secrets.bat         # Windows setup script
```

## Contoh Environment

### Pengembangan (lokal)
```env
DEBUG=True
SECRET_KEY=dev-key
DATABASE_URL=postgresql://postgres:password@localhost/jojango
```

### Produksi
```env
DEBUG=False
SECRET_KEY=<strong-unique-key>
DATABASE_URL=postgresql://user:pwd@prod-host/jojango
ALLOWED_HOSTS=yourdomain.com
ENVIRONMENT=production
```

Lihat `.env.example` untuk list lengkap variabel.

## Timeline Deployment

- **CI Workflow**: 2-5 menit
- **Build Workflow**: 5-10 menit  
- **Deploy Workflow**: 5-15 menit
- **Total**: ~15-30 menit dari push ke live

## Indikator Sukses

✅ Semua CI checks pass  
✅ Docker images built dan pushed  
✅ Deployment selesai tanpa error  
✅ Health check pass  
✅ Frontend loaded dengan benar  
✅ API endpoints merespons  

## Dapatkan Bantuan

1. **Cek Workflow Logs**
   - Tab Actions → Pilih run → View logs

2. **Baca Dokumentasi**
   - [GITHUB_ACTIONS_SETUP.md](.github/GITHUB_ACTIONS_SETUP.md)
   - [SECRETS_CONFIGURATION.md](.github/SECRETS_CONFIGURATION.md)

3. **Masalah Umum**
   - Lihat section "Troubleshooting" di atas

4. **GitHub Documentation**
   - [GitHub Actions Docs](https://docs.github.com/en/actions)

---

**Waktu Setup**: ~5 menit  
**Workflow Runs**: 15-30 menit  
**Success Rate**: Harus 100% setelah setup benar
