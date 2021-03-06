class PanZoomTrailer {

    private vis: HTMLElement;
    private width = 0;
    private height = 0;

    private text: HTMLElement;
    private phoneText: HTMLElement;
    private hand: SVGElement;
    private phone: SVGElement;
    private heightLine: SVGLineElement;
    private heightEndMarker: SVGLineElement;
    private perspective: SVGGElement;

    private phoneHeightSvg = 165;
    private phoneHeightM = 0.15;
    private svgUnitToM = this.phoneHeightM / this.phoneHeightSvg; // 0.0009090909
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
        const phoneText = document.getElementById('phone-text');

        if(!hand || !phone || !text || !heightLine || !heightEndMarker || !perspective || !phoneText) {
            throw new Error('Could not find crucial DOM elements');
        }
        this.hand = <SVGElement> <unknown> hand;
        this.phone = <SVGElement> <unknown> phone;
        this.text = text;
        this.heightLine = <SVGLineElement> <unknown> heightLine;
        this.heightEndMarker = <SVGLineElement> <unknown> heightEndMarker;
        this.perspective = <SVGGElement> <unknown> perspective;
        this.phoneText = phoneText;

        this.step1();
    }

    private setSize() {
        this.width = window.innerWidth;
        this.height = window.innerHeight;
        this.vis.setAttribute('width', this.width.toString());
        this.vis.setAttribute('height', this.height.toString());
    }

    private step1() {
        document.body.className = 'step1';

        const centerX = this.width / 2;
        const handFrom = {x: centerX + 100, y: this.height};
        const handTo = {x: centerX - 90, y: this.height - this.initialBottomPadding};

        this.moveTo(this.phone, centerX - 100, this.height - this.initialBottomPadding - 170);
        this.moveTo(this.hand, handFrom.x, handFrom.y);
        this.phoneText.style.left = centerX - 30 + 'px';
        this.phoneText.style.top = this.height - this.initialBottomPadding - 28 + 'px';

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
        document.body.className = 'step2';

        const centerX = this.width / 2;
        const handBottom = {x: centerX - 90, y: this.height - this.initialBottomPadding};
        const handTop = {x: centerX - 90, y: this.height - this.initialBottomPadding - 70};

        let finishedScrollingPx = 0;
        let currentlyScrollingPx = 0;

        const updateScroll = () => {
            this.phoneText.scrollTop = finishedScrollingPx + currentlyScrollingPx;
        };

        const up = (onEnd: () => void) => {
            new PZTAnimation((progressPercent: number) => {
                const interpolateFct = this.getInterpolateChoordFct(progressPercent, handBottom, handTop);
                currentlyScrollingPx = (handBottom.y - handTop.y) * progressPercent;
                updateScroll();
                this.moveTo(this.hand, interpolateFct('x'), interpolateFct('y'))
            }, () => {
                currentlyScrollingPx = 0;
                finishedScrollingPx += handBottom.y - handTop.y;
                updateScroll();
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
                new PZTAnimation((progressPercent: number) => {
                    this.phoneText.style.opacity = (1 - progressPercent).toString();
                }, () => {
                    this.phoneText.style.opacity = '0';
                    this.step3();
                }
                ).start(300);
            }))))));
        }, 500);
    }

    private step3() {
        document.body.className = 'step3';
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

        let tasksDoneCount = -1;

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

        const customSigmoid = (t:number) => {
            return 1/(1+Math.pow(Math.E, -10*(t-0.43)));
        };

        const updateZoom = () => {
            const totalBarHeightSvg = completedBarHeightSvg + currentlyAddingBarHeightSvg;
            let scaleLinear = Math.min(1, 1 / (totalBarHeightSvg / 400));
            if(scaleLinear < 0) {
                scaleLinear = 1;
            }
            scale = customSigmoid(scaleLinear);

            this.attr(this.perspective, 'transform', 'scale(' + scale + ')');
            this.attr(this.heightEndMarker, 'stroke-width', 2 / scale);
            this.attr(this.heightLine, 'stroke-width', 2 / scale);
        };

        const up = (onEnd: () => void) => {
            if(tasksDoneCount > 10) {
                completedBarHeightSvg += lineHeightSvgAddedPerCycle;
                updateBarHeight();
                updateZoom();
                setTimeout(onEnd);
            } else {
                const animationTime = Math.max(400 - 10 * tasksDoneCount, 20);
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
                }).start(animationTime);
            }
        };
        const down = (onEnd: () => void) => {
            if(tasksDoneCount > 10) {
                this.moveTo(this.hand, handBottom.x, handBottom.y);
                setTimeout(onEnd);
            } else {
                const animationTime = Math.max(100 - 10 * tasksDoneCount, 30);
                new PZTAnimation((progressPercent: number) => {
                    const interpolateFct = this.getInterpolateChoordFct(progressPercent, handTop, handBottom);
                    this.moveTo(this.hand, interpolateFct('x'), interpolateFct('y'));
                }, () => {
                    onEnd();
                }).start(animationTime);
            }
        };

        const todo: ((cb: () => void) => void)[] = [];
        const countCyclesNeeded = Math.round(goalHeightM / lineHeightSvgAddedPerCycle / this.svgUnitToM);

        for(let i = 0; i < countCyclesNeeded; i++) {
            todo.push(up);
            todo.push(down);
        }
        todo.push(() => {
            new PZTAnimation((progressPercent: number) => {
                this.phone.style.opacity = (1 - progressPercent).toString();
                this.hand.style.opacity = (1 - progressPercent).toString();
            }, () => {
                this.phone.style.opacity = '0';
                this.hand.style.opacity = '0';
                setTimeout(() => this.step4(scale), 1000);
            }).start(300);
        });

        const workTodo = () => {
            tasksDoneCount++;
            if(todo[tasksDoneCount]) {
                todo[tasksDoneCount](workTodo);
            }
        };

        updateBarHeight();

        setTimeout(() => workTodo(), 1000);
    };

    step4(scaleStart: number) {
        document.body.className = 'step4';
        const centerX = this.width / 2;
        const lineX = centerX - 16;
        const lineStartY = this.height - this.initialBottomPadding + 60;

        this.text.innerText = 'Over a year, you pan: ';

        const barStartHeight = 25 / this.svgUnitToM;
        const barEndHeight = 25 * 365 / this.svgUnitToM;

        let barHeight = barStartHeight;
        let scale = scaleStart;

        // everest size in svg: 570
        // everest size in m: 8848
        // svg unit to m: 0.0009090909
        // scale: 17075

        const customSigmoid = (t:number) => {
            return 1/(1+Math.pow(Math.E, -15*(t-0.4)));
        };

        const updateZoom = () => {
            let scaleLinear = Math.min(1, 1 / ((barHeight - barStartHeight) / 25000));
            if(scaleLinear < 0) {
                scaleLinear = 1;
            }
            //console.log(scaleLinear);
            scale = scaleStart * customSigmoid(scaleLinear);

            this.attr(this.perspective, 'transform', 'scale(' + scale + ')');
            this.attr(this.heightEndMarker, 'stroke-width', 2 / scale);
            this.attr(this.heightLine, 'stroke-width', 2 / scale);
        };
        updateZoom();

        const updateBarHeight = () => {
            const totalbarHeightM = Math.round(barHeight * this.svgUnitToM);

            this.text.innerText = 'Over a year, you pan: ' + totalbarHeightM + 'm';

            this.attr(this.heightEndMarker, 'x1', lineX - 5 / scale);
            this.attr(this.heightEndMarker, 'x2', lineX + 5 / scale);
            this.attr(this.heightEndMarker, 'y1', lineStartY - barHeight);
            this.attr(this.heightEndMarker, 'y2', lineStartY - barHeight);

            this.attr(this.heightLine, 'x1', lineX);
            this.attr(this.heightLine, 'x2', lineX);
            this.attr(this.heightLine, 'y1', lineStartY);
            this.attr(this.heightLine, 'y2', lineStartY - barHeight);
        };

        setTimeout(() => {
            new PZTAnimation((percentDone: number) => {
                barHeight = barStartHeight + (barEndHeight - barStartHeight) * percentDone;
                updateBarHeight();
                updateZoom();
            }, () => {
                /*new PZTAnimation((percentDone: number) => {

                }).start(500);*/
                setTimeout(() => this.step5(), 1000);
            }).start(5000);
        }, 2000);
    }

    step5() {
        document.body.className = 'step5';
        this.text.innerText = 'What if we could save even just 5% of that time?';
        new PZTAnimation((percentDone: number) => {
            this.vis.style.opacity = (1 - percentDone).toString();
        }, () => {
            this.vis.style.opacity = '0';
            setTimeout(() => this.step6(), 3000);
        }).start(500);
    }

    step6() {
        document.body.className = 'step6';
        this.text.innerText = 'Evaluating Pan and Zoom Timelines and Sliders';

        const paperInfoElements = document.getElementsByClassName('paper-info');

        new PZTAnimation((percentDone: number) => {
            for(let i = 0; i < paperInfoElements.length; i++) {
                const paperInfoElement = paperInfoElements[i];
                (paperInfoElement as HTMLElement).style.opacity = percentDone.toString();
            }
        }).start(500);
    }

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


