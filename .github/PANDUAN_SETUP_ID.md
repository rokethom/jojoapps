# Panduan Setup GitHub Actions CI/CD

Dokumen ini menjelaskan pipeline CI/CD yang dikonfigurasi untuk proyek JoJango CMS.

## Gambaran Umum

Pipeline CI/CD mengotomatisasi pengujian, pembangunan, dan penempatan aplikasi Anda. Pipeline ini dipicu pada push dan pull request, dengan workflow terpisah untuk tahap yang berbeda.

## Workflows

### 1. **CI Workflow** (`ci.yml`)
Berjalan pada setiap push dan pull request ke branch `main` dan `develop`.

**Komponen:**
- **Backend Tests**: Menjalankan test Django dengan service PostgreSQL dan Redis
  - Pengecekan migrasi
  - Suite test Django
  - Pelaporan code coverage
  - Linting (flake8)
  - Pemformatan kode (black)
  - Pengurutan import (isort)

- **Frontend Tests**: Menjalankan test untuk ketiga aplikasi frontend (admin, customer, driver)
  - Instalasi dependensi NPM
  - Linting
  - Verifikasi build
  - Eksekusi test suite

- **Code Quality**: Integrasi SonarCloud opsional untuk metrik kualitas kode

- **Security Check**: Pemindaian kerentanan Trivy

### 2. **Build Workflow** (`build.yml`)
Membangun dan mendorong image Docker ke GitHub Container Registry.

**Image yang Dibangun:**
- Backend
- Frontend (Admin, Customer, Driver)
- Nginx reverse proxy

Menggunakan multi-stage builds dan Docker layer caching untuk performa optimal.

### 3. **Deploy Workflow** (`deploy.yml`)
Menempat aplikasi ke production/staging.

**Fitur:**
- Pemilihan environment manual (staging/production)
- Deployment berbasis SSH ke VPS
- Migrasi otomatis
- Koleksi file statis
- Orkestrasi Docker Compose
- Verifikasi deployment
- Notifikasi Slack opsional

### 4. **Release Workflow** (`release.yml`)
Membuat rilis GitHub dengan changelog otomatis.

**Dipicu oleh:**
- Mendorong tag seperti `v1.0.0`, `v1.0.0-alpha`, dll.

### 5. **Lint Workflow** (`lint.yml`)
Lint Dockerfiles, konfigurasi YAML, dan file Markdown.

### 6. **Tugas Terjadwal** (`schedule.yml`)
Berjalan setiap hari:
- Pengecekan update dependensi
- Pemindaian keamanan
- Pembersihan image Docker

## Instruksi Setup

### Langkah 1: Konfigurasi GitHub Secrets

Tambahkan secrets berikut ke pengaturan repository Anda (`Settings > Secrets and variables > Actions`):

#### Untuk Build & Deployment:
```
GITHUB_TOKEN          # Tersedia secara otomatis
```

#### Untuk Production Deployment (SSH):
```
PRODUCTION_HOST           # Hostname atau IP VPS
PRODUCTION_USER           # Username SSH
PRODUCTION_SSH_KEY        # Private SSH key (multiline)
PRODUCTION_SSH_PORT       # Port SSH (default: 22)
PRODUCTION_DEPLOY_PATH    # Jalur deployment di server
```

#### Untuk Staging Deployment (opsional):
```
STAGING_HOST              # Hostname VPS Staging
STAGING_USER              # Username SSH Staging
STAGING_SSH_KEY           # Private SSH key Staging
STAGING_SSH_PORT          # Port SSH Staging
STAGING_DEPLOY_PATH       # Jalur deployment Staging
```

#### Opsional:
```
SONARCLOUD_TOKEN          # Untuk analisis kualitas kode
SLACK_WEBHOOK             # Untuk notifikasi Slack
```

### Langkah 2: Konfigurasi Variabel Environment

Buat file `.env.prod` di direktori root:

```bash
cp .env.example .env.prod
```

Edit `.env.prod` dengan nilai production:
```env
DEBUG=False
SECRET_KEY=your-production-secret-key
DATABASE_URL=postgresql://user:password@prod-db-host:5432/jojango
REDIS_URL=redis://prod-redis-host:6379/0
ALLOWED_HOSTS=yourdomain.com,www.yourdomain.com
ENVIRONMENT=production
```

### Langkah 3: Setup Server Production

1. **Install Docker dan Docker Compose**:
   ```bash
   curl -fsSL https://get.docker.com -o get-docker.sh
   sudo sh get-docker.sh
   sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
   sudo chmod +x /usr/local/bin/docker-compose
   ```

