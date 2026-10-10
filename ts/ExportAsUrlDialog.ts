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

export class ExportAsUrlDialog {
    dialogEl: HTMLDialogElement;
    static textArea: HTMLTextAreaElement | null = null;

    static createShort(urlin: string): void {
        const url = "shortrelay.php?v=" + urlin;
        if (ExportAsUrlDialog.textArea)
            ExportAsUrlDialog.textArea.value = "Waiting for short URL for web service...";
        fetch(url)
            .then((response) => {
                if (!response.ok)
                    throw new Error("Shortener error: " + response.statusText);
                return response.text();
            })
            .then((text) => {
                if (ExportAsUrlDialog.textArea)
                    ExportAsUrlDialog.textArea.value = text;
            })
            .catch((e) => {
                if (ExportAsUrlDialog.textArea)
                    ExportAsUrlDialog.textArea.value = "Shortener error: " + e;
            });
    }

    constructor(dump: string) {
        const start = window.location.href.split("?");
        dump = dump.replace(/ /g, "+");
        const query = "?rol=" + encodeURIComponent(dump);
        const url = start[0] + query;

        this.dialogEl = document.createElement("dialog");
        document.body.appendChild(this.dialogEl);

        const vp = document.createElement("div");
        this.dialogEl.appendChild(vp);

        const title = document.createElement("div");
        title.className = "dialogTitle";
        title.textContent = "Export as URL";
        vp.appendChild(title);

        const p1 = document.createElement("div");
        p1.textContent = "URL for this layout is...";
        vp.appendChild(p1);

        if (url.length > 2000) {
            const warn = document.createElement("div");
            warn.style.width = "800px";
            warn.textContent = "Warning: this URL is longer than 2000 characters and may not work in some browsers.";
            vp.appendChild(warn);
        }

        const ta = document.createElement("textarea");
        ta.style.width = "800px";
        ta.value = url;
        ExportAsUrlDialog.textArea = ta;
        vp.appendChild(ta);

        const p2 = document.createElement("div");
        p2.style.width = "800px";
        p2.textContent = "To save this URL select it all (eg click in text and type control-A) and copy to your clipboard (eg control-C) before pasting to a suitable place.";
        vp.appendChild(p2);

        const hp = document.createElement("div");
        hp.className = "hpanel topSpace";
        vp.appendChild(hp);

        const okButton = document.createElement("button");
        okButton.textContent = "OK";
        okButton.onclick = () => this.closeDialog();
        hp.appendChild(okButton);

        const shortButton = document.createElement("button");
        shortButton.textContent = "Create short URL";
        shortButton.onclick = () => {
            shortButton.style.display = "none";
            ExportAsUrlDialog.createShort(encodeURIComponent(query));
        };
        hp.appendChild(shortButton);

        this.dialogEl.showModal();
    }

    closeDialog(): void {
        this.dialogEl.close();
        document.body.removeChild(this.dialogEl);
    }
}
