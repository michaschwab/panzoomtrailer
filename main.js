"use strict";
var PanZoomTrailer = /** @class */ (function () {
    function PanZoomTrailer() {
        this.width = 0;
        this.height = 0;
        var vis = document.getElementById('vis');
        if (!vis) {
            throw Error('Visualization DOM element not found');
        }
        this.vis = vis;
        this.setSize();
        var hand = document.getElementById('hand');
        var phone = document.getElementById('phone');
        var text = document.getElementById('text');
        if (!hand || !phone || !text) {
            throw new Error('Could not find crucial DOM elements');
        }
        this.hand = hand;
        this.phone = phone;
        this.text = text;
        this.step0();
    }
    PanZoomTrailer.prototype.setSize = function () {
        this.width = window.innerWidth;
        this.height = window.innerHeight;
        this.vis.setAttribute('width', this.width.toString());
        this.vis.setAttribute('height', this.height.toString());
    };
    PanZoomTrailer.prototype.step0 = function () {
        var _this = this;
        var centerX = this.width / 2;
        var handFrom = { x: centerX + 100, y: this.height };
        var handTo = { x: centerX - 90, y: this.height - 330 };
        this.moveTo(this.phone, centerX - 100, this.height - 500);
        this.moveTo(this.hand, handFrom.x, handFrom.y);
        this.text.innerText = 'Pan and Zoom is important because we use it a lot.';
        setTimeout(function () {
            new PZTAnimation(function (progressPercent) {
                var interpolateFct = _this.getInterpolateChoordFct(progressPercent, handFrom, handTo);
                _this.moveTo(_this.hand, interpolateFct('x'), interpolateFct('y'));
            }, function () {
                _this.step1();
            }).start(500);
        }, 1000);
    };
    PanZoomTrailer.prototype.step1 = function () {
        var _this = this;
        var centerX = this.width / 2;
        var handFrom = { x: centerX - 90, y: this.height - 330 };
        var handTo = { x: centerX - 90, y: this.height - 400 };
        setTimeout(function () {
            new PZTAnimation(function (progressPercent) {
                var interpolateFct = _this.getInterpolateChoordFct(progressPercent, handFrom, handTo);
                _this.moveTo(_this.hand, interpolateFct('x'), interpolateFct('y'));
            }, function () {
            }).start(500);
        }, 500);
    };
    PanZoomTrailer.prototype.getInterpolateChoordFct = function (progressPercent, from, to) {
        return function (coord) { return from[coord] + (to[coord] - from[coord]) * progressPercent; };
    };
    PanZoomTrailer.prototype.moveTo = function (element, x, y) {
        element.setAttributeNS(null, 'transform', 'translate(' + x + ', ' + y + ')');
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
