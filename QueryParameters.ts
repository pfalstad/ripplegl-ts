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

export class QueryParameters {
    private map = new Map<string, string>();

    constructor() {
        const search = window.location.search;
        if (search && search.length > 0) {
            const nameValues = search.substring(1).split("&");
            for (const nv of nameValues) {
                const pair = nv.split("=");
                this.map.set(pair[0], decodeURIComponent(pair[1]));
            }
        }
    }

    getValue(key: string): string | null {
        return this.map.has(key) ? this.map.get(key)! : null;
    }

    getBooleanValue(key: string, def: boolean): boolean {
        const val = this.getValue(key);
        if (val == null)
            return def;
        return val === "1" || val.toLowerCase() === "true";
    }
}
