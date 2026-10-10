/*
    Copyright (C) 2017 by Paul Falstad

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

import { RippleSim } from "./RippleSim";
import { StringTokenizer } from "./StringTokenizer";
import { DragHandle } from "./DragHandle";
import { Point } from "./Point";
import { Rectangle } from "./Rectangle";
import type { Editable, EditInfo } from "./EditInfo";
import type { Graphics } from "./Graphics";

export abstract class DragObject implements Editable {
    handles: DragHandle[] = [];
    selected = false;
    sim: RippleSim;
    rotation = 0;
    transform: number[] | null = null;
    invTransform: number[] | null = null;
    centerX = 0;
    centerY = 0; // set in setTransform()
    flags = 0;

    constructor(st?: StringTokenizer) {
        this.sim = RippleSim.theSim;
        this.sim.changedWalls = true;
        if (st != null)
            this.flags = parseInt(st.nextToken());
        else
            this.setTransform();
    }

    prepare(): void {}
    setSelected(s: boolean): void { this.selected = s; }
    isSelected(): boolean { return this.selected; }
    run(): void {}
    delete(): void {}

    setTransform(): void {
        if (this.transform == null) {
            this.transform = new Array(6).fill(0);
            this.invTransform = new Array(6).fill(0);
        }
        const t = this.transform;
        const it = this.invTransform!;
        let cx = 0, cy = 0;
        for (const dh of this.handles) {
            cx += dh.x;
            cy += dh.y;
        }
        cx /= this.handles.length;
        cy /= this.handles.length;
        this.centerX = cx;
        this.centerY = cy;

        // make translation-rotation-translation matrix to rotate object about cx,cy
        t[0] = t[4] = Math.cos(this.rotation);
        t[1] = Math.sin(this.rotation);
        t[3] = -t[1];
        t[2] = (1 - t[0]) * cx - t[1] * cy;
        t[5] = -t[3] * cx + (1 - t[4]) * cy;
        // inverse transform
        it[0] = it[4] = t[0];
        it[1] = t[3];
        it[3] = t[1];
        it[2] = (1 - t[0]) * cx + t[1] * cy;
        it[5] = t[3] * cx + (1 - t[4]) * cy;
    }

    drag(dx: number, dy: number): boolean {
        for (const dh of this.handles) {
            dh.x += dx;
            dh.y += dy;
        }
        this.setTransform();
        return true;
    }

    draw(): void {
        if (!this.selected)
            return;
        const t = this.transform!;
        for (const dh of this.handles) {
            const x = Math.trunc(dh.x * t[0] + dh.y * t[1] + t[2]);
            const y = Math.trunc(dh.x * t[3] + dh.y * t[4] + t[5]);
            RippleSim.drawHandle(x, y);
        }
        this.drawSelection();
    }

    transformPoint(p: Point): Point {
        const t = this.transform!;
        const x = Math.trunc(p.x * t[0] + p.y * t[1] + t[2]);
        const y = Math.trunc(p.x * t[3] + p.y * t[4] + t[5]);
        return new Point(x, y);
    }

    inverseTransformPoint(p: Point): Point {
        const it = this.invTransform!;
        const x = Math.trunc(p.x * it[0] + p.y * it[1] + it[2]);
        const y = Math.trunc(p.x * it[3] + p.y * it[4] + it[5]);
        return new Point(x, y);
    }

    drawSelection(): void {}

    // draw onto the 2D overlay canvas, in grid coordinates; used by purely cosmetic
    // objects (e.g. Line, Text, Arrow) that don't affect the wave simulation via prepare().
    draw2D(_g: Graphics): void {}

    rotate(ang: number): void {
        this.rotation += ang;
        this.setTransform();
        this.sim.changedWalls = true;
    }

    rotateTo(x: number, y: number): void {
        this.rotation = Math.atan2(-y + this.centerY, x - this.centerX) - Math.PI / 2;
        const step = Math.PI / 12;
        this.rotation = Math.round(this.rotation / step) * step;
        this.setTransform();
        this.sim.changedWalls = true;
    }

    canRotate(): boolean { return false; }

    static hypotf(x: number, y: number): number {
        return Math.sqrt(x * x + y * y);
    }

    static distanceToLineSegment(x: number, y: number, lx1: number, ly1: number, lx2: number, ly2: number): number {
        x -= lx1;
        y -= ly1;
        lx2 -= lx1;
        ly2 -= ly1;
        const lr = DragObject.hypotf(lx2, ly2);

        // project along line
        const proj1 = (x * lx2 + y * ly2) / (lr * lr);

        // if we are off edge of line, return distance to nearest endpoint
        if (proj1 < 0)
            return DragObject.hypotf(x, y);
        if (proj1 > 1) {
            x -= lx2;
            y -= ly2;
            return DragObject.hypotf(x, y);
        }

        // return distance from line
        const proj2 = x * ly2 - y * lx2;
        return Math.abs(proj2) / lr;
    }

    hitTestInside(_x: number, _y: number): boolean { return false; }

    hitTest(x: number, y: number): number {
        if (this.handles.length === 1) {
            const dh = this.handles[0];
            return DragObject.hypotf(dh.x - x, dh.y - y);
        }
        const dh1 = this.handles[0];
        const dh2 = this.handles[1];
        return DragObject.distanceToLineSegment(x, y, dh1.x, dh1.y, dh2.x, dh2.y);
    }

    dragHandle(_dh: DragHandle, _x: number, _y: number): boolean {
        this.sim.changedWalls = true;
        return true;
    }

    setInitialPosition(): void {
        if (this.handles.length === 1) {
            const start = this.sim.findSpace(this, 0, 0);
            const dh = this.handles[0];
            dh.x = start.x;
            dh.y = start.y;
        }
        if (this.handles.length === 2) {
            const start = this.sim.findSpace(this, 40, 0);
            const dh1 = this.handles[0];
            const dh2 = this.handles[1];
            dh1.x = start.x;
            dh1.y = start.y;
            dh2.x = start.x + start.width;
            dh2.y = start.y;
        }
    }

    boundingBox(): Rectangle {
        let minx = 10000, miny = 10000, maxx = -10000, maxy = -10000;
        for (const dh of this.handles) {
            const p = this.transformPoint(new Point(dh.x, dh.y));
            if (p.x < minx) minx = p.x;
            if (p.y < miny) miny = p.y;
            if (p.x > maxx) maxx = p.x;
            if (p.y > maxy) maxy = p.y;
        }
        return new Rectangle(minx, miny, maxx - minx, maxy - miny);
    }

    abstract getDumpType(): number;

    dump(): string {
        const t = this.getDumpType();
        let out: string;
        if (t >= 200)
            out = t + " " + this.flags;
        else
            out = String.fromCharCode(t) + " " + this.flags;
        out += this.dumpHandles();
        return out;
    }

    dumpHandles(): string {
        let out = "";
        for (const dh of this.handles)
            out += " " + dh.x + " " + dh.y;
        return out;
    }

    getEditInfo(_n: number): EditInfo | null {
        return null;
    }

    setEditValue(_n: number, _ei: EditInfo): void {}

    rescale(scale: number): void {
        for (const dh of this.handles)
            dh.rescale(scale);
        this.setTransform();
    }

    selectText(): string | null {
        if (this.handles.length !== 2)
            return null;
        return "length = " + this.sim.getLengthText(this.length());
    }

    length(): number {
        const dh1 = this.handles[0];
        const dh2 = this.handles[1];
        return Math.round(Math.hypot(dh1.x - dh2.x, dh1.y - dh2.y));
    }

    reset(): void {}
    mouseDown(): void {}
}
