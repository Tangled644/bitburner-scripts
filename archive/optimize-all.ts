export async function main(ns: NS) {
    ns.disableLog("getServerMaxMoney");
    ns.disableLog("asleep");

    if (!ns.fileExists("hack-utils/optimize-simple-main.ts")) throw new Error("optimize-main script missing")

    const servers = ns
        .read("hackable.txt")
        .split("\n")
        .filter(s => s !== "")
        .filter(s => ns.getServerSecurityLevel(s) != ns.getServerMinSecurityLevel(s))
        .filter(s => ns.getServerMoneyAvailable(s) != ns.getServerMaxMoney(s));

    ns.tprint(`Queued ${servers.length} servers.`);

    let jobs: { host: string, pid: number }[] = [];

    while (servers.length > 0 || jobs.length > 0) {
        //(ns.getServerMaxRam() - ns.getServerUsedRam() > ns.getScriptRam("hack-utils/optimize-simple-main.ts") && servers.length > 0)
        //(jobs.length < 3 && servers.length > 0)
        while (ns.getServerMaxRam() - ns.getServerUsedRam() > ns.getScriptRam("hack-utils/optimize-simple-main.ts") && servers.length > 0) {
            const nextServer = servers[0];
            const pid = ns.exec("hack-utils/optimize-simple-main.ts", "home", 1, nextServer);
            
            if (pid > 0) {
                jobs.push({ host: nextServer, pid: pid });
                servers.shift()
            } else {
                ns.tprint(`Failed to start optimization for ${nextServer}.`);
            }
            await ns.asleep(100)
        }

        for (let i = jobs.length - 1; i >= 0; i--) {
            if (!ns.isRunning(jobs[i].pid)) {
                ns.tprint(`Finished optimizing ${jobs[i].host}.`);
                jobs.splice(i, 1);
            }
        }

        await ns.asleep(1000);
    }

    ns.tprint("All optimization complete.");
}