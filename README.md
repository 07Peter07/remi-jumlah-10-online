# Remi Jumlah 10 – Online Multiplayer

Game kartu remi online multiplayer (4 pemain) berbasis web.

## Fitur
- Online real-time (Socket.IO)
- 4 pemain per room
- 1 deck 52 kartu (tanpa Joker)
- Bagi 7 kartu per pemain
- 10 kartu terbuka di meja
- Pasangan kartu harus berjumlah 10
- K, Q, J = 10
- Target poin: 70
- Perhitungan akhir:
  - Hanya ♥ & ♦
  - A = 20 poin
  - 9 = 10 poin
- Saldo & top up virtual

## Teknologi
- Node.js
- Express
- Socket.IO
- HTML, CSS, JavaScript

## Cara Menjalankan (Local)
```bash
npm install
node server.js
