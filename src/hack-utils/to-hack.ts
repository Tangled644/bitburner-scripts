export async function main(ns:NS) {
    const hack = ns.read("hackable.txt").split("\n").filter(s => s !== "").filter(s => ns.getServerMaxRam(s) > 0);

    hack.sort((a, b) => (ns.getServerMaxMoney(b) - ns.getServerMaxMoney(a)))
    // for (const ser of hack) {
    //     ns.tprint(`${ser}: maxMoney: ${ns.getServerMaxMoney(ser)}, growth: ${ns.getServerGrowth(ser)}, weakTime: ${ns.formulas.hacking.weakenTime(ns.getServer(ser), ns.getPlayer())}`)
    // }
    for (const ser of hack) {
        ns.tprint(`${ser}: maxMoney: ${ns.getServerMaxMoney(ser).toExponential(2)}, growth: ${ns.getServerGrowth(ser)}, mindiff: ${ns.getServerMinSecurityLevel(ser)} hacklevel: ${ns.getServerRequiredHackingLevel(ser)}`)
    }
}