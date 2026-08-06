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

export class Box extends RectDragObject {
    constructor(st?: StringTokenizer) { super(st); }

    prepare(): void {
        RippleSim.drawWall(this.topLeft.x, this.topLeft.y, this.topRight.x, this.topRight.y);
        RippleSim.drawWall(this.topLeft.x, this.topLeft.y, this.bottomLeft.x, this.bottomLeft.y);
        RippleSim.drawWall(this.bottomRight.x, this.bottomRight.y, this.topRight.x, this.topRight.y);
        RippleSim.drawWall(this.bottomLeft.x, this.bottomLeft.y, this.bottomRight.x, this.bottomRight.y);
    }

    // let people poke inside box
    hitTestInside(_x: number, _y: number): boolean { return false; }

    getDumpType(): number { return "b".charCodeAt(0); }
}
