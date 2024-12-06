const express = require('express');
const cors = require('cors');
const path = require('path');
const moment = require('moment');
const asyncHandler = require('express-async-handler');

const DatabaseManager = require('./database/db_manager');
const DirectoryScanner = require('./scan_dirs/scan_dirs');
const SubnetScanner = require('./scan_servers/scan_servers');

const app = express();
app.use(cors());
app.use(express.json());

const dbManager = new DatabaseManager();
const configPath = path.join(__dirname, 'config.json');

// Helper function to format timestamps
function formatTimestamp(timestamp) {
    if (!timestamp) return null;
    try {
        return moment(timestamp).format('YYYY-MM-DD HH:mm:ss');
    } catch (err) {
        return timestamp;
    }
}

// Helper function to determine backup status
function getBackupStatus(server, files) {
    const serverIdentifiers = [
        server.hostname.toLowerCase(),
        server.ip_address ? server.ip_address.toLowerCase() : null
    ].filter(Boolean);
    
    const matchingFiles = files.filter(file => {
        const filenameLower = file.filename.toLowerCase();
        return serverIdentifiers.some(id => filenameLower.includes(id));
    });
    
    if (matchingFiles.length === 0) {
        return 'red';
    }
    
    // Find most recent backup
    const mostRecent = matchingFiles.reduce((latest, current) => {
        const currentDate = moment(current.last_modified);
        return !latest || currentDate.isAfter(moment(latest.last_modified)) ? current : latest;
    });
    
    // Check if backup is within a year
    const lastModified = moment(mostRecent.last_modified);
    if (moment().diff(lastModified, 'days') <= 365) {
        return 'green';
    }
    return 'yellow';
}

// Get all files
app.get('/api/files', asyncHandler(async (req, res) => {
    const files = await dbManager.getAllScannedFiles();
    
    const formattedFiles = files.map(file => ({
        id: file.id,
        filename: file.filename,
        filepath: file.filepath,
        last_modified: formatTimestamp(file.last_modified),
        size: file.size,
        scan_time: formatTimestamp(file.scan_time)
    }));
    
    // Sort if requested
    const sortBy = req.query.sort;
    if (sortBy) {
        const order = req.query.order === 'desc' ? -1 : 1;
        formattedFiles.sort((a, b) => {
            if (a[sortBy] < b[sortBy]) return -1 * order;
            if (a[sortBy] > b[sortBy]) return 1 * order;
            return 0;
        });
    }
    
    res.json({
        status: 'success',
        count: formattedFiles.length,
        files: formattedFiles
    });
}));

// Get all servers
app.get('/api/servers', asyncHandler(async (req, res) => {
    const [servers, files] = await Promise.all([
        dbManager.getAllServers(),
        dbManager.getAllScannedFiles()
    ]);
    
    const formattedFiles = files.map(file => ({
        filename: file.filename,
        filepath: file.filepath,
        last_modified: formatTimestamp(file.last_modified)
    }));
    
    const formattedServers = servers.map(server => {
        const serverData = {
            id: server.id,
            hostname: server.hostname,
            ip_address: server.ip_address,
            detected_os: server.detected_os,
            open_ports: server.open_ports,
            last_scan: formatTimestamp(server.last_scan),
            is_reachable: Boolean(server.is_reachable),
            scan_time: formatTimestamp(server.scan_time)
        };
        serverData.backup_status = getBackupStatus(serverData, formattedFiles);
        return serverData;
    });
    
    // Sort if requested
    const sortBy = req.query.sort;
    if (sortBy) {
        const order = req.query.order === 'desc' ? -1 : 1;
        formattedServers.sort((a, b) => {
            if (a[sortBy] < b[sortBy]) return -1 * order;
            if (a[sortBy] > b[sortBy]) return 1 * order;
            return 0;
        });
    }
    
    res.json({
        status: 'success',
        count: formattedServers.length,
        servers: formattedServers
    });
}));

// Scan directories
app.post('/api/scan/directories', asyncHandler(async (req, res) => {
    const scanner = new DirectoryScanner(dbManager, configPath);
    const results = await scanner.scanDirectories();
    
    if (results) {
        const totalFiles = Object.values(results)
            .reduce((sum, files) => sum + files.length, 0);
            
        res.json({
            status: 'success',
            message: `Directory scan completed successfully. Found ${totalFiles} files.`
        });
    } else {
        res.status(500).json({
            status: 'error',
            message: 'No files found during scan'
        });
    }
}));

// Scan servers
app.post('/api/scan/servers', asyncHandler(async (req, res) => {
    // Check for root privileges
    if (process.getuid && process.getuid() !== 0) {
        return res.status(500).json({
            status: 'error',
            message: 'Server scanning requires root privileges. Please run the application with sudo.'
        });
    }
    
    const scanner = new SubnetScanner(dbManager, configPath);
    const results = await scanner.scanAllSubnets();
    
    if (results && results.length > 0) {
        res.json({
            status: 'success',
            message: `Server scan completed successfully. Found ${results.length} servers.`
        });
    } else {
        res.status(500).json({
            status: 'error',
            message: 'No servers found during scan'
        });
    }
}));

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'healthy' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
