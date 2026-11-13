import { TaskScheduler } from "./lib/smartTaskScheduler";

export async function main(ns:NS) {
    ns.disableLog("ALL")
    const TS = new TaskScheduler(TaskScheduler.mapServers(ns, "servers.txt", ns.args[2] as boolean));
    
    
    const server = ns.getServer(ns.args[0] as string)
    await TS.optimize(ns, server)
    await TS.batch(ns, "percent", server, ns.args[1] as number)
}