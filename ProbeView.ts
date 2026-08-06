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

import { WindowBox } from "./WindowBox";
import { Color } from "./Color";
import { Font } from "./Font";
import { Graphics } from "./Graphics";
import { RippleSim } from "./RippleSim";

interface MenuItemDesc {
    label: string;
    action: () => void;
    element: HTMLButtonElement;
}

export class ProbeView extends WindowBox {
    cv: HTMLCanvasElement;
    private ctx: CanvasRenderingContext2D;
    values: number[];
    maxValue: number;
    offset = 0;
    font: Font;
    color: Color;
    recording = false;
    recordingBuffer: string[] | null = null;

    private startRecordingItem!: MenuItemDesc;
    private stopRecordingItem!: MenuItemDesc;
    private saveRecordingItem!: MenuItemDesc;
    private contextMenuEl: HTMLDivElement | null = null;

    constructor(n: number, col: Color, showing: boolean) {
        super(false, false, true, true);

        this.cv = document.createElement("canvas");
        this.setWidget(this.cv);
        this.setSize(400, 100);
        this.ctx = this.cv.getContext("2d")!;

        this.values = new Array(100).fill(0);
        this.maxValue = 1e-8;
        this.font = new Font("SansSerif", 0, 16);
        this.color = col;

        this.setText("Probe View " + (n + 1));

        this.cv.addEventListener("contextmenu", (e) => this.onContextMenu(e));

        const winwidth = window.innerWidth;
        const winheight = window.innerHeight;
        let x = winwidth - 450 - n * 20;
        let y = winheight - 150 - n * 20;
        if (150 * n < winheight / 2) {
            x = winwidth - 450;
            y = winheight - 150 * (n + 1);
        }
        this.setPopupPosition(x, y);
        this.setVisible(showing);
        this.show();
    }

    draw(): void {
        const g = new Graphics(this.ctx);
        const width = this.cv.clientWidth;
        const height = this.cv.clientHeight;
        this.cv.width = width;
        if (width !== this.values.length) {
            this.values = new Array(width).fill(0);
            this.offset = 0;
            this.maxValue = 1e-8;
        }
        this.cv.height = height;
        g.setColor(Color.white);
        g.fillRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
        g.setColor("#ccc");
        g.drawLine(0, height / 2, width, height / 2);
        const sim = RippleSim.theSim;
        const ts = sim.t / RippleSim.timeStep;
        const lastBar = Math.round(ts % 100);
        for (let i = width - lastBar; i > 0; i -= 100)
            g.drawLine(i, 0, i, height);
        g.setColor(this.color);
        this.ctx.beginPath();
        this.ctx.moveTo(-10, height / 2);
        for (let i = 0; i !== this.values.length; i++)
            this.ctx.lineTo(i, height * (.5 - .47 * this.values[(i + this.offset) % this.values.length] / this.maxValue));
        this.ctx.stroke();
        this.drawFrequency(g);
    }

    recordValue(x: number): void {
        this.values[this.offset++] = x;
        if (this.offset >= this.values.length)
            this.offset = 0;
        if (this.recording && this.recordingBuffer != null)
            this.recordingBuffer.push(String(x * 1000));
    }

    reset(): void {
        this.values = new Array(this.values.length).fill(0);
        this.offset = 0;
        this.maxValue = 1e-8;
    }

    protected onCloseClick(): void {
        this.setVisible(false);
    }

    private drawFrequency(g: Graphics): void {
        // try to get frequency
        // get average
        let avg = 0;
        let i: number;
        this.maxValue = 1e-8;
        for (i = 0; i !== this.values.length; i++) {
            const v = this.values[(i + this.offset) % this.values.length];
            avg += v;
            this.maxValue = Math.max(Math.abs(v), this.maxValue);
        }
        avg /= i * 2;
        let state = 0;
        const thresh = avg * .05;
        let oi = 0;
        let avperiod = 0;
        let periodct = -1;
        let avperiod2 = 0;
        // count period lengths
        let lastq = 0;
        for (i = 0; i !== this.values.length; i++) {
            let q = this.values[(i + this.offset) % this.values.length] - avg;
            // low-pass filter
            lastq = q = .9 * lastq + .1 * q;

            const os = state;
            if (q < thresh)
                state = 1;
            else if (q > -thresh)
                state = 2;
            if (state === 2 && os === 1) {
                const pd = i - oi;
                oi = i;
                // short periods can't be counted properly
                if (pd < 12)
                    continue;
                // skip first period, it might be too short
                if (periodct >= 0) {
                    avperiod += pd;
                    avperiod2 += pd * pd;
                }
                periodct++;
            }
        }
        avperiod /= periodct;
        avperiod2 /= periodct;
        const periodstd = Math.sqrt(avperiod2 - avperiod * avperiod);
        let freq = 1 / (avperiod * RippleSim.theSim.timeToRealTime(RippleSim.timeStep));
        // don't show freq if standard deviation is too great
        if (periodct < 1 || periodstd > 20)
            freq = 0;
        g.setFont(this.font);
        g.drawString(RippleSim.showFormat(this.maxValue * 1000), 2, 13);
        if (freq !== 0)
            g.drawString(RippleSim.getUnitText(freq, "Hz"), 2, 33);
    }

