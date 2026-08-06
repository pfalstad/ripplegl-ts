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

export class Parabola extends RectDragObject {
    constructor(st?: StringTokenizer) { super(st); }

    prepare(): void {
        RippleSim.drawParabola(this.topLeft.x, this.topLeft.y, this.width(), this.height());
        const w2 = this.width() / 2.;
        const a = this.height() / (w2 * w2);
        const p = Math.trunc(1 / (4 * a));
        RippleSim.drawFocus(this.topLeft.x + this.width() / 2, this.bottomLeft.y - p);
    }

    drawSelection(): void {
        this.prepare();
    }

    // let people poke inside
    hitTestInside(_x: number, _y: number): boolean { return false; }

    getDumpType(): number { return "p".charCodeAt(0); }
}
