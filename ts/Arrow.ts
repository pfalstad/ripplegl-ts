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

// a Line with an arrowhead drawn at its second handle
import { Line } from "./Line";
import { Graphics } from "./Graphics";

export class Arrow extends Line {
    static readonly HEAD_LENGTH = 10;
    static readonly HEAD_ANGLE = Math.PI / 7;

    getDumpType(): number { return "A".charCodeAt(0); }

    draw2D(g: Graphics): void {
        super.draw2D(g);
        const tail = this.handles[0];
        const tip = this.handles[1];
        const angle = Math.atan2(tip.y - tail.y, tip.x - tail.x);
        const a1 = angle - Arrow.HEAD_ANGLE;
        const a2 = angle + Arrow.HEAD_ANGLE;
        g.drawLine(tip.x, tip.y, tip.x - Arrow.HEAD_LENGTH * Math.cos(a1), tip.y - Arrow.HEAD_LENGTH * Math.sin(a1));
        g.drawLine(tip.x, tip.y, tip.x - Arrow.HEAD_LENGTH * Math.cos(a2), tip.y - Arrow.HEAD_LENGTH * Math.sin(a2));
    }
}
