# Manifest Instalasi GitHub Actions CI/CD

**Tanggal Instalasi**: 24 April 2026  
**Proyek**: JoJango CMS  
**Versi**: 1.0

## File yang Dibuat

### File Workflow (`.github/workflows/`)
- ✅ `ci.yml` - Pipeline CI/CD untuk tests dan code quality
- ✅ `build.yml` - Docker image building dan pushing
- ✅ `deploy.yml` - Production/staging deployment
- ✅ `release.yml` - GitHub release automation
- ✅ `lint.yml` - Linting dan code style checks
- ✅ `schedule.yml` - Scheduled security dan dependency scans

### File Dokumentasi (`.github/`)
- ✅ `QUICKSTART.md` - Panduan quick start 5 menit (Bahasa Inggris)
- ✅ `PANDUAN_SETUP_ID.md` - Dokumentasi setup lengkap (Bahasa Indonesia)
- ✅ `KONFIGURASI_SECRETS_ID.md` - Panduan secrets dan credentials (Bahasa Indonesia)
- ✅ `CHECKLIST_SETUP_ID.md` - Checklist setup step-by-step (Bahasa Indonesia)
- ✅ `RINGKASAN_CICD_ID.md` - Ringkasan implementasi (Bahasa Indonesia)

### File Konfigurasi
- ✅ `.env.example` - Template variabel environment
- ✅ `backend/pytest.ini` - Konfigurasi pytest
- ✅ `backend/setup.cfg` - Konfigurasi tool backend
- ✅ `backend/pyproject.toml` - Konfigurasi build

### Helper Scripts (Root)
- ✅ `setup-secrets.sh` - Script setup secrets Linux/macOS
- ✅ `setup-secrets.bat` - Script setup secrets Windows

## Total File yang Dibuat: 16

## Langkah-Langkah Setup (Diperlukan)

### 1. Konfigurasi Awal
```bash
# Navigasi ke root project
cd jojangocms3-modelform

# Salin template environment
cp .env.example .env.prod

# Edit dengan nilai Anda
nano .env.prod
```

### 2. Tambah GitHub Secrets
```bash
# Setup otomatis (recommended)
./setup-secrets.sh                    # macOS/Linux
# atau
.\setup-secrets.bat                   # Windows

# Setup manual
# Pergi ke: GitHub Settings → Secrets and variables → Actions
# Tambah semua secret PRODUCTION_*
```

### 3. Commit Changes
```bash
git add .github/
git add setup-secrets.sh setup-secrets.bat
git add .env.example backend/pytest.ini backend/setup.cfg backend/pyproject.toml
git commit -m "chore: add GitHub Actions CI/CD pipeline"
git push origin main
```

### 4. Verifikasi Setup
```bash
# Pergi ke repository GitHub
# Klik tab "Actions"
# Monitor first workflow run (harus ~5-10 menit)
```

## Ringkasan Workflows

### 1. CI Workflow (`ci.yml`)
**Trigger**: Push/PR ke `main` atau `develop`  
**Duration**: 2-5 menit

**Langkah**:
- Backend tests dengan PostgreSQL/Redis
- Frontend tests untuk 3 apps
- Code coverage reporting
- Linting (flake8, black, isort)
- Security scanning (Trivy)

**Success Criteria**:
- Semua tests pass ✓
- Code coverage terjaga ✓
- Tidak ada linting errors ✓

### 2. Build Workflow (`build.yml`)
**Trigger**: Setelah successful CI pada `main`/`develop`  
**Duration**: 5-10 menit

**Images yang Dibangun**:
- Backend Django app
- Frontend Admin app
- Frontend Customer app
- Frontend Driver app
- Nginx reverse proxy

**Output**:
- Images di-push ke GitHub Container Registry (ghcr.io)
- Tags: `branch-name`, `sha-branch`, `latest`

### 3. Deploy Workflow (`deploy.yml`)
**Trigger**: Setelah successful build pada `main`  
**Duration**: 5-15 menit

