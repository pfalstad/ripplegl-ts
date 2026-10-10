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

import { Color } from "./Color";
import { Font } from "./Font";
import { Polygon } from "./Polygon";

export class Graphics {
    context: CanvasRenderingContext2D;
    currentFontSize = 0;
    currentFont: Font | null = null;
    lastColor: Color | null = null;

    constructor(context: CanvasRenderingContext2D) {
        this.context = context;
    }

    setColor(color: Color | string | null): void {
        if (color instanceof Color) {
            const colorString = color.getHexValue();
            this.context.strokeStyle = colorString;
            this.context.fillStyle = colorString;
            this.lastColor = color;
        } else if (color != null) {
            this.context.strokeStyle = color;
            this.context.fillStyle = color;
            this.lastColor = null;
        } else {
            console.log("Ignoring null-Color");
        }
    }

    fillRect(x: number, y: number, width: number, height: number): void {
        this.context.fillRect(x, y, width, height);
    }

    drawRect(x: number, y: number, width: number, height: number): void {
        this.context.strokeRect(x, y, width, height);
    }

    fillOval(x: number, y: number, width: number, height: number): void {
        this.context.beginPath();
        this.context.arc(x + width / 2, y + width / 2, width / 2, 0, 2.0 * 3.14159);
        this.context.closePath();
        this.context.fill();
    }

    drawString(s: string, x: number, y: number): void {
        this.context.fillText(s, x, y);
    }

    setLineWidth(width: number): void {
        this.context.lineWidth = width;
    }

    drawLine(x1: number, y1: number, x2: number, y2: number): void {
        this.context.beginPath();
        this.context.moveTo(x1, y1);
        this.context.lineTo(x2, y2);
        this.context.stroke();
    }

    drawPolyline(xpoints: number[], ypoints: number[], n: number): void {
        this.context.beginPath();
        for (let i = 0; i < n; i++) {
            if (i === 0)
                this.context.moveTo(xpoints[i], ypoints[i]);
            else
                this.context.lineTo(xpoints[i], ypoints[i]);
        }
        this.context.closePath();
        this.context.stroke();
    }

    fillPolygon(p: Polygon): void {
        this.context.beginPath();
        for (let i = 0; i < p.npoints; i++) {
            if (i === 0)
                this.context.moveTo(p.xpoints[i], p.ypoints[i]);
            else
                this.context.lineTo(p.xpoints[i], p.ypoints[i]);
        }
        this.context.closePath();
        this.context.fill();
    }

    setFont(f: Font | null): void {
        if (f != null) {
            this.context.font = f.fontname;
            this.currentFontSize = f.size;
            this.currentFont = f;
        }
    }

    getFont(): Font | null {
        return this.currentFont;
    }
}
