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

import type { RippleSim } from "./RippleSim";
import type { Editable } from "./EditInfo";
import { EditInfo } from "./EditInfo";
import { EditDialog } from "./EditDialog";

export class EditOptions implements Editable {
    sim: RippleSim;
    offsetEditInfo: EditInfo | null = null;

    constructor(s: RippleSim) {
        this.sim = s;
    }

    getEditInfo(n: number): EditInfo | null {
        if (n === 0)
            return new EditInfo("Grid size", this.sim.windowWidth, 0, 0).setDimensionless();
        if (n === 1)
            return this.offsetEditInfo = new EditInfo("Absorbing area width", this.sim.windowOffsetX, 0, 0).setDimensionless();
        if (n === 2)
            return new EditInfo("Screen width scale (m)", this.sim.lengthScale * this.sim.windowWidth, 0, 0);
        if (n === 3)
            return new EditInfo("Mouse snap grid size (m, 0 = off)", this.sim.snapGridSize * this.sim.lengthScale, 0, 0);
        return null;
    }

    setEditValue(n: number, ei: EditInfo): void {
        if (n === 0 && ei.value > 0) {
            this.sim.setResolution(Math.trunc(ei.value));
            this.offsetEditInfo!.value = this.sim.windowOffsetX;
            EditDialog.theEditDialog!.updateValue(this.offsetEditInfo!);
        }
        if (n === 1 && ei.value > 0)
            this.sim.setResolution(this.sim.windowWidth, Math.trunc(ei.value));
        if (n === 2)
            this.sim.lengthScale = ei.value / this.sim.windowWidth;
        if (n === 3 && ei.value >= 0)
            this.sim.snapGridSize = Math.trunc(ei.value / this.sim.lengthScale);
    }
}
