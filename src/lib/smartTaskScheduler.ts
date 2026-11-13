interface Job {
        ram: number;
        expiresAt: number;
    }

class OutOfMemoryError extends Error {}

class Ser {
    #usedRam: number = 0;
    #jobs: Job[] = [];
    #lazyFreeRAM:number;

    constructor(
        public readonly name: string = name, 
        public readonly maxRam: number
    ) {
        this.name = name;
        this.maxRam = maxRam;
        this.#lazyFreeRAM = maxRam;
    }

    /**
     * Evaluates job expiry queue.
     * @returns Current amount of free RAM on the server.
     */
    update(): number {
        const now = Date.now();
        let freedRam = 0;
        this.#jobs = this.#jobs.filter(task => {
            if (task.expiresAt <= now) {
                freedRam += task.ram;
                return false;
            }
            return true;
        });
        
        this.#usedRam -= freedRam;
        this.#lazyFreeRAM = this.maxRam - this.#usedRam;
        return this.#lazyFreeRAM;
    }

    /**
     * Evaluates job expiry queue.
     */
    updateNoReturn(): void {
        const now = Date.now();
        let freedRam = 0;
        this.#jobs = this.#jobs.filter(task => {
            if (task.expiresAt <= now) {
                freedRam += task.ram;
                return false;
            }
            return true;
        });
        
        this.#usedRam -= freedRam;
        this.#lazyFreeRAM = this.maxRam - this.#usedRam;
    }

    /**
     * Allocates as many threads as possible to this given server, returns non-allocated thread count.
     * @param threads Threads to try and allocate to this server.
     * @param durationMs How long to allocate RAM.
     */
    allocateMaxThreads(threads: number, durationMs: number): number {
        const freeTasks = Math.floor(this.update() / 1.75);
        const deploy = Math.min(freeTasks, threads);
        this.#usedRam += deploy * 1.75;
        this.#jobs.push({ 
            ram: deploy * 1.75, 
            expiresAt: Date.now() + durationMs 
        });
        return deploy;
    }

    /**
     * Allocates given number of threads to this server.
     * Ensure the server has enough RAM for threads. 
     * @param threads Number of threads to allocate.
     * @param durationMs How long to allocate RAM.
     */
    allocateThreads(threads: number, durationMs: number): void {
        const freeTasks = Math.floor(this.update() / 1.75);
        if (threads > freeTasks) throw new OutOfMemoryError(`freeTasks: ${freeTasks}`)
        this.#usedRam += threads * 1.75;
        this.#jobs.push({ 
            ram: threads * 1.75, 
            expiresAt: Date.now() + durationMs 
        });
        this.#lazyFreeRAM -= threads * 1.75;
    }
    
    /**
     * Allocates given RAM to this server.
     * Ensure the server has enough RAM.
     * @param ram RAM to allocate.
     * @param durationMs How long to allocate RAM.
     */
    allocateRam(ram: number, durationMs: number): void {
        if (ram > this.update()) throw new OutOfMemoryError(`freeRAM: ${this.#lazyFreeRAM}`)
        this.#usedRam += ram;
        this.#jobs.push({ 
            ram, 
            expiresAt: Date.now() + durationMs
        });
        this.#lazyFreeRAM -= ram;
    }

    /**
     * Runs threads of given type on server.
     * Tries to run as many threads as the server can.
     * Returns leftover thread count.
     * @param threads How many threads of type to run on target.
     * @param durationMs Duration to allocate RAM.
     * @param type hack.ts, grow.ts, weaken.ts
     */
    runJob(ns:NS, threads: number, durationMs: number, target:string, type: string, additionalMsec:number): number {
        this.updateNoReturn()
        const thread = Math.min(Math.floor(this.#lazyFreeRAM / 1.75), threads)
        if (thread === 0) {return threads;}
        this.#usedRam += thread * 1.75;
        this.#jobs.push({ 
            ram: thread * 1.75, 
            expiresAt: Date.now() + durationMs 
        });
        
        ns.exec(type, this.name, {threads: thread, temporary: true}, target, additionalMsec);
        return threads - thread;
    }
}