    private buildContextMenu(): void {
        const menu = document.createElement("div");
        menu.className = "context-menu";

        const makeItem = (label: string, action: () => void): MenuItemDesc => {
            const el = document.createElement("button");
            el.className = "menu-item";
            el.textContent = label;
            el.onclick = () => { this.hideContextMenu(); action(); };
            menu.appendChild(el);
            return { label, action, element: el };
        };

        this.startRecordingItem = makeItem("Start Recording", () => this.menuPerformed("start"));
        this.stopRecordingItem = makeItem("Stop Recording", () => this.menuPerformed("stop"));
        this.saveRecordingItem = makeItem("Save Recording...", () => this.menuPerformed("save"));

        document.body.appendChild(menu);
        this.contextMenuEl = menu;
    }

    private hideContextMenu(): void {
        if (this.contextMenuEl) {
            document.body.removeChild(this.contextMenuEl);
            this.contextMenuEl = null;
            window.removeEventListener("click", this.hideContextMenuBound);
        }
    }

    private hideContextMenuBound = () => this.hideContextMenu();

    private onContextMenu(e: MouseEvent): void {
        e.preventDefault();
        this.buildContextMenu();
        this.startRecordingItem.element.disabled = this.recording;
        this.stopRecordingItem.element.disabled = !this.recording;
        this.saveRecordingItem.element.disabled = this.recordingBuffer == null;
        const menuX = e.clientX;
        const menuY = e.clientY;
        this.contextMenuEl!.style.left = menuX + "px";
        this.contextMenuEl!.style.top = menuY + "px";
        setTimeout(() => window.addEventListener("click", this.hideContextMenuBound), 0);
    }

    private menuPerformed(name: string): void {
        this.hideContextMenu();
        if (name === "start") {
            this.recording = true;
            this.recordingBuffer = [];
        }
        if (name === "stop")
            this.recording = false;
        if (name === "save" && this.recordingBuffer != null) {
            new SaveRecordingBufferDialog(this.recordingBuffer.join("\n") + "\n");
        }
    }
}

class SaveRecordingBufferDialog {
    dialogEl: HTMLDialogElement;

    static getBlobUrl(data: string): string {
        const oldBlob = (document as any).exportBlob;
        if (oldBlob)
            URL.revokeObjectURL(oldBlob);
        const blob = new Blob([data], { type: "text/plain" });
        const url = URL.createObjectURL(blob);
        (document as any).exportBlob = url;
        return url;
    }

    constructor(data: string) {
        this.dialogEl = document.createElement("dialog");
        document.body.appendChild(this.dialogEl);

        const vp = document.createElement("div");
        this.dialogEl.appendChild(vp);

        const title = document.createElement("div");
        title.className = "dialogTitle";
        title.textContent = "Export as Local File";
        vp.appendChild(title);

        const p = document.createElement("div");
        p.textContent = "Click on the link below to save your data";
        vp.appendChild(p);

        const url = SaveRecordingBufferDialog.getBlobUrl(data);
        const now = new Date();
        const pad = (n: number) => String(n).padStart(2, "0");
        const fname = `ripple-${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}.txt`;

        const a = document.createElement("a");
        a.textContent = fname;
        a.href = url;
        a.setAttribute("download", fname);
        vp.appendChild(a);
        vp.appendChild(document.createElement("br"));

        const okButton = document.createElement("button");
        okButton.textContent = "OK";
        okButton.onclick = () => this.closeDialog();
        vp.appendChild(okButton);

        this.dialogEl.showModal();
    }

    closeDialog(): void {
        this.dialogEl.close();
        document.body.removeChild(this.dialogEl);
    }
}
