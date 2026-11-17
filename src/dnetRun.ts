import { DefaultPorts } from "./lib/Enums";

/**
 * Runs a given script on all darknet servers. Pass parameters via ns.args.
 * @param pos1 script to run.
 * @param pos2 threads to run.
 * @param pos3 arguments to pass. any or any[]. 
 * @param pos4 temporary, default false.
 * @example run dnet/dnetRun.ts dnet/kill-dnet.ts
 * @example run dnet/dnetRun.ts dnet/restart-propagate.ts 1 1 true
 */
export async function main(ns:NS) {
    const [script, threads = 1, arg = 1, temp = false] = ns.args as [string, number, any, boolean]
    ns.clearPort(DefaultPorts.DNET_RUN);
    ns.tryWritePort(DefaultPorts.DNET_RUN, {script:script, threads:threads, args:arg});
    if (temp) {
        await ns.asleep(10000);
        ns.clearPort(DefaultPorts.DNET_RUN);
    }
}