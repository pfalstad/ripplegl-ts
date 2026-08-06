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

export class ExportAsLocalFileDialog {
    dialogEl: HTMLDialogElement;

    static downloadIsSupported(): boolean {
        return "download" in document.createElement("a");
    }

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
        p.textContent = "Click on the link below to save your layout";
        vp.appendChild(p);

        const url = ExportAsLocalFileDialog.getBlobUrl(data);
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
