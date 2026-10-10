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

// a purely cosmetic line annotation; it doesn't interact with the wave simulation
import { DragObject } from "./DragObject";
import { DragHandle } from "./DragHandle";
import { StringTokenizer } from "./StringTokenizer";
import { Graphics } from "./Graphics";
import { EditInfo } from "./EditInfo";

export class Line extends DragObject {
    color: string | null = null; // null = default color

    constructor();
    constructor(x1: number, y1: number, x2: number, y2: number);
    constructor(st: StringTokenizer);
    constructor(arg0?: number | StringTokenizer, y1?: number, x2?: number, y2?: number) {
        super(arg0 instanceof StringTokenizer ? arg0 : undefined);
        if (arg0 instanceof StringTokenizer) {
            this.handles.push(new DragHandle(this, arg0), new DragHandle(this, arg0));
            const c = arg0.nextToken();
            this.color = c === "-" ? null : decodeURIComponent(c);
        } else if (arg0 !== undefined) {
            this.handles.push(new DragHandle(this, arg0, y1 as number), new DragHandle(this, x2 as number, y2 as number));
        } else {
            this.handles.push(new DragHandle(this), new DragHandle(this));
        }
        this.setTransform();
    }

    getDumpType(): number { return "L".charCodeAt(0); }

    dump(): string {
        return super.dump() + " " + (this.color == null ? "-" : encodeURIComponent(this.color));
    }

    // drawn on the 2D overlay canvas, in grid coordinates; not part of prepare()/the wall
    // texture, so it has no effect on the simulation.
    draw2D(g: Graphics): void {
        g.setColor(this.selected ? "#ffff00" : (this.color ?? "#ffffff"));
        g.setLineWidth(1);
        g.drawLine(this.handles[0].x, this.handles[0].y, this.handles[1].x, this.handles[1].y);
    }

    getEditInfo(n: number): EditInfo | null {
        if (n === 0) {
            const ei = new EditInfo("Color (blank = default)", 0).disallowSliders();
            ei.text = this.color ?? "";
            return ei;
        }
        return null;
    }

    setEditValue(n: number, ei: EditInfo): void {
        if (n === 0) {
            const v = ei.textf!.value.trim();
            this.color = v.length === 0 ? null : v;
        }
    }
}
