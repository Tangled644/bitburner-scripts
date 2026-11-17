import { DefaultPorts as Port } from "../lib/Enums"

interface returnedLogs {
    code: number,
    passwordAttempted: string,
    message: string,
    data?: string,
}

export async function main(ns:NS) {
    const temp = ns.args[0] as boolean;
    ns.exec("dnet/dnetServer.ts", ns.getHostname(), {preventDuplicates: true, temporary: temp}, temp)
    ns.disableLog("scp")

    if (ns.ls(ns.getHostname(), "STORM_SEED.exe").length > 0) {
        ns.dnet.unleashStormSeed()
    }

    while (true) {
        const dnetList = ns.dnet.probe();
        const sTime = Date.now();

        for (const server of dnetList) {
            const inProgress = ns.peek(Port.DNET_IN_PROGRESS) as string[];
            if (inProgress.includes(server)) {continue;}
            ns.clearPort(Port.DNET_IN_PROGRESS);
            ns.writePort(Port.DNET_IN_PROGRESS, inProgress.concat(server));
            const auth = await serverSolver(ns, server);
            ns.writePort(Port.DNET_IN_PROGRESS, (ns.readPort(Port.DNET_IN_PROGRESS) as string[]).filter((s) => s !== server));
            if (!auth) {continue;}

            ns.scp(["lib/Enums.ts", ...ns.ls("home", "dnet/")], server, "home");
            ns.exec(ns.getScriptName(), server, {preventDuplicates: true, temporary: temp}, temp)
        }

        if (Date.now() - sTime < 10000) {
            await ns.dnet.nextMutation();
        }
    }
}

/**
 * Tries to guess a Dnet Host's password.
 * @param host Hostname.
 * @returns true if solved, false otherwise.
 */
async function serverSolver(ns:NS, host: string): Promise<boolean> {
    const details = ns.dnet.getServerDetails(host);
    if (!details.isConnectedToCurrentServer || !details.isOnline) {
        return false;
    }

    if (details.hasSession) {
        return true;
    }

    if (guessPass(ns, host)) {
        return true;
    }

    switch (details.modelId) {
        case "ZeroLogon":
            return ZeroLogon(ns, host);
        case "DeskMemo_3.1":
            return DeskMemo_3_1(ns, host, details);
        case "CloudBlare(tm)":
            return CloudBlaretm(ns, host, details);
        case "FreshInstall_1.0":
            return FreshInstall_1_0(ns, host, details);
        case "PHP 5.4":
            return PHP5_4(ns, host, details)
        case "Pr0verFl0":
            return Pr0verFl0(ns, host);
        case "Laika4":
            return Laika4(ns, host);
        case "OctantVoxel":
            return OctantVoxel(ns, host, details);
        case "OpenWebAccessPoint":
            return OpenWebAccessPoint(ns, host, details);
        case "DeepGreen":
            return DeepGreen(ns, host, details);
        case "BellaCuore":
            return BellaCuore(ns, host, details);
        case "AccountsManager_4.2":
            return AccountsManager_4_2(ns, host, details);
        case "NIL":
            return NIL(ns, host, details);
        case "Factori-Os":
            return Factori_Os(ns, host, details);
        default:
            ns.tryWritePort(Port.DNET_LOG, `WARN: Unrecognized modelId: ${details.modelId} on Host ${host}`);
            return false;
    }
}

// Below is functions to guess passwords. Below that are some helper functions.


async function ZeroLogon(ns:NS, host: string): Promise<boolean> {
    const result = await ns.dnet.authenticate(host, "");
    if (!result.success && result.code == 401) {
        ns.tryWritePort(Port.DNET_LOG, `ERROR: Failed ZeroLogon: ${host}`)
    }
    return result.success;
}

