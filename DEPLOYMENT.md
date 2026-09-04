# Panduan Deployment Produksi GoTangguh / GoResilio (Linux VPS)

Dokumen ini adalah panduan langkah-demi-langkah resmi untuk melakukan deployment platform **GoTangguh / GoResilio** ke server produksi Linux VPS (Ubuntu 22.04 / 24.04 LTS).

---

## 1. Spesifikasi Server Minimum & Rekomendasi

| Komponen | Spesifikasi Minimum | Rekomendasi Produksi |
| :--- | :--- | :--- |
| **OS** | Ubuntu 22.04 LTS (x86_64) | Ubuntu 24.04 LTS (x86_64) |
| **vCPU** | 2 vCPU | 4 vCPU |
| **RAM** | 4 GB RAM | 8 GB RAM |
| **Storage** | 40 GB NVMe SSD | 80 GB NVMe SSD |
| **Database** | MySQL 8.0+ | MySQL 8.0+ / Managed DB |
| **Node.js** | Node.js 18.x LTS | Node.js 20.x LTS |

---

## 2. Persiapan Server & Instalasi Dependensi

Jalankan perintah berikut pada terminal server VPS Anda:

```bash
# Update repository sistem
sudo apt update && sudo apt upgrade -y

# Install dependensi dasar
sudo apt install -y curl git ufw build-essential nginx certbot python3-certbot-nginx

# Install Node.js 20 LTS (via NodeSource)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Verifikasi versi
node -v   # v20.x.x
npm -v    # 10.x.x

# Install PM2 Process Manager secara global
sudo npm install -g pm2
```

---

## 3. Instalasi & Konfigurasi MySQL 8.0

```bash
# Install server MySQL
sudo apt install -y mysql-server

# Jalankan pengamanan instalasi MySQL
sudo mysql_secure_installation

# Masuk ke MySQL console
sudo mysql -u root -p
```

Di dalam MySQL console, buat database dan pengguna khusus:

```sql
CREATE DATABASE gotangguh_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE USER 'gotangguh_user'@'localhost' IDENTIFIED BY 'BuatPasswordSangatKuatDanAcak123!';
GRANT ALL PRIVILEGES ON gotangguh_db.* TO 'gotangguh_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

Impor skema dan seed data resmi:

```bash
cd /path/to/cloned/GoTangguh
mysql -u gotangguh_user -p gotangguh_db < database/schema.sql
```

---

## 4. Setup Kode Sumber & Lingkungan (.env)

```bash
# Clone repositori ke direktori aplikasi
sudo mkdir -p /var/www/gotangguh
sudo chown -R $USER:$USER /var/www/gotangguh
git clone <URL_REPOSITORY_ANDA> /var/www/gotangguh
cd /var/www/gotangguh

# Install dependensi Node.js
npm ci --production=false

# Buat file konfigurasi .env
cp .env.example .env
nano .env
```

Pastikan variabel wajib telah diatur dengan aman:

```ini
NODE_ENV=production
PORT=3000
NEXT_PUBLIC_APP_URL=https://gotangguh.id

# Generate secret: openssl rand -hex 32
JWT_SECRET=f7e34b...masukkan_64_karakter_acak_disini...9a12c
JWT_EXPIRES_IN=7d

DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=gotangguh_user
DB_PASSWORD=BuatPasswordSangatKuatDanAcak123!
DB_NAME=gotangguh_db

# Nomor WhatsApp Admin untuk pemesanan & konsultasi langsung
NEXT_PUBLIC_ADMIN_WHATSAPP=6281199887766
NEXT_PUBLIC_SUPPORT_EMAIL=admin.ops@gotangguh.id
```

---

## 5. Build Aplikasi Next.js

```bash
npm run build
```

Pastikan proses build selesai dengan status exit code 0 tanpa error.

---

## 6. Jalankan Service Menggunakan PM2

Buat file konfigurasi `ecosystem.config.js` pada root direktori:

```javascript
module.exports = {
  apps: [
    {
      name: 'gotangguh-app',
      script: 'node_modules/next/dist/bin/next',
      args: 'start -p 3000',
      instances: 'max',
      exec_mode: 'cluster',
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production'
      }
    }
  ]
};
```

Jalankan dan atur auto-start saat reboot:

```bash
# Mulai proses aplikasi
pm2 start ecosystem.config.js

# Simpan state PM2
pm2 save

# Setup startup script sistem (systemd)
pm2 startup
# (Salin dan jalankan baris perintah yang ditampilkan oleh PM2)
```

---

## 7. Konfigurasi Nginx Reverse Proxy & SSL

Buat konfigurasi server block Nginx:

```bash
sudo nano /etc/nginx/sites-available/gotangguh.conf
```

Isi dengan konfigurasi berikut:

```nginx
server {
    listen 80;
    server_name gotangguh.id www.gotangguh.id;

    # Security Headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    # Gzip Compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript image/svg+xml;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Static file caching
    location /_next/static {
        proxy_pass http://127.0.0.1:3000;
        proxy_cache_valid 200 365d;
        expires 365d;
        access_log off;
    }
}
```

Aktifkan konfigurasi dan test Nginx:

```bash
sudo ln -s /etc/nginx/sites-available/gotangguh.conf /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

Pasang sertifikat SSL gratis via Certbot:

```bash
sudo certbot --nginx -d gotangguh.id -d www.gotangguh.id
```

---

## 8. Verifikasi Operasional & Health Check

Periksa endpoint health check platform:

```bash
curl -i https://gotangguh.id/api/health
```

Respon sukses (HTTP 200):

```json
{
  "status": "healthy",
  "service": "gotangguh-spatial-engine",
  "version": "2.0.0",
  "database": {
    "connected": true,
    "latencyMs": 5,
    "message": "Koneksi database MySQL aktif & seluruh tabel siap digunakan."
  }
}
```

---

## 9. Backup Database Otomatis (Cron Job)

Buat script backup berkala:

```bash
mkdir -p /var/backups/gotangguh
sudo nano /usr/local/bin/backup-gotangguh.sh
```

Isi script:

```bash
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/var/backups/gotangguh"
mysqldump -u gotangguh_user -p'BuatPasswordSangatKuatDanAcak123!' gotangguh_db | gzip > "$BACKUP_DIR/gotangguh_$DATE.sql.gz"
# Hapus backup yang lebih lama dari 14 hari
find $BACKUP_DIR -type f -name "*.sql.gz" -mtime +14 -exec rm {} \;
```

Beri izin eksekusi dan jadwalkan via crontab setiap jam 02:00 malam:

```bash
sudo chmod +x /usr/local/bin/backup-gotangguh.sh
(crontab -l 2>/dev/null; echo "0 2 * * * /usr/local/bin/backup-gotangguh.sh") | crontab -
```
