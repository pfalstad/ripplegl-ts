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

export class MediumEllipse extends MediumBox {
    constructor(st?: StringTokenizer) { super(st as StringTokenizer); }

    prepare(): void {
        RippleSim.drawSolidEllipse(
            (this.topLeft.x + this.topRight.x) / 2, (this.topLeft.y + this.bottomLeft.y) / 2,
            (this.topRight.x - this.topLeft.x) / 2, (this.bottomLeft.y - this.topLeft.y) / 2,
            this.speedIndex, 1 - this.absorption);
    }

    hitTest(x: number, y: number): number {
        x -= (this.topLeft.x + this.topRight.x) / 2;
        y -= (this.topLeft.y + this.bottomLeft.y) / 2;
        const a = (this.topRight.x - this.topLeft.x) / 2;
        const b = (this.bottomLeft.y - this.topLeft.y) / 2;
        return Math.abs(Math.sqrt(x * x / (a * a) + y * y / (b * b)) - 1) * a;
    }

    drawSelection(): void {
        RippleSim.drawEllipse(
            (this.topLeft.x + this.topRight.x) / 2, (this.topLeft.y + this.bottomLeft.y) / 2,
            (this.topRight.x - this.topLeft.x) / 2, (this.bottomLeft.y - this.topLeft.y) / 2);
    }

    getDumpType(): number { return "E".charCodeAt(0); }
}