async function DeskMemo_3_1(ns:NS, host: string, details: DarknetServerDetails): Promise<boolean> {
    const pass = details.passwordHint.replaceAll(/\D/g, "");
    const result = await ns.dnet.authenticate(host, pass);
    if (!result.success && result.code == 401) {
        ns.tryWritePort(Port.DNET_LOG, `ERROR: Failed DeskMemo_3_1: ${host}, Password:${pass}`)
    }
    return result.success;
}

async function CloudBlaretm(ns:NS, host: string, details: DarknetServerDetails): Promise<boolean> {
    const pass = details.data.replaceAll(/\D/g, "");
    const result = await ns.dnet.authenticate(host, pass);
    if (!result.success && result.code == 401) {
        ns.tryWritePort(Port.DNET_LOG, `ERROR: Failed CloudBlaretm: ${host}, Password: ${pass}`)
    }
    return result.success;
}

async function FreshInstall_1_0(ns:NS, host: string, details: DarknetServerDetails): Promise<boolean> {
    let pass = "password";
    if (details.passwordLength === 5) {
        pass = "12345";
    } 
    if (details.passwordLength === 4) {
        pass = "0000";
    } 
    if (details.passwordFormat === "alphabetic" && details.passwordLength != 8) {
        pass = "admin";
    }
    const result = await ns.dnet.authenticate(host, pass);
    if (!result.success && result.code == 401) {
        ns.tryWritePort(Port.DNET_LOG, `ERROR: Failed FreshInstall_1_0: ${host}, Password: ${pass}`);
    }
    return result.success;
}

async function PHP5_4(ns:NS, host: string, details: DarknetServerDetails): Promise<boolean> {
    const pass = permute(details.data.split("").map(i => Number(i)));
    let result: DarknetResult & { data?: any; } = {success:false, code:200, message:"null"};
    let pw: string = "";

    for (let i = 0; i < pass.length; i++) {
        result = (await ns.dnet.authenticate(host, pass[i].toString().replaceAll(",", "")));
        if (result.success) {pw = pass[i].toString().replaceAll(",", ""); savePass(ns, host, pw); break;}
    }
    if (!result.success && result.code === 401) {
        ns.tryWritePort(Port.DNET_LOG, `ERROR: Failed PHP5_4: ${host}, Password: ${pass}`);
    }
    return result.success;
}

async function Pr0verFl0(ns:NS, host:string): Promise<boolean> {
    const pass = "111111111111111111111111";
    const result = await ns.dnet.authenticate(host, pass);
    if (!result.success && result.code === 401) {
        ns.tryWritePort(Port.DNET_LOG, `ERROR: Failed Pr0verFl0: ${host}, Password: ${pass}`);
    }
    return result.success;
}

async function Laika4(ns:NS, host:string): Promise<boolean> {
    const pass = ["fido", "spot", "rover", "max"];
    let result: DarknetResult & { data?: any; } = {success:false, code:200, message:"null"};
    let pw: string = "";

    for (let i = 0; i < pass.length; i++) {
        result = (await ns.dnet.authenticate(host, pass[i].toString().replaceAll(",", "")));
        if (result.success) {pw = pass[i].toString(); savePass(ns, host, pw); break;}
    }
    if (!result.success && result.code === 401) {
        ns.tryWritePort(Port.DNET_LOG, `ERROR: Failed Laika4: ${host}, Password: ${pass}`);
    }
    return result.success;
}

async function OctantVoxel(ns:NS, host:string, details: DarknetServerDetails): Promise<boolean> {
    const [baseStr, number] = details.data.split(",");
    const base = Number(baseStr);
    const numArr = number.split("").reverse();
    let sum = 0;
    for (let i = 0; i < numArr.length; i++) {
        sum += (Math.pow(base, i) * strToNum(numArr[i]))
    }

    const result = await ns.dnet.authenticate(host, String(sum));
    if (!result.success && result.code === 401) {
        ns.tryWritePort(Port.DNET_LOG, `ERROR: Failed OctantVoxel: ${host}, Password: ${String(sum)}`);
    }
    return result.success;
}

