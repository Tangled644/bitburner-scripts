import { DefaultPorts as Port} from "../lib/Enums";

export async function main(ns:NS) {
    fish(ns).catch((e) => {
        ns.print(`ERROR: fish crashed. Reason: ${e}`);
    });
    
    while (true) {
        const action = ns.peek(Port.DNET_RUN);
        try {
            ns.run(action.script, {preventDuplicates:true, threads:action.threads, temporary: ns.args[0] as boolean}, action.args);
        } catch(e) {ns.print(`Recieved incorrect run: ${action}`)}
        await ns.nextPortWrite(Port.DNET_RUN);
    }
}

async function fish(ns:NS) {
    while (ns.dnet.getBlockedRam() > 0) {
        ns.run("dnet/reallocateMemory.ts", {temporary: true});
        await ns.asleep(10000);
    }
    cash(ns);

    try {
        ns.run("dnet/fishing.ts", {threads:Math.floor((ns.getServerMaxRam() - 14.05) / 3.6), temporary: ns.args[0] as boolean});
        while (true) {
            cash(ns);
            await ns.asleep(30000);
        }
    } catch {
        ns.print(`WARN: no RAM to fish on ${ns.getHostname()}`)
    }
}

function cash(ns:NS) {
    for (const c of ns.ls(ns.getHostname(), ".cache")) {
        ns.tryWritePort(Port.DNET_LOG, `INFO: ${ns.dnet.openCache(c, true).message}`)
    }
}