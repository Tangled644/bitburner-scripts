export async function main(ns:NS) {
    let details = ns.dnet.getServerDetails()
    let blockedThreads = Math.ceil(ns.dnet.getBlockedRam() / ns.formulas.dnet.getExpectedRamBlockRemoved(details))
    
    while (blockedThreads > 0) {
        while (ns.getServerMaxRam() - ns.getServerUsedRam() > 2.6) {
            ns.run("dnet/freeRAM.ts", {temporary: true})
            blockedThreads--;
        }
        await ns.asleep(5000);
    }

    while (ns.dnet.getBlockedRam() > 0) {
        await ns.asleep(5000);
    }

    const freeRAM = ns.getServerMaxRam() - ns.getServerUsedRam()
    const cache = ns.ls(ns.getHostname(), ".cache")
    for (const c of cache) {
        ns.tryWritePort(12, ns.dnet.openCache(c, true).message)
    }

    while (true) {
        await ns.nextPortWrite(13);
        const action = ns.peek(13);
        try {
            ns.run(action.script, {threads:action.threads, temporary:true}, action.args);
        } catch {}
    }
}