interface TimeThreadsJob {
    time: number;
    threads: number;
    job: string;
}

export class startTiming {
    #binaryHeap: TimeThreadsJob[] = [];

    constructor() {}

    private swap(index1: number, index2: number): boolean {
        if (index1 === index2) {return true;}
        const temp = this.#binaryHeap[index1];
        this.#binaryHeap[index1] = this.#binaryHeap[index2];
        this.#binaryHeap[index2] = temp;
        return true;
    }

    private bubbleUp(index: number): boolean {
        if (index === 0) {
            return true;
        }
        let parent = Math.floor((index - 1) / 2)
        while (index != 0) {
            if (this.#binaryHeap[parent].time > this.#binaryHeap[index].time) {
                this.swap(parent, index);
                index = parent;
                parent = Math.floor((parent - 1) / 2)
            } else {break;}
        }
        return true;
    }

    private bubbleDown(): boolean {
        if (this.#binaryHeap.length === 0) return true;

        let par = 0;
        const length = this.#binaryHeap.length;

        while (true) {
            let lchld = 2 * par + 1;
            let rchld = 2 * par + 2;
            let smallest = par;

            if (lchld < length && this.#binaryHeap[lchld].time < this.#binaryHeap[smallest].time) {
                smallest = lchld;
            }
            if (rchld < length && this.#binaryHeap[rchld].time < this.#binaryHeap[smallest].time) {
                smallest = rchld;
            }
            if (smallest === par) {
                break;
            }

            this.swap(par, smallest);
            par = smallest;
        }

        return true;
    }

    checkTime(): (TimeThreadsJob | null) {
        if (this.#binaryHeap.length === 0) {return null;}
        return this.#binaryHeap[0];
    }

    removeTime(): (TimeThreadsJob | null) {
        if (this.#binaryHeap.length === 0) {return null;}
        if (this.#binaryHeap.length === 1) {return this.#binaryHeap.pop() as TimeThreadsJob;}
        const out = this.#binaryHeap[0];
        this.#binaryHeap[0] = this.#binaryHeap.pop() as TimeThreadsJob;
        this.bubbleDown();
        return out;
    }

    newTime(startTime: number, threads: number, jobType: string): boolean {
        this.#binaryHeap.push({time: startTime, threads: threads, job: jobType})
        this.bubbleUp(this.#binaryHeap.length - 1)
        return true;
    }

    get getSize(): number {
        return this.#binaryHeap.length;
    }
    
    get peekBinHeap(): (TimeThreadsJob[]) {
        return this.#binaryHeap
    }

}