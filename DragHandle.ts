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

import type { DragObject } from "./DragObject";
import { StringTokenizer } from "./StringTokenizer";

export class DragHandle {
    x = 0;
    y = 0;
    parent: DragObject;
    hidden = false;

    constructor(par: DragObject, arg1?: number | StringTokenizer, arg2?: number) {
        this.parent = par;
        if (arg1 instanceof StringTokenizer) {
            this.x = parseInt(arg1.nextToken());
            this.y = parseInt(arg1.nextToken());
        } else if (arg1 !== undefined) {
            this.x = arg1;
            this.y = arg2 as number;
        }
    }

    toString(): string {
        return `DragHandle(${this.x},${this.y})`;
    }

    dragTo(xd: number, yd: number): boolean {
        if (this.parent.dragHandle(this, xd, yd)) {
            this.x = xd;
            this.y = yd;
            this.parent.setTransform();
            return true;
        }
        return false;
    }

    rescale(scale: number): void {
        this.x = Math.trunc(this.x * scale);
        this.y = Math.trunc(this.y * scale);
    }
}