2. **Clone repository**:
   ```bash
   git clone https://github.com/yourusername/jojangocms3-modelform.git
   cd jojangocms3-modelform
   ```

3. **Setup direktori**:
   ```bash
   mkdir -p logs
   chmod 755 logs
   ```

4. **Tambah SSH key ke server** (di mesin lokal):
   ```bash
   ssh-copy-id -i ~/.ssh/deploy_key.pub deploy@your-server.com
   ```

### Langkah 4: Konfigurasi GitHub Variables (opsional)

Tambahkan variabel organisasi atau repository (`Settings > Secrets and variables > Variables`):

```
ENABLE_SONARCLOUD    # Atur ke "true" untuk enable SonarCloud
```

## Workflow Triggers

| Workflow | Trigger | Branch |
|----------|---------|--------|
| CI | Push, PR | main, develop |
| Build | Push | main, develop |
| Deploy | Push ke main, manual | main (auto), any (manual) |
| Release | Tag push | Semua tag |
| Lint | Push, PR | main, develop |
| Schedule | Daily 2 AM UTC | - |

## Manual Triggers

Semua workflow dapat dipicu secara manual dari tab GitHub Actions:

1. Pergi ke **Actions** → Pilih workflow → **Run workflow**
2. Pilih branch/tag dan opsi
3. Klik **Run workflow**

## Proses Deployment

### Automatic Deployment (branch main)

1. Push kode ke branch `main`
2. CI tests berjalan otomatis
3. Jika tests pass, image Docker dibangun dan didorong
4. Workflow deployment production dimulai secara otomatis (memerlukan persetujuan environment)

### Manual Deployment

1. Pergi ke **Actions** → **Deploy to Production**
2. Klik **Run workflow**
3. Pilih environment (staging/production)
4. Review dan approve
5. Deployment dimulai

## Monitoring & Debugging

### Lihat Workflow Logs

1. Pergi ke tab **Actions**
2. Pilih workflow run
3. Lihat step logs untuk debugging

### Masalah Umum

**Masalah**: Tests gagal di CI tapi pass lokal
- Pastikan file `.env` dikonfigurasi dengan benar
- Cek string koneksi database dan Redis
- Verifikasi versi Python/Node cocok

**Masalah**: Deployment gagal dengan SSH error
- Verifikasi SSH key ditambahkan dengan benar ke server
- Cek konfigurasi port SSH dan host
- Pastikan `DEPLOY_PATH` ada di server

**Masalah**: Docker images tidak dibangun
- Cek syntax Dockerfile
- Verifikasi jalur file benar
- Cek ruang disk tersedia di GitHub Actions runner

## Best Practices

1. **Branch Protection**: Enable branch protection rules memerlukan CI pass sebelum merge
2. **Status Checks**: Require semua workflow checks pass sebelum merge PRs
3. **Secrets Rotation**: Secara teratur rotate SSH keys dan credentials
4. **Logs Retention**: Setup kebijakan retensi log
5. **Notifications**: Enable notifikasi Slack untuk deployment kritis
6. **Versioning**: Gunakan semantic versioning untuk releases (v1.0.0)

## Konfigurasi Variabel Environment

### Development (.env)
```env
DEBUG=True
SECRET_KEY=development-key
DATABASE_URL=postgresql://postgres:password@localhost:5432/jojango
REDIS_URL=redis://localhost:6379/0
ALLOWED_HOSTS=localhost,127.0.0.1
```

### Production (.env.prod)
```env
DEBUG=False
SECRET_KEY=<strong-unique-key>
DATABASE_URL=postgresql://user:password@prod-host:5432/jojango_prod
REDIS_URL=redis://prod-host:6379/0
ALLOWED_HOSTS=yourdomain.com
ENVIRONMENT=production
```

## Prosedur Rollback

Jika deployment gagal atau menyebabkan masalah:

```bash
# SSH ke server production
ssh deploy@your-server.com

# Navigasi ke direktori deployment
cd /path/to/jojangocms3-modelform

# Stop container saat ini
docker-compose -f docker-compose.prod.yml down

# Checkout versi sebelumnya
git checkout previous-tag

# Redeploy
docker-compose -f docker-compose.prod.yml up -d
```

## Support & Troubleshooting

Untuk masalah dengan pipeline CI/CD:

1. Cek [GitHub Actions Documentation](https://docs.github.com/en/actions)
2. Review workflow logs di tab Actions
3. Test workflows lokal dengan [act](https://github.com/nektos/act)
4. Cek health service di server production

## Optimasi Lanjutan

Pertimbangkan implementasi:
- Automated performance testing
- Load testing pada staging
- Database backup sebelum deployment
- Blue-green deployment strategy
- Canary deployments
- A/B testing setup
