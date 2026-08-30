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

import { RippleSim } from "./RippleSim";
import { DragObject } from "./DragObject";
import { EditInfo } from "./EditInfo";
import { EditDialog } from "./EditDialog";
import { Adjustable } from "./Adjustable";

export class SliderDialog {
    elm: DragObject;
    sim: RippleSim;
    einfos: (EditInfo | null)[] = [];
    logCheckboxes: (HTMLInputElement | null)[] = [];
    einfocount = 0;

    dialogEl: HTMLDialogElement;
    private contentDiv: HTMLDivElement;

    constructor(elm: DragObject, sim: RippleSim) {
        this.elm = elm;
        this.sim = sim;

        this.dialogEl = document.createElement("dialog");
        document.body.appendChild(this.dialogEl);

        const vp = document.createElement("div");
        this.dialogEl.appendChild(vp);

        const title = document.createElement("div");
        title.className = "dialogTitle";
        title.textContent = "Add Sliders";
        vp.appendChild(title);

        this.contentDiv = document.createElement("div");
        vp.appendChild(this.contentDiv);

        const hp = document.createElement("div");
        hp.className = "hpanel topSpace";
        vp.appendChild(hp);

        const applyButton = document.createElement("button");
        applyButton.textContent = "Apply";
        applyButton.onclick = () => this.apply();
        hp.appendChild(applyButton);

        const okButton = document.createElement("button");
        okButton.textContent = "OK";
        okButton.onclick = () => { this.apply(); this.closeDialog(); };
        hp.appendChild(okButton);

        const cancelButton = document.createElement("button");
        cancelButton.textContent = "Cancel";
        cancelButton.onclick = () => this.closeDialog();
        hp.appendChild(cancelButton);

        this.buildDialog();
        this.dialogEl.showModal();
    }

    buildDialog(): void {
        for (let i = 0; ; i++) {
            this.einfos[i] = this.elm.getEditInfo(i);
            if (this.einfos[i] == null)
                break;
            const ei = this.einfos[i]!;
            if (!ei.canCreateAdjustable())
                continue;
            const adj = this.findAdjustable(i);

            // remove HTML tags from name
            const name = ei.name.replace(/<[^>]*>/g, "");

            const row = document.createElement("div");
            row.style.marginTop = "4px";

            // checkbox to enable/disable slider for this item
            const cbEl = document.createElement("input");
            cbEl.type = "checkbox";
            cbEl.checked = adj != null;
            cbEl.addEventListener("change", () => this.itemStateChanged(i, "checkbox", cbEl));
            const cbLabel = document.createElement("label");
            cbLabel.style.display = "flex";
            cbLabel.style.alignItems = "center";
            cbLabel.style.gap = "4px";
            cbLabel.appendChild(cbEl);
            cbLabel.appendChild(document.createTextNode(name));
            row.appendChild(cbLabel);

            if (adj != null) {
                if (!adj.sliderBeingShared()) {
                    // choice for slider sharing
                    const sel = document.createElement("select");
                    const opt0 = document.createElement("option");
                    opt0.textContent = "New Slider";
                    sel.appendChild(opt0);
                    let ct = 0;
                    for (let j = 0; j !== this.sim.adjustables.length; j++) {
                        const adji = this.sim.adjustables[j];
                        // don't share with an object sharing with someone else
                        if (adji.sharedSlider != null)
                            break;
                        // don't share with ourselves
                        if (adji === adj)
                            continue;
                        const opt = document.createElement("option");
                        opt.textContent = "Share Slider: " + adji.sliderText;
                        sel.appendChild(opt);
                        ct++;
                        if (adji === adj.sharedSlider)
                            sel.selectedIndex = ct;
                    }
                    sel.addEventListener("change", () => this.itemStateChanged(i, "choice", sel));
                    row.appendChild(sel);
                }

                // min/max/step/log/label inputs
                row.appendChild(this.makeLabel("Min Value"));
                const minBox = document.createElement("input");
                minBox.type = "text";
                minBox.value = EditDialog.formatUnits(ei, adj.minValue);
                minBox.style.width = "100%";
                ei.minBox = minBox;
                row.appendChild(minBox);

                row.appendChild(this.makeLabel("Max Value"));
                const maxBox = document.createElement("input");
                maxBox.type = "text";
                maxBox.value = EditDialog.formatUnits(ei, adj.maxValue);
                maxBox.style.width = "100%";
                ei.maxBox = maxBox;
                row.appendChild(maxBox);

                row.appendChild(this.makeLabel("Step (0=continuous)"));
                const stepBox = document.createElement("input");
                stepBox.type = "text";
                stepBox.value = EditDialog.formatUnits(ei, adj.sliderStep);
                stepBox.style.width = "100%";
                ei.stepBox = stepBox;
                row.appendChild(stepBox);

                const logCbEl = document.createElement("input");
                logCbEl.type = "checkbox";
                logCbEl.checked = adj.logarithmic;
                this.logCheckboxes[i] = logCbEl;
                const logLabel = document.createElement("label");
                logLabel.style.display = "flex";
                logLabel.style.alignItems = "center";
                logLabel.style.gap = "4px";
                logLabel.appendChild(logCbEl);
                logLabel.appendChild(document.createTextNode("Logarithmic"));
                row.appendChild(logLabel);

                if (adj.sharedSlider == null) {
                    row.appendChild(this.makeLabel("Label"));
                    const labelBox = document.createElement("input");
                    labelBox.type = "text";
                    labelBox.value = adj.sliderText;
                    labelBox.style.width = "100%";
                    ei.labelBox = labelBox;
                    row.appendChild(labelBox);
                }
            }

            this.contentDiv.appendChild(row);
        }
        this.einfocount = this.einfos.findIndex(e => e == null);
        if (this.einfocount < 0) this.einfocount = this.einfos.length;
    }

