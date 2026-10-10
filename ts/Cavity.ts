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

import { RectDragObject } from "./RectDragObject";
import { DragHandle } from "./DragHandle";
import { StringTokenizer } from "./StringTokenizer";
import { RippleSim } from "./RippleSim";
import { EditInfo } from "./EditInfo";
import { Slit } from "./Slit";

export class Cavity extends RectDragObject {
    slitWidth: number;

    constructor();
    constructor(st: StringTokenizer);
    constructor(x1: number, y1: number, x2: number, y2: number);
    constructor(arg0?: number | StringTokenizer, y1?: number, x2?: number, y2?: number) {
        if (arg0 instanceof StringTokenizer) {
            super(arg0);
            this.slitWidth = 10000;
            try {
                this.slitWidth = parseInt(arg0.nextToken());
            } catch (e) { /* ignored */ }
        } else if (arg0 !== undefined) {
            super();
            this.topLeft.x = this.bottomLeft.x = arg0;
            this.topLeft.y = this.topRight.y = y1 as number;
            this.bottomRight.x = this.topRight.x = x2 as number;
            this.bottomRight.y = this.bottomLeft.y = y2 as number;
            this.slitWidth = 10000;
            this.setTransform();
        } else {
            super();
            this.slitWidth = 10000;
        }
    }

    dump(): string {
        return super.dump() + " " + this.slitWidth;
    }

    prepare(): void {
        RippleSim.drawWall(this.topLeft.x, this.topLeft.y, this.bottomLeft.x, this.bottomLeft.y);
        RippleSim.drawWall(this.bottomRight.x, this.bottomRight.y, this.topRight.x, this.topRight.y);
        RippleSim.drawWall(this.bottomLeft.x, this.bottomLeft.y, this.bottomRight.x, this.bottomRight.y);
        const h1: DragHandle = this.topLeft;
        const h2: DragHandle = this.topRight;
        const dx = h2.x - h1.x;
        const dy = h2.y - h1.y;
        const len = Math.hypot(dx, dy);
        if (this.slitWidth > len)
            return;
        const n1 = .5 - this.slitWidth / len / 2;
        Slit.drawWall(h1.x, h1.y, h1.x + dx * n1, h1.y + dy * n1);
        Slit.drawWall(h2.x, h2.y, h2.x - dx * n1, h2.y - dy * n1);
    }

    drawSelection(): void {
        this.prepare();
    }

    // let people poke inside
    hitTestInside(_x: number, _y: number): boolean { return false; }

    protected selectTextAdjust(): number { return 2; }

    getDumpType(): number { return "c".charCodeAt(0); }

    getEditInfo(n: number): EditInfo | null {
        if (n === 0) {
            const w = (this.slitWidth > this.width()) ? this.width() : this.slitWidth;
            return new EditInfo("Opening Width (m)", w * this.sim.lengthScale, 0, 1);
        }
        return null;
    }

    setEditValue(n: number, ei: EditInfo): void {
        if (n === 0)
            this.slitWidth = Math.trunc(ei.value / this.sim.lengthScale);
    }
}
