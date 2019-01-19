class PanZoomTrailer {

    private vis: HTMLElement;
    private width = 0;
    private height = 0;

    private text: HTMLElement;
    private hand: SVGElement;
    private phone: SVGElement;
    private heightLine: SVGLineElement;
    private heightEndMarker: SVGLineElement;
    private perspective: SVGGElement;

    private phoneHeightSvg = 165;
    private phoneHeightM = 0.15;
    private svgUnitToM = this.phoneHeightM / this.phoneHeightSvg;
    private initialBottomPadding = 330;

    constructor() {
        const vis = document.getElementById('vis');

        if(!vis) {
            throw Error('Visualization DOM element not found');
        }

        this.vis = vis;
        this.setSize();
        window.addEventListener('resize', this.setSize.bind(this));

        const hand = document.getElementById('hand');
        const phone = document.getElementById('phone');
        const text = document.getElementById('text');
        const heightLine = document.getElementById('height-line');
        const heightEndMarker = document.getElementById('height-end-marker');
        const perspective = document.getElementById('perspective');

        if(!hand || !phone || !text || !heightLine || !heightEndMarker || !perspective) {
            throw new Error('Could not find crucial DOM elements');
        }
        this.hand = <SVGElement> <unknown> hand;
        this.phone = <SVGElement> <unknown> phone;
        this.text = text;
        this.heightLine = <SVGLineElement> <unknown> heightLine;
        this.heightEndMarker = <SVGLineElement> <unknown> heightEndMarker;
        this.perspective = <SVGGElement> <unknown> perspective;

        this.step1();
    }

    private setSize() {
        this.width = window.innerWidth;
        this.height = window.innerHeight;
        this.vis.setAttribute('width', this.width.toString());
        this.vis.setAttribute('height', this.height.toString());
    }

    private step1() {
        const centerX = this.width / 2;
        const handFrom = {x: centerX + 100, y: this.height};
        const handTo = {x: centerX - 90, y: this.height - this.initialBottomPadding};

        this.moveTo(this.phone, centerX - 100, this.height - this.initialBottomPadding - 170);
        this.moveTo(this.hand, handFrom.x, handFrom.y);

        this.text.innerText = 'Pan and Zoom is important because we use it a lot.';
        setTimeout(() => {
            new PZTAnimation((progressPercent: number) => {
                const interpolateFct = this.getInterpolateChoordFct(progressPercent, handFrom, handTo);
                this.moveTo(this.hand, interpolateFct('x'), interpolateFct('y'));
            }, () => {
                this.moveTo(this.hand, handTo.x, handTo.y);
                this.step2();
            }).start(500);
        }, 1000);
    }

    private step2() {
        const centerX = this.width / 2;
        const handBottom = {x: centerX - 90, y: this.height - this.initialBottomPadding};
        const handTop = {x: centerX - 90, y: this.height - this.initialBottomPadding - 70};

        const up = (onEnd: () => void) => {
            new PZTAnimation((progressPercent: number) => {
                const interpolateFct = this.getInterpolateChoordFct(progressPercent, handBottom, handTop);
                this.moveTo(this.hand, interpolateFct('x'), interpolateFct('y'))
            }, () => {
                onEnd();
            }).start(500);
        };
        const down = (onEnd: () => void) => {
            new PZTAnimation((progressPercent: number) => {
                const interpolateFct = this.getInterpolateChoordFct(progressPercent, handTop, handBottom);
                this.moveTo(this.hand, interpolateFct('x'), interpolateFct('y'))
            }, () => {
                onEnd();
            }).start(150);
        };
        setTimeout(() => {
            up(() => down(() => up(() => down(() => up(() => down(() => {
                this.step3();
            }))))));
        }, 500);
    }

    private step3() {
        this.text.innerText = 'In fact, this is how much you pan daily: ';

        const centerX = this.width / 2;
        const handBottom = {x: centerX - 90, y: this.height - this.initialBottomPadding};
        const handTop = {x: centerX - 90, y: this.height - this.initialBottomPadding - 70};
        const lineX = centerX - 16;
        const lineStartY = this.height - this.initialBottomPadding + 60;
        const lineHeightSvgAddedPerCycle = 90;
        const goalHeightM = 25;

        let completedBarHeightSvg = 0;
        let currentlyAddingBarHeightSvg = 0;
        let scale = 1;

        const updateBarHeight = () => {
            const totalBarHeightSvg = completedBarHeightSvg + currentlyAddingBarHeightSvg;
            const totalbarHeightM = Math.round(totalBarHeightSvg * this.svgUnitToM);

            this.text.innerText = 'In fact, this is how much you pan daily: ' + totalbarHeightM + 'm';

            this.attr(this.heightEndMarker, 'x1', lineX - 5 / scale);
            this.attr(this.heightEndMarker, 'x2', lineX + 5 / scale);
            this.attr(this.heightEndMarker, 'y1', lineStartY - totalBarHeightSvg);
            this.attr(this.heightEndMarker, 'y2', lineStartY - totalBarHeightSvg);

            this.attr(this.heightLine, 'x1', lineX);
            this.attr(this.heightLine, 'x2', lineX);
            this.attr(this.heightLine, 'y1', lineStartY);
            this.attr(this.heightLine, 'y2', lineStartY - totalBarHeightSvg);
        };

        this.attr(this.perspective, 'transform-origin', lineX + 'px ' + (lineStartY + 200) + 'px');

        const updateZoom = () => {
            const totalBarHeightSvg = completedBarHeightSvg + currentlyAddingBarHeightSvg;
            scale = Math.min(1, 1 / (totalBarHeightSvg / 300));

            this.attr(this.perspective, 'transform', 'scale(' + scale + ')');
            this.attr(this.heightEndMarker, 'stroke-width', 1 / scale);
            this.attr(this.heightLine, 'stroke-width', 1 / scale);
        };

        const up = (onEnd: () => void) => {
            new PZTAnimation((progressPercent: number) => {
                const interpolateFct = this.getInterpolateChoordFct(progressPercent, handBottom, handTop);
                this.moveTo(this.hand, interpolateFct('x'), interpolateFct('y'));
                currentlyAddingBarHeightSvg = progressPercent * lineHeightSvgAddedPerCycle;
                updateBarHeight();
                updateZoom();
            }, () => {
                completedBarHeightSvg += lineHeightSvgAddedPerCycle;
                currentlyAddingBarHeightSvg = 0;
                onEnd();
            }).start(30);
        };
        const down = (onEnd: () => void) => {
            this.moveTo(this.hand, handBottom.x, handBottom.y);
            setTimeout(onEnd);
        };

        const todo: ((cb: () => void) => void)[] = [];
        const countCyclesNeeded = Math.round(goalHeightM / lineHeightSvgAddedPerCycle / this.svgUnitToM);

        for(let i = 0; i < countCyclesNeeded; i++) {
            todo.push(up);
            todo.push(down);
        }

        let i = -1;
        const workTodo = () => {
            i++;
            if(todo[i]) {
                todo[i](workTodo);
            }
        };
        setTimeout(() => workTodo(), 1000);
    };

    private getInterpolateChoordFct(progressPercent: number, from: {x: number, y: number}, to: {x: number, y: number}) {
        return (coord: 'x'|'y') => from[coord] + (to[coord] - from[coord]) * progressPercent;
    }

    private moveTo(element: SVGElement, x: number, y: number) {
        element.setAttributeNS(null, 'transform', 'translate(' + x + ', ' + y + ')');
    }

    private attr(element: SVGElement, attrName: string, value: string|number) {
        element.setAttributeNS(null, attrName, value.toString());
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


