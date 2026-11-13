export async function main(ns:NS) {
    const host = ns.args[0] as string
    const delay = ns.args[1] as number
    await ns.weaken(host, {additionalMsec:delay})
}