async function BellaCuore(ns:NS, host:string, details: DarknetServerDetails): Promise<boolean> {
    const arr = details.data.split("").map(s => {
        if (s === "M") {return 1000};
        if (s === "D") {return 500};
        if (s === "C") {return 100};
        if (s === "L") {return 50};
        if (s === "X") {return 10};
        if (s === "V") {return 5};
        if (s === "I") {return 1};
        return 0;
    })

    let sum = 0;
    for (let i = 0; i < arr.length; i++) {
        if (i != arr.length - 1) {
            if (arr[i] < arr[i+1]) {
                sum += (arr[i+1] - arr[i]);
                i++;
            } else {
                sum += arr[i];
            }
        } else {
            sum += arr[i];
        }
    }

    const result = await ns.dnet.authenticate(host, String(sum));
    if (!result.success && result.code === 401) {
        ns.tryWritePort(Port.DNET_LOG, `ERROR: Failed BellaCuore: ${host}, Password: ${String(sum)}`);
    }
    return result.success;
}

async function OpenWebAccessPoint(ns:NS, host:string, details: DarknetServerDetails): Promise<boolean> {
    await ns.dnet.authenticate(host, "pwProbe");
    const logs = await bleedingHeart(ns, host, "passwordAttempted", "pwProbe");
    if ((logs === null || typeof(logs.data) !== "string")) {return false;}
    const pass = logs.data.match(RegExp(`${host}:(\\d+)`));
    if (!pass) {return false;}
    

    const result = await ns.dnet.authenticate(host, pass[1]);
    if (!result.success && result.code === 401) {
        ns.tryWritePort(Port.DNET_LOG, `ERROR: Failed OpenWebAccessPoint: ${host}, Password: ${pass[1]}`);
    }
    return result.success;
}

async function DeepGreen(ns:NS, host:string, details: DarknetServerDetails): Promise<boolean> {
    const passArr = [];
    const length = details.passwordLength;
    for (let i = 0; i < 10; i++) {
        const res = await ns.dnet.authenticate(host, i.toString().repeat(length));
        if (res.success) {savePass(ns, host, i.toString().repeat(length)); return true;}
        const log = await bleedingHeart(ns, host, "passwordAttempted", i.toString().repeat(length));
        if ((log === null || typeof(log.data) !== "string")) {return false;}

        for (const j of log.data.split(",")) {
            for (let h = 0; h < Number(j); h++) {
                passArr.push(i);    
            }
        }
        if (passArr.length === length) {break;}
    }

    const pass = permute(passArr);
    let result: DarknetResult & { data?: any; } = {success:false, code:200, message:"null"}; 
    let pw: string = "";

    for (let i = 0; i < pass.length; i++) {
        result = (await ns.dnet.authenticate(host, pass[i].toString().replaceAll(",", "")));
        if (result.success) {pw = pass[i].toString().replaceAll(",", ""); savePass(ns, host, pw); break;}
    }
    if (!result.success && result.code === 401) {
        ns.tryWritePort(Port.DNET_LOG, `ERROR: Failed DeepGreen: ${host}, Password: ${pass}`);
    }
    return result.success;
}

async function AccountsManager_4_2(ns:NS, host:string, details: DarknetServerDetails): Promise<boolean> {
    const length = details.passwordLength;
    let max = Math.pow(10, length);
    let min = 0
    
    while (Math.pow((max - min), 2) > 2) {
        const mid = (Math.floor((max + min) / 2)).toString();
        const res = await ns.dnet.authenticate(host, mid);
        if (res.success) {savePass(ns, host, mid);  return true;}
        const log = await bleedingHeart(ns, host, "passwordAttempted", mid);
        if ((log === null || typeof(log.data) !== "string")) {return false;}
        
            if (log.message === "Success") {
                return true;
            }
            if (log.data === "Higher") {
                min = Number(mid);
                continue;
            }
            if (log.data === "Lower") {
                max = Number(mid);
                continue;
            }
        
    }
    ns.tryWritePort(Port.DNET_LOG, `ERROR: Failed AccountsManager_4_2: ${host}, min: ${min}, max: ${max}`);
    return false;
}

