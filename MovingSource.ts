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

export class MovingSource extends Source {
    moveDuration: number;
    pauseDuration: number;
    startIter = 0;
    phase = 0;

    constructor(st?: StringTokenizer) {
        if (st != null) {
            super(st, 2);
            this.moveDuration = parseInt(st.nextToken());
            this.pauseDuration = parseInt(st.nextToken());
        } else {
            super();
            this.handles.push(new DragHandle(this));
            this.moveDuration = 900;
            this.pauseDuration = 500;
        }
    }

    dump(): string { return super.dump() + " " + this.moveDuration + " " + this.pauseDuration; }

    run(): void {
        const dh1 = this.handles[0];
        const dh2 = this.handles[1];

        if (this.sim.iters < this.startIter)
            this.startIter = this.sim.iters;

        const dur = (this.phase === 0 || this.phase === 2) ? this.moveDuration : this.pauseDuration;
        let step = (this.sim.iters - this.startIter) / dur;
        if (step > 1) {
            step = 1;
            this.startIter = this.sim.iters;
            this.phase++;
            if (this.phase >= 4)
                this.phase = 0;
            step = 0;
        }
        if (this.phase === 1)
            step = 1;
        if (this.phase === 3)
            step = 0;
        if (this.phase === 2)
            step = 1 - step;

        const v = this.getValue();
        const nstep = 1 - step;

        // use drawPoke here because it is less noisy
        if (this.enabled)
            RippleSim.drawPoke(Math.trunc(dh1.x * nstep + dh2.x * step),
                Math.trunc(dh1.y * nstep + dh2.y * step), v);
    }

    getEditInfo(n: number): EditInfo | null {
        if (n === 0)
            return new EditInfo("Move Duration (iters)", this.moveDuration, 0, 1).setDimensionless();
        if (n === 1)
            return new EditInfo("Pause Duration (iters)", this.pauseDuration, 0, 1).setDimensionless();
        return super.getEditInfo(n - 2);
    }

    setEditValue(n: number, ei: EditInfo): void {
        if (n === 0)
            this.moveDuration = Math.trunc(ei.value);
        if (n === 1)
            this.pauseDuration = Math.trunc(ei.value);
        super.setEditValue(n - 2, ei);
    }

    drawSelection(): void {
        RippleSim.drawWall(this.handles[0].x, this.handles[0].y, this.handles[1].x, this.handles[1].y);
    }

    getDumpType(): number { return "d".charCodeAt(0); }

    selectText(): string | null {
        const s = super.selectText();
        if (s == null)
            return null;
        return s + ", v = " + this.sim.getSpeedText(this.length() / this.moveDuration);
    }
}
