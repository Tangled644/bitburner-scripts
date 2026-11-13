export async function main(ns:NS) {
    ns.clearPort(13);
    ns.tryWritePort(13, {script:ns.args[0], threads:ns.args[1], args:ns.args[2]})
}