async function NIL(ns:NS, host:string, details: DarknetServerDetails): Promise<boolean> {
    const ansArr: number[] = [];

    for (let i = 0; i < details.passwordLength; i++) {
        ansArr.push(0)
    }

    for (let i = 0; i < 10; i++) {
        const strAns = ansArr.toString().replaceAll(",", "");
        const res = await ns.dnet.authenticate(host, strAns);
        if (res.success) {savePass(ns, host, strAns); return true;}
        const log = await bleedingHeart(ns, host, "passwordAttempted", strAns);
        if ((log === null || typeof(log.data) !== "string")) {return false;}

        const split = log.data.split(",")
        for (let j = 0; j < ansArr.length; j++) {
            if (split[j] === "yes") {
                continue;
            } else if (split[j] === "yesn't") {
                ansArr[j] = i + 1;
            }
        }
    }
    ns.tryWritePort(Port.DNET_LOG, `ERROR: Failed NIL: ${host}, Password: ${ansArr}`);  
    return false;
}

async function Factori_Os(ns:NS, host:string, details: DarknetServerDetails): Promise<boolean> {
    const len = 10 ** details.passwordLength;
    let primes = [...Array(len)].map((k, v) => (v));
    primes.splice(0, 2);

    let index = 0;
    let p = primes[index];
    const lim = (len ** 0.5);
    while (p < lim) {
        p = primes[index++];
        primes = primes.filter((n) => (n % p) || (n == p));
    }

    let L = 1;
    let primeIndex = 0;
    let pr = primes[primeIndex];

    while (primeIndex++ < primes.length) {
        while (true) {
            const resp = await ns.dnet.authenticate(host, (L * pr).toString());
            if (resp.success) {savePass(ns, host, (L * pr).toString()); return true;}
            const log = await bleedingHeart(ns, host, "passwordAttempted", (L * pr).toString());
            if (log === null) {return false;}

            if (log.data === "true") {
                L *= pr;
                continue;
            }
            if (log.data === "false") {
                break;
            }
            ns.tryWritePort(Port.DNET_LOG, `check t/f conditions on ${host}, got ${log.data}`);
            return false;
        }
        pr = primes[primeIndex];
    }
    if (details.passwordLength !== 1) {return false;}
    const zeroResp = await ns.dnet.authenticate(host, "0");
    if (zeroResp.success) {savePass(ns, host, "0"); return true;}
    const oneResp = await ns.dnet.authenticate(host, "1");
    if (oneResp.success) {savePass(ns, host, "1"); return true;} else {return false;}
} 

/**
 * Saves passwords to default password cache port.
 * @param hostname Hostname of guessed server.
 * @param password Password of guessed server.
 */
function savePass(ns:NS, hostname: string, password: string) {
    const cache = ns.readPort(Port.DNET_PASSWORD_CACHE) as {[index:string]:string};
    cache[hostname] = password;
    ns.tryWritePort(Port.DNET_PASSWORD_CACHE, cache);
}

/**
 * Guesses a password on hostname. Pulls passwords from DNET_PASSWORD_CACHE port's object.
 * Removes the password if it fails.
 * @param hostname Host to try to connect to.
 * @returns true if successfully connected, false otherwise.
 */
function guessPass(ns:NS, hostname: string): boolean {
    const cache = ns.peek(Port.DNET_PASSWORD_CACHE) as {[index:string]:string};
    if (Object.keys(cache).includes(hostname)) {
        const resp = ns.dnet.connectToSession(hostname, cache[hostname]);
        if (!resp.success) {
            ns.clearPort(Port.DNET_PASSWORD_CACHE);
            delete cache[hostname];
            ns.tryWritePort(Port.DNET_PASSWORD_CACHE, cache);
            return false;
        }
        return true;
    } else {
        return false;
    }
}

