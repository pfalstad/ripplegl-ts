/*
 * Copyright 2010 Traction Software, Inc.
 * Copyright 2010 clazzes.org Project
 *
 * Based on TractionDialogBox by Traction Software, Inc. Renamed to WindowBox and
 * added resize support by clazzes.org
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not
 * use this file except in compliance with the License. You may obtain a copy of
 * the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 * License for the specific language governing permissions and limitations under
 * the License.
 */

// TypeScript/DOM port. Instead of replicating GWT DialogBox's pixel-based edge hit-testing
// for resizing, we use eight small resize-handle elements (one per compass direction, see
// the "windowbox-handle-*" CSS classes) laid over the border of the box.

const CURSORS: Record<number, string> = {
    0: "nw-resize", 1: "n-resize", 2: "ne-resize",
    3: "w-resize", 5: "e-resize",
    6: "sw-resize", 7: "s-resize", 8: "se-resize",
};

export class WindowBox {
    private static readonly MIN_WIDTH = 100;
    private static readonly MIN_HEIGHT = 100;

    element: HTMLDivElement;
    private titlebar: HTMLDivElement;
    private titleText: HTMLSpanElement;
    private closeEl: HTMLAnchorElement;
    private minimizeEl: HTMLAnchorElement;
    private body: HTMLDivElement;

    private resizable: boolean;
    private minimized = false;
    private visible = false;
    private minWidth = WindowBox.MIN_WIDTH;
    private minHeight = WindowBox.MIN_HEIGHT;

    private dragMode = -1; // -1 = not dragging, 100 = moving, 0-8 (skip 4) = resizing
    private dragX = 0;
    private dragY = 0;

    constructor(modal: boolean = false, showMinimizeIcon: boolean = true, showCloseIcon: boolean = true,
        resizable: boolean = false) {
        this.resizable = resizable;

        this.element = document.createElement("div");
        this.element.className = "windowbox";
        this.element.style.display = "none";

        this.titlebar = document.createElement("div");
        this.titlebar.className = "windowbox-titlebar";
        this.titleText = document.createElement("span");
        this.titlebar.appendChild(this.titleText);

        const controls = document.createElement("div");
        controls.className = "windowbox-controls";
        this.minimizeEl = document.createElement("a");
        this.minimizeEl.className = "windowbox-minimize";
        this.minimizeEl.addEventListener("click", () => this.onMinimizeClick());
        this.minimizeEl.style.display = showMinimizeIcon ? "" : "none";
        this.closeEl = document.createElement("a");
        this.closeEl.className = "windowbox-close";
        this.closeEl.addEventListener("click", () => this.onCloseClick());
        this.closeEl.style.display = showCloseIcon ? "" : "none";
        controls.appendChild(this.minimizeEl);
        controls.appendChild(this.closeEl);
        this.titlebar.appendChild(controls);

        this.body = document.createElement("div");
        this.body.className = "windowbox-body";

        this.element.appendChild(this.titlebar);
        this.element.appendChild(this.body);

        this.titlebar.addEventListener("mousedown", (e) => this.beginDragging(e, 100));

        if (resizable) {
            for (const [code, cursor] of Object.entries(CURSORS)) {
                const handle = document.createElement("div");
                handle.className = "windowbox-handle windowbox-handle-" + code;
                handle.style.cursor = cursor;
                handle.addEventListener("mousedown", (e) => this.beginDragging(e, Number(code)));
                this.element.appendChild(handle);
            }
        }

        document.body.appendChild(this.element);
        void modal; // modality isn't meaningful without a full modal-overlay implementation
    }

    private beginDragging(event: MouseEvent, mode: number): void {
        if (this.minimized && mode !== 100)
            return;
        event.preventDefault();
        this.dragMode = mode;
        this.dragX = event.clientX;
        this.dragY = event.clientY;
        const onMove = (e: MouseEvent) => this.continueDragging(e);
        const onUp = () => {
            this.dragMode = -1;
            window.removeEventListener("mousemove", onMove);
            window.removeEventListener("mouseup", onUp);
        };
        window.addEventListener("mousemove", onMove);
        window.addEventListener("mouseup", onUp);
    }

    private continueDragging(event: MouseEvent): void {
        const dx = event.clientX - this.dragX;
        const dy = event.clientY - this.dragY;
        this.dragX = event.clientX;
        this.dragY = event.clientY;

        if (this.dragMode === 100) {
            this.setPopupPosition(this.getPopupLeft() + dx, this.getPopupTop() + dy);
            return;
        }

        const mode = this.dragMode;
        let x = this.getPopupLeft();
        let y = this.getPopupTop();
        let w = this.element.offsetWidth;
        let h = this.element.offsetHeight;

        // left/center/right column: 0,3,6 = left; 2,5,8 = right; 1,7 = center column (no x change)
        if (mode % 3 !== 1) {
            if (mode % 3 === 0) {
                x += dx;
                w -= dx;
            } else {
                w += dx;
            }
            w = Math.max(w, this.minWidth);
        }
        if (Math.trunc(mode / 3) !== 1) {
            if (Math.trunc(mode / 3) === 0) {
                y += dy;
                h -= dy;
            } else {
                h += dy;
            }
            h = Math.max(h, this.minHeight);
        }

        this.element.style.width = w + "px";
        this.body.style.height = (h - this.titlebar.offsetHeight) + "px";
        this.setPopupPosition(x, y);
    }

    setText(text: string): void {
        this.titleText.textContent = text;
    }

    setWidget(el: HTMLElement): void {
        this.body.innerHTML = "";
        this.body.appendChild(el);
    }

    getWidget(): HTMLElement | null {
        return this.body.firstElementChild as HTMLElement | null;
    }

    setPopupPosition(x: number, y: number): void {
        this.element.style.left = x + "px";
        this.element.style.top = y + "px";
    }

    getPopupLeft(): number {
        return this.element.offsetLeft;
    }

    getPopupTop(): number {
        return this.element.offsetTop;
    }

    setVisible(v: boolean): void {
        this.visible = v;
        this.element.style.display = v ? "block" : "none";
    }

    isVisible(): boolean {
        return this.visible;
    }

    show(): void {
        this.setVisible(true);
    }

    hide(): void {
        this.setVisible(false);
    }

    center(): void {
        const w = this.element.offsetWidth;
        const h = this.element.offsetHeight;
        this.setPopupPosition(Math.max(0, (window.innerWidth - w) / 2), Math.max(0, (window.innerHeight - h) / 2));
    }

    setMinWidth(minWidth: number): void {
        this.minWidth = minWidth < 1 ? WindowBox.MIN_WIDTH : minWidth;
    }

    setMinHeight(minHeight: number): void {
        this.minHeight = minHeight < 1 ? WindowBox.MIN_HEIGHT : minHeight;
    }

    protected onCloseClick(): void {
        this.hide();
    }

    protected onMinimizeClick(): void {
        const widget = this.getWidget();
        if (!widget)
            return;
        const wasVisible = widget.style.display !== "none";
        const offsetWidth = this.element.offsetWidth;
        widget.style.display = wasVisible ? "none" : "";
        this.minimized = wasVisible;
        if (wasVisible) {
            this.element.style.width = offsetWidth + "px";
            this.minimizeEl.className = "windowbox-maximize";
        } else {
            this.element.style.width = "";
            this.minimizeEl.className = "windowbox-minimize";
        }
    }
}
