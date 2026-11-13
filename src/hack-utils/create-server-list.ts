export async function main(ns:NS) {
    const [minRAM = 1, expandCloud = false, cloudSize = 0] = ns.args as [number?, boolean?, (number | string)?];
    ns.disableLog("scp")
    ns.disableLog("brutessh")
    ns.disableLog("ftpcrack")
    ns.disableLog("getServerMaxRam")

    if (expandCloud) {
        let run = true;
        const servers = ns.cloud.getServerNames();

        if (run) {
            if (servers.length < ns.cloud.getServerLimit()) {ns.tprint("Buying new servers...");}

            for (let i = servers.length + 1; i <= ns.cloud.getServerLimit(); i++) {
                if (!ns.cloud.purchaseServer(`cluster-${i}`, 16)) break;
                ns.tprint(`bought cluster-${i} for ${ns.cloud.getServerCost(16)}`);
            }
        }
        if (servers.length < ns.cloud.getServerLimit()) {run = false;}

        let GB = cloudSize;
        if (run) {
            // parse GB string to RAM
            if (typeof(GB) == "string") {
                if (GB.toLowerCase() == "max") {
                    for (let i = 20; i > Math.log2(ns.getServerMaxRam("cluster-1")); i--) {
                        if (ns.getPlayer().money >= 25 * ns.cloud.getServerUpgradeCost("cluster-1", Math.pow(2, i))) {
                            GB = Math.pow(2, i);
                            break;
                        }
                    }
                } else {throw new Error("Cloudsize as string must be \"max\".");}

                if (typeof(GB) == "string") {GB = -1;}
            }

            if (GB == -1) {
                const nextTier = Math.pow(2, Math.log2(ns.getServerMaxRam("cluster-1")) + 1)
                ns.tprint(`No upgrades possible. Next upgrade (${nextTier} GB) needs \$${25 * ns.cloud.getServerUpgradeCost("cluster-1", nextTier)}.`); run = false;
            } else {
                if (GB % 2 != 0) {throw new Error("RAM must be a power of 2.");} 
                if (ns.getServerMaxRam("cluster-1") >= GB) {ns.tprint(`RAM to upgrade must be larger than current RAM (${ns.getServerMaxRam("cluster-1")} GB found).`); run = false;}
                if (GB > ns.cloud.getRamLimit()) {ns.tprint(`Specified RAM too high, max = ${ns.cloud.getRamLimit()}`); run = false;}
                const upReqMoney = 25 * ns.cloud.getServerUpgradeCost("cluster-1", GB)
                if (ns.getPlayer().money < upReqMoney) {
                    ns.tprint(`Not enough money for synchronus upgrade to ${GB} GB.\n\$${upReqMoney} needed.`);
                    run = false
                }
            }

            if (run) {
                ns.tprint("Upgrading existing servers...");
                for (const server of servers) {
                    const cost = ns.cloud.getServerUpgradeCost(server, GB)
                    if (!ns.cloud.upgradeServer(server, GB)) break;
                    ns.tprint(`Upgraded ${server} to ${GB} GB for ${cost}`)
                }
            }
        }


        ns.tprint("Done Buying / Upgrading Cloud.")
    }

    const serverList = ["home"];
    let index = 0;

    while (serverList.length > index) {
        const connected = ns.scan(serverList[index]);
        for (const server of connected) {
            if (!serverList.includes(server)) {
                serverList.push(server);
            }
        }
        index++;
    }
    serverList.sort((a, b) => ns.getServerMaxRam(b) - ns.getServerMaxRam(a))

    for (const server of serverList) {
        if (server == "home") {continue;}
        if (ns.fileExists("BruteSSH.exe")) {ns.brutessh(server)}
        if (ns.fileExists("FTPCrack.exe")) {ns.ftpcrack(server)}
        if (ns.fileExists("relaySMTP.exe")) {ns.relaysmtp(server)}
        if (ns.fileExists("HTTPWorm.exe")) {ns.httpworm(server)}
        if (ns.fileExists("SQLInject.exe")) {ns.sqlinject(server)}
    }

    ns.write("servers.txt", "", "w")
    for (const server of serverList) {
        if (server == "home") {continue;}
        if (ns.getServerMaxRam(server) < minRAM) continue;
        if (ns.nuke(server)) { 
            ns.scp(["grow.ts", "weaken.ts", "hack.ts"], server, "home")
            ns.write("servers.txt", server + "\n", "a")
        }
    }
    
    ns.write("hackable.txt", "", "w")
    for (const server of serverList) {
        if (ns.getServerMaxMoney(server) == 0) continue;
        if (ns.getPlayer().skills.hacking < ns.getServerRequiredHackingLevel(server)) continue;
        if (ns.nuke(server)) { 
            ns.write("hackable.txt", server + "\n", "a")
        }
    }
}