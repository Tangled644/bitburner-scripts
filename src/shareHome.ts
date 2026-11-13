export async function main(ns:NS) {
    const threads = Math.floor((ns.getServerMaxRam("home") - ns.getServerUsedRam("home")) / 4) - 2;
    ns.exec("share.ts", "home", {threads:threads, temporary:true});
}