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

import { LineSource } from "./LineSource";
import { StringTokenizer } from "./StringTokenizer";
import { RippleSim } from "./RippleSim";
import { EditInfo } from "./EditInfo";

export class PhasedArraySource extends LineSource {
    phaseShift2 = 0;

    constructor();
    constructor(st: StringTokenizer);
    constructor(x1: number, y1: number, x2: number, y2: number, ps1: number, ps2: number);
    constructor(arg0?: number | StringTokenizer, arg1?: number, arg2?: number, arg3?: number, ps1?: number, ps2?: number) {
        if (arg0 instanceof StringTokenizer) {
            super(arg0);
            this.phaseShift2 = parseFloat(arg0.nextToken());
        } else if (arg0 !== undefined) {
            super(arg0, arg1 as number, arg2 as number, arg3 as number);
            this.phaseShift = ps1 as number;
            this.phaseShift2 = ps2 as number;
        } else {
            super();
        }
    }

    dump(): string { return super.dump() + " " + this.phaseShift2; }

    run(): void {
        const dh1 = this.handles[0];
        const dh2 = this.handles[1];
        const freq = this.frequency;
        let w = freq * (this.sim.t - this.freqTimeZero) + this.phaseShift;
        w %= Math.PI * 2;
        RippleSim.drawPhasedArray(dh1.x, dh1.y, dh2.x, dh2.y, w, w + this.phaseShift2 - this.phaseShift);
    }

    getEditInfo(n: number): EditInfo | null {
        if (n === 0)
            return new EditInfo("Frequency (Hz)", this.frequency, 4, 500);
        if (n === 1)
            return new EditInfo("Phase Offset 1 (degrees)", this.phaseShift * 180 / Math.PI, -180, 180).setDimensionless();
        if (n === 2)
            return new EditInfo("Phase Offset 2 (degrees)", this.phaseShift2 * 180 / Math.PI, -180, 180).setDimensionless();
        return null;
    }

    setEditValue(n: number, ei: EditInfo): void {
        if (n === 0) {
            // adjust time zero to maintain continuity in the waveform
            // even though the frequency has changed.
            const oldfreq = this.frequency;
            this.frequency = ei.value;
            this.freqTimeZero = this.sim.t - oldfreq * (this.sim.t - this.freqTimeZero) / this.frequency;
        }
        if (n === 1)
            this.phaseShift = ei.value * Math.PI / 180;
        if (n === 2)
            this.phaseShift2 = ei.value * Math.PI / 180;
    }

    getDumpType(): number { return 201; }
}
