import { TaskScheduler } from "./lib/smartTaskScheduler";

export async function main(ns:NS) {
    const map = new Map
    const TS = new TaskScheduler(map.set("home", 128));

    // TS.newThreads(ns, 100000, ns.getWeakenTime("n00dles"), "n00dles", "weaken.ts", 0)
    TS.assignBatches(ns, [128], [0], ["weaken.ts"], [ns.getWeakenTime("n00dles")], "n00dles")
}