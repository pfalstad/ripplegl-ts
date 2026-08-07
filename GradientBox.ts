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
import { MediumBox } from "./MediumBox";

export class GradientBox extends RectDragObject {
    speedIndex: number;
    speedIndex2: number;
    absorption = 0;

    constructor(st?: StringTokenizer) {
        super(st);
        if (st != null) {
            this.speedIndex = parseFloat(st.nextToken());
            this.speedIndex2 = parseFloat(st.nextToken());
            if (st.hasMoreTokens())
                this.absorption = parseFloat(st.nextToken());
        } else {
            this.speedIndex = .25;
            this.speedIndex2 = .5;
        }
    }

    prepare(): void {
        const alpha = 1 - this.absorption;
        RippleSim.drawMedium(this.topLeft.x, this.topLeft.y, this.topRight.x, this.topRight.y,
            this.bottomLeft.x, this.bottomLeft.y,
            this.bottomRight.x, this.bottomRight.y,
            this.speedIndex, this.speedIndex2, alpha, alpha);
    }

    getEditInfo(n: number): EditInfo | null {
        if (n === 0)
            return new EditInfo("Refractive Index 1", Math.sqrt(1 / this.speedIndex), 0, 1).setDimensionless();
        if (n === 1)
            return new EditInfo("Refractive Index 2", Math.sqrt(1 / this.speedIndex2), 0, 1).setDimensionless();
        if (n === 2)
            return new EditInfo("Absorption (0-0.25)", this.absorption, 0, .25).setDimensionless();
        return null;
    }

    setEditValue(n: number, ei: EditInfo): void {
        if (n === 0)
            this.speedIndex = MediumBox.getRefractiveIndex(ei.value);
        if (n === 1)
            this.speedIndex2 = MediumBox.getRefractiveIndex(ei.value);
        if (n === 2)
            this.absorption = Math.min(.25, Math.max(0, ei.value));
    }

    getDumpType(): number { return "g".charCodeAt(0); }
    dump(): string { return super.dump() + " " + this.speedIndex + " " + this.speedIndex2 + " " + this.absorption; }
}
