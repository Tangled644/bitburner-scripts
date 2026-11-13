export async function main(ns:NS) {
    const serList = [["home"]];
    let i = 0;
    let found: string[] = [];
    const toFind = (ns.args[0] as string).toLowerCase();

    BFS: while (serList.length > i) {
        const connected = ns.scan(serList[i][0]);
        for (const server of connected) {
            if (server == serList[i][1]) {
                continue;
            }
            // ns.tprint(server)
            // ns.tprint(serList[i])
            // ns.tprint("-----")
            if (server.toLowerCase() == toFind) {
                found = structuredClone(serList[i]);
                found.unshift(server);
                found.reverse();
                break BFS;
            }
            const newArr = structuredClone(serList[i]);
            newArr.unshift(server);
            serList.push(newArr);
        }
        i++;
    }

    let outString = "";
    for (const server of found) {
        outString = outString + "connect " + server + ";";
    }
    ns.tprint(outString)
}