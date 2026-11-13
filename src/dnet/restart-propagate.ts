export async function main(ns:NS) {
    ns.scp("dnet/propagate.ts", ns.getHostname(), "home");
    ns.killall(ns.getHostname(), true);
    ns.run("dnet/propagate.ts", {temporary: true});
}