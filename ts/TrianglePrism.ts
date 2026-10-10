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

import { MediumBox } from "./MediumBox";
import { StringTokenizer } from "./StringTokenizer";
import { RippleSim } from "./RippleSim";

export class TrianglePrism extends MediumBox {
    constructor(st?: StringTokenizer) { super(st as StringTokenizer); }

    prepare(): void {
        RippleSim.drawTriangle(this.topLeft.x, this.topLeft.y, this.topRight.x, this.topRight.y,
            this.bottomLeft.x, this.bottomLeft.y,
            this.speedIndex);
    }

    drawSelection(): void {
        RippleSim.drawWall(this.topLeft.x, this.topLeft.y, this.topRight.x, this.topRight.y);
        RippleSim.drawWall(this.topLeft.x, this.topLeft.y, this.bottomLeft.x, this.bottomLeft.y);
        RippleSim.drawWall(this.bottomLeft.x, this.bottomLeft.y, this.topRight.x, this.topRight.y);
    }

    // let people poke inside
    hitTestInside(_x: number, _y: number): boolean { return false; }

    getDumpType(): number { return "t".charCodeAt(0); }
}