/**
 * Fetches logs from a given dnet server. 
 * @param host hostname to heartBleed()
 * @param field object key to look for, optional.
 * @param value object value to look for (uses String.match() !== null), string or RegExp. required if using field. Ignored if field is not set.
 * @returns null if desired object is not found or error has occured, otherwise Object.
 * Check DNET_LOG port for Error information.
 */
async function bleedingHeart(ns:NS, host:string, field?: keyof returnedLogs, value?: string|RegExp): Promise<null | returnedLogs>{
    if (field) {
        if (!value) {ns.tryWritePort(Port.DNET_LOG, `ERROR: ${host}: value required when using field`); return null}
        if (typeof(value) !== "string" && !(value instanceof RegExp)) {ns.tryWritePort(Port.DNET_LOG, `ERROR: ${host}: value must be string or RegExp`); return null}
        if (!(field === "code" || field === "passwordAttempted" || field === "message" || field === "data")) {ns.tryWritePort(Port.DNET_LOG, `ERROR: ${host}: field must be part of dNetResponse interface.`); return null}

        const feedback = (await ns.dnet.heartbleed(host, {peek:true, logsToCapture:5}));
        if (feedback.code === 451) {ns.tryWritePort(Port.DNET_LOG, `ERROR: not enough Cha: ${host},`); return null}
        let obj: returnedLogs;

        for (const log of feedback.logs) {
            try {
                obj = JSON.parse(log);
                    if (obj && obj[field] && ((obj)[field] as string).match(value) !== null) {
                    return obj;
                }
            } catch (error) {
                if (!(error instanceof SyntaxError)) {
                    ns.tryWritePort(Port.DNET_LOG, `ERROR: failed parsing JSON on ${host}: ${error}`);
                    return null;
                }
            }
            continue;
        }
        ns.tryWritePort(Port.DNET_LOG, `Error: could not find ${value} in ${host}.${field}`);
        return null;
    } else {
        const feedback = (await ns.dnet.heartbleed(host, {peek:true, logsToCapture:5}));
        if (feedback.code === 451) {ns.tryWritePort(Port.DNET_LOG, `ERROR: not enough Cha: ${host},`); return null}
        let obj: returnedLogs;

        for (const log of feedback.logs) {
            try {
                obj = JSON.parse(log);
                return obj;
            } catch (error) {
                if (!(error instanceof SyntaxError)) {
                    ns.tryWritePort(Port.DNET_LOG, `ERROR: failed parsing JSON on ${host}: ${error}`);
                    return null;
                }
            }
            continue;
        }
        ns.tryWritePort(Port.DNET_LOG, `Error: did not find logs on ${host}`)
        return null;
    }
}
/**
 * Computes permutations of array.
 * Taken from delimited on StackOverflow.
 * @link https://stackoverflow.com/a/20871714.
 * @param inputArr Array to permute.
 * @returns Array of permutations.
 */
function permute(inputArr: number[]) {
    const result: number[][] = [];

    const permute = (arr: number[], m: number[] = []) => {
        if (arr.length === 0) {
            result.push(m);
        } else {
            for (let i = 0; i < arr.length; i++) {
                const curr = arr.slice();
                const next = curr.splice(i, 1);
                permute(curr.slice(), m.concat(next))
            }
        }
    }

    permute(inputArr);
    return result;
}

/**
 * Converts Hex to base-10. Hex in capitals.
 * @param x character to convert.
 * @returns x as base-10.
 */
function strToNum(x: string) {
    if (x.charCodeAt(0) >= 65) {
        return x.charCodeAt(0) - 55;
    } else {
        return x.charCodeAt(0) - 48;
    }
 
}