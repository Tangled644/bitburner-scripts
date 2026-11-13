import { optimize } from "./optimize-simple";
import { newWorker } from "./simple-workers";

export async function main(ns:NS) {
    ns.disableLog("ALL")

    const [target, maxThreads = 20] = ns.args as [string, number?]
        const servers = ns
        .read("hackable.txt")
        .split("\n")
        .filter(s => s !== "")

    if (!servers.includes(target)) {throw new Error(`${target} not hackable. Try running create-server-list.ts.`)}
    await optimize(ns, target);

    const growTime = ns.getGrowTime(target);
    const weakTime = ns.getWeakenTime(target);
    const hackTime = ns.getHackTime(target);
    const hackAnalyze = ns.hackAnalyze(target);

    const targetHackPercent = 0.01; 
    let bestHack = Math.max(1, Math.floor(targetHackPercent / hackAnalyze));

    const recoveryMultiplier = 1 / (1 - bestHack * hackAnalyze); 
    let bestGrow = Math.ceil(ns.growthAnalyze(target, recoveryMultiplier));

    const hackSec = ns.hackAnalyzeSecurity(bestHack);
    const growSec = ns.growthAnalyzeSecurity(bestGrow);
    const totalSec = hackSec + growSec;
    const bestWeaken = Math.ceil(totalSec / 0.05);

    ns.tprint(`Starting batches with sizes [${bestHack}, ${bestGrow}, ${bestWeaken}]`)
    async function batch(ns:NS, host:string): Promise<void> {
        await newWorker(ns, target, [0, bestGrow, 0], [0, weakTime - growTime, 0]);
        await newWorker(ns, target, [bestHack, 0, 0], [weakTime - hackTime - 50, 0, 0]);
        await newWorker(ns, target, [0, 0, bestWeaken], [0, 0, 50]);
    }

    while (true) {
        await batch(ns, target);
    }
}


