# Checklist Setup GitHub Actions CI/CD

Selesaikan checklist ini untuk setup lengkap GitHub Actions untuk proyek Anda.

## Pre-Setup

- [ ] Repository GitHub dibuat dan kode dipush
- [ ] GitHub CLI terinstal (opsional, untuk otomasi)
- [ ] Pasangan SSH key di-generate untuk deployment
- [ ] Server Production/Staging siap dengan Docker terinstal

## Langkah 1: Konfigurasi Secrets

### Production Deployment
- [ ] Tambah secret `PRODUCTION_HOST`
- [ ] Tambah secret `PRODUCTION_USER`  
- [ ] Tambah secret `PRODUCTION_SSH_KEY` (isi private key)
- [ ] Tambah secret `PRODUCTION_SSH_PORT` (biasanya 22)
- [ ] Tambah secret `PRODUCTION_DEPLOY_PATH` (e.g., /home/deploy/app)

### Staging Deployment (Opsional)
- [ ] Tambah secret `STAGING_HOST`
- [ ] Tambah secret `STAGING_USER`
- [ ] Tambah secret `STAGING_SSH_KEY`
- [ ] Tambah secret `STAGING_SSH_PORT`
- [ ] Tambah secret `STAGING_DEPLOY_PATH`

### Layanan Opsional
- [ ] Tambah `SONARCLOUD_TOKEN` (untuk analisis kualitas kode)
- [ ] Tambah `SLACK_WEBHOOK` (untuk notifikasi deployment)

## Langkah 2: Konfigurasi Repository

### Branch Protection
- [ ] Pergi ke Settings → Branches
- [ ] Tambah rule untuk branch `main`
- [ ] Require pull request reviews sebelum merge
- [ ] Require status checks untuk pass (pilih semua CI workflows)
- [ ] Include administrators dalam restrictions

### Environment Configuration
- [ ] Buat `.env.prod` dari `.env.example`
- [ ] Isi semua nilai yang diperlukan
- [ ] **JANGAN commit .env.prod ke git**
- [ ] Tambah `.env` dan `.env.prod` ke `.gitignore`

### GitHub Variables (Opsional)
- [ ] Atur `ENABLE_SONARCLOUD=true` jika gunakan SonarCloud
- [ ] Atur variabel organization-wide lainnya

## Langkah 3: Setup Server Production

### SSH Access
- [ ] SSH key disalin ke server (`ssh-copy-id`)
- [ ] User SSH dikonfigurasi untuk password-less auth
- [ ] Port SSH dikonfigurasi (jika tidak 22)

### Docker Setup
- [ ] Docker terinstal
- [ ] Docker Compose terinstal
- [ ] Docker daemon dikonfigurasi untuk start on boot
- [ ] Ruang disk cukup untuk images (minimum 10GB recommended)

### Application Directory
- [ ] Direktori dibuat di `PRODUCTION_DEPLOY_PATH`
- [ ] Permissions diatur dengan benar untuk deploy user
- [ ] File `.env` dibuat dengan nilai production

### Database & Redis
- [ ] PostgreSQL database dibuat dan accessible
- [ ] Redis instance berjalan dan accessible
- [ ] Backups dikonfigurasi (opsional)
- [ ] Monitoring setup (opsional)

## Langkah 4: Test Workflows

### CI Workflow
- [ ] Push ke branch `develop`
- [ ] Verifikasi CI workflow berjalan
- [ ] Verifikasi semua tests pass
- [ ] Cek code coverage reports

### Build Workflow
- [ ] Tunggu build workflow selesai
- [ ] Verifikasi Docker images di-push ke GitHub Container Registry
- [ ] Cek image tags dan versions

### Manual Deployment
- [ ] Pergi ke Actions → Deploy to Production
- [ ] Klik "Run workflow"
- [ ] Pilih environment "staging"
- [ ] Verifikasi deployment selesai sukses
- [ ] Test aplikasi di server staging

### Production Deployment
- [ ] Push test tag: `git tag v0.0.1 && git push origin v0.0.1`
- [ ] Verifikasi release dibuat di GitHub
- [ ] Trigger production deployment secara manual
- [ ] Monitor deployment logs
- [ ] Test aplikasi di production

## Langkah 5: Konfigurasi Monitoring & Notifications

### Slack Notifications (Opsional)
- [ ] Buat Slack webhook URL
- [ ] Tambah secret `SLACK_WEBHOOK`
- [ ] Test notification dengan trigger deployment

### Email Notifications
- [ ] Enable GitHub email notifications untuk Actions
- [ ] Konfigurasi notification preferences

### Logs & Artifacts
- [ ] Konfigurasi log retention dalam repository settings
- [ ] Review workflow artifacts setup
- [ ] Setup log aggregation (opsional)

## Langkah 6: Dokumentasi & Team Training

- [ ] Salin `.github/GITHUB_ACTIONS_SETUP.md` ke project wiki atau README
- [ ] Share `.github/SECRETS_CONFIGURATION.md` dengan team
- [ ] Document deployment process untuk team
- [ ] Buat runbooks untuk common troubleshooting
- [ ] Train team tentang manual deployment procedures

## Langkah 7: Ongoing Maintenance

### Mingguan
- [ ] Monitor workflow runs di tab Actions
- [ ] Cek untuk deployment failures
- [ ] Review error logs

### Bulanan
- [ ] Update dependencies dalam `requirements.txt` dan `package.json`
- [ ] Review dan update secrets rotation schedule
- [ ] Analisis code coverage trends

### Quarterly
- [ ] Rotate SSH keys
- [ ] Review dan update security policies
- [ ] Audit GitHub Actions permissions
- [ ] Performance optimization review

## Troubleshooting

### CI Tests Gagal
- [ ] Cek jika tests pass lokal
- [ ] Verifikasi database connection di CI environment
- [ ] Cek Python/Node version compatibility
- [ ] Review recent code changes

### Deployment Gagal
- [ ] Verifikasi SSH connectivity: `ssh -i key deploy@host`
- [ ] Cek deployment path ada dan permissions benar
- [ ] Review konfigurasi `.env` di server
- [ ] Cek available disk space: `df -h`
- [ ] Verifikasi Docker daemon running: `docker ps`

### Secrets Tidak Bekerja
- [ ] Verifikasi nama secret cocok persis (case-sensitive)
- [ ] Pastikan secret ditambah ke repository yang benar
- [ ] Cek format SSH key benar
- [ ] Verifikasi key permissions: `chmod 600 key`

## Quick Commands

```bash
# Test SSH connection
ssh -i deploy_key -p 22 deploy@production.example.com "echo 'Success'"

# Lihat GitHub Actions logs lokal (dengan act)
act -j build-backend

# Buat release tag
git tag v1.0.0
git push origin v1.0.0

# Cek deployment status
gh run list --workflow=deploy.yml

# Lihat latest deployment logs
gh run view <run-id> --log
```

## Resources

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Docker Documentation](https://docs.docker.com)
- [Django Testing Documentation](https://docs.djangoproject.com/en/stable/topics/testing/)
- [GitHub CLI Documentation](https://cli.github.com/)

---

**Last Updated**: 24 April 2026
**Checklist Version**: 1.0
