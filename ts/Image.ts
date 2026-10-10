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

// imported images are downscaled to fit within this many pixels on their longest
// side, to keep the saved dump size and texture upload cost reasonable
const MAX_IMAGE_DIM = 512;

// lets the user place an imported image as a rectangle, like MediumBox/Box, and have
// it drawn directly into the medium/wall grid: white pixels are normal (no medium),
// black pixels are walls, and shades of blue are a medium (see shader-draw-image-fs)
export class Image extends RectDragObject {
    canvas: HTMLCanvasElement | null = null;
    private pendingDataUrl: string | null = null;

    constructor(st?: StringTokenizer) {
        super(st);
        if (st != null)
            this.loadFromDataUrl(Image.tokenToDataUrl(st.nextToken()));
    }

    static fromFile(file: File): Image {
        const box = new Image();
        box.loadImageFile(file);
        return box;
    }

    loadImageFile(file: File): void {
        const reader = new FileReader();
        reader.onload = () => this.loadFromDataUrl(reader.result as string);
        reader.readAsDataURL(file);
    }

    private loadFromDataUrl(dataUrl: string): void {
        this.pendingDataUrl = dataUrl;
        // this class shadows the DOM's Image constructor, so reach it via window
        const img = new window.Image();
        img.onload = () => {
            const scale = Math.min(1, MAX_IMAGE_DIM / Math.max(img.width, img.height));
            const w = Math.max(1, Math.round(img.width * scale));
            const h = Math.max(1, Math.round(img.height * scale));
            const canvas = document.createElement("canvas");
            canvas.width = w;
            canvas.height = h;
            canvas.getContext("2d")!.drawImage(img, 0, 0, w, h);
            this.canvas = canvas;
            this.pendingDataUrl = null;
            this.sim.changedWalls = true;
        };
        img.src = dataUrl;
    }

    prepare(): void {
        if (this.canvas == null)
            return;
        RippleSim.drawImageMedium(this.topLeft.x, this.topLeft.y, this.topRight.x, this.topRight.y,
            this.bottomLeft.x, this.bottomLeft.y, this.bottomRight.x, this.bottomRight.y, this.canvas);
    }

    // let people poke inside, like MediumBox
    hitTestInside(_x: number, _y: number): boolean { return false; }

    delete(): void {
        if (this.canvas != null)
            RippleSim.deleteImageTexture(this.canvas);
    }

    getDumpType(): number { return 205; }

    dump(): string {
        const dataUrl = this.canvas != null ? this.canvas.toDataURL("image/png") : (this.pendingDataUrl ?? "");
        return super.dump() + " " + Image.dataUrlToToken(dataUrl);
    }

    // dumps are tokenized on whitespace and on "+" (since spaces get turned into "+" for
    // URL export), so raw base64 (which uses "+" and "/") isn't safe as-is; use the
    // URL-safe base64 alphabet instead, which contains neither character
    private static dataUrlToToken(dataUrl: string): string {
        const comma = dataUrl.indexOf(",");
        const b64 = comma >= 0 ? dataUrl.substring(comma + 1) : "";
        return b64.replace(/\+/g, "-").replace(/\//g, "_");
    }

    private static tokenToDataUrl(token: string): string {
        const b64 = token.replace(/-/g, "+").replace(/_/g, "/");
        return "data:image/png;base64," + b64;
    }
}
