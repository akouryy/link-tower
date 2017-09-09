'use strict';

function D(...args) { console.log(...args); return args[args.length-1]; }

class Grid {
    constructor({y, x}) {
        this.y = y;
        this.x = x;
        this.group = 0;
    }
}

class Grids {
    constructor({w: width, h: height}) {
        this.Width = width;
        this.Height = height;
        this.Grids = _.range(Height).map(j => _.range(Width).map(i => new Grid({y: j, x: i})));
        this.Cut = {};
        this.groupCount = 0;
    }

    justifyX(x) {
        return (x % this.Width + this.Width) % this.Width;
    }

    at({y, x}) {
        if(y < 0 || y >= this.Height) return [];
        return [this.Grids[y][this.justifyX(x)]];
    }

    nextStepCandidates({y, x}) {
        return _.flatten(_.range(-4, 5).map(dx => _.range(-4, 5).map(dy => {
            const d = Math.abs(dx) + Math.abs(dy);
            const pos = {x: this.justifyX(x + dx), y: y + dy}
            return (d === 2 || d === 4) && this.at(pos).some(g => g.group === 0) ? [pos] : [];
        })));
    }

    seekReachableGrid({y, x}, {y: dy, x: dx}) {
        const [g] = this.at({y, x});
        if(!g) return [];
        if(g.group !== 0) return [[{y, x}]];
        return this.seekReachableGrid({y: y + dy, x: x + dx}, {y: dy, x: dx}).map(r => [{y, x}, ...r]);
    }

    setGroup({y, x}, newGroup) {
        this.at({y, x}).map(g => {
            g.group = newGroup;
        });
    }

    setOwner({y, x}, turnA) {
        // shallow flatten(hoge, true)
        const reach = _.flatten([[-1,-1],[-1,1],[1,-1],[1,1]].map(([dy, dx]) =>
            this.seekReachableGrid({y, x}, {y: dy, x: dx})
        ), true);
        if(reach.length === 0) {
            this.setGroup({y, x}, ++this.groupCount);
        } else {
            const oldGroups = _.compact(_.flatten(reach.map(rs =>
                this.at(rs[rs.length - 1]).map(r => r.group)
            )));
            const newGroup = oldGroups[0] || ++this.groupCount;
            reach.forEach(rs => rs.forEach(r => this.setGroup(r, newGroup)));
            this.forEach(g => {
                if(oldGroups.includes(g.group)) g.group = newGroup;
            });
            const cutGrids = [];
            this.forEachPathSet((a, b, {y, x}) => {
                if(!a || !b) return;
                const cutRightUp = (x + y + turnA + 1) % 2;
                this.at({y, x: x + cutRightUp}).forEach(g1 =>
                    this.at({y: y + 1, x: x + 1 - cutRightUp}).forEach(g2 =>
                        cutGrids.push([g1, g2], [g2, g1])
                    )
                );
            });
        }
    }

    forEach(f) {
        for(const r of this.Grids) for(const g of r) f(g);
    }

    isPathUsed({y, x}, isA) {
        const rightUp = (x + y + isA) % 2;
        return this.at({y, x: x + rightUp}).some(g1 => this.at({y: y + 1, x: x + 1 - rightUp}).some(g2 => {
            return g1.group !== 0 && g1.group === g2.group;
        }));
    }

    forEachPathSet(f) {
        for(const y of _.range(this.Height-1)) for(const x of _.range(this.Width)) {
            f(this.isPathUsed({y, x}, true), this.isPathUsed({y, x}, false), {y, x});
        }
    }

    forEachPath(f) {
        this.forEachPathSet((a, b, {y, x}) => {
            f({used: a, y, x, isA: true});
            f({used: b, y, x, isA: false});
        });
    }
}
