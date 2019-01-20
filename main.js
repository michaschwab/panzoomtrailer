"use strict";
var PanZoomTrailer = /** @class */ (function () {
    function PanZoomTrailer() {
        this.width = 0;
        this.height = 0;
        this.phoneHeightSvg = 165;
        this.phoneHeightM = 0.15;
        this.svgUnitToM = this.phoneHeightM / this.phoneHeightSvg; // 0.0009090909
        this.initialBottomPadding = 330;
        var vis = document.getElementById('vis');
        if (!vis) {
            throw Error('Visualization DOM element not found');
        }
        this.vis = vis;
        this.setSize();
        window.addEventListener('resize', this.setSize.bind(this));
        var hand = document.getElementById('hand');
        var phone = document.getElementById('phone');
        var text = document.getElementById('text');
        var heightLine = document.getElementById('height-line');
        var heightEndMarker = document.getElementById('height-end-marker');
        var perspective = document.getElementById('perspective');
        var phoneText = document.getElementById('phone-text');
        if (!hand || !phone || !text || !heightLine || !heightEndMarker || !perspective || !phoneText) {
            throw new Error('Could not find crucial DOM elements');
        }
        this.hand = hand;
        this.phone = phone;
        this.text = text;
        this.heightLine = heightLine;
        this.heightEndMarker = heightEndMarker;
        this.perspective = perspective;
        this.phoneText = phoneText;
        this.step1();
    }
    PanZoomTrailer.prototype.setSize = function () {
        this.width = window.innerWidth;
        this.height = window.innerHeight;
        this.vis.setAttribute('width', this.width.toString());
        this.vis.setAttribute('height', this.height.toString());
    };
    PanZoomTrailer.prototype.step1 = function () {
        var _this = this;
        var centerX = this.width / 2;
        var handFrom = { x: centerX + 100, y: this.height };
        var handTo = { x: centerX - 90, y: this.height - this.initialBottomPadding };
        this.moveTo(this.phone, centerX - 100, this.height - this.initialBottomPadding - 170);
        this.moveTo(this.hand, handFrom.x, handFrom.y);
        this.phoneText.style.left = centerX - 30 + 'px';
        this.phoneText.style.top = this.height - this.initialBottomPadding - 28 + 'px';
        this.text.innerText = 'Pan and Zoom is important because we use it a lot.';
        setTimeout(function () {
            new PZTAnimation(function (progressPercent) {
                var interpolateFct = _this.getInterpolateChoordFct(progressPercent, handFrom, handTo);
                _this.moveTo(_this.hand, interpolateFct('x'), interpolateFct('y'));
            }, function () {
                _this.moveTo(_this.hand, handTo.x, handTo.y);
                _this.step2();
            }).start(500);
        }, 1000);
    };
    PanZoomTrailer.prototype.step2 = function () {
        var _this = this;
        var centerX = this.width / 2;
        var handBottom = { x: centerX - 90, y: this.height - this.initialBottomPadding };
        var handTop = { x: centerX - 90, y: this.height - this.initialBottomPadding - 70 };
        var finishedScrollingPx = 0;
        var currentlyScrollingPx = 0;
        var updateScroll = function () {
            _this.phoneText.scrollTop = finishedScrollingPx + currentlyScrollingPx;
        };
        var up = function (onEnd) {
            new PZTAnimation(function (progressPercent) {
                var interpolateFct = _this.getInterpolateChoordFct(progressPercent, handBottom, handTop);
                currentlyScrollingPx = (handBottom.y - handTop.y) * progressPercent;
                updateScroll();
                _this.moveTo(_this.hand, interpolateFct('x'), interpolateFct('y'));
            }, function () {
                currentlyScrollingPx = 0;
                finishedScrollingPx += handBottom.y - handTop.y;
                updateScroll();
                onEnd();
            }).start(500);
        };
        var down = function (onEnd) {
            new PZTAnimation(function (progressPercent) {
                var interpolateFct = _this.getInterpolateChoordFct(progressPercent, handTop, handBottom);
                _this.moveTo(_this.hand, interpolateFct('x'), interpolateFct('y'));
            }, function () {
                onEnd();
            }).start(150);
        };
        setTimeout(function () {
            up(function () { return down(function () { return up(function () { return down(function () { return up(function () { return down(function () {
                new PZTAnimation(function (progressPercent) {
                    _this.phoneText.style.opacity = (1 - progressPercent).toString();
                }, function () { return _this.step3(); }).start(300);
            }); }); }); }); }); });
        }, 500);
    };
    PanZoomTrailer.prototype.step3 = function () {
        var _this = this;
        this.text.innerText = 'In fact, this is how much you pan daily: ';
        var centerX = this.width / 2;
        var handBottom = { x: centerX - 90, y: this.height - this.initialBottomPadding };
        var handTop = { x: centerX - 90, y: this.height - this.initialBottomPadding - 70 };
        var lineX = centerX - 16;
        var lineStartY = this.height - this.initialBottomPadding + 60;
        var lineHeightSvgAddedPerCycle = 90;
        var goalHeightM = 25;
        var completedBarHeightSvg = 0;
        var currentlyAddingBarHeightSvg = 0;
        var scale = 1;
        var tasksDoneCount = -1;
        var updateBarHeight = function () {
            var totalBarHeightSvg = completedBarHeightSvg + currentlyAddingBarHeightSvg;
            var totalbarHeightM = Math.round(totalBarHeightSvg * _this.svgUnitToM);
            _this.text.innerText = 'In fact, this is how much you pan daily: ' + totalbarHeightM + 'm';
            _this.attr(_this.heightEndMarker, 'x1', lineX - 5 / scale);
            _this.attr(_this.heightEndMarker, 'x2', lineX + 5 / scale);
            _this.attr(_this.heightEndMarker, 'y1', lineStartY - totalBarHeightSvg);
            _this.attr(_this.heightEndMarker, 'y2', lineStartY - totalBarHeightSvg);
            _this.attr(_this.heightLine, 'x1', lineX);
            _this.attr(_this.heightLine, 'x2', lineX);
            _this.attr(_this.heightLine, 'y1', lineStartY);
            _this.attr(_this.heightLine, 'y2', lineStartY - totalBarHeightSvg);
        };
        this.attr(this.perspective, 'transform-origin', lineX + 'px ' + (lineStartY + 200) + 'px');
        var customSigmoid = function (t) {
            return 1 / (1 + Math.pow(Math.E, -10 * (t - 0.43)));
        };
        var updateZoom = function () {
            var totalBarHeightSvg = completedBarHeightSvg + currentlyAddingBarHeightSvg;
            var scaleLinear = Math.min(1, 1 / (totalBarHeightSvg / 400));
            if (scaleLinear < 0) {
                scaleLinear = 1;
            }
            scale = customSigmoid(scaleLinear);
            _this.attr(_this.perspective, 'transform', 'scale(' + scale + ')');
            _this.attr(_this.heightEndMarker, 'stroke-width', 2 / scale);
            _this.attr(_this.heightLine, 'stroke-width', 2 / scale);
        };
        var up = function (onEnd) {
            if (tasksDoneCount > 10) {
                completedBarHeightSvg += lineHeightSvgAddedPerCycle;
                updateBarHeight();
                updateZoom();
                setTimeout(onEnd);
            }
            else {
                var animationTime = Math.max(400 - 10 * tasksDoneCount, 20);
                new PZTAnimation(function (progressPercent) {
                    var interpolateFct = _this.getInterpolateChoordFct(progressPercent, handBottom, handTop);
                    _this.moveTo(_this.hand, interpolateFct('x'), interpolateFct('y'));
                    currentlyAddingBarHeightSvg = progressPercent * lineHeightSvgAddedPerCycle;
                    updateBarHeight();
                    updateZoom();
                }, function () {
                    completedBarHeightSvg += lineHeightSvgAddedPerCycle;
                    currentlyAddingBarHeightSvg = 0;
                    onEnd();
                }).start(animationTime);
            }
        };
        var down = function (onEnd) {
            if (tasksDoneCount > 10) {
                _this.moveTo(_this.hand, handBottom.x, handBottom.y);
                setTimeout(onEnd);
            }
            else {
                var animationTime = Math.max(100 - 10 * tasksDoneCount, 30);
                new PZTAnimation(function (progressPercent) {
                    var interpolateFct = _this.getInterpolateChoordFct(progressPercent, handTop, handBottom);
                    _this.moveTo(_this.hand, interpolateFct('x'), interpolateFct('y'));
                }, function () {
                    onEnd();
                }).start(animationTime);
            }
        };
        var todo = [];
        var countCyclesNeeded = Math.round(goalHeightM / lineHeightSvgAddedPerCycle / this.svgUnitToM);
        for (var i = 0; i < countCyclesNeeded; i++) {
            todo.push(up);
            todo.push(down);
        }
        todo.push(function () {
            new PZTAnimation(function (progressPercent) {
                _this.phone.style.opacity = (1 - progressPercent).toString();
                _this.hand.style.opacity = (1 - progressPercent).toString();
            }, function () {
                _this.phone.style.opacity = '0';
                _this.hand.style.opacity = '0';
                _this.step4(scale);
            }).start(300);
        });
        var workTodo = function () {
            tasksDoneCount++;
            if (todo[tasksDoneCount]) {
                todo[tasksDoneCount](workTodo);
            }
        };
        updateBarHeight();
        setTimeout(function () { return workTodo(); }, 1000);
    };
    ;
    PanZoomTrailer.prototype.step4 = function (scaleStart) {
        var _this = this;
        var centerX = this.width / 2;
        var lineX = centerX - 16;
        var lineStartY = this.height - this.initialBottomPadding + 60;
        this.text.innerText = 'Over a year, you zoom: ';
        var barStartHeight = 25 / this.svgUnitToM;
        var barEndHeight = 25 * 365 / this.svgUnitToM;
        var barHeight = barStartHeight;
        var scale = scaleStart;
        var customSigmoid = function (t) {
            return 1 / (1 + Math.pow(Math.E, -15 * (t - 0.4)));
        };
        var updateZoom = function () {
            var scaleLinear = Math.min(1, 1 / ((barHeight - barStartHeight) / 25000));
            if (scaleLinear < 0) {
                scaleLinear = 1;
            }
            //console.log(scaleLinear);
            scale = scaleStart * customSigmoid(scaleLinear);
            _this.attr(_this.perspective, 'transform', 'scale(' + scale + ')');
            _this.attr(_this.heightEndMarker, 'stroke-width', 2 / scale);
            _this.attr(_this.heightLine, 'stroke-width', 2 / scale);
        };
        updateZoom();
        var updateBarHeight = function () {
            var totalbarHeightM = Math.round(barHeight * _this.svgUnitToM);
            _this.text.innerText = 'Over a year, you zoom: ' + totalbarHeightM + 'm';
            _this.attr(_this.heightEndMarker, 'x1', lineX - 5 / scale);
            _this.attr(_this.heightEndMarker, 'x2', lineX + 5 / scale);
            _this.attr(_this.heightEndMarker, 'y1', lineStartY - barHeight);
            _this.attr(_this.heightEndMarker, 'y2', lineStartY - barHeight);
            _this.attr(_this.heightLine, 'x1', lineX);
            _this.attr(_this.heightLine, 'x2', lineX);
            _this.attr(_this.heightLine, 'y1', lineStartY);
            _this.attr(_this.heightLine, 'y2', lineStartY - barHeight);
        };
        setTimeout(function () {
            new PZTAnimation(function (percentDone) {
                barHeight = barStartHeight + (barEndHeight - barStartHeight) * percentDone;
                updateBarHeight();
                updateZoom();
            }).start(5000);
        }, 2000);
    };
    PanZoomTrailer.prototype.getInterpolateChoordFct = function (progressPercent, from, to) {
        return function (coord) { return from[coord] + (to[coord] - from[coord]) * progressPercent; };
    };
    PanZoomTrailer.prototype.moveTo = function (element, x, y) {
        element.setAttributeNS(null, 'transform', 'translate(' + x + ', ' + y + ')');
    };
    PanZoomTrailer.prototype.attr = function (element, attrName, value) {
        element.setAttributeNS(null, attrName, value.toString());
    };
    return PanZoomTrailer;
}());
var PZTAnimation = /** @class */ (function () {
    function PZTAnimation(onAnimationStep, onAnimationEnd) {
        this.onAnimationStep = onAnimationStep;
        this.onAnimationEnd = onAnimationEnd;
        this.startMs = 0;
        this.endMs = 0;
        this.boundOnAnimationFrame = this.onAnimationFrame.bind(this);
    }
    PZTAnimation.prototype.start = function (durationMs) {
        var nowMs = performance.now();
        // If the animation is already happening, just update its end time.
        if (nowMs <= this.endMs) {
            this.endMs = nowMs + durationMs;
            return;
        }
        this.startMs = nowMs;
        this.endMs = nowMs + durationMs;
        requestAnimationFrame(this.boundOnAnimationFrame);
    };
    PZTAnimation.prototype.stop = function () {
        this.endMs = 0;
    };
    Object.defineProperty(PZTAnimation.prototype, "startTimeMs", {
        get: function () {
            return this.startMs;
        },
        enumerable: true,
        configurable: true
    });
    PZTAnimation.prototype.onAnimationFrame = function (nowMs) {
        if (nowMs >= this.endMs) {
            if (this.onAnimationEnd) {
                this.onAnimationEnd();
            }
            return;
        }
        this.onAnimationStep((nowMs - this.startMs) / (this.endMs - this.startMs));
        requestAnimationFrame(this.boundOnAnimationFrame);
    };
    return PZTAnimation;
}());
var pzt = new PanZoomTrailer();
