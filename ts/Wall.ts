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

export class Wall extends DragObject {
    constructor();
    constructor(x1: number, y1: number, x2: number, y2: number);
    constructor(st: StringTokenizer);
    constructor(arg0?: number | StringTokenizer, y1?: number, x2?: number, y2?: number) {
        if (arg0 instanceof StringTokenizer) {
            super(arg0);
            this.handles.push(new DragHandle(this, arg0), new DragHandle(this, arg0));
        } else if (arg0 !== undefined) {
            super();
            this.handles.push(new DragHandle(this, arg0, y1 as number), new DragHandle(this, x2 as number, y2 as number));
        } else {
            super();
            this.handles.push(new DragHandle(this), new DragHandle(this));
        }
        this.setTransform();
    }

    prepare(): void {
        RippleSim.drawWall(this.handles[0].x, this.handles[0].y, this.handles[1].x, this.handles[1].y);
    }

    drawSelection(): void {
        this.prepare();
    }

    getDumpType(): number { return "w".charCodeAt(0); }
}
