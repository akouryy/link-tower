'use strict';

const Width = 6, Height = 13, Size = 20;
let posA = {x: 1, y: Height - 1}, posB = {x: 4, y: Height - 1}, turnA = true;

const $Grids = _.range(Height).map(() => new Array(Width));
const $Paths = _.range(Height).map(() => _.range(Width).map(() => [null, null]));

const grids = new Grids({w: Width, h: Height});
grids.setOwner(posA, turnA);
grids.setOwner(posB, turnA);

jQuery($ => {
    const $tower = $("<svg>");
    const $towerView = $("#tower").attr({width: Size * 2 * Width - 4, height: Size * 2 * Height});
    $tower[0].setAttribute('viewBox', `2 0 ${Size * 2 * Width - 4} ${Size * 2 * Height}`);

    for(const j of _.range(Height)) {
        for(const i of _.range(Width)) {
            $Grids[j][i] = $("<rect>").attr({
                x: (i * 2 + 0.5) * Size, y: (j * 2 + 0.5) * Size, width: Size, height: Size,
                'data-x': i, 'data-y': j
            }).data({x: i, y: j}).addClass("grid " + "ba"[(i + j) % 2]).appendTo($tower);
        }
    }
    for(const j of _.range(Height - 1)) {
        for(const i of _.range(-1, Width)) {
            for(const k of [0,1]) {
                const $path = $("<line>").attr({
                    x1: (i * 2 + 1.5) * Size, x2: (i * 2 + 2.5) * Size,
                    y1: (j * 2 + 1.5 + k) * Size, y2: (j * 2 + 2.5 - k) * Size,
                }).addClass("path " + "ba"[(i + j + k) % 2]).appendTo($tower);
                if(i === -1) {
                    $Paths[j][Width - 1][k] = $path;
                } else if(i === Width - 1) {
                    $Paths[j][i][k] = $Paths[j][i][k].add($path);
                } else {
                    $Paths[j][i][k] = $path;
                }
            }
        }
    }

    $('#pass').click(() => { turnA = !turnA; turn(); })

    function turn() {
        const turnName = turnA ? 'a' : 'b', pos = turnA ? posA : posB;

        $tower.find(".grid").removeClass("now next");
        $Grids[posA.y][posA.x].addClass("now");
        $Grids[posB.y][posB.x].addClass("now");

        grids.nextStepCandidates(pos).forEach(({x, y}) => {
            $Grids[y][x].addClass('next');
        });
        $towerView.html($tower.html());

        $towerView.off('click').on('click', ev => {
            const $target = $(ev.target);
            if($target.hasClass('next')) {
                const newPos = {x: $target.data('x'), y: $target.data('y')};
                if(turnA) posA = newPos;
                else      posB = newPos;
                grids.setOwner(newPos, turnA);
                grids.forEach(g => {
                    if(g.group !== 0) {
                        $Grids[g.y][g.x].addClass('owned').addClass(`g-${g.group}`);
                    } else {
                        $Grids[g.y][g.x].removeClass('owned');
                    }
                });
                grids.forEachPath(({used, y, x, isA}) => {
                    if(used) {
                        $Paths[y][x][(y + x + isA) % 2].addClass('owned');
                    } else {
                        $Paths[y][x][(y + x + isA) % 2].removeClass('owned');
                    }
                });
                turnA = !turnA;
                turn();
            }
        });
    }
    turn();
});