export class TaskScheduler {
    #servers: Map<string, Ser> = new Map();
    #totalFreeThreads: number = 0;
    #ramDelay = 100;

    constructor(serList: Map<string, number>) {
        for (const [name, maxRam] of serList) {
            this.#servers.set(name, new Ser(name, maxRam));
            this.#totalFreeThreads += Math.floor(maxRam / 1.75);
        }
    }

    /**
     * Static method to convert file to server list.
     * Expects server list to be newline-deliminated strings.
     * @param file Filepath to server list file.
     * @returns Map object for TaskScheduler constructor.
     */
    static mapServers(ns:NS, file: string, home: boolean = false): Map<string, number> {
        const ser = ns.read(file).split("\n").filter(s => s !== "")
        const homeServer = 128
        const map = new Map();
        if (home) {
            if (ns.getServerMaxRam("home") > 128) {
                map.set("home", ns.getServerMaxRam("home") - 128)
            }
        }
        for (const s of ser) {
            const ram = ns.getServerMaxRam(s);
            if (ram > 0) map.set(s, ram);
        }
        return map;
    }

    /**
     * Evaluates job RAM expiry queue for all server objects.
     */
    updateAll(): void {
        for (const server of this.#servers.values()) {
            server.updateNoReturn();
        }
    }

    /**
     * Evaluates job RAM expiry queue for all server objects.
     * Updates #totalFreeThreads counts.
     */
    updateFreeThreadCt(): void {
        this.#totalFreeThreads = 0;
        for (const ser of this.#servers.values()) {
            const free = ser.update()
            this.#totalFreeThreads += Math.floor(free / 1.75);
        }
    }

    /**
     * Asynchrously updates local instance of free threads.
     * In theory unnecesscary.
     */
    async startLazyFreeThreadsSync(ns:NS) {
        while (true) {
            this.updateFreeThreadCt();
            await ns.asleep(10000);
        }
    }

