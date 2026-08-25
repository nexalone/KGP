/**
 * INPUT ANGGOTA KGP SMP NEGERI 1 KALIWEDI
 * Script ini HARUS berupa "container-bound script" yang terpasang
 * pada Spreadsheet "ANGGOTA KESEJAHTERAAN GURU DAN PEGAWAI".
 *
 * Struktur sheet yang diasumsikan:
 * Baris 1 : Judul  -> "ANGGOTA KESEJAHTERAAN GURU DAN PEGAWAI"
 * Baris 2 : Header -> KODE | NAMA | TANGGAL DAFTAR | JABATAN
 * Baris 3+: Data anggota
 */

var SHEET_NAME = 'Sheet1';       // ganti jika nama sheet berbeda
var DATA_START_ROW = 3;          // baris pertama tempat data anggota dimulai
var JABATAN_LIST = ['Anggota', 'Ketua', 'Sekretaris', 'Bendahara', 'Pengurus', 'BP'];

function doGet() {
  return HtmlService.createTemplateFromFile('Index')
    .evaluate()
    .setTitle('Input Anggota KGP SMP Negeri 1 Kaliwedi')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

function getSheet_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) sheet = ss.getSheets()[0];
  return sheet;
}

/** Format kode: [YY][MM][XXX] contoh 2508001, reset urutan tiap bulan berjalan */
function generateNextCode_() {
  var sheet = getSheet_();
  var now = new Date();
  var tz = Session.getScriptTimeZone();
  var yy = Utilities.formatDate(now, tz, 'yy');
  var mm = Utilities.formatDate(now, tz, 'MM');
  var prefix = yy + mm;

  var lastRow = sheet.getLastRow();
  var maxSeq = 0;
  if (lastRow >= DATA_START_ROW) {
    var codes = sheet.getRange(DATA_START_ROW, 1, lastRow - DATA_START_ROW + 1, 1).getValues();
    codes.forEach(function (row) {
      var kode = String(row[0] || '');
      if (kode.indexOf(prefix) === 0 && kode.length === prefix.length + 3) {
        var seq = parseInt(kode.substring(prefix.length), 10);
        if (!isNaN(seq) && seq > maxSeq) maxSeq = seq;
      }
    });
  }
  var nextSeq = maxSeq + 1;
  var seqStr = ('000' + nextSeq).slice(-3);
  return prefix + seqStr;
}

/** Dipanggil dari client untuk menampilkan kode calon anggota baru di form */
function getNextCode() {
  return generateNextCode_();
}

function getToday() {
  return Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd');
}

function getJabatanList() {
  return JABATAN_LIST;
}

/** Ambil seluruh daftar anggota untuk ditampilkan di bawah form */
function getMembers() {
  var sheet = getSheet_();
  var lastRow = sheet.getLastRow();
  if (lastRow < DATA_START_ROW) return [];
  var values = sheet.getRange(DATA_START_ROW, 1, lastRow - DATA_START_ROW + 1, 4).getValues();
  var result = [];
  values.forEach(function (row, i) {
    if (row[0]) {
      var tgl = row[2];
      if (Object.prototype.toString.call(tgl) === '[object Date]') {
        tgl = Utilities.formatDate(tgl, Session.getScriptTimeZone(), 'yyyy-MM-dd');
      }
      result.push({
        rowIndex: DATA_START_ROW + i,
        kode: row[0],
        nama: row[1],
        tanggal: tgl,
        jabatan: row[3]
      });
    }
  });
  // urutkan terbaru di atas
  result.sort(function (a, b) { return b.rowIndex - a.rowIndex; });
  return result;
}

/**
 * Tambah anggota baru, kode dibuat otomatis di server (bukan dari client).
 * Pakai LockService karena beberapa petugas bisa submit hampir bersamaan -
 * tanpa lock, dua submit bisa saja mendapat kode yang sama atau menimpa baris yang sama.
 */
function addMember(data) {
  var lock = LockService.getScriptLock();
  lock.waitLock(30000); // tunggu maks 30 detik kalau ada petugas lain sedang menyimpan
  try {
    var sheet = getSheet_();
    var nama = (data.nama || '').toString().trim();
    if (!nama) throw new Error('Nama tidak boleh kosong.');

    var jabatan = data.jabatan || 'Anggota';
    if (JABATAN_LIST.indexOf(jabatan) === -1) jabatan = 'Anggota';

    var tanggal = data.tanggal ? new Date(data.tanggal) : new Date();
    var kode = generateNextCode_();

    var lastRow = Math.max(sheet.getLastRow(), DATA_START_ROW - 1);
    var targetRow = lastRow + 1;
    sheet.getRange(targetRow, 1, 1, 4).setValues([[kode, nama, tanggal, jabatan]]);

    return {
      rowIndex: targetRow,
      kode: kode,
      nama: nama,
      tanggal: Utilities.formatDate(tanggal, Session.getScriptTimeZone(), 'yyyy-MM-dd'),
      jabatan: jabatan
    };
  } finally {
    lock.releaseLock();
  }
}

/** Ubah data anggota yang sudah ada (kode tidak berubah) */
function updateMember(data) {
  var lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    var sheet = getSheet_();
    var rowIndex = parseInt(data.rowIndex, 10);
    if (!rowIndex || rowIndex < DATA_START_ROW) throw new Error('Baris tidak valid.');

    var nama = (data.nama || '').toString().trim();
    if (!nama) throw new Error('Nama tidak boleh kosong.');

    var jabatan = data.jabatan || 'Anggota';
    if (JABATAN_LIST.indexOf(jabatan) === -1) jabatan = 'Anggota';

    var tanggal = data.tanggal ? new Date(data.tanggal) : new Date();

    sheet.getRange(rowIndex, 2, 1, 3).setValues([[nama, tanggal, jabatan]]);
    return true;
  } finally {
    lock.releaseLock();
  }
}

/** Hapus satu baris anggota */
function deleteMember(rowIndex) {
  var lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    var sheet = getSheet_();
    var r = parseInt(rowIndex, 10);
    if (!r || r < DATA_START_ROW) throw new Error('Baris tidak valid.');
    sheet.deleteRow(r);
    return true;
  } finally {
    lock.releaseLock();
  }
}
