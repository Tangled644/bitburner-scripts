import { newWorker } from "./simple-workers";

export async function optimize(ns:NS, host:string): Promise<void> {

    const weakThreads = Math.ceil((ns.getServerSecurityLevel(host) - ns.getServerMinSecurityLevel(host)) / 0.05);
    
    if (weakThreads > 0) {
        ns.tprint(`Initial weaken on ${host}, ${weakThreads} to run.`)

        await newWorker(ns, host, [0, 0, weakThreads]);
        await ns.asleep(ns.getWeakenTime(host));
    }

    let curRatio = ns.getServerMoneyAvailable(host) / ns.getServerMaxMoney(host);
    if (curRatio === 0) curRatio = 0.01;
    let growThreads = Math.ceil(ns.growthAnalyze(host, (1 / curRatio)));

    ns.tprint(`Grow on ${host}, ${growThreads} to run. ${Math.round(ns.getServerMoneyAvailable(host))} / ${ns.getServerMaxMoney(host)} maxMoney.`)

    while (growThreads > 0) {
        const growTime = ns.getGrowTime(host)
        const weakenTime = ns.getWeakenTime(host)
        await newWorker(ns, host, [0, 1, 2], [0, weakenTime - growTime - 50, 0]);
        growThreads--;
    } 

    while ((ns.getServerSecurityLevel(host) != ns.getServerMinSecurityLevel(host)) || 
           (ns.getServerMoneyAvailable(host) != ns.getServerMaxMoney(host)))
            {await ns.asleep(5000);}
}