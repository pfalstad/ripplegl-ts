/*
    Copyright (C) 2017 by Paul Falstad and Iain Sharp

    This file is part of RippleGL.

    RippleGL is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 2 of the License, or
    (at your option) any later version.

    RippleGL is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with RippleGL.  If not, see <http://www.gnu.org/licenses/>.
*/

export class Scrollbar {
    static HORIZONTAL = 1;
    static HMARGIN = 2;
    static SCROLLHEIGHT = 14;
    static BARWIDTH = 3;
    static BARMARGIN = 3;

    element: HTMLElement;
    canvas: HTMLCanvasElement;
    g: CanvasRenderingContext2D;
    min: number;
    max: number;
    val: number;
    private widthPx: number;
    dragging = false;
    enabled = true;
    command: (() => void) | null;
    formatValue: ((v: number) => string) | null;

    // bound once so add/removeEventListener target the same function reference
    private boundMouseMove = (e: MouseEvent) => this.onMouseMove(e);
    private boundMouseUp = (e: MouseEvent) => this.onMouseUp(e);

    constructor(_orientation: number, value: number, _visible: number, minimum: number, maximum: number,
        cmd: (() => void) | null = null, formatValue: ((v: number) => string) | null = null) {
        this.min = minimum;
        this.max = maximum - 1;
        this.val = value;
        this.command = cmd;
        this.formatValue = formatValue;
        this.widthPx = 166;

        this.element = document.createElement("div");
        this.canvas = document.createElement("canvas");
        this.canvas.style.width = this.widthPx + "px";
        //this.canvas.style.height = "40px";
        this.canvas.width = this.widthPx;
        this.canvas.height = Scrollbar.SCROLLHEIGHT;
        this.element.appendChild(this.canvas);
        this.g = this.canvas.getContext("2d")!;
        this.g.fillStyle = "#ffffff";

        this.canvas.addEventListener("mousedown", (e) => this.onMouseDown(e));
        this.canvas.addEventListener("mouseout", (e) => this.onMouseOut(e));
        this.canvas.addEventListener("wheel", (e) => this.onMouseWheel(e as WheelEvent), { passive: false });

        this.canvas.addEventListener("touchstart", (e) => this.onTouchStart(e), { passive: false });
        this.canvas.addEventListener("touchmove", (e) => this.onTouchMove(e), { passive: false });
        this.canvas.addEventListener("touchend", (e) => this.onTouchEnd(e));
        this.canvas.addEventListener("touchcancel", () => this.onTouchCancel());

        this.draw();
    }

    setWidth(w: number): void {
        this.widthPx = w;
        this.canvas.style.width = w + "px";
        this.canvas.width = w;
        this.draw();
    }

    draw(): void {
        const g = this.g;
        const width = this.widthPx;
        const SCROLLHEIGHT = Scrollbar.SCROLLHEIGHT;
        const HMARGIN = Scrollbar.HMARGIN;
        const BARMARGIN = Scrollbar.BARMARGIN;

        g.font = "15px sans-serif";
        const valStr = this.formatValue ? this.formatValue(this.val) : String(this.val);
        const tw = g.measureText(valStr).width;

        g.fillStyle = "#ffffff";
        g.strokeStyle = this.enabled ? "#000000" : "lightgrey";
        g.lineWidth = 1.0;
        g.fillRect(0, 0, width, SCROLLHEIGHT);
        g.beginPath();
        g.moveTo(HMARGIN + SCROLLHEIGHT - 3, 0);
        g.lineTo(HMARGIN, SCROLLHEIGHT / 2);
        g.lineTo(HMARGIN + SCROLLHEIGHT - 3, SCROLLHEIGHT);
        g.moveTo(width - HMARGIN - SCROLLHEIGHT + 3, 0);
        g.lineTo(width - HMARGIN, SCROLLHEIGHT / 2);
        g.lineTo(width - HMARGIN - SCROLLHEIGHT + 3, SCROLLHEIGHT);
        g.stroke();
        if (this.enabled)
            g.strokeStyle = "grey";
        g.beginPath();
        g.lineWidth = 5.0;
        const rmargin = (this.val > (this.max * 3 + this.min) / 4) ? 0 : tw;
        const lmargin = tw - rmargin;
        g.moveTo(HMARGIN + SCROLLHEIGHT + BARMARGIN + lmargin, SCROLLHEIGHT / 2);
        g.lineTo(width - HMARGIN - SCROLLHEIGHT - BARMARGIN - rmargin, SCROLLHEIGHT / 2);
        g.stroke();
        const p = HMARGIN + SCROLLHEIGHT + BARMARGIN +
            ((width - 2 * (HMARGIN + SCROLLHEIGHT + BARMARGIN)) * (this.val - this.min)) / (this.max - this.min);
        if (this.enabled) {
            g.strokeStyle = "red";
            g.beginPath();
            g.moveTo(HMARGIN + SCROLLHEIGHT + BARMARGIN + lmargin, SCROLLHEIGHT / 2);
            g.lineTo(p, SCROLLHEIGHT / 2);
            g.stroke();
            g.strokeStyle = "#000000";
            g.lineWidth = 2.0;
            g.fillRect(p - 2, 2, 5, SCROLLHEIGHT - 4);
            g.strokeRect(p - 2, 2, 5, SCROLLHEIGHT - 4);
        }

        g.textBaseline = "middle";
        g.fillStyle = "#000000";
        const x = (rmargin === 0) ? HMARGIN + SCROLLHEIGHT : width - SCROLLHEIGHT - HMARGIN - tw;
        g.fillText(valStr, x, SCROLLHEIGHT / 2);
    }

