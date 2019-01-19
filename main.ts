class PanZoomTrailer {

    private vis: HTMLElement;
    private width = 0;
    private height = 0;

    private text: HTMLElement;
    private hand: SVGElement;
    private phone: SVGElement;

    constructor() {
        const vis = document.getElementById('vis');

        if(!vis) {
            throw Error('Visualization DOM element not found');
        }

        this.vis = vis;
        this.setSize();

        const hand = document.getElementById('hand');
        const phone = document.getElementById('phone');
        const text = document.getElementById('text');
        if(!hand || !phone || !text) {
            throw new Error('Could not find crucial DOM elements');
        }
        this.hand = <SVGElement> <unknown> hand;
        this.phone = <SVGElement> <unknown> phone;
        this.text = text;

        this.step0();
    }

    private setSize() {
        this.width = window.innerWidth;
        this.height = window.innerHeight;
        this.vis.setAttribute('width', this.width.toString());
        this.vis.setAttribute('height', this.height.toString());
    }

    private step0() {
        const centerX = this.width / 2;
        const handFrom = {x: centerX + 100, y: this.height};
        const handTo = {x: centerX - 90, y: this.height - 330};

        this.moveTo(this.phone, centerX - 100, this.height - 500);
        this.moveTo(this.hand, handFrom.x, handFrom.y);

        this.text.innerText = 'Pan and Zoom is important because we use it a lot.';
        setTimeout(() => {
            new PZTAnimation((progressPercent: number) => {
                const interpolateFct = this.getInterpolateChoordFct(progressPercent, handFrom, handTo);
                this.moveTo(this.hand, interpolateFct('x'), interpolateFct('y'))
            }, () => {
                this.step1();
            }).start(500);
        }, 1000);
    }

    private step1() {
        const centerX = this.width / 2;
        const handFrom = {x: centerX - 90, y: this.height - 330};
        const handTo = {x: centerX - 90, y: this.height - 400};

        setTimeout(() => {
            new PZTAnimation((progressPercent: number) => {
                const interpolateFct = this.getInterpolateChoordFct(progressPercent, handFrom, handTo);
                this.moveTo(this.hand, interpolateFct('x'), interpolateFct('y'))
            }, () => {

            }).start(500);
        }, 500);
    }

    private getInterpolateChoordFct(progressPercent: number, from: {x: number, y: number}, to: {x: number, y: number}) {
        return (coord: 'x'|'y') => from[coord] + (to[coord] - from[coord]) * progressPercent;
    }

    private moveTo(element: SVGElement, x: number, y: number) {
        element.setAttributeNS(null, 'transform', 'translate(' + x + ', ' + y + ')');
    }
}


class PZTAnimation {
    private startMs = 0;
    private endMs = 0;
    private boundOnAnimationFrame = this.onAnimationFrame.bind(this);
    constructor(private onAnimationStep: (percentDone: number) => void, private onAnimationEnd?: () => void) {}
    start(durationMs: number) {
        const nowMs = performance.now();
        // If the animation is already happening, just update its end time.
        if (nowMs <= this.endMs) {
            this.endMs = nowMs + durationMs;
            return;
        }
        this.startMs = nowMs;
        this.endMs = nowMs + durationMs;
        requestAnimationFrame(this.boundOnAnimationFrame);
    }
    stop() {
        this.endMs = 0;
    }
    get startTimeMs(): number {
        return this.startMs;
    }
    private onAnimationFrame(nowMs: number) {
        if (nowMs >= this.endMs) {
            if(this.onAnimationEnd) {
                this.onAnimationEnd();
            }
            return;
        }
        this.onAnimationStep((nowMs - this.startMs) / (this.endMs - this.startMs));
        requestAnimationFrame(this.boundOnAnimationFrame);
    }
}

const pzt = new PanZoomTrailer();


