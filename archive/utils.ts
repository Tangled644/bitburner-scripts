export async function main(ns: NS) {
    return findBestServer(ns, findServers(ns))
}

export function findServers(ns: NS, start: string = "home"): string[] {
    const serverList = [start];
    let index: number = 0;

    while (serverList.length > index) {
        const connected = ns.scan(serverList[index]);
        for (const server of connected) {
            if (!serverList.includes(server)) {
                serverList.push(server);
            }
        }
        index++;
    }

    ns.print(serverList);
    return serverList;
}

export function findBestServer(ns: NS, serverList: string[]): string {
    const filter = [];
    let noPorts = false;

    if (!ns.fileExists("BruteSSH.exe")) {
        noPorts = true;
    }

    for (const server of serverList) {
        if (ns.getServerRequiredHackingLevel(server) / 2 > ns.getHackingLevel()) {
            continue;
        }

        if (noPorts && ns.getServerNumPortsRequired(server) > 0) {
            continue;
        }

        filter.push(server);
    }

    let best: string = "";
    let bestRatio: number = 0;
    for (const server of filter) {
        let difRatio = ns.getServerMaxMoney(server) / ns.getServerMinSecurityLevel(server);
        if ((best === "") || (difRatio > bestRatio)) {
            best = server;
            bestRatio = difRatio;
        }
    }

    ns.print(best);
    return best;
}

export function findPath(ns: NS, hostname: string): string[] {
    const out: string[] = []
    let done: boolean = false;




    return out.reverse();
}