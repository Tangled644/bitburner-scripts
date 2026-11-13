export async function main(ns:NS) {
    ns.exec("dnet/dnetServer.ts", ns.getHostname(), {temporary: true})
    while (true) {
        const dnetList = ns.dnet.probe();
        const sTime = Date.now();

        for (const server of dnetList) {
            const auth = await serverSolver(ns, server)
            if (!auth) {continue;}

            ns.scp([ns.getScriptName(), "dnet/dnetServer.ts", "dnet/freeRAM.ts", "dnet/kill-dnet.ts", "dnet/restart-propagate.ts"], server);
            ns.exec(ns.getScriptName(), server, {preventDuplicates: true, temporary: true})
        }

        if (Date.now() - sTime < 10000) {
            await ns.dnet.nextMutation();
        }
    }
}

async function serverSolver(ns:NS, host: string): Promise<boolean> {
    const details = ns.dnet.getServerDetails(host);
    if (!details.isConnectedToCurrentServer || !details.isOnline) {
        return false;
    }

    if (details.hasSession) {
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
            return Pr0verFl0(ns, host, details);
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
        default:
            ns.tryWritePort(12, `Unrecognized modelId: ${details.modelId} on Host ${host}`);
            return false;
    }
}

async function ZeroLogon(ns:NS, host: string): Promise<boolean> {
    const result = await ns.dnet.authenticate(host, "");
    if (!result.success) {
        ns.tryWritePort(12, `Failed ZeroLogon: ${host}`)
    }
    return result.success;
}

async function DeskMemo_3_1(ns:NS, host: string, details: DarknetServerDetails): Promise<boolean> {
    const pass = details.passwordHint.replaceAll(/\D/g, "");
    const result = await ns.dnet.authenticate(host, pass);
    if (!result.success) {
        ns.tryWritePort(12, `Failed DeskMemo_3_1: ${host}, Password:${pass}`)
    }
    return result.success;
}

