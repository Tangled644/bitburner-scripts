import { DefaultPorts } from "./lib/Enums";

export async function main(ns:NS) {
    let temp;
    if (ns.args.length > 0) {
        temp = ns.args[0] as boolean ? false : true;
    } else {
        temp = true;
    }
    resetInProgress(ns).catch(() => {ns.print("resetInProgress crashed.")})
    ns.clearPort(DefaultPorts.DNET_LOG);
    ns.clearPort(DefaultPorts.DNET_RUN);
    ns.clearPort(DefaultPorts.DNET_PASSWORD_CACHE);
    ns.tryWritePort(DefaultPorts.DNET_PASSWORD_CACHE, {})

    ns.scp(["lib/Enums.ts", ...ns.ls("home", "dnet/")], "darkweb");
    ns.exec("dnet/propagate.ts", "darkweb", {temporary: temp}, temp);

    while (true) {
        await ns.nextPortWrite(DefaultPorts.DNET_LOG);
        ns.print(ns.readPort(DefaultPorts.DNET_LOG))
    }
}

async function resetInProgress(ns:NS) {
    ns.clearPort(DefaultPorts.DNET_IN_PROGRESS);
    ns.writePort(DefaultPorts.DNET_IN_PROGRESS, []);
    await ns.dnet.nextMutation();
}