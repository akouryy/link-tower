'use strict';

function D(...args) { console.log(...args); return args[args.length-1]; }

class Grid {
    constructor({y, x}) {
        this.y = y;
        this.x = x;
        this.group = 0;
        this.visited = 0;
    }
}

class Grids {
    constructor({w: width, h: height}) {
        this.Width = width;
        this.Height = height;
        this.Grids = _.range(Height).map(j => _.range(Width).map(i => new Grid({y: j, x: i})));
        this.groupCount = 0;
        this.pathUsed    = _.range(Height).map(() => _.range(Width).map(() => [false, false]));
        this.oldPathUsed = _.range(Height).map(() => _.range(Width).map(() => [false, false]));
        this.visitCount = 0;
    }

    justifyX(x) {
        return (x % this.Width + this.Width) % this.Width;
    }

    minX(x1, x2) {
        const xm = x1 > x2 ? x2 : x1, xM = x1 > x2 ? x1 : x2;
        if(xm == 0 && xM > 1) return xM;
        return xm;
    }

    at({y, x}) {
        if(y < 0 || y >= this.Height) return [];
        return [this.Grids[y][this.justifyX(x)]];
    }

    nextStepCandidates({y: y0, x: x0}) {
        const turnA = (x0 + y0) % 2;
        return _.flatten(_.range(Width).map(x => _.range(Height).map(y => ({x, y})))).filter(pos =>
            (pos.x + pos.y) % 2 === turnA && this.at(pos).some(g => g.group === 0 && !g.visited) &&
                this.reachableGridExists(pos)
        );
    }

    reachableGridExists({y, x}) {
        return {y, x}, [[-1,-1],[-1,1],[1,-1],[1,1]].some(([dx,dy]) =>
            this.checkReachableGrid({y, x}, {y: dy, x: dx})
        );
    }

    checkReachableGrid({y, x: xb}, {y: dy, x: dx}) {
        const x = this.justifyX(xb);
        const [g] = this.at({y, x});
        if(!g) return false;
        if(g.group !== 0) {
            return true;
        }
        return this.checkReachableGrid({y: y + dy, x: x + dx}, {y: dy, x: dx});
    }

    seekReachableGrid({y, x: xb}, {y: dy, x: dx}) {
        const x = this.justifyX(xb);
        const [g] = this.at({y, x});
        if(!g) return [];
        if(g.group !== 0) {
            return [[{y, x}]];
        }
        return this.seekReachableGrid({y: y + dy, x: x + dx}, {y: dy, x: dx}).map(r => {
            this.pathUsed[Math.min(y, y + dy)][this.minX(x, this.justifyX(x + dx))][+(dx * dy < 0)] = true;
            return [{y, x}, ...r];
        });
    }

    setGroup({y, x}, newGroup) {
        this.at({y, x}).map(g => {
            g.group = newGroup;
        });
    }

    visit({y, x}, turnA) {
        this.forEachPath(({group, y, x, isA}) => this.oldPathUsed[y][x][isA] = group);

        if(this.at({y, x}).length === 0) throw `Grid(y=${y}, x=${x}): out of range.`;
        if(this.at({y, x})[0].visited) throw `Grid(y=${y}, x=${x}) has already visited.`;
        this.at({y, x})[0].visited = ++this.visitCount;

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
                const cutRightUp = (x + y + !turnA) % 2;
                this.at({y, x: x + cutRightUp}).forEach(g1 =>
                    this.at({y: y + 1, x: x + 1 - cutRightUp}).forEach(g2 => {
                        this.pathUsed[y][x][cutRightUp] = false;
                        cutGrids.push([g1, g2], [g2, g1]);
                    })
                );
            });
            if(this.visitCount >= 4) {
                this.forEach(g => {
                    const d = [{group:0},{group:0}];
                    if([g.x, this.justifyX(g.x-1)].every(x => [g.y, g.y-1].every(y => {
                        const r = this.pathUsed[y];
                        if(!r) return true;
                        return !r[x][(x + y + 1) % 2];
                    }))) {
                        g.group = 0;
                    }
                });
            }
        }
    }

    setGroupDFS(grid, parent, group) {
        const oldGroup = grid.group;
        grid.group = group;

        for(const [dx, dy] of [[-1,-1],[-1,1],[1,-1],[1,1]]) {
            for(const g of this.at({y: grid.y + dy, x: grid.x + dx})) {
                if(g != parent && g.group === oldGroup &&
                        this.pathUsed[Math.min(g.y, grid.y)][this.minX(g.x, grid.x)][+(dx * dy < 0)]) {
                    this.setGroupDFS(g, grid, group);
                }
            }
        }
    }


    forEach(f) {
        for(const r of this.Grids) for(const g of r) f(g);
    }

    pathGroup({y, x}, isA) {
        const rightUp = (x + y + isA) % 2;
        if(this.pathUsed[y][x][rightUp])
            for(const g1 of this.at({y, x: x + rightUp}))
                for(const g2 of this.at({y: y + 1, x: x + 1 - rightUp}))
                    return g1.group;
        return 0;
    }

    forEachPathSet(f) {
        for(const y of _.range(this.Height-1)) for(const x of _.range(this.Width)) {
            f(this.pathGroup({y, x}, true), this.pathGroup({y, x}, false), {y, x});
        }
    }

    forEachPath(f) {
        this.forEachPathSet((a, b, {y, x}) => {
            f({group: a, y, x, isA: true, oldGroup: this.oldPathUsed[y][x][true]});
            f({group: b, y, x, isA: false, oldGroup: this.oldPathUsed[y][x][false]});
        });
    }
}