    /**
     * Function for allocating memory usage to the cluster. Does not call ns.exec.
     * For most uses, prefer assignThreads(), which calls H/G/W.
     * @param threadct Number of threads to allocate.
     * @param durationMs How long to allocate RAM for, milliseconds.
     * @returns true if all threads were allocated, false if entire cluster does not have enough RAM.
     */
    allocateThreads(threadct: number, durationMs: number): boolean {
        if (threadct < 1 || !Number.isInteger(threadct)) throw new TypeError("threadct must be a positive integer.");
        if (durationMs < 0 || !Number.isInteger(durationMs)) throw new TypeError("durationMs nust be a nonnegative integer.");

        if (threadct > this.#totalFreeThreads) {
            this.updateFreeThreadCt();
            if (threadct > this.#totalFreeThreads) {return false;}
        }

        for (const server of this.#servers.values()) {
            if (threadct == 0) break;
            threadct -= server.allocateMaxThreads(threadct, durationMs);
        }

        this.#totalFreeThreads -= threadct;
        return true;
    }

    /**
     * Function for batch allocating memory usage to the cluster. Does not call ns.exec.
     * For most uses, prefer assignBatch(), which calls H/G/W.
     * @param batchCts Array, Number of each thread to allocate.
     * @param durationMs Array, How long to allocate each type for, milliseconds.
     * @returns true if entire batch was allocated, false if entire cluster does not have enough RAM.
     */
    allocateBatch(batchCts: number[], durationMs: number[]): boolean {
        if (batchCts.length == 0) throw new RangeError("batchCts must be nonempty.");
        if (durationMs.length == 0) throw new RangeError("durationMs must be nonempty.");
        for (const i of batchCts) {if (i < 1 || !Number.isInteger(i)) throw new TypeError("Values of batchCts must be positive integers.");}
        for (const i of durationMs) {if (i < 0 || !Number.isInteger(i)) throw new TypeError("Values of durationMs must be nonnegative integers.");}
        if (batchCts.length !== durationMs.length) throw new Error("batchCts and durationMs must have equal length.");

        const totalThreads = batchCts[0] + batchCts[1] + batchCts[2]
        if (totalThreads > this.#totalFreeThreads) {
            this.updateFreeThreadCt();
            if (totalThreads > this.#totalFreeThreads) {return false;}
        }

        for (let i = 0; i < batchCts.length; i++) {
            for (const server of this.#servers.values()) {
                if (batchCts[i] == 0) break;
                batchCts[i] -= server.allocateMaxThreads(batchCts[i], durationMs[i]);
            }
        }

        this.#totalFreeThreads -= totalThreads;
        return true;
    }

    /**
     * Helper function for spreading jobs across cluster. Behavior similar to allocateThreads(), does call ns.exec.
     * Can be invoked directly, but durationMs is taken as job length.
     * In most cases, call assignThreads(), which will call newThreads().
     * 
     * WARNING - Does not validate inputs. Does not guarentee cluster has enough RAM.
     */
    newThreads(ns:NS, threadct: number, durationMs: number, target: string, job: string, additionalMsec: number) {
        for (const server of this.#servers.values()) {
            if (threadct == 0) break;
            threadct = server.runJob(ns, threadct, durationMs, target, job, additionalMsec);
        }
        return true;
    }

    /**
     * Runs a batch of given size. Ensure arrays are of same size.
     * Jobs in a batch are run at the same time, delay outputs with additionalMsecArr.
     * Ensure durationArr is of sufficient size - the memory manager depends on it. 
     * 
     * WARNING - Does not validate inputs.
     * @param threadArr Array of threads.
     * @param additionalMsecArr Array of times to pass to additionalMsec.
     * @param typeArr Array of job to perform. "hack.ts" / "grow.ts" / "weaken.ts".
     * @param durationArr Array of duration to allocate RAM.
     * @param host target server to hack.
     * @returns true if all jobs were executed, false if the server does not have enough RAM.
     */
    assignBatches(ns:NS, threadArr: number[], additionalMsecArr: number[], typeArr: string[], durationArr: number[], host: string): boolean {
        let threadCt = 0;
        for (const thread of threadArr) {
            threadCt += thread;
        }
        if (threadCt > this.#totalFreeThreads) {
            this.updateFreeThreadCt();
            if (threadCt > this.#totalFreeThreads) {return false;}
        }
        for (let i = 0; i < threadArr.length; i++) {
            this.newThreads(ns, threadArr[i], durationArr[i], host, typeArr[i], additionalMsecArr[i])
        }

        this.#totalFreeThreads -= threadCt;
        return true;
    }

    /**
     * Optimize a given server.
     * Suggested to await.
     * @param host server to optimize.
     * @param player player object, if using Formulas API.
     */
    async optimize(ns:NS, host: Server, player?: (Player | undefined)) {
        if (typeof(player) == "undefined") {

            let curRatio = ns.getServerMoneyAvailable(host.hostname) / ns.getServerMaxMoney(host.hostname);
            if (curRatio === 0) curRatio = 0.01;
            let growThreads = Math.ceil(ns.growthAnalyze(host.hostname, (1 / curRatio)));
            let weakThreads = Math.ceil((ns.getServerSecurityLevel(host.hostname) - ns.getServerMinSecurityLevel(host.hostname)) / 0.05)
            ns.print(`INFO: Optimizing ${host.hostname}`)
            ns.print(`INFO: growThreads = ${growThreads}, weakThreads = ${weakThreads}`)
            this.updateFreeThreadCt()
            while (weakThreads > this.#totalFreeThreads) {
                const weakenTime = ns.getWeakenTime(host.hostname);
                this.assignBatches(ns, [this.#totalFreeThreads], [0], ["weaken.ts"], [weakenTime], host.hostname);
                weakThreads -= this.#totalFreeThreads;
                await ns.asleep(weakenTime + 1000);
                this.updateFreeThreadCt();
            }
            if (weakThreads > 0) {
                const weakenTime = ns.getWeakenTime(host.hostname);
                this.assignBatches(ns, [weakThreads], [0], ["weaken.ts"], [weakenTime], host.hostname); 
            }
            this.updateFreeThreadCt()
            await ns.asleep(1000); 
            while (growThreads * 3 > this.#totalFreeThreads) {
                const grTdToRun = Math.floor(this.#totalFreeThreads / 3);
                const weakenTime = ns.getWeakenTime(host.hostname);
                this.assignBatches(ns, [grTdToRun, 2 * grTdToRun], [weakenTime - ns.getGrowTime(host.hostname) - 50, 0], ["grow.ts", "weaken.ts"], [weakenTime - 50, weakenTime], host.hostname);
                growThreads -= grTdToRun;
                await ns.asleep(weakenTime + 1000);
                this.updateFreeThreadCt();
            }
            this.assignBatches(ns, [growThreads, 2 * growThreads], [ns.getWeakenTime(host.hostname) - ns.getGrowTime(host.hostname) - 50, 0], ["grow.ts", "weaken.ts"], [ns.getWeakenTime(host.hostname) - 50, ns.getWeakenTime(host.hostname)], host.hostname);
            if ((ns.getServerSecurityLevel(host.hostname) != ns.getServerMinSecurityLevel(host.hostname)) || (ns.getServerMoneyAvailable(host.hostname) != ns.getServerMaxMoney(host.hostname))) {
                await ns.asleep(ns.getWeakenTime(host.hostname) + 1000);
            }
            if (ns.getServerSecurityLevel(host.hostname) > ns.getServerMinSecurityLevel(host.hostname) + 0.01 || ns.getServerMoneyAvailable(host.hostname) < ns.getServerMaxMoney(host.hostname) * 0.99) {
                throw new Error(`Optimization Failed on ${host.hostname}. Sec: ${ns.getServerSecurityLevel(host.hostname)} (Target: ${ns.getServerMinSecurityLevel(host.hostname)}), Money: ${ns.getServerMoneyAvailable(host.hostname)} (Target: ${ns.getServerMaxMoney(host.hostname)})`);
            }


            ns.print(`INFO: Optimization on ${host.hostname} done.`)
        } 
    }

    /**
     * Collection of batch strategies to run.
     * Optimize the server first.
     * 
     * @param strategy Batching strategy to use.
     * @param host Target to hack.
     * @param player Player object
     * @param args Parameter of given strategy.
     */
    async batch(ns:NS, strategy: string = "percent", host: Server, param?: (number | undefined), player?: (Player | undefined)) {
        ns.print("WARN: Ensure the server is already optimal.")
        switch (strategy.toLowerCase()) {
            case "percent": {
                if (typeof(param) == "undefined") {throw new RangeError("Percent must be between 0 and 1 exclusive.")}
                const percent = param;
                if (typeof(player) == "undefined") {
                    const hAnalyze = ns.hackAnalyze(host.hostname);
                    const bestHack = Math.max(1, Math.floor(percent / hAnalyze));
                    const recoveryMultiplier = 1 / (1 - bestHack * hAnalyze); 
                    const bestGrow = Math.ceil(ns.growthAnalyze(host.hostname, recoveryMultiplier));
                    const hackWeaken = Math.ceil(ns.hackAnalyzeSecurity(bestHack) / 0.05);
                    const growWeaken = Math.ceil(ns.growthAnalyzeSecurity(bestGrow) / 0.05);
                    this.updateFreeThreadCt()
                    ns.print(`INFO: Starting batch with counts: [Hack: ${bestHack}, Weaken: ${hackWeaken}, Grow: ${bestGrow}, Weaken: ${growWeaken}, Total:${bestHack + hackWeaken + bestGrow + growWeaken}]`);
                    if (this.#totalFreeThreads < bestHack + hackWeaken + bestGrow + growWeaken) throw new Error(`Not enough RAM for given percentage. ${this.#totalFreeThreads} threads free.`)

                    while (true) {
                        const ht = ns.getHackTime(host.hostname);
                        const gt = ns.getGrowTime(host.hostname);
                        const wt = ns.getWeakenTime(host.hostname);
                        this.assignBatches(ns, 
                            [bestHack, hackWeaken, bestGrow, growWeaken],
                            [wt - ht - 50, 0, wt - gt + 50, 100],
                            ["hack.ts", "weaken.ts", "grow.ts", "weaken.ts"],
                            [this.#ramDelay + wt - 50, this.#ramDelay + wt, this.#ramDelay + wt + 50, this.#ramDelay + wt + 100],
                            host.hostname,
                        )
                        await ns.asleep(200);
                    }
                } else {}
            }
            default: throw new TypeError("Specify a valid batching strategy.")
                
        }
        
    }

    // switch code.

    // let opTime: number;
    //     if (player !== undefined) {
    //         switch (type) {
    //             case "H":
    //                 opTime = ns.formulas.hacking.hackTime(host, player);
    //                 break;
    //             case "G":
    //                 opTime = ns.formulas.hacking.growTime(host, player);
    //                 break;
    //             case "W":
    //                 opTime = ns.formulas.hacking.weakenTime(host, player);
    //                 break;
    //         }
    //     } else {
    //         switch (type) {
    //             case "H":
    //                 opTime = ns.getHackTime(host.hostname);
    //                 break;
    //             case "G":
    //                 opTime = ns.getGrowTime(host.hostname);
    //                 break;
    //             case "W":
    //                 opTime = ns.getWeakenTime(host.hostname);
    //                 break;
    //         }
    //     }

    // /**
    //  * @ - seperate this into a part that runs time calculations and passes it into a second function that assigns time delays to servers and runs the jobs.
    //  * Creates threads of a given type.
    //  * @deprecated - use assignBatches with single argument for similar behavior.
    //  * 
    //  * WARNING - Does not validate inputs. 
    //  * @param threadct Number of threads to allocate.
    //  * @param type Type of Hack / Grow / Weaken. Takes strings "H" / "G" / "W".
    //  * @param additionalMsec Additional M
    //  * @param host Host server to Hack / Grow / Weaken. From getServer
    //  * @param player Player object, pass ns.getPlayer(). If present, will try to call Formulas API.
    //  * @returns true if all threads were started, false if entire cluster does not have enough RAM.
    //  */
    // assignThreads(ns:NS, threadct: number, type: string, additionalMsec: number, host: Server, player?: (Player | undefined)): boolean {
    //     throw new Error("broken currently use assignBatches().")
    //     if (threadct > this.#totalFreeThreads) {
    //         this.updateFreeThreadCt();
    //         if (threadct > this.#totalFreeThreads) {return false;}
    //     }
    //     return true;
    // }

    // /**
    //  * Attempts to find servers to fit all input threads provided.
    //  * @deprecated unsupported, functionality may break. 
    //  * @param sizes Input threads, can be of any length.
    //  * @returns Array of identical size to input, server name, null if no server found.
    //  */
    // findThreadFit(sizes: number[]): (string | null)[] {
    //     const fittingServers = [];
    //     this.updateFreeThreadCt();
    //     for (let [name, threads] of this.#freeThreads) {
    //         for (let threadCt of sizes) {
    //             if (threads <= threadCt) {
    //                 threads -= threadCt;
    //                 threadCt = -1;
    //                 sizes.shift()
    //                 fittingServers.push(name);
    //             }
    //             if (threadCt !== -1) {
    //                 break;
    //             }
    //         }
    //     }
    //     for (const i of sizes) {
    //         fittingServers.push(null)
    //     }
    //     return fittingServers;
    // }
}