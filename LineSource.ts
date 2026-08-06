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

import { Source } from "./Source";
import { DragHandle } from "./DragHandle";
import { StringTokenizer } from "./StringTokenizer";
import { RippleSim } from "./RippleSim";
import { EditInfo } from "./EditInfo";
import { Checkbox } from "./Checkbox";

export class LineSource extends Source {
    static readonly FLAG_GAUSS = 1;

    gauss = false;

    constructor();
    constructor(st: StringTokenizer);
    constructor(x: number, y: number, x2: number, y2: number);
    constructor(arg0?: number | StringTokenizer, arg1?: number, arg2?: number, arg3?: number) {
        if (arg0 instanceof StringTokenizer) {
            super(arg0, 2);
            this.setTransform();
            this.gauss = (this.flags & LineSource.FLAG_GAUSS) !== 0;
        } else if (arg0 !== undefined) {
            super();
            const h0 = this.handles[0];
            h0.x = arg0;
            h0.y = arg1 as number;
            this.handles.push(new DragHandle(this, arg2 as number, arg3 as number));
            this.frequency = .5;
            this.pulseLength = 10;
            this.delay = 100;
            this.setTransform();
        } else {
            super();
            this.handles.push(new DragHandle(this));
            this.setTransform();
        }
    }

    run(): void {
        const dh1 = this.handles[0];
        const dh2 = this.handles[1];
        const v = this.getValue();
        if (this.enabled)
            RippleSim.drawLineSource(dh1.x, dh1.y, dh2.x, dh2.y, v, this.gauss);
    }

    drawSelection(): void {
        RippleSim.drawWall(this.handles[0].x, this.handles[0].y, this.handles[1].x, this.handles[1].y);
    }

    dump(): string {
        this.flags = this.gauss ? LineSource.FLAG_GAUSS : 0;
        return super.dump();
    }

    getEditInfo(n: number): EditInfo | null {
        // we don't put the Gaussian checkbox at the end because Source has a variable number of edit info
        // items.  So we insert it at n == 1.
        if (n === 0)
            return super.getEditInfo(n);
        if (n === 1) {
            const ei = new EditInfo("", 0, -1, -1);
            ei.checkbox = new Checkbox("Gaussian", this.gauss);
            return ei;
        }
        return super.getEditInfo(n - 1);
    }

    setEditValue(n: number, ei: EditInfo): void {
        if (n === 0) {
            super.setEditValue(n, ei);
        }
        if (n === 1) {
            this.gauss = ei.checkbox!.getState();
            return;
        }
        super.setEditValue(n - 1, ei);
    }

    getDumpType(): number { return "S".charCodeAt(0); }
}
