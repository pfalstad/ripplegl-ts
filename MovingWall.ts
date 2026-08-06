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

export class MovingWall extends RectDragObject {
    complained = false;
    moveDuration: number;
    pauseDuration: number;
    startIter = 0;
    phase = 0;
    lastWallX1 = 0;
    lastWallX2 = 0;
    lastWallY1 = 0;
    lastWallY2 = 0;

    constructor(st?: StringTokenizer) {
        super(st);
        if (st != null) {
            this.moveDuration = parseInt(st.nextToken());
            this.pauseDuration = parseInt(st.nextToken());
        } else {
            this.moveDuration = 900;
            this.pauseDuration = 500;
        }
    }

    dump(): string { return super.dump() + " " + this.moveDuration + " " + this.pauseDuration; }

    run(): void {
        if (this.sim.waveChooser.getSelectedIndex() === RippleSim.WAVE_SOUND) {
            // Moving walls cause the simulation to become unstable when using acoustic wave simulation.  When a wall moves, it leaves behind a cell
            // with zero displacement, which is not right; it should use the value of the adjacent cell.  We would need to write a shader to clean this up
            // and set an appropriate displacement for those cells, using acoustic boundary conditions.
            if (!this.complained) {
                alert("Moving walls are not supported for acoustic waves.");
                this.complained = true;
            }
            this.sim.iters = this.startIter;
        }
        if (this.sim.iters < this.startIter)
            this.startIter = this.sim.iters;

        const t = this.transform!;
        RippleSim.setTransform(t[0], t[1], t[2], t[3], t[4], t[5]);
        RippleSim.clearWall(this.lastWallX1, this.lastWallY1, this.lastWallX2, this.lastWallY2);
        const x1 = this.topLeft.x;
        const x2 = this.topRight.x;
        const y1 = this.topLeft.y;
        const y2 = this.bottomLeft.y;
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
        const y = Math.trunc(y1 + (y2 - y1) * step);
        this.lastWallX1 = x1;
        this.lastWallY1 = y;
        this.lastWallX2 = x2;
        this.lastWallY2 = y;
        RippleSim.drawWall(x1, y, x2, y);
        RippleSim.setTransform(1, 0, 0, 0, 1, 0);
    }

    getEditInfo(n: number): EditInfo | null {
        if (n === 0)
            return new EditInfo("Move Duration (iters)", this.moveDuration, 0, 1).setDimensionless();
        if (n === 1)
            return new EditInfo("Pause Duration (iters)", this.pauseDuration, 0, 1).setDimensionless();
        return null;
    }

    setEditValue(n: number, ei: EditInfo): void {
        if (n === 0)
            this.moveDuration = Math.trunc(ei.value);
        if (n === 1)
            this.pauseDuration = Math.trunc(ei.value);
    }

    selectText(): string {
        const s = super.selectText();
        return s + ", v = " + this.sim.getSpeedText(this.height() / this.moveDuration);
    }

    getDumpType(): number { return "W".charCodeAt(0); }
}
