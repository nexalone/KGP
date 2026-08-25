# KGP - Input Anggota (Apps Script)

Web app Google Apps Script untuk input data anggota Koperasi Guru dan Pegawai
SMP Negeri 1 Kaliwedi. Kode disimpan di GitHub, dideploy ke Google Apps Script
memakai `clasp`.

## Struktur file
- `Code.gs` — logika server (baca/tulis ke Google Sheet)
- `Index.html` — tampilan form + daftar anggota
- `appsscript.json` — manifest project Apps Script

## Setup sekali di awal (di komputer developer)

```bash
npm install -g @google/clasp
clasp login
```

`clasp login` akan buka browser, login pakai akun Google yang punya akses ke
spreadsheet & Apps Script project.

## Menghubungkan repo GitHub ini ke Apps Script yang sudah ada

Karena project Apps Script (dengan deployment `.../exec` yang sudah kamu
punya) sudah ada, tinggal ambil **Script ID**-nya:

1. Buka spreadsheet → Ekstensi → Apps Script.
2. Project Settings (ikon gerigi) → salin **Script ID**.

Lalu di folder repo `KGP` (hasil `git clone` repo kamu):

```bash
git clone https://github.com/<username>/KGP.git
cd KGP
clasp clone <SCRIPT_ID>
```

`clasp clone` akan membuat file `.clasp.json` (berisi Script ID) dan menarik
file yang ada di Apps Script ke folder ini. Setelah itu, timpa/tambahkan
`Code.gs`, `Index.html`, `appsscript.json` dengan versi dari chat ini, lalu:

```bash
git add .
git commit -m "Update form: baris kompak tanggal & jabatan, lock concurrent submit"
git push
```

## Alur kerja sehari-hari (edit kode)

1. `git pull` — ambil update terbaru dari GitHub.
2. Edit `Code.gs` / `Index.html` sesuai kebutuhan.
3. Uji lokal dulu kalau perlu, lalu:
   ```bash
   clasp push
   ```
   Ini mengirim kode ke Apps Script (Editor Apps Script akan langsung
   menunjukkan perubahan).
4. Untuk mempublikasikan perubahan ke URL web app yang sudah dipakai petugas:
   - Buka Apps Script Editor → **Deploy → Manage deployments**
   - Pilih deployment aktif → **Edit (ikon pensil)** → Version: **New version** → Deploy.
   - URL `.../exec` yang sudah dibagikan ke petugas **tidak berubah**.
5. Commit & push perubahan ke GitHub:
   ```bash
   git add .
   git commit -m "Deskripsi perubahan"
   git push
   ```

## Siapa perlu akses apa

- **Petugas input data**: cukup diberi link web app (`.../exec`). Mereka
  TIDAK perlu akses GitHub atau Apps Script Editor sama sekali — mereka hanya
  memakai form di browser.
- **Developer/admin (kamu, atau rekan yang bantu ubah kode)**: perlu akses
  GitHub repo `KGP` (untuk kolaborasi kode) dan akses Editor Apps Script
  (untuk `clasp push`/`clasp login`, atau share project Apps Script ke email
  mereka via Editor → Share).
- Kalau mau lebih dari satu developer memakai `clasp push` ke project yang
  sama, tambahkan editor lain di **Apps Script Editor → Share** (ikon orang),
  bukan lewat GitHub — GitHub hanya menyimpan source code, bukan akses ke
  project Apps Script itu sendiri.

## Catatan penting

- Simpan `.clasp.json` di `.gitignore` **jika** berisi info sensitif, tapi
  untuk repo privat biasanya aman di-commit supaya semua developer memakai
  Script ID yang sama. Kalau repo publik, sebaiknya `.gitignore`-kan dan tiap
  developer generate sendiri lewat `clasp clone`.
- `Code.gs` sudah dilengkapi `LockService` di `addMember`, `updateMember`, dan
  `deleteMember` supaya aman dipakai beberapa petugas secara bersamaan (tidak
  akan menimpa baris atau kode yang sama).
