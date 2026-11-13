import { optimize } from "./optimize-simple";

export async function main(ns:NS): Promise<void> {
    ns.tprint(`Optimizing ${ns.args[0]}.`);
    await optimize(ns, ns.args[0] as string);
}