    calcValueFromPos(x: number): number {
        let v = this.min + (this.max - this.min) * (x - Scrollbar.HMARGIN - Scrollbar.SCROLLHEIGHT - Scrollbar.BARMARGIN) /
            (this.widthPx - 2 * (Scrollbar.HMARGIN + Scrollbar.SCROLLHEIGHT + Scrollbar.BARMARGIN));
        v = Math.round(v);
        if (v < this.min) v = this.min;
        if (v > this.max) v = this.max;
        return v;
    }

    private offsetX(e: MouseEvent | Touch): number {
        const rect = this.canvas.getBoundingClientRect();
        return e.clientX - rect.left;
    }

    private doMouseDown(x: number): void {
        if (!this.enabled)
            return;
        if (x < Scrollbar.HMARGIN + Scrollbar.SCROLLHEIGHT) {
            if (this.val > this.min) this.val--;
        } else if (x > this.widthPx - Scrollbar.HMARGIN - Scrollbar.SCROLLHEIGHT) {
            if (this.val < this.max) this.val++;
        } else {
            this.val = this.calcValueFromPos(x);
            this.dragging = true;
            // like GWT's Event.setCapture(): route mousemove/mouseup through document while
            // dragging, so the drag keeps tracking the mouse even once it leaves the canvas
            document.addEventListener("mousemove", this.boundMouseMove);
            document.addEventListener("mouseup", this.boundMouseUp);
        }
        this.draw();
        if (this.command) this.command();
    }

    private releaseCapture(): void {
        document.removeEventListener("mousemove", this.boundMouseMove);
        document.removeEventListener("mouseup", this.boundMouseUp);
    }

    onMouseDown(e: MouseEvent): void {
        this.dragging = false;
        e.preventDefault();
        this.doMouseDown(this.offsetX(e));
    }

    onMouseMove(e: MouseEvent): void {
        e.preventDefault();
        if (this.enabled && this.dragging) {
            // belt-and-suspenders: if the mouse button was released somewhere that
            // didn't deliver us a mouseup (e.g. over another window), e.buttons lets
            // us notice on the next move and stop dragging instead of tracking forever
            if (e.buttons === 0) {
                this.dragging = false;
                this.releaseCapture();
                this.draw();
                return;
            }
            this.val = this.calcValueFromPos(this.offsetX(e));
            this.draw();
            if (this.command) this.command();
        }
    }

    onMouseUp(e: MouseEvent): void {
        e.preventDefault();
        this.releaseCapture();
        if (this.enabled && this.dragging) {
            this.val = this.calcValueFromPos(this.offsetX(e));
            this.dragging = false;
            this.draw();
            if (this.command) this.command();
        }
    }

    onMouseOut(_e: MouseEvent): void {
        // dragging continues until mouseup, matching original behavior
    }

    onMouseWheel(e: WheelEvent): void {
        e.preventDefault();
        if (this.enabled)
            this.setValue(this.val + e.deltaY / 3);
    }

    onTouchStart(e: TouchEvent): void {
        e.preventDefault();
        this.dragging = false;
        this.doMouseDown(this.offsetX(e.touches[0]));
    }

    onTouchMove(e: TouchEvent): void {
        e.preventDefault();
        if (this.enabled && this.dragging) {
            this.val = this.calcValueFromPos(this.offsetX(e.touches[0]));
            this.draw();
            if (this.command) this.command();
        }
    }

    onTouchEnd(e: TouchEvent): void {
        e.preventDefault();
        if (this.enabled && this.dragging) {
            this.dragging = false;
            this.draw();
            if (this.command) this.command();
        }
    }

    onTouchCancel(): void {
        this.dragging = false;
    }

    addClickHandler(fn: () => void): void {
        this.canvas.addEventListener("click", fn);
    }

    getValue(): number {
        return this.val;
    }

    setValue(i: number): void {
        if (i < this.min) i = this.min;
        else if (i > this.max) i = this.max;
        this.val = Math.round(i);
        this.draw();
        if (this.command) this.command();
    }

    enable(): void {
        this.enabled = true;
        this.draw();
    }

    disable(): void {
        this.enabled = false;
        this.dragging = false;
        this.releaseCapture();
        this.draw();
    }
}