**Langkah Deployment**:
1. SSH ke server production
2. Pull latest code
3. Load environment variables
4. Pull Docker images
5. Jalankan database migrations
6. Collect static files
7. Restart containers
8. Verifikasi health check

**Opsi**:
- Deployment otomatis ke production
- Pemilihan staging/production manual

### 4. Release Workflow (`release.yml`)
**Trigger**: Git tag baru (`v*.*.*`)  
**Duration**: 1-2 menit

**Fitur**:
- Automatic changelog generation
- Release notes creation
- Docker image references

### 5. Lint Workflow (`lint.yml`)
**Trigger**: Push/PR ke `main`/`develop`  
**Duration**: 1-2 menit

**Checks**:
- Dockerfile linting (hadolint)
- YAML linting
- Markdown linting

### 6. Schedule Workflow (`schedule.yml`)
**Trigger**: Daily at 2 AM UTC  
**Duration**: 5-10 menit

**Tasks**:
- Dependency updates check
- Security vulnerability scans
- Docker image cleanup

## Secrets yang Diperlukan

### Production Deployment (Diperlukan)
```
PRODUCTION_HOST              # Server IP/hostname
PRODUCTION_USER              # Username SSH
PRODUCTION_SSH_KEY           # Private SSH key (multiline)
PRODUCTION_SSH_PORT          # Port SSH (biasanya 22)
PRODUCTION_DEPLOY_PATH       # Direktori deployment
```

### Staging Deployment (Opsional)
```
STAGING_HOST
STAGING_USER
STAGING_SSH_KEY
STAGING_SSH_PORT
STAGING_DEPLOY_PATH
```

### Layanan Opsional
```
SONARCLOUD_TOKEN             # Code quality analysis
SLACK_WEBHOOK                # Slack notifications
```

## Variabel Environment Diperlukan

### Development
```
DEBUG=True
SECRET_KEY=dev-key
DATABASE_URL=postgresql://postgres:password@localhost:5432/jojango
REDIS_URL=redis://localhost:6379/0
ALLOWED_HOSTS=localhost,127.0.0.1
```

### Production (dalam `.env.prod`)
```
DEBUG=False
SECRET_KEY=<strong-unique-secret>
DATABASE_URL=postgresql://user:pass@prod-host:5432/jojango
REDIS_URL=redis://prod-host:6379/0
ALLOWED_HOSTS=yourdomain.com,www.yourdomain.com
ENVIRONMENT=production
```

## Testing Pipeline

### Test CI Workflow
```bash
# Push ke branch develop
git checkout develop
git commit --allow-empty -m "test: trigger CI"
git push origin develop

# Monitor tab Actions
# Tunggu semua checks pass
```

### Test Build Workflow
```bash
# Push ke main (jika CI pass di develop)
git merge develop
git push origin main

# Tunggu Docker images dibangun
# Cek GitHub Container Registry
```

### Test Deploy Workflow
```bash
# Manual trigger
# Pergi ke Actions → Deploy to Production → Run workflow
# Pilih environment staging
# Verifikasi deployment di server staging
```

## Masalah Umum & Solusi

### ❌ SSH Connection Gagal
```bash
# Solusi:
# 1. Verifikasi secrets ditambah dengan benar
# 2. Test SSH secara manual:
ssh -i ~/.ssh/key -p 22 user@host "echo OK"

# 3. Cek SSH key permissions:
chmod 600 ~/.ssh/key
```

### ❌ Tests Gagal
```bash
# Solusi:
# 1. Jalankan tests lokal:
cd backend && pytest

# 2. Cek konfigurasi CI environment
# 3. Verifikasi database settings dalam pytest.ini
```

### ❌ Docker Build Gagal
```bash
# Solusi:
# 1. Test build lokal:
docker build -f Dockerfile.backend .

# 2. Cek syntax Dockerfile
# 3. Verifikasi semua files dalam COPY commands ada
```

