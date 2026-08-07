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
import { StringTokenizer } from "./StringTokenizer";
import { RippleSim } from "./RippleSim";
import { EditInfo } from "./EditInfo";
import { EditDialog } from "./EditDialog";

export class MediumBox extends RectDragObject {
    speedIndex: number;
    absorption: number;

    constructor();
    constructor(st: StringTokenizer);
    constructor(x: number, y: number, x2: number, y2: number);
    constructor(arg0?: number | StringTokenizer, y?: number, x2?: number, y2?: number) {
        if (arg0 instanceof StringTokenizer) {
            super(arg0);
            this.speedIndex = parseFloat(arg0.nextToken());
            this.absorption = arg0.hasMoreTokens() ? parseFloat(arg0.nextToken()) : 0;
        } else if (arg0 !== undefined) {
            super();
            this.speedIndex = .25;
            this.absorption = 0;
            this.topLeft.x = this.bottomLeft.x = arg0;
            this.topLeft.y = this.topRight.y = y as number;
            this.topRight.x = this.bottomRight.x = x2 as number;
            this.bottomLeft.y = this.bottomRight.y = y2 as number;
            this.setTransform();
        } else {
            super();
            this.speedIndex = .25;
            this.absorption = 0;
        }
    }

    prepare(): void {
        const alpha = 1 - this.absorption;
        RippleSim.drawMedium(this.topLeft.x, this.topLeft.y, this.topRight.x, this.topRight.y,
            this.bottomLeft.x, this.bottomLeft.y,
            this.bottomRight.x, this.bottomRight.y,
            this.speedIndex, this.speedIndex, alpha, alpha);
    }

    // let people poke inside
    hitTestInside(_x: number, _y: number): boolean { return false; }

    getEditInfo(n: number): EditInfo | null {
        if (n === 0)
            return new EditInfo("Refractive Index (1-2)", Math.sqrt(1 / this.speedIndex), 0, 1).setDimensionless();
        if (n === 1)
            return new EditInfo("Absorption (0-0.25)", this.absorption, 0, .25).setDimensionless();
        return null;
    }

    setEditValue(n: number, ei: EditInfo): void {
        if (n === 0) {
            this.speedIndex = MediumBox.getRefractiveIndex(ei.value);
            ei.value = Math.sqrt(1 / this.speedIndex);
            EditDialog.theEditDialog!.updateValue(ei);
        }
        if (n === 1)
            this.absorption = Math.min(.25, Math.max(0, ei.value));
    }

    static getRefractiveIndex(v: number): number {
        if (v < 1) v = 1;
        if (v > 2) v = 2;
        return 1 / (v * v);
    }

    getDumpType(): number { return "m".charCodeAt(0); }
    dump(): string { return super.dump() + " " + this.speedIndex + " " + this.absorption; }
}
