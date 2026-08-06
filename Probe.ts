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

import { DragObject } from "./DragObject";
import { DragHandle } from "./DragHandle";
import { StringTokenizer } from "./StringTokenizer";
import { RippleSim } from "./RippleSim";
import { Color } from "./Color";
import { ProbeView } from "./ProbeView";

export class Probe extends DragObject {
    static readonly FLAG_OPEN = 1;

    static readonly colors = [
        1, 0, 0,
        0, .7, 0,
        0, 0, 1,
        0, 0, 0,
        .7, .7, 0,
        0, .7, .7,
        1, 0, 1,
        1, .5, 0,
    ];

    probeView!: ProbeView;
    num = 0;
    colorIndex = 0;
    handle: DragHandle;

    constructor(st?: StringTokenizer) {
        super(st);
        if (st != null) {
            this.handle = new DragHandle(this, st);
            this.handles.push(this.handle);
            this.makeView();
            this.setTransform();
        } else {
            this.handle = new DragHandle(this);
            this.handles.push(this.handle);
            this.flags |= Probe.FLAG_OPEN;
            this.makeView();
            this.setTransform();
        }
    }

    dump(): string {
        this.flags &= ~Probe.FLAG_OPEN;
        if (this.probeView.isVisible())
            this.flags |= Probe.FLAG_OPEN;
        return super.dump();
    }

    makeView(): void {
        this.num = 0;
        for (const obj of this.sim.dragObjects) {
            if (obj !== this && obj instanceof Probe)
                this.num++;
        }
        this.colorIndex = (this.num % 8) * 3;
        this.probeView = new ProbeView(this.num,
            new Color(Probe.colors[this.colorIndex], Probe.colors[this.colorIndex + 1], Probe.colors[this.colorIndex + 2]),
            (this.flags & Probe.FLAG_OPEN) !== 0);
    }

    run(): void {
        const v = RippleSim.getProbeValue(this.handle.x, this.handle.y);
        this.probeView.recordValue(v);
    }

    reset(): void {
        this.probeView.reset();
    }

    rescale(x: number): void {
        super.rescale(x);
        this.probeView.reset();
    }

    draw(): void {
        RippleSim.drawHandle(this.handle.x, this.handle.y);
        RippleSim.setDrawingSelection(1);
        RippleSim.setDrawingColor(Probe.colors[this.colorIndex], Probe.colors[this.colorIndex + 1], Probe.colors[this.colorIndex + 2], 1);
        RippleSim.drawEllipse(this.handle.x, this.handle.y, 8, 8);
        this.probeView.draw();
        super.draw();
    }

    mouseDown(): void {
        this.probeView.setVisible(true);
    }

    getDumpType(): number { return "P".charCodeAt(0); }

    delete(): void {
        this.probeView.hide();
    }

    selectText(): string {
        return "Probe " + (this.num + 1);
    }
}
