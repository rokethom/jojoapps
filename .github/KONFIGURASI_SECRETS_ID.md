# Template Konfigurasi GitHub Secrets

## Required Secrets untuk GitHub Actions

### Docker Registry (Otomatis - GitHub)
- `GITHUB_TOKEN` - Disediakan secara otomatis oleh GitHub Actions

### Production Deployment Secrets
- `PRODUCTION_HOST` - Hostname atau alamat IP server production
- `PRODUCTION_USER` - Username SSH untuk server production
- `PRODUCTION_SSH_KEY` - Private SSH key untuk autentikasi (multiline)
- `PRODUCTION_SSH_PORT` - Port SSH (biasanya 22)
- `PRODUCTION_DEPLOY_PATH` - Jalur di mana kode di-deploy di server production

Contoh nilai:
```
PRODUCTION_HOST=api.yourdomain.com
PRODUCTION_USER=deploy
PRODUCTION_SSH_KEY=-----BEGIN RSA PRIVATE KEY-----
... (contents of private key)
-----END RSA PRIVATE KEY-----
PRODUCTION_SSH_PORT=22
PRODUCTION_DEPLOY_PATH=/home/deploy/jojangocms3-modelform
```

### Staging Deployment Secrets (Opsional)
- `STAGING_HOST` - Hostname server staging
- `STAGING_USER` - Username SSH untuk staging
- `STAGING_SSH_KEY` - Private SSH key untuk staging
- `STAGING_SSH_PORT` - Port SSH untuk staging
- `STAGING_DEPLOY_PATH` - Jalur deployment staging

### Code Quality (Opsional)
- `SONARCLOUD_TOKEN` - Token autentikasi SonarCloud untuk analisis kode

### Notifications (Opsional)
- `SLACK_WEBHOOK` - URL webhook Slack untuk notifikasi deployment

## Cara Generate SSH Key untuk Deployment

1. Generate pasangan SSH key:
   ```bash
   ssh-keygen -t rsa -b 4096 -f deploy_key -N ""
   ```

2. Salin public key ke server:
   ```bash
   ssh-copy-id -i deploy_key.pub deploy@your-server.com
   ```

3. Tambah private key ke GitHub Secrets:
   - Pergi ke: Settings > Secrets and variables > Actions
   - Klik "New repository secret"
   - Name: `PRODUCTION_SSH_KEY`
   - Value: Salin seluruh isi file `deploy_key`

## Cara Tambah Secrets ke GitHub

### Via GitHub Web Interface:
1. Pergi ke repository Anda
2. Klik tab **Settings**
3. Di sidebar kiri, klik **Secrets and variables** → **Actions**
4. Klik **New repository secret**
5. Masukkan Name dan Value
6. Klik **Add secret**

### Via GitHub CLI:
```bash
gh secret set PRODUCTION_HOST -b "your-server.com"
gh secret set PRODUCTION_USER -b "deploy"
gh secret set PRODUCTION_SSH_KEY < deploy_key
```

## Konfigurasi Variabel Environment

Variabel environment production harus dikonfigurasi langsung di server production dalam:
- `<DEPLOY_PATH>/.env` - Untuk variabel environment deployment
- Docker environment dalam `docker-compose.prod.yml`

Jangan commit data sensitif ke git. Selalu gunakan GitHub Secrets.

## Best Practices Keamanan

1. **Rotate SSH Keys**: Ubah SSH keys setiap 90 hari
2. **Limit Permissions**: User SSH hanya boleh memiliki permission untuk direktori deployment
3. **Use Strong Passwords**: Semua credentials harus complex dan unique
4. **Audit Logs**: Monitor GitHub Actions audit logs untuk akses unauthorized
5. **Secret Scanning**: Enable secret scanning dalam pengaturan repository
6. **Branch Protection**: Require CI checks sebelum merge ke main

## Debugging Secrets Issues

Jika deployment gagal karena secrets:

1. Verifikasi secret ditambah ke repository yang benar (bukan organization)
2. Cek nama secret cocok persis dalam workflow (case-sensitive)
3. Pastikan format SSH key benar (RSA atau ED25519)
4. Test koneksi SSH secara manual:
   ```bash
   ssh -i deploy_key -p 22 deploy@your-server.com "echo 'Connected'"
   ```

## Automatic Secret Rotation

Pertimbangkan implementasi:
- Quarterly key rotation
- Menggunakan GitHub's security advisories
- Enable Dependabot untuk deteksi secret
