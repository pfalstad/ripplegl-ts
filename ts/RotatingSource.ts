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

import { MultipoleSource } from "./MultipoleSource";
import { StringTokenizer } from "./StringTokenizer";
import { RippleSim } from "./RippleSim";
import { EditInfo } from "./EditInfo";

export class RotatingSource extends MultipoleSource {
    anglePerIter: number;

    constructor(st?: StringTokenizer) {
        super(st);
        this.anglePerIter = st != null ? parseFloat(st.nextToken()) : .002;
    }

    run(): void {
        const v = this.getValue();
        if (this.enabled) {
            for (let i = 0; i !== this.sourceCount; i++) {
                const dh = this.handles[i + 1];
                // use drawPoke here because it is less noisy
                RippleSim.drawPoke(dh.x, dh.y, i % 2 === 0 ? v : -v);
            }
        }
        this.rotate(this.anglePerIter);
    }

    dump(): string {
        return super.dump() + " " + this.anglePerIter;
    }

    canRotate(): boolean { return false; }

    getDumpType(): number { return 204; }

    getEditInfo(n: number): EditInfo | null {
        if (n === 0)
            return new EditInfo("Iters Per Rotation", 2 * Math.PI / this.anglePerIter, 0, 1).setDimensionless();
        return super.getEditInfo(n - 1);
    }

    setEditValue(n: number, ei: EditInfo): void {
        if (n === 0)
            this.anglePerIter = 2 * Math.PI / ei.value;
        super.setEditValue(n - 1, ei);
    }
}