### ❌ Deployment Health Check Gagal
```bash
# Solusi:
# 1. SSH ke server:
ssh deploy@server

# 2. Cek services:
docker ps
docker-compose -f docker-compose.prod.yml ps

# 3. Lihat logs:
docker-compose -f docker-compose.prod.yml logs backend
```

## Metrik Performa

| Stage | Time | Notes |
|-------|------|-------|
| CI Tests | 2-5 min | Tergantung jumlah tests |
| Docker Build | 5-10 min | Lebih cepat dengan cache |
| Deploy | 5-15 min | Termasuk migrations |
| **Total** | **15-30 min** | Per push ke main |

## Success Checklist

- [ ] Semua secrets ditambah ke GitHub
- [ ] `.env.prod` dikonfigurasi di server
- [ ] Akses SSH terverifikasi
- [ ] Docker terinstal di servers
- [ ] First CI run selesai sukses
- [ ] Docker images dibangun dan di-push
- [ ] Manual deployment ke staging sukses
- [ ] Production deployment terverifikasi
- [ ] Health checks passing
- [ ] Aplikasi responding dengan benar

## Monitoring & Maintenance

### Mingguan
- [ ] Cek untuk failed workflows
- [ ] Review deployment logs
- [ ] Verifikasi semua services berjalan

### Bulanan
- [ ] Update dependencies
- [ ] Review code coverage trends
- [ ] Cek security scan results

### Quarterly
- [ ] Rotate SSH keys
- [ ] Audit GitHub Actions permissions
- [ ] Review cost/performance

## File Dokumentasi

| File | Tujuan | Audience |
|------|--------|----------|
| `.github/PANDUAN_SETUP_ID.md` | Referensi lengkap | DevOps/setup |
| `.github/KONFIGURASI_SECRETS_ID.md` | Manajemen secrets | Security/DevOps |
| `.github/CHECKLIST_SETUP_ID.md` | Panduan step-by-step | First-time setup |
| `.github/RINGKASAN_CICD_ID.md` | Ringkasan implementasi | Semua team members |

## Reference Commands

```bash
# List workflow runs
gh run list

# Lihat specific run
gh run view <run-id>

# Lihat job logs
gh run view <run-id> -j job-name --log

# Trigger workflow secara manual
gh workflow run deploy.yml -f environment=production

# Buat release
git tag v1.0.0
git push origin v1.0.0

# List secrets
gh secret list

# Set secret
gh secret set SECRET_NAME -b "value"
```

## Langkah Selanjutnya

1. **Selesaikan Setup**: Ikuti `.github/PANDUAN_SETUP_ID.md`
2. **Konfigurasi Secrets**: Jalankan `setup-secrets.sh` atau `setup-secrets.bat`
3. **Test Deployment**: Deploy ke staging terlebih dahulu
4. **Enable Notifications**: Konfigurasi Slack webhook (opsional)
5. **Setup Monitoring**: Monitor production deployments
6. **Document Procedures**: Share knowledge dengan team

## Support & Resources

- GitHub Actions: https://docs.github.com/en/actions
- Docker: https://docs.docker.com
- Django: https://docs.djangoproject.com
- GitHub CLI: https://cli.github.com

## Verifikasi Instalasi

```bash
# Verifikasi files dibuat
ls -la .github/workflows/          # Harus menampilkan 6 files
ls -la .github/*.md                # Harus menampilkan beberapa files
ls -la backend/pytest.ini          # Harus ada
ls -la .env.example                # Harus ada
```

## Support

Untuk issues atau pertanyaan:
1. Cek dokumentasi relevant di `.github/`
2. Review workflow logs di tab Actions
3. Test lokal sebelum push
4. Cek troubleshooting sections

---

**Installation Status**: ✅ Complete  
**Versi**: 1.0  
**Last Updated**: 24 April 2026  
**Siap untuk Production**: Yes
