const nmap = require('node-nmap');
const dns = require('dns').promises;
const fs = require('fs').promises;
const moment = require('moment');

class SubnetScanner {
    constructor(dbManager, configPath) {
        this.dbManager = dbManager;
        this.configPath = configPath;
        this.subnets = [];
        this.loadConfig();

        // Check if running as root
        if (process.getuid && process.getuid() !== 0) {
            console.error('Error: Nmap scanning requires root privileges.');
            console.error('Please run the application with sudo.');
            process.exit(1);
        }
    }

    async loadConfig() {
        try {
            const configData = await fs.readFile(this.configPath, 'utf8');
            const config = JSON.parse(configData);
            this.subnets = config.subnets_to_scan || [];
        } catch (err) {
            console.error(`Error loading config file: ${err}`);
            this.subnets = [];
        }
    }

    async scanHost(ipAddress) {
        return new Promise((resolve) => {
            const quickscan = new nmap.QuickScan(ipAddress, '-n -T4 -F --min-parallelism 100 --max-retries 1 -O');
            
            quickscan.on('complete', async (data) => {
                if (!data || data.length === 0) {
                    resolve(null);
                    return;
                }

                const host = data[0];
                let hostname;

                try {
                    const dnsResult = await dns.reverse(ipAddress);
                    hostname = dnsResult[0];
                } catch (err) {
                    hostname = ipAddress;
                }

                // Extract OS information
                const osInfo = host.osNmap || 'Unknown';

                // Extract open ports
                const openPorts = [];
                if (host.openPorts) {
                    for (const port of host.openPorts) {
                        openPorts.push(`${port.port}/${port.protocol} (${port.service || 'unknown'})`);
                    }
                }

                const result = {
                    hostname: hostname,
                    ip_address: ipAddress,
                    detected_os: osInfo,
                    open_ports: openPorts.join(', '),
                    is_reachable: true,
                    last_scan: moment().format('YYYY-MM-DD HH:mm:ss')
                };

                resolve(result);
            });

            quickscan.on('error', (err) => {
                console.error(`Error scanning host ${ipAddress}: ${err}`);
                resolve(null);
            });

            quickscan.startScan();
        });
    }

    async scanSubnet(subnet) {
        const results = [];
        console.log(`Scanning subnet: ${subnet}`);

        try {
            // First do a ping scan to find live hosts
            const pingscan = new nmap.QuickScan(subnet, '-n -sn --min-parallelism 100');
            
            const liveHosts = await new Promise((resolve) => {
                pingscan.on('complete', (data) => {
                    const hosts = data.map(host => host.ip);
                    resolve(hosts);
                });

                pingscan.on('error', (err) => {
                    console.error(`Error scanning subnet ${subnet}: ${err}`);
                    resolve([]);
                });

                pingscan.startScan();
            });

            console.log(`Found ${liveHosts.length} live hosts in ${subnet}`);

            // Scan each live host in parallel
            const scanPromises = liveHosts.map(async (ip) => {
                try {
                    const hostResult = await this.scanHost(ip);
                    if (hostResult) {
                        await this.dbManager.updateServer(hostResult.hostname, hostResult);
                        results.push(hostResult);
                        console.log(`Scanned ${ip}: ${results.length} hosts processed`);
                    }
                } catch (err) {
                    console.error(`Error processing ${ip}: ${err}`);
                }
            });

            await Promise.all(scanPromises);

        } catch (err) {
            console.error(`Error scanning subnet ${subnet}: ${err}`);
        }

        return results;
    }

    async scanAllSubnets() {
        const allResults = [];
        
        for (const subnet of this.subnets) {
            const subnetResults = await this.scanSubnet(subnet);
            allResults.push(...subnetResults);
        }
        
        return allResults;
    }
}

module.exports = SubnetScanner;
