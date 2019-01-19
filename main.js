"use strict";
var PanZoomTrailer = /** @class */ (function () {
    function PanZoomTrailer() {
        this.width = 0;
        this.height = 0;
        this.phoneHeightSvg = 165;
        this.phoneHeightM = 0.15;
        this.svgUnitToM = this.phoneHeightM / this.phoneHeightSvg;
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
        if (!hand || !phone || !text || !heightLine || !heightEndMarker || !perspective) {
            throw new Error('Could not find crucial DOM elements');
        }
        this.hand = hand;
        this.phone = phone;
        this.text = text;
        this.heightLine = heightLine;
        this.heightEndMarker = heightEndMarker;
        this.perspective = perspective;
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
        var up = function (onEnd) {
            new PZTAnimation(function (progressPercent) {
                var interpolateFct = _this.getInterpolateChoordFct(progressPercent, handBottom, handTop);
                _this.moveTo(_this.hand, interpolateFct('x'), interpolateFct('y'));
            }, function () {
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
                _this.step3();
            }); }); }); }); }); });
        }, 500);
    };
    PanZoomTrailer.prototype.step3 = function () {
        var _this = this;
        this.text.innerText = 'In fact, this is how much you daily: ';
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
        var updateBarHeight = function () {
            var totalBarHeightSvg = completedBarHeightSvg + currentlyAddingBarHeightSvg;
            var totalbarHeightM = Math.round(totalBarHeightSvg * _this.svgUnitToM);
            _this.text.innerText = 'In fact, this is how much you daily: ' + totalbarHeightM + 'm';
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
        var updateZoom = function () {
            var totalBarHeightSvg = completedBarHeightSvg + currentlyAddingBarHeightSvg;
            scale = Math.min(1, 1 / (totalBarHeightSvg / 300));
            _this.attr(_this.perspective, 'transform', 'scale(' + scale + ')');
            _this.attr(_this.heightEndMarker, 'stroke-width', 1 / scale);
            _this.attr(_this.heightLine, 'stroke-width', 1 / scale);
        };
        var up = function (onEnd) {
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
            }).start(30);
        };
        var down = function (onEnd) {
            _this.moveTo(_this.hand, handBottom.x, handBottom.y);
            setTimeout(onEnd);
        };
        var todo = [];
        var countCyclesNeeded = Math.round(goalHeightM / lineHeightSvgAddedPerCycle / this.svgUnitToM);
        for (var i_1 = 0; i_1 < countCyclesNeeded; i_1++) {
            todo.push(up);
            todo.push(down);
        }
        var i = -1;
        var workTodo = function () {
            i++;
            if (todo[i]) {
                todo[i](workTodo);
            }
        };
        setTimeout(function () { return workTodo(); }, 1000);
    };
    ;
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
