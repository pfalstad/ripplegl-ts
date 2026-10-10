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

import { Wall } from "./Wall";
import { StringTokenizer } from "./StringTokenizer";
import { RippleSim } from "./RippleSim";
import { EditInfo } from "./EditInfo";

export class Slit extends Wall {
    slitCount: number;
    slitWidth: number;
    slitSeparation: number;

    constructor(st?: StringTokenizer) {
        if (st != null) {
            super(st);
            this.slitCount = parseInt(st.nextToken());
            this.slitWidth = parseInt(st.nextToken());
            this.slitSeparation = parseInt(st.nextToken());
        } else {
            super();
            this.slitCount = 1;
            this.slitWidth = 10;
            this.slitSeparation = 10;
        }
    }

    dump(): string {
        return super.dump() + " " + this.slitCount + " " + this.slitWidth + " " + this.slitSeparation;
    }

    prepare(): void {
        const h1 = this.handles[0];
        const h2 = this.handles[1];
        const dx = h2.x - h1.x;
        const dy = h2.y - h1.y;
        const len = Math.hypot(dx, dy);
        const pos0 = (len - this.slitCount * this.slitWidth - (this.slitCount - 1) * this.slitSeparation) / 2;
        if (pos0 < 0)
            return;
        let n1 = 0;
        for (let i = 0; i !== this.slitCount; i++) {
            const n2 = (pos0 + (this.slitWidth + this.slitSeparation) * i) / len;
            Slit.drawWall(h1.x + dx * n1, h1.y + dy * n1, h1.x + dx * n2, h1.y + dy * n2);
            n1 = n2 + this.slitWidth / len;
        }
        RippleSim.drawWall(h2.x, h2.y, Math.trunc(h1.x + dx * n1), Math.trunc(h1.y + dy * n1));
    }

    static drawWall(x1: number, y1: number, x2: number, y2: number): void {
        RippleSim.drawWall(Math.trunc(x1), Math.trunc(y1), Math.trunc(x2), Math.trunc(y2));
    }

    getEditInfo(n: number): EditInfo | null {
        if (n === 0)
            return new EditInfo("Slit Count", this.slitCount, 0, 1).setDimensionless();
        if (n === 1)
            return new EditInfo("Slit Width (m)", this.slitWidth * this.sim.lengthScale, 0, 1);
        if (n === 2)
            return new EditInfo("Slit Separation (m)", this.slitSeparation * this.sim.lengthScale, 0, 1);
        return null;
    }

    setEditValue(n: number, ei: EditInfo): void {
        if (n === 0)
            this.slitCount = Math.trunc(ei.value);
        if (n === 1)
            this.slitWidth = Math.trunc(ei.value / this.sim.lengthScale);
        if (n === 2)
            this.slitSeparation = Math.trunc(ei.value / this.sim.lengthScale);
    }

    getDumpType(): number { return 203; }
}
