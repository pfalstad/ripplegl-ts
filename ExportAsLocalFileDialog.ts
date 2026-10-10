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
    static lastFileName: string | null = null;
    dialogEl: HTMLDialogElement;
    textBox: HTMLInputElement;
    blobUrl: string;

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

    static setLastFileName(s: string | null): void {
        // remember filename for use when saving a new file.
        // if s is null or automatically generated then just clear out old filename.
        if (s == null || s.startsWith("ripple-"))
            ExportAsLocalFileDialog.lastFileName = null;
        else
            ExportAsLocalFileDialog.lastFileName = s;
    }

    constructor(data: string) {
        this.dialogEl = document.createElement("dialog");
        document.body.appendChild(this.dialogEl);
        this.dialogEl.addEventListener("keydown", (e: KeyboardEvent) => {
            if (e.key === "Enter") { e.preventDefault(); this.apply(); this.closeDialog(); }
            if (e.key === "Escape") { e.preventDefault(); this.closeDialog(); }
        });

        const vp = document.createElement("div");
        this.dialogEl.appendChild(vp);

        const title = document.createElement("div");
        title.className = "dialogTitle";
        title.textContent = "Export as Local File";
        vp.appendChild(title);

        const label = document.createElement("div");
        label.textContent = "File name:";
        vp.appendChild(label);

        const tb = document.createElement("input");
        tb.type = "text";
        tb.style.width = "250px";
        this.textBox = tb;
        vp.appendChild(tb);

        this.blobUrl = ExportAsLocalFileDialog.getBlobUrl(data);

        let fname = ExportAsLocalFileDialog.lastFileName;
        if (fname == null) {
            const now = new Date();
            const pad = (n: number) => String(n).padStart(2, "0");
            fname = `ripple-${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}.txt`;
        }
        tb.value = fname;

        const hp = document.createElement("div");
        hp.style.display = "flex";
        hp.style.justifyContent = "space-between";
        hp.style.marginTop = "8px";
        vp.appendChild(hp);

        const okButton = document.createElement("button");
        okButton.textContent = "OK";
        okButton.onclick = () => { this.apply(); this.closeDialog(); };
        hp.appendChild(okButton);

        const cancelButton = document.createElement("button");
        cancelButton.textContent = "Cancel";
        cancelButton.onclick = () => this.closeDialog();
        hp.appendChild(cancelButton);

        this.dialogEl.showModal();
        // select the base name so it can be typed over without losing the extension
        tb.focus();
        const dot = fname.lastIndexOf(".");
        tb.setSelectionRange(0, dot > 0 ? dot : fname.length);
    }

    apply(): void {
        let fname = this.textBox.value.trim();
        if (fname.length === 0)
            return;
        if (!fname.includes("."))
            fname += ".txt";
        ExportAsLocalFileDialog.setLastFileName(fname);
        const a = document.createElement("a");
        a.href = this.blobUrl;
        a.setAttribute("download", fname);
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    }

    closeDialog(): void {
        if (this.dialogEl.open)
            this.dialogEl.close();
        document.body.removeChild(this.dialogEl);
    }
}
