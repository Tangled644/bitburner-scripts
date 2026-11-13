import { startTiming } from "@/src/lib/timingADT";

const ST = new startTiming();
const n = 100;

for (let i = 0; i < n; i++) {
    ST.newTime(Math.round(Math.random() * 100), Math.round(Math.random() * 100), "")
    // console.log(ST.peekBinHeap)
}

console.log("-----")
console.log(ST.getSize)
console.log("-----")

for (let i = 0; i < n; i++) {
    console.log(ST.removeTime())
    // console.log("=====")
    // console.log(ST.peekBinHeap)
}