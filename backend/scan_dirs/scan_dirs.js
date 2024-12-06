const fs = require('fs').promises;
const path = require('path');
const moment = require('moment');

class DirectoryScanner {
    constructor(dbManager, configPath) {
        this.dbManager = dbManager;
        this.configPath = configPath;
        this.directories = [];
        this.loadConfig();
    }

    async loadConfig() {
        try {
            const configData = await fs.readFile(this.configPath, 'utf8');
            const config = JSON.parse(configData);
            this.directories = config.directories_to_scan || [];
        } catch (err) {
            console.error(`Error loading config file: ${err}`);
            this.directories = [];
        }
    }

    async scanDirectories() {
        const results = {};
        
        // Clear previous scan results
        await this.dbManager.clearScannedFiles();
        
        for (const directory of this.directories) {
            results[directory] = await this.scanDirectory(directory);
        }
        
        return results;
    }

    async scanDirectory(directoryPath) {
        const processedFiles = [];
        
        try {
            const processDir = async (currentPath) => {
                const entries = await fs.readdir(currentPath, { withFileTypes: true });
                
                for (const entry of entries) {
                    const fullPath = path.join(currentPath, entry.name);
                    
                    if (entry.isFile()) {
                        try {
                            // Get file stats
                            const stats = await fs.stat(fullPath);
                            const lastModified = moment(stats.mtime).format('YYYY-MM-DD HH:mm:ss');
                            const size = stats.size;

                            // Store in database
                            const fileId = await this.dbManager.addScannedFile(
                                entry.name,
                                fullPath,
                                lastModified,
                                size
                            );
                            
                            processedFiles.push({
                                id: fileId,
                                filename: entry.name,
                                filepath: fullPath,
                                last_modified: lastModified,
                                size: size
                            });
                        } catch (err) {
                            console.error(`Error processing file ${fullPath}: ${err}`);
                        }
                    } else if (entry.isDirectory()) {
                        await processDir(fullPath);
                    }
                }
            };

            await processDir(directoryPath);
        } catch (err) {
            console.error(`Error scanning directory ${directoryPath}: ${err}`);
        }
        
        return processedFiles;
    }
}

module.exports = DirectoryScanner;
