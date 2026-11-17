export async function main(ns:NS) {
    ns.scp(ns.ls("home", "dnet/"), ns.getHostname(), "home");
    ns.killall(undefined, true);
    ns.run("dnet/propagate.ts", {temporary: true}, true);
    await ns.asleep(15000)
}