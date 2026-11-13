interface Password {
    host: string,
    pw: string,
}

export async function main(ns:NS) {
    ns.clearPort(12);

    ns.scp(["dnet/propagate.ts", "dnet/dnetServer.ts", "dnet/freeRAM.ts", "dnet/kill-dnet.ts", "dnet/restart-propagate.ts"], "darkweb");
    ns.exec("dnet/propagate.ts", "darkweb", {temporary: true});

    while (true) {
        await ns.nextPortWrite(12);
        ns.print(`INFO: ${ns.readPort(12)}`)
    }
}

async function dnetListener(ns:NS) {
    const rawData = ns.read("dnet/pw.json");
    const pwList: Password[] = (rawData !== "") ? JSON.parse(rawData) : [];

    ns.print("INFO: Starting listener on port 10.")

    while (true) {
        await ns.nextPortWrite(10);

        const rawPw = ns.peek(10);
        const newpw: Password | null = (rawPw && rawPw !== "NULL PORT DATA") ? rawPw as Password : null;
        let unique = true;
        for (const pwObj of pwList) {
            if (newpw === null) {
                unique = false;
                break;
            }
            if (pwObj.host === newpw.host) {
                unique = false;
            }
        }
        if (unique) {
            pwList.push(ns.readPort(10));
            ns.write("dnet/pw.json", JSON.stringify(pwList), "w")
            ns.clearPort(11);
            ns.writePort(11, pwList);
        }
    }
}