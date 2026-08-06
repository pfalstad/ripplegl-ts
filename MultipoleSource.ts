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
import { Rectangle } from "./Rectangle";

export class MultipoleSource extends Source {
    separation: number;
    angle: number;
    sourceCount: number;

    constructor(st?: StringTokenizer) {
        if (st != null) {
            super(st, 2);
            const dh0 = this.handles[0];
            const dh = this.handles[1];
            this.sourceCount = parseInt(st.nextToken());
            this.separation = Math.hypot(dh.x - dh0.x, dh.y - dh0.y);
            this.angle = Math.atan2(dh.y - dh0.y, dh.x - dh0.x);
        } else {
            super();
            this.sourceCount = 2;
            this.separation = 20;
            this.angle = 0;
        }
        this.createHandles();
    }

    createHandles(): void {
        this.handles.length = 1;
        for (let i = 0; i !== this.sourceCount; i++)
            this.handles.push(new DragHandle(this));
        this.positionHandles();
    }

    positionHandles(): void {
        const dh0 = this.handles[0];
        for (let i = 0; i !== this.sourceCount; i++) {
            const dh = this.handles[i + 1];
            const a = this.angle + Math.PI * 2 * i / this.sourceCount;
            dh.x = Math.trunc(dh0.x + this.separation * Math.cos(a));
            dh.y = Math.trunc(dh0.y + this.separation * Math.sin(a));
        }
    }

    dragHandle(dh: DragHandle, x: number, y: number): boolean {
        const dh0 = this.handles[0];
        if (dh === dh0) {
            this.positionHandles();
            return true;
        }
        this.separation = Math.hypot(x - dh0.x, y - dh0.y);
        this.angle = Math.atan2(y - dh0.y, x - dh0.x);
        this.positionHandles();
        return false;
    }

    setInitialPosition(): void {
        const start: Rectangle = this.sim.findSpace(this, 0, 0);
        const dh = this.handles[0];
        dh.x = start.x;
        dh.y = start.y;
        this.positionHandles();
    }

    run(): void {
        const v = this.getValue();
        if (this.enabled) {
            for (let i = 0; i !== this.sourceCount; i++) {
                const dh = this.handles[i + 1];
                RippleSim.drawSource(dh.x, dh.y, i % 2 === 0 ? v : -v);
            }
        }
    }

    rotate(ang: number): void {
        this.angle += ang;
        this.positionHandles();
    }

    rotateTo(x: number, y: number): void {
        const dh = this.handles[0];
        this.angle = -Math.atan2(-y + dh.y, x - dh.x);
        this.positionHandles();
    }

    canRotate(): boolean { return true; }

    getEditInfo(n: number): EditInfo | null {
        if (n === 0)
            return new EditInfo("Source Count", this.sourceCount, 0, 1).setDimensionless();
        if (n === 1)
            return new EditInfo("Radius (m)", this.separation * this.sim.lengthScale, 0, 1);
        return super.getEditInfo(n - 2);
    }

    setEditValue(n: number, ei: EditInfo): void {
        if (n === 0) {
            const sc = Math.trunc(ei.value);
            if (sc > 1 && (sc % 2) === 0)
                this.sourceCount = sc;
            this.createHandles();
            return;
        }
        if (n === 1) {
            this.separation = ei.value / this.sim.lengthScale;
            this.positionHandles();
            return;
        }
        super.setEditValue(n - 2, ei);
    }

    getDumpType(): number { return 200; }

    dump(): string { return super.dump() + " " + this.sourceCount; }

    dumpHandles(): string {
        const dh0 = this.handles[0];
        const dh1 = this.handles[1];
        return " " + dh0.x + " " + dh0.y + " " + dh1.x + " " + dh1.y;
    }

    rescale(scale: number): void {
        this.handles[0].rescale(scale);
        this.positionHandles();
        this.setTransform();
    }
}
