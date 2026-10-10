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
import { Checkbox } from "./Checkbox";

export class ModeBox extends RectDragObject {
    xmode: number;
    ymode: number;
    box: boolean;
    randomize: boolean;

    constructor(st?: StringTokenizer) {
        super(st);
        if (st != null) {
            this.xmode = parseInt(st.nextToken());
            this.ymode = parseInt(st.nextToken());
            this.randomize = st.nextToken() === "true";
            this.box = st.nextToken() === "true";
        } else {
            this.xmode = 1;
            this.ymode = 1;
            this.box = true;
            this.randomize = false;
        }
    }

    private rand(): number {
        return Math.abs(Math.trunc(Math.random() * 0x7fffffff));
    }

    reset(): void {
        if (this.randomize) {
            let m1x = this.rand() % this.xmode;
            let m1y = this.rand() % this.ymode;
            let m2x = this.rand() % this.xmode;
            let m2y = this.rand() % this.ymode;
            if (this.sim.waveChooser.getSelectedIndex() !== RippleSim.WAVE_SOUND) {
                if (m1x === 0) m1x = 1;
                if (m1y === 0) m1y = 1;
                if (m2x === 0) m2x = 1;
                if (m2y === 0) m2y = 1;
            }
            RippleSim.drawModes(this.topLeft.x + 1, this.topLeft.y + 1, this.bottomRight.x - 1, this.bottomRight.y - 1,
                m1x * Math.PI, m1y * Math.PI, m2x * Math.PI, m2y * Math.PI);
        } else {
            RippleSim.drawModes(this.topLeft.x + 1, this.topLeft.y + 1, this.bottomRight.x - 1, this.bottomRight.y - 1,
                this.xmode * Math.PI, this.ymode * Math.PI, 0, 0);
        }
    }

    prepare(): void {
        if (this.box) {
            RippleSim.drawWall(this.topLeft.x, this.topLeft.y, this.topRight.x, this.topRight.y);
            RippleSim.drawWall(this.topLeft.x, this.topLeft.y, this.bottomLeft.x, this.bottomLeft.y);
            RippleSim.drawWall(this.bottomRight.x, this.bottomRight.y, this.topRight.x, this.topRight.y);
            RippleSim.drawWall(this.bottomLeft.x, this.bottomLeft.y, this.bottomRight.x, this.bottomRight.y);
        }
        this.reset();
    }

    getEditInfo(n: number): EditInfo | null {
        if (n === 0)
            return new EditInfo("x mode", this.xmode, 0, 1).setDimensionless();
        if (n === 1)
            return new EditInfo("y mode", this.ymode, 0, 1).setDimensionless();
        if (n === 2) {
            const ei = new EditInfo("", 0, -1, -1);
            ei.checkbox = new Checkbox("Randomize", this.randomize);
            return ei;
        }
        if (n === 3) {
            const ei = new EditInfo("", 0, -1, -1);
            ei.checkbox = new Checkbox("Draw Box", this.box);
            return ei;
        }
        return null;
    }

    setEditValue(n: number, ei: EditInfo): void {
        if (n === 0)
            this.xmode = Math.trunc(ei.value);
        if (n === 1)
            this.ymode = Math.trunc(ei.value);
        if (n === 2)
            this.randomize = ei.checkbox!.getState();
        if (n === 3)
            this.box = ei.checkbox!.getState();
    }

    protected selectTextAdjust(): number { return 2; }

    dump(): string {
        return super.dump() + " " + this.xmode + " " + this.ymode + " " + this.randomize + " " + this.box;
    }

    selectText(): string {
        // calculate mode frequency using dimensions of inside of box
        return super.selectText() + ", f = " +
            RippleSim.getUnitText(this.sim.waveSpeed / 2 * Math.hypot(
                this.xmode / (this.sim.lengthScale * (this.width() - 2)),
                this.ymode / (this.sim.lengthScale * (this.height() - 2))), "Hz");
    }

    getDumpType(): number { return "M".charCodeAt(0); }

    hitTestInside(_x: number, _y: number): boolean {
        return false;
    }
}
