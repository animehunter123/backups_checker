const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');
const moment = require('moment');

class DatabaseManager {
    constructor(dbPath = null) {
        if (!dbPath) {
            // Create database in the backend directory
            this.dbPath = path.join(__dirname, '..', 'backup_checker.db');
        } else {
            this.dbPath = dbPath;
        }

        // Ensure the database directory exists
        fs.mkdirSync(path.dirname(this.dbPath), { recursive: true });
        
        // Initialize the database
        this.initDb();
        
        // Set permissions to 666 (rw-rw-rw-)
        try {
            fs.chmodSync(this.dbPath, 0o666);
        } catch (e) {
            console.warn(`Warning: Could not set database permissions: ${e}`);
            console.warn(`You might need to manually run: chmod 666 ${this.dbPath}`);
        }
    }

    initDb() {
        return new Promise((resolve, reject) => {
            const db = new sqlite3.Database(this.dbPath, (err) => {
                if (err) {
                    console.error('Database initialization error:', err);
                    reject(err);
                    return;
                }

                db.serialize(() => {
                    // Create table for scanned files
                    db.run(`
                        CREATE TABLE IF NOT EXISTS scanned_files (
                            id INTEGER PRIMARY KEY AUTOINCREMENT,
                            filename TEXT NOT NULL,
                            filepath TEXT NOT NULL,
                            last_modified TIMESTAMP,
                            size INTEGER,
                            scan_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                        )
                    `);

                    // Create table for scanned servers
                    db.run(`
                        CREATE TABLE IF NOT EXISTS scanned_servers (
                            id INTEGER PRIMARY KEY AUTOINCREMENT,
                            hostname TEXT NOT NULL,
                            ip_address TEXT,
                            detected_os TEXT,
                            open_ports TEXT,
                            last_scan TIMESTAMP,
                            is_reachable BOOLEAN,
                            scan_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                        )
                    `, (err) => {
                        if (err) reject(err);
                        else resolve();
                    });
                });
            });

            db.close();
        });
    }

    clearScannedFiles() {
        return new Promise((resolve, reject) => {
            const db = new sqlite3.Database(this.dbPath);
            db.run('DELETE FROM scanned_files', (err) => {
                db.close();
                if (err) reject(err);
                else resolve();
            });
        });
    }

    clearScannedServers() {
        return new Promise((resolve, reject) => {
            const db = new sqlite3.Database(this.dbPath);
            db.run('DELETE FROM scanned_servers', (err) => {
                db.close();
                if (err) reject(err);
                else resolve();
            });
        });
    }

    addScannedFile(filename, filepath, lastModified, size) {
        return new Promise((resolve, reject) => {
            const db = new sqlite3.Database(this.dbPath);
            db.run(
                `INSERT INTO scanned_files (filename, filepath, last_modified, size)
                VALUES (?, ?, ?, ?)`,
                [filename, filepath, lastModified, size],
                function(err) {
                    db.close();
                    if (err) reject(err);
                    else resolve(this.lastID);
                }
            );
        });
    }

    getAllScannedFiles() {
        return new Promise((resolve, reject) => {
            const db = new sqlite3.Database(this.dbPath);
            db.all('SELECT * FROM scanned_files', (err, rows) => {
                db.close();
                if (err) reject(err);
                else resolve(rows);
            });
        });
    }

    updateServer(hostname, data) {
        return new Promise((resolve, reject) => {
            const db = new sqlite3.Database(this.dbPath);
            
            // First check if server exists
            db.get('SELECT id FROM scanned_servers WHERE hostname = ?', [hostname], (err, row) => {
                if (err) {
                    db.close();
                    reject(err);
                    return;
                }

                if (row) {
                    // Update existing server
                    db.run(
                        `UPDATE scanned_servers 
                        SET ip_address = ?,
                            detected_os = ?,
                            open_ports = ?,
                            last_scan = ?,
                            is_reachable = ?,
                            scan_time = CURRENT_TIMESTAMP
                        WHERE id = ?`,
                        [
                            data.ip_address,
                            data.detected_os,
                            data.open_ports,
                            data.last_scan,
                            data.is_reachable,
                            row.id
                        ],
                        (err) => {
                            db.close();
                            if (err) reject(err);
                            else resolve(row.id);
                        }
                    );
                } else {
                    // Insert new server
                    db.run(
                        `INSERT INTO scanned_servers (
                            hostname, ip_address, detected_os, open_ports,
                            last_scan, is_reachable
                        )
                        VALUES (?, ?, ?, ?, ?, ?)`,
                        [
                            hostname,
                            data.ip_address,
                            data.detected_os,
                            data.open_ports,
                            data.last_scan,
                            data.is_reachable
                        ],
                        function(err) {
                            db.close();
                            if (err) reject(err);
                            else resolve(this.lastID);
                        }
                    );
                }
            });
        });
    }

    getAllServers() {
        return new Promise((resolve, reject) => {
            const db = new sqlite3.Database(this.dbPath);
            db.all('SELECT * FROM scanned_servers', (err, rows) => {
                db.close();
                if (err) reject(err);
                else resolve(rows);
            });
        });
    }
}

module.exports = DatabaseManager;
