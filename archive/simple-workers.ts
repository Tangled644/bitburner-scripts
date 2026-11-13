/**
 * @param threads [hack, grow, weaken], executes in order hack, grow, weaken.
 * @param [ser_file="servers.txt"] server list file.
*/ 
export async function newWorker(ns:NS, host:string, threads:number[], delays:number[] = [0, 0, 0], timeout:number = 5000, ser_file:string = "servers.txt"): Promise<void> {

    const types = ["hack.ts", "grow.ts", "weaken.ts"];
    const servers = ns.read(ser_file).split("\n").filter(s => s !== "");
    const scriptRam = types.map((x) => ns.getScriptRam(x));

    for (let i = 0; i < types.length; i++) {
        while (threads[i] > 0) {
            let deployed = false;
            
            for (const server of servers) {
                const maxInstance = Math.floor((ns.getServerMaxRam(server) - ns.getServerUsedRam(server)) / scriptRam[i]);
                
                if (maxInstance <= 0) continue;
                
                const threadsToRun = Math.min(threads[i], maxInstance);
                const pid = ns.exec(types[i], server, threadsToRun, host, delays[i]);

                if (pid > 0) {
                    threads[i] -= threadsToRun; 
                    deployed = true;
                }

                if (threads[i] <= 0) break;
            }
                        
            if (!deployed) {
                ns.print(`Out of server memory. Waiting ${timeout}ms. (${threads[i]} ${types[i]} threads remaining)`);
                await ns.asleep(timeout);
            }
        }
    }
}