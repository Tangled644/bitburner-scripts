// const dnet = "the password is the base 12 number 109 in base 10"
// const string = dnet.split(/\D+/g).map(s => Number(s)).filter(s => s > 0);

// const dnet = "6,1443"

// const [baseStr, number] = dnet.split(",");
// const base = Number(baseStr);
// const numArr = number.split("").map(s => Number(s)).reverse();
// let sum = 0;
// for (let i = 0; i < numArr.length; i++) {
//     sum += (Math.pow(base, i) * numArr[i])
// }
// console.log(sum);

// const data = "33191558860512 Note to self: 1 and 2 are important. 🅱️ung0 9504882903 terminal_🅱️lade:4921972 2053 I can see a 9 and a 7.letmein6969 Did it have a 4 and a 2? I just got a new set of hacknet nodes. They should pay for themselves by early next year!"
// const host = "terminal_🅱️lade"
// const safeHost = host.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
// data.match(RegExp(`${safeHost}:(\\d+)`))
// const sequence = match ? match[1] : null;

// let len = 3;


// console.log("A".charCodeAt(0))

// function letToNum(x: string) {
//     if (x.charCodeAt(0) >= 65) {
//         return x.charCodeAt(0) - 55;
//     } else {
//         return x.charCodeAt(0) - 48;
//     }
 
// }

// for (let i = 0; i < 10; i++) {
//     console.log(letToNum(String(i)));
// }

// console.log(letToNum("A"))
// console.log(letToNum("B"))
// console.log(letToNum("C"))
// console.log(letToNum("D"))
// console.log(letToNum("E"))
// console.log(letToNum("F"))
// console.log(letToNum("G"))
// console.log(letToNum("H"))
// console.log(letToNum("I"))
// console.log(letToNum("J"))


let arr = "CXCLXVI".split("").map(s => {
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

console.log(sum)