    private makeLabel(text: string): HTMLElement {
        const el = document.createElement("div");
        el.textContent = text;
        el.style.marginTop = "4px";
        el.style.fontSize = "0.9em";
        return el;
    }

    findAdjustable(item: number): Adjustable | null {
        return this.sim.findAdjustable(this.elm, item);
    }

    apply(): boolean {
        for (let i = 0; i !== this.einfocount; i++) {
            const adj = this.findAdjustable(i);
            if (adj == null)
                continue;
            const ei = this.einfos[i]!;
            try {
                adj.sliderText = ei.labelBox == null ? "" : ei.labelBox.value;
                if (adj.labelEl != null)
                    adj.labelEl.textContent = adj.sliderText;
                if (ei.minBox)
                    adj.minValue = EditDialog.parseUnitsStr(ei, ei.minBox.value);
                if (ei.maxBox)
                    adj.maxValue = EditDialog.parseUnitsStr(ei, ei.maxBox.value);
                if (ei.stepBox)
                    adj.sliderStep = EditDialog.parseUnitsStr(ei, ei.stepBox.value);
                if (this.logCheckboxes[i] != null)
                    adj.logarithmic = this.logCheckboxes[i]!.checked;
                // guard: logarithmic requires minValue > 0
                if (adj.logarithmic && adj.minValue <= 0)
                    adj.logarithmic = false;
                adj.setSliderValue(ei.value);
            } catch (e) { RippleSim.console(String(e)); }
        }
        return true;
    }

    itemStateChanged(i: number, type: "checkbox" | "choice", src: HTMLElement): void {
        const ei = this.einfos[i];
        if (ei == null) return;
        this.apply();
        if (type === "checkbox") {
            const cbEl = src as HTMLInputElement;
            if (cbEl.checked) {
                const adj = new Adjustable(this.elm, i);
                adj.sliderText = ei.name.replace(/ \(.*\)$/, "");
                adj.createSliderWithValue(this.sim, ei.value);
                this.sim.adjustables.push(adj);
            } else {
                const adj = this.findAdjustable(i);
                if (adj) {
                    adj.deleteSlider(this.sim);
                    const idx = this.sim.adjustables.indexOf(adj);
                    if (idx >= 0) this.sim.adjustables.splice(idx, 1);
                }
            }
        } else if (type === "choice") {
            const sel = src as HTMLSelectElement;
            const adj = this.findAdjustable(i);
            if (adj) {
                if (sel.selectedIndex === 0) {
                    // new slider
                    adj.sharedSlider = null;
                    if (!adj.sliderText || adj.sliderText.length === 0)
                        adj.sliderText = ei.name.replace(/ \(.*\)$/, "");
                    adj.createSliderWithValue(this.sim, ei.value);
                } else {
                    let ct = 0;
                    for (let j = 0; j !== this.sim.adjustables.length; j++) {
                        const adji = this.sim.adjustables[j];
                        if (adji.sharedSlider != null)
                            break;
                        if (adji === adj)
                            continue;
                        if (++ct === sel.selectedIndex) {
                            adj.sharedSlider = adji;
                            adj.deleteSlider(this.sim);
                        }
                    }
                }
            }
        }
        Adjustable.reorderAdjustables();
        this.clearDialog();
        this.buildDialog();
    }

    clearDialog(): void {
        while (this.contentDiv.firstChild)
            this.contentDiv.removeChild(this.contentDiv.firstChild);
        for (let j = 0; j < this.logCheckboxes.length; j++)
            this.logCheckboxes[j] = null;
        for (let j = 0; j < this.einfos.length; j++) {
            if (this.einfos[j]) {
                this.einfos[j]!.minBox = null;
                this.einfos[j]!.maxBox = null;
                this.einfos[j]!.labelBox = null;
                this.einfos[j]!.stepBox = null;
            }
        }
    }

    closeDialog(): void {
        if (this.dialogEl.open)
            this.dialogEl.close();
        document.body.removeChild(this.dialogEl);
        this.sim.sliderDialog = null;
    }
}