async function CloudBlaretm(ns:NS, host: string, details: DarknetServerDetails): Promise<boolean> {
    const pass = details.data.replaceAll(/\D/g, "");
    const result = await ns.dnet.authenticate(host, pass);
    if (!result.success) {
        ns.tryWritePort(12, `Failed CloudBlaretm: ${host}, Password: ${pass}`)
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
    if (!result.success) {
        ns.tryWritePort(12, `Failed FreshInstall_1_0: ${host}, Password: ${pass}`);
    }
    return result.success;
}

async function PHP5_4(ns:NS, host: string, details: DarknetServerDetails): Promise<boolean> {
    const pass = permute(details.data.split("").map(i => Number(i)));
    let result: boolean = false;
    let pw: string = "";

    for (let i = 0; i < pass.length; i++) {
        result = (await ns.dnet.authenticate(host, pass[i].toString().replaceAll(",", ""))).success;
        if (result) {pw = pass[i].toString().replaceAll(",", ""); break;}
    }
    if (!result) {
        ns.tryWritePort(12, `Failed PHP5_4: ${host}, Password: ${pass}`);
    }
    return result;
}

async function Pr0verFl0(ns:NS, host:string, details: DarknetServerDetails): Promise<boolean> {
    const pass = "1111111111111111";
    const result = await ns.dnet.authenticate(host, pass);
    if (!result.success) {
        ns.tryWritePort(12, `Failed Pr0verFl0: ${host}, Password: ${pass}`);
    }
    return result.success;
}

async function Laika4(ns:NS, host:string): Promise<boolean> {
    const pass = ["fido", "spot", "rover", "max"];
    let result: boolean = false;
    let pw: string = "";

    for (let i = 0; i < pass.length; i++) {
        result = (await ns.dnet.authenticate(host, pass[i].toString().replaceAll(",", ""))).success;
        if (result) {pw = pass[i].toString(); break;}
    }
    if (!result) {
        ns.tryWritePort(12, `Failed Laika4: ${host}, Password: ${pass}`);
    }
    return result;
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
    if (!result.success) {
        ns.tryWritePort(12, `Failed OctantVoxel: ${host}, Password: ${String(sum)}`);
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
    if (!result.success) {
        ns.tryWritePort(12, `Failed BellaCuore: ${host}, Password: ${String(sum)}`);
    }
    return result.success;
}

async function OpenWebAccessPoint(ns:NS, host:string, details: DarknetServerDetails): Promise<boolean> {
    if (details.requiredCharismaSkill > ns.getPlayer().skills.charisma) {
        return false;
    }
    await ns.dnet.authenticate(host, "a");
    const feedback = JSON.parse((await ns.dnet.heartbleed(host, {peek: true})).logs as unknown as string).data;
    const pass = feedback.match(RegExp(`${host}:(\\d+)`))[1];

    const result = await ns.dnet.authenticate(host, pass);
    if (!result.success) {
        ns.tryWritePort(12, `Failed OpenWebAccessPoint: ${host}, Password: ${pass}`);
    }
    return result.success;
}

async function DeepGreen(ns:NS, host:string, details: DarknetServerDetails): Promise<boolean> {
    if (details.requiredCharismaSkill > ns.getPlayer().skills.charisma) {
        return false;
    }
    const passArr = [];
    const length = details.passwordLength
    eachIter: for (let i = 0; i < 10; i++) {
        await ns.dnet.authenticate(host, String(i).repeat(length));
        const feedback = (await ns.dnet.heartbleed(host, {peek:true, logsToCapture:10})).logs;
        for (const log of feedback) {
            let obj;

            try {
                obj = JSON.parse(log);
            } catch (error) {
                if (error instanceof SyntaxError) {
                    continue;
                } else {
                    throw new Error(`Error occured parsing JSON: ${error}`)
                }
            }

            if (obj.passwordAttempted != String(i).repeat(length)) {
                continue;
            }
            for (const j of obj.data.split(",")) {
                for (let h = 0; h < Number(j); h++) {
                    passArr.push(i);    
                }
            }
            continue eachIter;
        }
    }

    const pass = permute(passArr);
    let result: boolean = false;
    let pw: string = "";

    for (let i = 0; i < pass.length; i++) {
        result = (await ns.dnet.authenticate(host, pass[i].toString().replaceAll(",", ""))).success;
        if (result) {pw = pass[i].toString().replaceAll(",", ""); break;}
    }
    if (!result) {
        ns.tryWritePort(12, `Failed DeepGreen: ${host}, Password: ${passArr}`);
    }
    return result;
}

async function AccountsManager_4_2(ns:NS, host:string, details: DarknetServerDetails): Promise<boolean> {
    if (details.requiredCharismaSkill > ns.getPlayer().skills.charisma) {
        return false;
    }
    const length = details.passwordLength;
    let max = Math.pow(10, length);
    let min = 0
    
    eachIter: while (Math.pow((max - min), 2) > 2) {
        const mid = String(Math.floor((max + min) / 2));
        await ns.dnet.authenticate(host, mid);
        const feedback = (await ns.dnet.heartbleed(host, {peek:true, logsToCapture:10})).logs;
        for (const log of feedback) {
            let obj;

            try {
                obj = JSON.parse(log);
            } catch (error) {
                if (error instanceof SyntaxError) {
                    continue;
                } else {
                    throw new Error(`Error occured parsing JSON: ${error}`)
                }
            }

            if (obj.passwordAttempted !== mid) {
                continue;
            }
            if (obj.message === "Success") {
                return true;
            }
            if (obj.data === "Higher") {
                min = Number(mid);
                continue eachIter;
            }
            if (obj.data === "Lower") {
                max = Number(mid);
                continue eachIter;
            }
        }
    }
    
    ns.tryWritePort(12, `Failed AccountsManager_4_2: ${host}, min: ${min}, max: ${max}`);
    return false;
}

async function NIL(ns:NS, host:string, details: DarknetServerDetails): Promise<boolean> {
    if (details.requiredCharismaSkill > ns.getPlayer().skills.charisma) {
        return false;
    }
    const ansArr: number[] = [];

    for (let i = 0; i < details.passwordLength; i++) {
        ansArr.push(0)
    }

    for (let i = 0; i < 10; i++) {
        const strAns = ansArr.toString().replaceAll(",", "");
        await ns.dnet.authenticate(host, strAns);
        const feedback = (await ns.dnet.heartbleed(host, {peek:true, logsToCapture:10})).logs;
        for (const log of feedback) {
            let obj;

            try {
                obj = JSON.parse(log);
            } catch (error) {
                if (error instanceof SyntaxError) {
                    continue;
                } else {
                    throw new Error(`Error occured parsing JSON: ${error}`)
                }
            }

            if (obj.passwordAttempted !== strAns) {
                continue;
            }
            if (obj.message === "Success") {
                return true;
            }

            const split = obj.data.split(",")
            for (let j = 0; j < ansArr.length; j++) {
                if (split[j] === "yes") {
                    continue;
                } else if (split[j] === "yesn't") {
                    ansArr[j] = i + 1;
                }
            }
        }
    }
    ns.tryWritePort(12, `Failed NIL: ${host}, Password: ${ansArr}`);  
    return false;
}

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

function strToNum(x: string) {
    if (x.charCodeAt(0) >= 65) {
        return x.charCodeAt(0) - 55;
    } else {
        return x.charCodeAt(0) - 48;
    }
 
}