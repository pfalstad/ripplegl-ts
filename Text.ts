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

// a purely cosmetic text annotation; it doesn't interact with the wave simulation
import { DragObject } from "./DragObject";
import { DragHandle } from "./DragHandle";
import { StringTokenizer } from "./StringTokenizer";
import { Graphics } from "./Graphics";
import { Font } from "./Font";
import { EditInfo } from "./EditInfo";

export class Text extends DragObject {
    text: string;
    size: number;
    color: string | null = null; // null = default color
    private lines: string[] = [];

    constructor();
    constructor(x: number, y: number);
    constructor(st: StringTokenizer);
    constructor(arg0?: number | StringTokenizer, y1?: number) {
        super(arg0 instanceof StringTokenizer ? arg0 : undefined);
        if (arg0 instanceof StringTokenizer) {
            this.handles.push(new DragHandle(this, arg0));
            this.size = parseInt(arg0.nextToken());
            const c = arg0.nextToken();
            this.color = c === "-" ? null : decodeURIComponent(c);
            this.text = decodeURIComponent(arg0.nextToken());
        } else if (arg0 !== undefined) {
            this.handles.push(new DragHandle(this, arg0, y1 as number));
            this.size = 16;
            this.text = "text";
        } else {
            this.handles.push(new DragHandle(this));
            this.size = 16;
            this.text = "text";
        }
        this.split();
        this.setTransform();
    }

    private split(): void {
        this.lines = this.text.split("\\n");
    }

    // the overlay canvas is scaled by winSize.width/windowWidth, the same factor applied
    // to handle positions on a resolution change, so size (grid units) must scale too or
    // the on-screen font size would change whenever the resolution changes.
    rescale(scale: number): void {
        super.rescale(scale);
        this.size = Math.max(1, Math.round(this.size * scale));
    }

    getDumpType(): number { return "x".charCodeAt(0); }

    dump(): string {
        return super.dump() + " " + this.size + " " + (this.color == null ? "-" : encodeURIComponent(this.color)) +
            " " + encodeURIComponent(this.text);
    }

    // drawn on the 2D overlay canvas, in grid coordinates; not part of prepare()/the wall
    // texture, so it has no effect on the simulation.
    draw2D(g: Graphics): void {
        g.setColor(this.selected ? "#ffff00" : (this.color ?? "#ffffff"));
        g.setFont(new Font("sans-serif", 0, this.size));
        const dh = this.handles[0];
        let y = dh.y;
        for (const line of this.lines) {
            g.drawString(line, dh.x, y);
            y += this.size + 3;
        }
    }

    private boxWidth(): number {
        let maxLen = 0;
        for (const l of this.lines)
            maxLen = Math.max(maxLen, l.length);
        return maxLen * this.size * .6;
    }

    private boxHeight(): number {
        return this.lines.length * (this.size + 3);
    }

    hitTestInside(x: number, y: number): boolean {
        const dh = this.handles[0];
        return x >= dh.x && x <= dh.x + this.boxWidth() &&
            y >= dh.y - this.size && y <= dh.y - this.size + this.boxHeight();
    }

    getEditInfo(n: number): EditInfo | null {
        if (n === 0) {
            const ei = new EditInfo("Text", 0).disallowSliders();
            ei.text = this.text.replace(/\\n/g, "\n");
            return ei;
        }
        if (n === 1)
            return new EditInfo("Size", this.size, 5, 100).setDimensionless();
        if (n === 2) {
            const ei = new EditInfo("Color (blank = default)", 0).disallowSliders();
            ei.text = this.color ?? "";
            return ei;
        }
        return null;
    }

    setEditValue(n: number, ei: EditInfo): void {
        if (n === 0) {
            this.text = ei.textf!.value.replace(/\n/g, "\\n");
            this.split();
        }
        if (n === 1)
            this.size = Math.trunc(ei.value);
        if (n === 2) {
            const v = ei.textf!.value.trim();
            this.color = v.length === 0 ? null : v;
        }
    }
}
